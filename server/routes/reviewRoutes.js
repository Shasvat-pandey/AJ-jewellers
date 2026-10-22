const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const upload = require('../middleware/upload');
const imagePipeline = require('../middleware/imagePipeline');
const { deleteImageVariants, normalizeImageEntry } = require('../services/imageService');
const { protect, admin } = require('../middleware/authMiddleware');

// Custom upload configuration for reviews
const reviewUpload = upload.fields([
  { name: 'images', maxCount: 3 }
]);

function handleUploadError(err, req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 8 MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files. Max 3 images.' });
  }
  return res.status(err.statusCode || 400).json({ success: false, message: err.message || 'Upload rejected.' });
}

const normalizeReview = (r) => {
  if (!r) return r;
  const obj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
  const alt = 'Review image';
  obj.images = (obj.images || []).map((img) => normalizeImageEntry(img, alt)).filter(Boolean);
  return obj;
};

// @route   POST /api/reviews
// @desc    Submit a review (Authenticated user)
router.post(
  '/',
  protect,
  reviewUpload,
  handleUploadError,
  imagePipeline,
  async (req, res) => {
    try {
      const { product, rating, comment } = req.body;
      
      if (!product || !rating) {
        return res.status(400).json({ success: false, message: 'Product ID and Rating are required' });
      }

      // 1. Processed images
      const images = req.processedImages || [];

      const newReview = new Review({
        product,
        user: req.user._id,
        rating: Number(rating),
        comment,
        images
      });

      const savedReview = await newReview.save();
      // Populate user info for immediate return if needed, but simple return is okay
      const populatedReview = await Review.findById(savedReview._id).populate('user', 'name email');

      res.status(201).json({ success: true, data: normalizeReview(populatedReview) });
    } catch (error) {
      for (const img of req.processedImages || []) deleteImageVariants(img);
      console.error('Error saving review:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/reviews/product/:productId
// @desc    Get all approved reviews for a specific product (Public)
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      product: req.params.productId,
      status: 'Approved' 
    })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews.map(normalizeReview),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/reviews
// @desc    Fetch all reviews for the admin dashboard
router.get('/', protect, admin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name sku')
      .sort({ createdAt: -1 })
      .lean();
      
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews.map(normalizeReview),
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PATCH /api/reviews/:id/status
// @desc    Update review status (Approve/Reject)
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email').populate('product', 'name sku');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: normalizeReview(review) });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review and its images
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    for (const img of review.images || []) {
      deleteImageVariants(img && img.toObject ? img.toObject() : img);
    }

    res.status(200).json({ success: true, message: 'Review successfully deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
