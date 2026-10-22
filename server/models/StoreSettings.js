const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  marketRates: {
    rate24k: { type: Number, default: 7450 },
    rate22k: { type: Number, default: 6830 },
    rate18k: { type: Number, default: 5580 },
    silver: { type: Number, default: 92 },
    diamond: { type: Number, default: 45000 },
    lockDurationMinutes: { type: Number, default: 15 } // Gold rate lock validity in minutes
  },
  businessInfo: {
    businessName: { type: String, default: "AJ JEWELLERS" },
    tagline: { type: String, default: "Exquisite Craftsmanship Since 1985" },
    logo: { type: String, default: "" },
    email: { type: String, default: "support@ajjewellers.com" },
    phone: { type: String, default: "+91 98765 43210" },
    address: { type: String, default: "123 Heritage Lane, Kolkata, West Bengal" },
    gstin: { type: String, default: "24AAAAA0000A1Z5" },
    pan: { type: String, default: "AAAAA0000A" },
    gstRate: { type: Number, default: 3 },
    bankDetails: {
      accountName: { type: String, default: "AJ JEWELLERS PVT LTD" },
      accountNumber: { type: String, default: "50200012345678" },
      bankName: { type: String, default: "HDFC Bank" },
      ifscCode: { type: String, default: "HDFC0001234" },
      upiId: { type: String, default: "ajjewellers@okhdfcbank" }
    }
  },
  notifications: {
    newOrders: { type: Boolean, default: true },
    lowStock: { type: Boolean, default: true },
    customerMessages: { type: Boolean, default: false }
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);