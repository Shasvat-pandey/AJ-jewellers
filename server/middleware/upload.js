/**
 * Strict upload gate: memory storage (files are validated + transcoded by
 * sharp before anything touches disk) + allowlist per field.
 *
 * - images: jpg/jpeg/png/webp/avif, 8 MB each, max 7
 * - videos: mp4/webm, 50 MB each, max 2
 */
const multer = require('multer');
const path = require('path');

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm']);
const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.webm']);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(String(file.originalname || '').toLowerCase());

  if (file.fieldname === 'images') {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype) || !ALLOWED_IMAGE_EXT.has(ext)) {
      return cb(
        Object.assign(
          new Error(
            `Rejected "${file.originalname}": accepted image types are JPG, PNG, WebP, AVIF.`
          ),
          { statusCode: 400 }
        ),
        false
      );
    }
    return cb(null, true);
  }

  if (file.fieldname === 'videos') {
    if (!ALLOWED_VIDEO_MIME.has(file.mimetype) || !ALLOWED_VIDEO_EXT.has(ext)) {
      return cb(
        Object.assign(
          new Error(`Rejected "${file.originalname}": accepted video types are MP4, WebM.`),
          { statusCode: 400 }
        ),
        false
      );
    }
    return cb(null, true);
  }

  return cb(Object.assign(new Error(`Unexpected field "${file.fieldname}".`), { statusCode: 400 }), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // hard ceiling (videos); images re-checked at 8 MB in imageService
    files: 9, // 7 images + 2 videos
  },
});

module.exports = upload;
