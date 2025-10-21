const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { createRateLimiter } = require('./middleware/rateLimiterCustom');
const auth = require('./middleware/auth');
const passport = require('./config/passport');

// Routes
const healthRoutes = require('./routes/health');
const connectRoutes = require('./routes/connect');
const authRoutes = require('./routes/auth');
let youtubeRoutesFactory = require('./routes/youtube');
const twitchRoutes = require('./routes/twitch');
let kickRoutesFactory = require('./routes/kick');
const emojiRoutes = require('./routes/emoji');

const app = express();
const { createWsServer } = require('./ws/server');
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://mellchat-v5y7.vercel.app',
  'https://mellchat-v5y7-5oxlvx0a6-shamils-projects-6a5060d0.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any Vercel preview URL
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow browser extensions (Chrome, Firefox, Edge, etc.)
    if (origin && (origin.startsWith('chrome-extension://') || 
                   origin.startsWith('moz-extension://') || 
                   origin.startsWith('safari-web-extension://'))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Base global limiter (dev-friendly)
app.use('/api/', createRateLimiter({ windowMs: 60_000, max: 1000 }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check route (no auth required)
app.use('/api/v1/health', healthRoutes);

// Auth routes (OAuth)
app.use('/api/v1/auth', authRoutes);

// Connect route (no auth required for demo)
app.use('/api/v1/connect', connectRoutes);

// YouTube Live Chat routes (tighter per-route guard)
const youtubeRoutes = youtubeRoutesFactory(() => app.get('wsHub'));
app.use('/api/v1/youtube', createRateLimiter({ windowMs: 10_000, max: 200 }), youtubeRoutes);

// Twitch Chat routes (tighter per-route guard)
app.use('/api/v1/twitch', createRateLimiter({ windowMs: 10_000, max: 200 }), twitchRoutes);

// Kick Chat routes (best-effort polling)
const kickRoutes = kickRoutesFactory(() => app.get('wsHub'));
app.use('/api/v1/kick', createRateLimiter({ windowMs: 10_000, max: 200 }), kickRoutes);

// Emoji processing routes (no auth required for demo)
app.use('/api/v1/emoji', createRateLimiter({ windowMs: 10_000, max: 100 }), emojiRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Start server
const httpServer = app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
  });
});

// Start WebSocket server on the same port as HTTP
const wsHub = createWsServer(httpServer);
app.set('wsHub', wsHub);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
