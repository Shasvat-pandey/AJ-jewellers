const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: "", trim: true },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
  dob: { type: String, default: "" },
  gender: { type: String, default: "" },
  avatar: { type: String, default: "" },
  addresses: [{
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    tag: { type: String, default: "Home" },
    isDefault: { type: Boolean, default: false },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    addressLine: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  }],
  notifications: {
    orderUpdates: { type: Boolean, default: true },
    whatsappAlerts: { type: Boolean, default: true },
    privilegeOffers: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false }
  },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' }
}, { 
  timestamps: true 
});

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Pre-save middleware (Modern Async approach, NO 'next' callback)
userSchema.pre('save', async function () {
  // If the password is not modified, skip the encryption
  if (!this.isModified('password')) return;
  
  // Generate a secure salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);