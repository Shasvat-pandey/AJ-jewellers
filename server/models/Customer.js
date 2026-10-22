const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: "", trim: true },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
  role: { type: String, default: 'customer', immutable: true },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' }
}, { 
  timestamps: true,
  collection: 'customers'
});

customerSchema.index({ status: 1 });

// Pre-save middleware for bcrypt hashing
customerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (/^\$2[abxy]\$\d{2}\$/.test(this.password)) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare passwords during login
customerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
