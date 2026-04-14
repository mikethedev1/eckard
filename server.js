require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const authRoutes  = require('./routes/authRoutes');
const userRoutes  = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentMethodRoutes  = require('./routes/paymentMethodRoutes'); 
const { getPlans } = require('./controllers/investmentController');
const { authenticate } = require('./middlewares/authMiddleware');
const { startCronJobs } = require('./services/cronService');
const logger       = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow image serving
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────
// const globalLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
//   standardHeaders: true,
//   legacyHeaders:   false,
//   message: { success: false, message: 'Too many requests, please try again later.' },
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10,                    // 10 login attempts
//   message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
// });

// app.use(globalLimiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

// ─── Static Files ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Eckard Oil Capital API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Public Routes ────────────────────────────────────────────────────────
// Plans are public so the marketing/landing page can show them without login
app.get('/api/plans', getPlans);

// ─── Auth Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── User Routes ──────────────────────────────────────────────────────────
app.use('/api/user', userRoutes);

// ─── Admin Routes ─────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);

// ─── Payment Method Routes ────────────────────────────────────────────────
app.use('/api/payment-methods', paymentMethodRoutes); 

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message && err.message.includes('Only JPG')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message    = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred'
    : err.message;

  res.status(statusCode).json({ success: false, message });
});

// ─── Start Server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Eckard Oil Capital API running on port ${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173/'}`);

  // Start background cron jobs
  startCronJobs();
});

module.exports = app;
