/**
 * imagePipeline middleware.
 * Runs AFTER multer (memory buffers) and BEFORE validation/controller:
 *  - sharp-validates + transcodes each image into variants on disk
 *  - writes videos to disk with safe names
 *  - exposes req.processedImages (DB-ready objects) + req.processedVideoUrl
 * On any failure: cleans up files already written for this request and
 * forwards a 400 error (no partial state, no crash).
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  processProductImage,
  deleteImageVariants,
  PRODUCTS_DIR,
} = require('../services/imageService');

const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm']);
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function imagePipeline(req, res, next) {
  const written = [];
  try {
    const files = req.files || {};
    const images = files.images || [];
    const videos = files.videos || [];

    if (images.length > 7) {
      const e = new Error('Maximum 7 images per product.');
      e.statusCode = 400;
      throw e;
    }
    if (videos.length > 2) {
      const e = new Error('Maximum 2 videos per product.');
      e.statusCode = 400;
      throw e;
    }

    // Alt text base: product name if the admin already typed it
    const altBase =
      (req.body && (req.body.name || req.body.sku)) || 'Product image';

    req.processedImages = [];
    for (let i = 0; i < images.length; i++) {
      const obj = await processProductImage(
        images[i],
        `${altBase} — view ${i + 1}`
      );
      written.push(obj);
      req.processedImages.push(obj);
    }

    // Videos: strict re-check + safe write (never executable, never original name)
    req.processedVideoUrl = '';
    if (videos.length > 0) {
      const v = videos[0];
      if (!ALLOWED_VIDEO_MIME.has(v.mimetype) || v.buffer.length > MAX_VIDEO_BYTES) {
        const e = new Error('Rejected video: accepted MP4/WebM up to 50 MB.');
        e.statusCode = 400;
        throw e;
      }
      // Magic-byte sniff for mp4/webm (ftyp | \x1aE\xdf\xa3)
      const head = v.buffer.subarray(0, 12);
      const isFtyp = head.includes(Buffer.from('ftyp'));
      const isWebm =
        v.buffer[0] === 0x1a && v.buffer[1] === 0x45 && v.buffer[2] === 0xdf && v.buffer[3] === 0xa3;
      if (!isFtyp && !isWebm) {
        const e = new Error('Rejected video: file content is not MP4/WebM.');
        e.statusCode = 400;
        throw e;
      }
      const ext = v.mimetype === 'video/webm' ? '.webm' : '.mp4';
      const name = `prod-${Date.now()}-${crypto.randomBytes(6).toString('hex')}-video${ext}`;
      if (!fs.existsSync(PRODUCTS_DIR)) fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
      await fs.promises.writeFile(path.join(PRODUCTS_DIR, name), v.buffer);
      req.processedVideoUrl = `/uploads/products/${name}`;
      written.push({ original: req.processedVideoUrl });
    }

    // Drop raw buffers ASAP (memory)
    req.files = undefined;
    next();
  } catch (err) {
    for (const w of written) deleteImageVariants(w);
    err.statusCode = err.statusCode || 400;
    next(err);
  }
}

module.exports = imagePipeline;
