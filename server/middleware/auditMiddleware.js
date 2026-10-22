const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = new Set([
  'password', 'passkey', 'token', 'otp', 'creditCard', 'authorization',
  'secret', 'razorpay_secret', 'pin', 'key_secret', 'email_pass'
]);

function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizePayload(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

const auditLog = async (req, res, next) => {
  res.on('finish', async () => {
    // Only log write actions from admin users
    if (req.user && req.user.role === 'admin' && req.method !== 'GET') {
      try {
        const sanitizedBody = sanitizePayload(req.body);
        await AuditLog.create({
          adminId: req.user._id,
          action: req.method,
          endpoint: req.originalUrl,
          payload: sanitizedBody,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
      } catch (err) {
        console.error('Audit log failed:', err.message);
      }
    }
  });
  next();
};

module.exports = auditLog;
