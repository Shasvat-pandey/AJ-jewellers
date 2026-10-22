const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, default: "" }, // e.g., ring size, bangle size, chain length
  color: { type: String, enum: ['Same as Base', 'Yellow Gold', 'Rose Gold', 'White Gold', 'Platinum', 'Silver', 'None'], default: 'Same as Base' },
  purity: { type: String, enum: ['Same as Base', '14K Gold', '18K Gold', '22K Gold', '24K Gold', 'Silver (925)', 'None'], default: 'Same as Base' },
  weight: { type: Number }, // Variant specific weight
  makingCharges: { type: Number }, // Override for specific variant
  gst: { type: Number }, // Override for specific variant GST
  stock: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  productCollection: { type: String, default: "Standard" },
  purity: { type: String, required: true }, // base purity
  weight: { type: Number, required: true },
  makingCharges: { type: Number, required: true },
  gst: { type: Number, default: 3 }, // Base GST
  diamondCarat: { type: Number, default: 0 },
  diamondValue: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 1 }, // Total base stock
  variants: [variantSchema],
  description: { type: String, default: "" },
  status: { type: String, default: "In Stock" },
  isFavorite: { type: Boolean, default: false },
  
  // Product media: responsive variant objects
  images: [
    {
      original: { type: String, required: true },
      thumbnail: { type: String, default: '' },
      medium: { type: String, default: '' },
      large: { type: String, default: '' },
      alt: { type: String, default: 'Product image' },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      format: { type: String, default: null },
      size: { type: Number, default: null },
    },
  ],
  videoUrl: { type: String, default: "" }, 
}, { timestamps: true });

// Auto-sync global stock from variants
productSchema.pre('save', function() {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }
});

// Auto-sync status with stock level
productSchema.pre('save', function() {
  if (this.isModified('stock') || this.isNew) {
    if (this.stock <= 0) {
      this.status = 'Out of Stock';
    } else if (this.stock <= 5) {
      this.status = 'Low Stock';
    } else {
      this.status = 'In Stock';
    }
  }
});

// Also handle findOneAndUpdate to keep status in sync
productSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  if (!update) return;
  const stockValue = update.stock !== undefined ? update.stock : update.$set?.stock;
  if (stockValue !== undefined) {
    const status = stockValue <= 0 ? 'Out of Stock' : stockValue <= 5 ? 'Low Stock' : 'In Stock';
    if (update.stock !== undefined) {
      update.status = status;
    } else {
      update.$set = update.$set || {};
      update.$set.status = status;
    }
  }
});

// Performance and catalog query indexes
productSchema.index({ category: 1, status: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);