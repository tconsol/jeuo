const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./config/logger');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const venueRoutes = require('./routes/venue.routes');
const bookingRoutes = require('./routes/booking.routes');
const activityRoutes = require('./routes/activity.routes');
const matchRoutes = require('./routes/match.routes');
const scoringRoutes = require('./routes/scoring.routes');
const paymentRoutes = require('./routes/payment.routes');
const walletRoutes = require('./routes/wallet.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const teamRoutes = require('./routes/team.routes');
const disputeRoutes = require('./routes/dispute.routes');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

// Trust reverse proxy (Cloud Run, GCP, etc.) — required for accurate IP-based rate limiting
app.set('trust proxy', parseInt(process.env.TRUST_PROXY || '1'));

// Security
app.use(helmet());

// Parse CORS origins from environment variable or use defaults
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173', // client
      'http://localhost:5174', // owner
      'http://localhost:5175', // admin
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

// Rate limiting — defaults are permissive for production; tighten via env vars if needed
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging   log every API request
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      logger[level](
        { method: req.method, url: req.originalUrl, status: res.statusCode, ms, ip: req.ip },
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`
      );
    });
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/scoring', scoringRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/disputes', disputeRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
