// server/models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // <-- MAGIC: MongoDB will auto-delete this document after 600 seconds (10 mins)
  }
});

module.exports = mongoose.model('Otp', otpSchema);