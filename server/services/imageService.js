/**
 * Production product-image pipeline.
 *
 * ORIGINAL -> VALIDATE -> OPTIMIZE/NORMALIZE -> STORE (variants)
 *
 * Principles:
 * - NEVER distort: all resizes use fit:"inside" (aspect preserved, no crop).
 * - Master/original kept (max 2048px, metadata stripped).
 * - Responsive WebP variants: thumbnail (400), medium (800), large (1600).
 * - Transparent PNGs flattened onto white only for JPEG fallbacks;
 *   WebP variants preserve alpha.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

const PRODUCTS_DIR = path.join(__dirname, '..', 'uploads', 'products');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(PRODUCTS_DIR);

// ---- Validation policy ----
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

// 8 MB per image (covers high-res jewellery photos, blocks abuse)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
// Protect server from gigantic decodes (sharp pixel limit is separate too)
const MAX_DIMENSION = 6000;
// Prevent tiny / blurry product photos (shortest side must be >= 300px)
const MIN_DIMENSION = 300;

function safeBaseName() {
  return `prod-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

function extOf(filename) {
  return path.extname(String(filename || '').toLowerCase());
}

/**
 * Validate raw upload buffer strictly (do not trust extension alone).
 * @throws {Error} with statusCode=400 on any rejection
 */
async function validateImageBuffer(file) {
  const err = (msg) => {
    const e = new Error(msg);
    e.statusCode = 400;
    return e;
  };

  if (!file || !file.buffer || file.buffer.length === 0) {
    throw err('Empty image upload rejected.');
  }
  if (file.buffer.length > MAX_IMAGE_BYTES) {
    throw err(`Image "${file.originalname}" exceeds 8 MB limit.`);
  }
  if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
    throw err(
      `Unsupported image type "${file.mimetype}". Accepted: JPG, PNG, WebP, AVIF.`
    );
  }
  if (!ALLOWED_IMAGE_EXT.has(extOf(file.originalname))) {
    throw err(
      `Suspicious file extension for "${file.originalname}". Accepted: .jpg .jpeg .png .webp .avif`
    );
  }

  let meta;
  try {
    meta = await sharp(file.buffer, { failOnError: true }).metadata();
  } catch {
    throw err(`Corrupted or unreadable image "${file.originalname}".`);
  }

  // sharp format names: jpeg | png | webp | avif | ...
  const formatOk = ['jpeg', 'png', 'webp', 'avif'].includes(meta.format);
  if (!formatOk || !meta.width || !meta.height) {
    throw err(`Unsupported image content in "${file.originalname}".`);
  }
  if (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION) {
    throw err(
      `Image "${file.originalname}" is too large (${meta.width}x${meta.height}). Maximum ${MAX_DIMENSION}px per side.`
    );
  }
  if (Math.min(meta.width, meta.height) < MIN_DIMENSION) {
    throw err(
      `Image "${file.originalname}" is too small (${meta.width}x${meta.height}). Minimum ${MIN_DIMENSION}px on the shortest side.`
    );
  }
  return meta;
}

/**
 * Process one validated image buffer into stored variants.
 * Returns DB-ready object with public URL paths.
 */
async function processProductImage(file, altText = '') {
  const meta = await validateImageBuffer(file);
  ensureDir(PRODUCTS_DIR);

  const base = safeBaseName();
  const hasAlpha = meta.hasAlpha === true;
  const inFormat = meta.format; // jpeg|png|webp|avif

  // Master format: keep alpha-capable inputs as PNG when they actually
  // carry transparency, else normalised JPEG. AVIF/WebP masters -> WebP.
  const masterExt =
    hasAlpha && (inFormat === 'png' || inFormat === 'avif')
      ? '.png'
      : inFormat === 'png' && hasAlpha
        ? '.png'
        : '.jpg';
  const masterFile = `${base}-original${masterExt}`;

  const thumbFile = `${base}-thumb.webp`;
  const mediumFile = `${base}-medium.webp`;
  const largeFile = `${base}-large.webp`;

  const src = sharp(file.buffer, { failOnError: true });
  // Strip EXIF/GPS etc. (default: no withMetadata) + neutralise orientation
  const normalised = src.clone().rotate();

  // --- Master (max 2048, aspect preserved, never enlarged) ---
  let masterPipeline = normalised.clone().resize({
    width: 2048,
    height: 2048,
    fit: 'inside',
    withoutEnlargement: true,
  });
  if (masterExt === '.jpg') {
    // Flatten transparency onto white so JPEG masters never get black boxes
    masterPipeline = masterPipeline.flatten({ background: '#ffffff' }).jpeg({
      quality: 88,
      mozjpeg: true,
    });
  } else {
    masterPipeline = masterPipeline.png({ compressionLevel: 9 });
  }
  await masterPipeline.toFile(path.join(PRODUCTS_DIR, masterFile));

  // --- WebP variants (fit inside, never crop, never stretch) ---
  const variant = (size, quality) => {
    let p = sharp(file.buffer, { failOnError: true })
      .rotate()
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
    return p.webp({ quality }).toFile(path.join(PRODUCTS_DIR, size === 400 ? thumbFile : size === 800 ? mediumFile : largeFile));
  };
  await variant(400, 80);
  await variant(800, 82);
  await variant(1600, 84);

  // Final master dimensions (post-normalisation, pre-variant)
  const finalMeta = await sharp(path.join(PRODUCTS_DIR, masterFile)).metadata();

  const pub = (f) => `/uploads/products/${f}`;
  const stat = fs.statSync(path.join(PRODUCTS_DIR, masterFile));

  return {
    original: pub(masterFile),
    thumbnail: pub(thumbFile),
    medium: pub(mediumFile),
    large: pub(largeFile),
    alt: String(altText || '').slice(0, 200),
    width: finalMeta.width || meta.width,
    height: finalMeta.height || meta.height,
    format: (masterExt === '.jpg' ? 'jpeg' : 'png'),
    size: stat.size,
  };
}

/** Delete every stored file belonging to an image object (orphan cleanup). */
function deleteImageVariants(img) {
  if (!img) return;
  const files = [img.original, img.thumbnail, img.medium, img.large]
    .filter(Boolean)
    .map((url) => {
      // Only ever delete inside our own uploads dir (path traversal guard)
      const rel = String(url).replace(/^\/+/, '');
      if (!rel.startsWith('uploads/')) return null;
      return path.join(__dirname, '..', rel);
    })
    .filter(Boolean);
  for (const f of files) {
    const uploadsRoot = path.join(__dirname, '..', 'uploads');
    const resolved = path.resolve(f);
    if (!resolved.startsWith(path.resolve(uploadsRoot))) continue;
    fs.promises.unlink(resolved).catch(() => {});
  }
}

/**
 * Backward compatibility: legacy DB rows store plain strings
 * ("/uploads/xxx.jpg"). Normalise to the object shape on read so the
 * frontend can rely on one contract.
 */
function normalizeImageEntry(entry, fallbackAlt = 'Product image') {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return {
      original: entry,
      thumbnail: entry,
      medium: entry,
      large: entry,
      alt: fallbackAlt,
      width: null,
      height: null,
      format: null,
      size: null,
    };
  }
  return {
    original: entry.original || entry.url || '',
    thumbnail: entry.thumbnail || entry.original || entry.url || '',
    medium: entry.medium || entry.original || entry.url || '',
    large: entry.large || entry.original || entry.url || '',
    alt: entry.alt || fallbackAlt,
    width: entry.width ?? null,
    height: entry.height ?? null,
    format: entry.format ?? null,
    size: entry.size ?? null,
  };
}

module.exports = {
  PRODUCTS_DIR,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_MIME,
  processProductImage,
  deleteImageVariants,
  normalizeImageEntry,
};
