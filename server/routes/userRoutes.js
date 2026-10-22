const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Otp = require('../models/Otp'); 
const StoreSettings = require('../models/StoreSettings');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, sendOtpSchema } = require('../validators/schema');
const rateLimit = require('express-rate-limit');

// Rate limiters
const isProd = process.env.NODE_ENV === 'production';
const otpLimiter = isProd 
  ? rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes.' } })
  : (req, res, next) => next();

const authLimiter = isProd 
  ? rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' } })
  : (req, res, next) => next();

// Helper to get email transporter
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  
      pass: process.env.EMAIL_PASS         
    }
  });
}

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing from environment');
  return jwt.sign({ id: String(id) }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/users/send-otp
// @desc    Send 6-digit OTP to Email for registration verification
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.error("Email service configuration missing (EMAIL_USER / EMAIL_PASS).");
      return res.status(500).json({ success: false, message: "Email delivery service is currently unavailable" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    // Replace any previous unverified OTP for this email
    await Otp.deleteMany({ email: cleanEmail });
    await Otp.create({ email: cleanEmail, otp: hashedOtp });

    const senderEmail = process.env.EMAIL_USER;
    const noreplyEmail = process.env.NOREPLY_EMAIL || 'no-reply@ajjewellers.in';

    const mailOptions = {
      from: `"AJ Jewellers (No-Reply)" <${senderEmail}>`,
      replyTo: noreplyEmail,
      to: cleanEmail,
      subject: 'Your AJ Jewellers Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 25px; border: 1px solid #C9A24B; border-radius: 8px; background-color: #FDFBF4; max-width: 500px; margin: auto;">
          <h2 style="color: #4A0E1B; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 5px 0;">AJ JEWELLERS</h2>
          <p style="color: #C9A24B; font-size: 11px; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: bold;">SECURITY VERIFICATION</p>
          <p style="color: #2A0A10; font-size: 14px;">Your 6-digit email verification code is:</p>
          <div style="background-color: #FFFFFF; border: 1px solid #EAE3D5; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <h1 style="color: #4A0E1B; letter-spacing: 8px; font-size: 32px; margin: 0;">${otpCode}</h1>
          </div>
          <p style="color: #7A6A5C; font-size: 12px; margin: 10px 0 20px 0;">This code will expire in 10 minutes. If you did not request this, please disregard this email.</p>
          <div style="border-top: 1px solid #EAE3D5; padding-top: 12px; font-size: 11px; color: #9A8A7C;">
            <p style="margin: 0;">This is an automated notification from a no-reply address. Please do not reply directly to this email.</p>
            <p style="margin: 4px 0 0 0;">For inquiries, please contact <a href="mailto:care@ajjewellers.in" style="color: #C9A24B; text-decoration: none;">care@ajjewellers.in</a>.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Verification code sent to your email" });

  } catch (error) {
    console.error("OTP Send Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send verification email. Please try again." });
  }
});

// @route   POST /api/users/register
// @desc    Verify OTP and Register Customer
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone, otp } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }

    // Verify OTP strictly (No bypass)
    const validOtpRecord = await Otp.findOne({ email: cleanEmail });
    if (!validOtpRecord) {
      return res.status(400).json({ success: false, message: "Verification code is invalid or has expired" });
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), validOtpRecord.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Create user (role is always 'customer' on public registration)
    const user = await User.create({ 
      name: name.trim(), 
      email: cleanEmail, 
      password, 
      phone: phone.trim(),
      role: 'customer',
      status: 'Active'
    });

    // Mirror to Customer collection
    await Customer.create({
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      role: 'customer',
      status: 'Active'
    }).catch(err => console.error("Customer mirror sync warning:", err.message));

    await Otp.deleteMany({ email: cleanEmail });

    const token = generateToken(user._id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate customer or admin & get token
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      if (cleanEmail === 'admin@aj.com') {
        user = await Admin.findOne({ email: cleanEmail });
      } else {
        user = await Customer.findOne({ email: cleanEmail });
      }
    }

    if (user && user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: "Account suspended. Please contact customer support." });
    }

    if (user && (await user.matchPassword(password))) {
      // Guarantee role assignment: admin@aj.com is always 'admin', other accounts are 'customer'
      const role = cleanEmail === 'admin@aj.com' ? 'admin' : (user.role || 'customer');
      const token = generateToken(user._id);
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          role,
          token
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Authentication service error. Please try again." });
  }
});

// @route   POST /api/users/logout
// @desc    Logout user / clear cookie
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @route   GET /api/users/me
// @desc    Get current user profile (verify token)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load user profile" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile & saved address (BOLA FIXED: User can only update own account; non-admins cannot change role)
router.put('/:id', protect, async (req, res) => {
  try {
    // Enforce Authorization check
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not authorized to update this account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Permitted user fields
    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.phone) user.phone = req.body.phone.trim();
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.city !== undefined) user.city = req.body.city;
    if (req.body.state !== undefined) user.state = req.body.state;
    if (req.body.pincode !== undefined) user.pincode = req.body.pincode;

    // Only administrators can change role or status
    if (isAdmin) {
      if (req.body.role && ['customer', 'admin'].includes(req.body.role)) {
        user.role = req.body.role;
      }
      if (req.body.status && ['Active', 'Suspended'].includes(req.body.status)) {
        user.status = req.body.status;
      }
    }

    const updatedUser = await user.save();

    // Synchronize to Customer or Admin collection
    if (updatedUser.role === 'customer') {
      await Customer.findByIdAndUpdate(updatedUser._id, {
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        status: updatedUser.status
      }).catch(() => null);
    } else if (updatedUser.role === 'admin') {
      await Admin.findByIdAndUpdate(updatedUser._id, {
        name: updatedUser.name,
        phone: updatedUser.phone,
        status: updatedUser.status
      }).catch(() => null);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error("Profile update error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

// @route   POST /api/users/contact
// @desc    Handle customer contact form messages
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Please provide your name, email, and message" });
    }

    const settings = await StoreSettings.findOne();
    const adminEmail = settings?.businessInfo?.email || process.env.EMAIL_USER;

    if (settings?.notifications?.customerMessages && adminEmail) {
      const transporter = getTransporter();
      if (transporter) {
        const mailOptions = {
          from: `"AJ Jewellers Contact Form" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          replyTo: email,
          subject: `New Customer Message from ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #4A0E1B; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #C9A24B; border-radius: 5px;">
              <h2 style="color: #C9A24B;">New Customer Message</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <div style="background-color: #FDFBF4; padding: 15px; border-left: 4px solid #C9A24B; margin: 20px 0;">
                <strong>Message:</strong><br/>
                <span style="white-space: pre-wrap;">${message}</span>
              </div>
              <p style="font-size: 12px; color: #7A6A5C;">Reply directly to this email to reach the customer.</p>
            </div>
          `
        };
        transporter.sendMail(mailOptions).catch(err => console.error("Contact form email failed:", err.message));
      }
    }

    res.status(200).json({ success: true, message: "Thank you for contacting us. We will get back to you shortly." });
  } catch (error) {
    console.error("Contact form error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin Dashboard only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Suspend or reactivate a user account (Admin only)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Use 'Active' or 'Suspended'." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be suspended" });
    }

    user.status = status;
    await user.save();

    // Mirror status to Customer collection
    await Customer.findByIdAndUpdate(user._id, { status }).catch(() => null);

    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, status: user.status }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/customers
// @desc    Get all customers from Customer collection (Admin only)
router.get('/customers', protect, admin, async (req, res) => {
  try {
    const customers = await Customer.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/admins
// @desc    Get all admins from Admin collection (Admin only)
router.get('/admins', protect, admin, async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;