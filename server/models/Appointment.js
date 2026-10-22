const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customerName: { 
    type: String, 
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  phone: { 
    type: String, 
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  userLocation: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true,
    maxlength: 250
  },
  preferredDate: { 
    type: Date, 
    required: [true, 'Preferred date is required'] 
  },
  interests: { 
    type: String, 
    required: [true, 'Interests/Viewing preference is required'],
    trim: true,
    maxlength: 1000
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

appointmentSchema.index({ status: 1 });
appointmentSchema.index({ preferredDate: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
