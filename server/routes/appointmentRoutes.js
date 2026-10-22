const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const Appointment = require('../models/Appointment');
const StoreSettings = require('../models/StoreSettings');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { appointmentSchema } = require('../validators/schema');

// Rate limiting for appointment requests (Max 10 requests per 15 minutes per IP)
const appointmentLimiter = process.env.NODE_ENV === 'production' 
  ? rateLimit({ 
      windowMs: 15 * 60 * 1000, 
      max: 10, 
      message: { success: false, message: 'Too many appointment requests. Please try again later.' } 
    })
  : (req, res, next) => next();

// Email transporter helper
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// @route   POST /api/appointments
// @desc    Submit a viewing appointment request (Internal & Secure)
router.post('/', appointmentLimiter, optionalProtect, validate(appointmentSchema), async (req, res) => {
  try {
    const { customerName, phone, userLocation, preferredDate, interests } = req.body;

    // Optional user attachment if authenticated
    let userId = null;
    if (req.user && req.user._id) {
      userId = req.user._id;
    }

    const appointment = await Appointment.create({
      customerName,
      phone,
      userLocation,
      preferredDate: new Date(preferredDate),
      interests,
      userId,
      status: 'Pending'
    });

    // Notify Store Admin via email if configured
    try {
      const settings = await StoreSettings.findOne();
      const adminEmail = settings?.businessInfo?.email || process.env.EMAIL_USER;
      const transporter = getTransporter();

      if (transporter && adminEmail) {
        const mailOptions = {
          from: `"AJ Jewellers Appointments" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          subject: `✨ New Boutique Appointment Request: ${customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #4A0E1B; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #C9A24B; border-radius: 8px; background-color: #FDFBF4;">
              <h2 style="color: #4A0E1B; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px 0;">AJ JEWELLERS</h2>
              <p style="color: #C9A24B; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">New Private Viewing Request</p>
              
              <div style="background-color: #FFFFFF; border: 1px solid #EAE3D5; padding: 18px; margin: 15px 0; border-radius: 4px;">
                <p style="margin: 6px 0;"><strong>Client Name:</strong> ${customerName}</p>
                <p style="margin: 6px 0;"><strong>Mobile:</strong> <a href="tel:${phone}" style="color: #4A0E1B;">${phone}</a></p>
                <p style="margin: 6px 0;"><strong>Location:</strong> ${userLocation}</p>
                <p style="margin: 6px 0;"><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 6px 0;"><strong>Jewellery Preferences:</strong><br/><span style="color: #7A6A5C;">${interests}</span></p>
              </div>

              <p style="font-size: 12px; color: #7A6A5C;">Please contact the client to confirm appointment timing and concierge arrangements.</p>
            </div>
          `
        };

        transporter.sendMail(mailOptions).catch(err => console.error("Appointment email notification failed:", err.message));
      }
    } catch (emailErr) {
      console.warn("Could not send appointment notification email:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your private viewing appointment request has been submitted. Our concierge will contact you shortly.',
      data: appointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to record appointment request' });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ preferredDate: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status and admin notes (Admin only)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (status && !['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) appointment.status = status;
    if (adminNotes !== undefined) appointment.adminNotes = adminNotes;

    await appointment.save();
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
