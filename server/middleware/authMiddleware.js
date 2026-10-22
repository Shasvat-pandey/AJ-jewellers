const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, please sign in' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id).select('-password');
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password');
    }
    if (!user) {
      user = await Customer.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, account no longer exists' });
    }

    // Guarantee admin@aj.com is strictly admin
    if (user.email && user.email.toLowerCase() === 'admin@aj.com') {
      user.role = 'admin';
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id).select('-password');
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password') || await Customer.findById(decoded.id).select('-password');
    }
    if (user && user.email && user.email.toLowerCase() === 'admin@aj.com') {
      user.role = 'admin';
    }
    if (user && user.status !== 'Suspended') {
      req.user = user;
    }
  } catch (err) {
    // Optional auth - gracefully continue if token invalid
  }
  next();
};

module.exports = { protect, admin, optionalProtect };
