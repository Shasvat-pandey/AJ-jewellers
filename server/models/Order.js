const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Product.variants' }, // Optional specific variant selected
  name: { type: String, required: true },
  specs: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  // Store variant-specific details for accurate pricing
  variantWeight: { type: Number },
  variantPurity: { type: String },
  gstPercent: { type: Number, default: 3 }
});

const paymentEvidenceSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storageKey: { type: String, required: true }, // Internal safe filename/path
  fileUrl: { type: String, required: true }, // Secure access URL
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String, default: 'Administrator' }
  },
  note: { type: String, default: '' }
});

const paymentHistorySchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'Evidence Uploaded', 'Payment Verified', 'Status Updated'
  fromStatus: { type: String },
  toStatus: { type: String },
  changedBy: {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String, default: 'System/Admin' }
  },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, default: "" }, // Customer user ID
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String, default: '' },
  
  // Hyperlocal Delivery Location & Pinpoint GPS Coordinates
  deliveryLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    landmark: { type: String, default: '' },
    formattedAddress: { type: String, default: '' },
    mapsUrl: { type: String, default: '' }
  },
  
  items: [orderItemSchema],
  subtotalAmount: { type: Number },
  taxAmount: { type: Number },
  shippingFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  lockedGoldRate: { type: Number },
  lockedGoldRateTimestamp: { type: Date },
  
  // Supported payment methods: cash, cash_on_delivery, pay_at_boutique, bank_transfer, external_upi
  paymentMethod: { type: String, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Awaiting Verification', 'Paid', 'Failed', 'Refunded'], 
    default: 'Pending' 
  }, 
  paidAt: { type: Date, default: null },
  paymentReference: { type: String, default: '' },
  amountPaid: { type: Number, default: 0 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
  internalAdminNotes: [
    {
      note: { type: String, required: true },
      addedBy: { type: String, required: true },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  evidence: [
    {
      originalName: { type: String, required: true },
      filename: { type: String, required: true },
      path: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      transactionReference: { type: String, default: '' }
    }
  ],
  history: [
    {
      status: { type: String, required: true },
      actor: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: '' }
    }
  ],
  
  paymentDetails: {
    paymentReference: { type: String, default: '' }, // Bank UTR, UPI Ref, Cheque No, Cash Receipt #
    amountPaid: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    verifiedBy: {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      adminName: { type: String, default: '' },
      adminEmail: { type: String, default: '' }
    },
    verifiedAt: { type: Date, default: null },
    internalAdminNote: { type: String, default: '' },
    evidence: [paymentEvidenceSchema],
    history: [paymentHistorySchema],
    // Legacy fields preserved for backward compatibility with historical orders
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
  },

  orderStatus: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing' 
  }, 
  placedAt: { type: Date, default: Date.now },
  processingAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  inventoryRestocked: { type: Boolean, default: false }, // Prevents double-restocking on cancel

  deliveredEmailSent: { type: Boolean, default: false },
  deliveredEmailSentAt: { type: Date },
  
  returnRequest: {
    type: { type: String, enum: ['None', 'Return', 'Resizing'], default: 'None' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
    reason: { type: String },
    requestedAt: { type: Date },
    adminResponse: { type: String }
  }
}, { timestamps: true });

// Performance indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);