const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const upload = require('../middleware/upload');
const imagePipeline = require('../middleware/imagePipeline');
const { deleteImageVariants, normalizeImageEntry } = require('../services/imageService');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { productSchema } = require('../validators/schema');

// Create a custom upload configuration for multiple fields
const multiUpload = upload.fields([
  { name: 'images', maxCount: 7 },
  { name: 'videos', maxCount: 2 }
]);

/** Multer error -> clean JSON 400 (instead of HTML crash). */
function handleUploadError(err, req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Images max 8 MB, videos max 50 MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files. Max 7 images + 2 videos.' });
  }
  return res.status(err.statusCode || 400).json({ success: false, message: err.message || 'Upload rejected.' });
}

const normalizeProduct = (p) => {
  if (!p) return p;
  const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
  const alt = obj.name ? `${obj.name} product image` : 'Product image';
  obj.images = (obj.images || []).map((img) => normalizeImageEntry(img, alt)).filter(Boolean);
  return obj;
};

// @route   POST /api/products
// @desc    Create a new product from the Admin Dashboard
router.post(
  '/',
  protect,
  admin,
  multiUpload,
  handleUploadError,
  imagePipeline,
  validate(productSchema),
  async (req, res) => {
    try {
      const productData = { ...req.body };

      if (productData.isFavorite === 'true') {
        productData.isFavorite = true;
      } else {
        productData.isFavorite = false;
      }

      // Parse variants if they are a string
      if (typeof productData.variants === 'string') {
        try {
          productData.variants = JSON.parse(productData.variants);
        } catch (e) {
          productData.variants = [];
        }
      }

      productData.images = req.processedImages || [];

      if (req.processedVideoUrl) {
        productData.videoUrl = req.processedVideoUrl;
      }

      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();

      res.status(201).json({ success: true, data: normalizeProduct(savedProduct) });
    } catch (error) {
      for (const img of req.processedImages || []) deleteImageVariants(img);
      console.error('Error saving product:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/products
// @desc    Fetch products with optional category, search, and pagination filters
router.get('/', async (req, res) => {
  try {
    const filter = {};

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      const cleanCat = req.query.category.replace(/-/g, ' ');
      filter.category = new RegExp(`^${cleanCat}$`, 'i');
    }

    // Search query
    if (req.query.search && typeof req.query.search === 'string') {
      const q = req.query.search.trim();
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { subcategory: { $regex: q, $options: 'i' } },
          { productCollection: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ];
      }
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products.map(normalizeProduct),
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/products/:id
// @desc    Fetch a single product by ID (FT-12 fix)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: normalizeProduct(product)
    });
  } catch (error) {
    console.error('Error fetching single product:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update an existing product (new uploads REPLACE gallery; deleted files cleaned)
router.put(
  '/:id',
  protect,
  admin,
  multiUpload,
  handleUploadError,
  imagePipeline,
  validate(productSchema),
  async (req, res) => {
    try {
      const productData = { ...req.body };
      delete productData.images;
      delete productData.videoUrl;

      if (productData.isFavorite === 'true') {
        productData.isFavorite = true;
      } else if (productData.isFavorite === 'false') {
        productData.isFavorite = false;
      }

      if (typeof productData.variants === 'string') {
        try {
          productData.variants = JSON.parse(productData.variants);
        } catch (e) {
          productData.variants = [];
        }
      }

      const existing = await Product.findById(req.params.id);
      if (!existing) {
        for (const img of req.processedImages || []) deleteImageVariants(img);
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Normalize current database images (handles both modern objects and legacy strings)
      const old = (existing.images || [])
        .map((img) => normalizeImageEntry(img && img.toObject ? img.toObject() : img))
        .filter(Boolean);

      if (req.body.keepImages !== undefined) {
        let kept = [];
        try {
          const parsed = JSON.parse(req.body.keepImages);
          if (Array.isArray(parsed)) {
            kept = parsed
              .map((k) => normalizeImageEntry(k))
              .filter(Boolean);
          }
        } catch {
          kept = old;
        }

        // Clean up any images that were removed by the admin
        const keptOriginals = new Set(kept.map((k) => k.original));
        for (const img of old) {
          if (!keptOriginals.has(img.original)) {
            deleteImageVariants(img);
          }
        }

        // Combine kept images with any newly uploaded/processed images (capped at 7)
        const combined = [...kept, ...(req.processedImages || [])].slice(0, 7);
        productData.images = combined;
      } else if (req.processedImages && req.processedImages.length > 0) {
        // If no keepImages specified but new images uploaded, clean old and replace
        for (const img of old) deleteImageVariants(img);
        productData.images = req.processedImages;
      } else {
        // Pure text/pricing/stock edit: preserve normalized gallery
        productData.images = old;
      }

      if (req.processedVideoUrl) {
        productData.videoUrl = req.processedVideoUrl;
      }

      // Ensure productCollection is populated
      if (!productData.productCollection && productData.collection) {
        productData.productCollection = productData.collection;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        productData,
        { new: true, returnDocument: 'after', runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.status(200).json({ success: true, data: normalizeProduct(updatedProduct) });
    } catch (error) {
      for (const img of req.processedImages || []) deleteImageVariants(img);
      console.error('Error updating product:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// @route   DELETE /api/products/:id
// @desc    Delete a product by its ID (plus its stored image files)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    for (const img of product.images || []) {
      deleteImageVariants(img && img.toObject ? img.toObject() : img);
    }

    res.status(200).json({ success: true, message: 'Product successfully deleted' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
