const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); 
const dns = require("dns");
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const auditLog = require('./middleware/auditMiddleware');

dotenv.config();

// SEC-16: Configurable DNS servers
if (process.env.DNS_SERVERS) {
  try {
    const servers = process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
      console.log('📡 Custom DNS servers configured:', servers);
    }
  } catch (dnsErr) {
    console.warn('⚠️ Failed to set custom DNS servers:', dnsErr.message);
  }
} else if (process.env.NODE_ENV !== 'production') {
  // Optional local dev fallback
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

// SEC-08: Validate JWT Secret at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
} else if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  console.error('FATAL: Production JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

// Ensure private and public upload directories exist
const publicUploadsDir = path.join(__dirname, 'uploads');
const privateEvidenceDir = path.join(__dirname, 'uploads', 'evidence');
const archivesDir = path.join(__dirname, 'archives', 'invoices');
[publicUploadsDir, privateEvidenceDir, archivesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function startServer() {
  try {
    await connectDB(); 

    const app = express();

    // Set security HTTP headers
    app.use(helmet({ crossOriginResourcePolicy: false }));

    // SEC-06: Strict CORS allowlist (Reject wildcard reflections with credentials)
    const rawAllowedOrigins = process.env.CLIENT_URL || process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
    const allowedOrigins = rawAllowedOrigins
      .split(',')
      .map(o => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    // Add localhost dev defaults if not in production
    if (process.env.NODE_ENV !== 'production') {
      ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'].forEach(devOrigin => {
        if (!allowedOrigins.includes(devOrigin)) {
          allowedOrigins.push(devOrigin);
        }
      });
    }

    app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or same-origin SSR)
        if (!origin) return callback(null, true);
        
        const normalizedOrigin = origin.replace(/\/+$/, '');
        if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
          callback(null, true);
        } else {
          console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
          callback(new Error(`CORS Error: Origin ${origin} not allowed by Access-Control-Allow-Origin`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
    // Cookie parser
    app.use(cookieParser());

    // Audit Log for admins (payload-sanitized)
    app.use(auditLog);

    // Body parser, reading data from body into req.body and limit size, while preserving rawBody
    app.use(express.json({ 
      limit: '10kb',
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      }
    }));

    // Data sanitization against NoSQL query injection
    app.use((req, res, next) => {
      Object.defineProperty(req, 'query', {
        value: req.query,
        writable: true,
        enumerable: true,
        configurable: true
      });
      next();
    });
    app.use(mongoSanitize());
    
    // Data sanitization against XSS
    app.use(xss());

    // Prevent parameter pollution
    app.use(hpp());

    const { protect, admin } = require('./middleware/authMiddleware');

    // SEC-13: Serve ONLY public product media publicly.
    // Private payment evidence (/uploads/evidence) is blocked from direct public static serving!
    app.use('/uploads', (req, res, next) => {
      // Explicitly block any direct public URL access to the evidence directory
      if (req.path.startsWith('/evidence') || req.path.includes('evidence')) {
        return res.status(403).json({ success: false, message: 'Access denied: Payment evidence is private.' });
      }
      next();
    }, express.static(publicUploadsDir, {
      maxAge: '30d',
      immutable: true,
      setHeaders: (res, filePath) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (/\.(webp|avif|jpe?g|png)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        } else if (/\.(mp4|webm)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }
    }));

    // SEC-13: Authenticated Admin-Only Route to securely stream private payment evidence
    app.get('/api/orders/:id/payment-evidence/:filename', protect, admin, (req, res) => {
      try {
        const safeFilename = path.basename(req.params.filename);
        const filePath = path.join(privateEvidenceDir, safeFilename);

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ success: false, message: 'Payment evidence file not found.' });
        }

        // Determine safe content type
        const ext = path.extname(safeFilename).toLowerCase();
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      } catch (err) {
        console.error('Error serving payment evidence:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve evidence file.' });
      }
    });

    // --- IMPORT ALL ROUTES ---
    const productRoutes = require('./routes/productRoutes');
    const settingsRoutes = require('./routes/settingsRoutes');
    const userRoutes = require('./routes/userRoutes');
    const orderRoutes = require('./routes/orderRoutes');
    const paymentRoutes = require('./routes/paymentRoutes');
    const reviewRoutes = require('./routes/reviewRoutes');
    const appointmentRoutes = require('./routes/appointmentRoutes');

    // --- USE ALL ROUTES ---
    app.use('/api/products', productRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payment', paymentRoutes); // Decommissioned / 410 Gone handler
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/appointments', appointmentRoutes); // SEC-09 & FT-11 internal appointment API

    // Global 404 handler for unknown API routes
    app.use('/api', (req, res) => {
      res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
    });

    // Global Error Handler - Never leak stack traces in production
    app.use((err, req, res, next) => {
      console.error('Unhandled Application Error:', err.message);
      if (process.env.NODE_ENV !== 'production' && err.stack) {
        console.error(err.stack);
      }
      res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error. Please try again later.' 
          : err.message
      });
    });

    const PORT = process.env.PORT || 5000;

    // Start background jobs
    const { startArchiveCleaner } = require('./services/archiveCleaner');
    startArchiveCleaner();

    app.listen(PORT, () => {
      console.log(`🚀 AJ Jewellers server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();