const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  images: [
    {
      original: { type: String, required: true },
      thumbnail: { type: String, default: '' },
      medium: { type: String, default: '' },
      large: { type: String, default: '' },
      alt: { type: String, default: 'Review image' }
    }
  ],
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
