const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Initialize global connection maps
global.activeKickConnections = global.activeKickConnections || new Map();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiters, rateLimitStats } = require('./middleware/rateLimiter');
const { metricsMiddleware, register } = require('./utils/metrics');
const auth = require('./middleware/auth');
const passport = require('./config/passport');

// Routes
const healthRoutes = require('./routes/health');
const connectRoutes = require('./routes/connect');
const authRoutes = require('./routes/auth');
const databaseRoutes = require('./routes/database');
const adminRoutes = require('./routes/admin');
const adaptiveMessagesRoutes = require('./routes/adaptiveMessages');
const dateMessagesRoutes = require('./routes/dateMessages');
const paginationMessagesRoutes = require('./routes/paginationMessages');
let youtubeRoutesFactory = require('./routes/youtube');
const twitchRoutes = require('./routes/twitch');
let kickRoutesFactory = require('./routes/kick');
const emojiRoutes = require('./routes/emoji');
const messagesRoutes = require('./routes/messages');

const app = express();
const { createWsServer } = require('./ws/server');
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Vite dev server (alternate port)
  'http://192.168.88.22:5173', // Local network access (mobile testing)
  'https://mellchat.vercel.app', // Production Vercel
  'https://mellchat-v5y7.vercel.app', // Old Vercel (legacy)
  'https://mellchat.live', // Custom domain
  'https://www.mellchat.live', // Custom domain with www
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
].filter(Boolean);

// Log allowed origins for debugging
logger.info('CORS allowed origins:', { allowedOrigins });

app.use(cors({
  origin: (origin, callback) => {
    // Log CORS requests for debugging
    logger.info('CORS request:', { origin, allowedOrigins });
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      logger.info('CORS allowed:', { origin });
      return callback(null, true);
    }
    
    // Allow any Vercel preview URL
    if (origin && origin.includes('.vercel.app')) {
      logger.info('CORS allowed (Vercel):', { origin });
      return callback(null, true);
    }
    
    // Allow browser extensions (Chrome, Firefox, Edge, etc.)
    if (origin && (origin.startsWith('chrome-extension://') || 
                   origin.startsWith('moz-extension://') || 
                   origin.startsWith('safari-web-extension://'))) {
      logger.info('CORS allowed (extension):', { origin });
      return callback(null, true);
    }
    
    logger.warn('CORS blocked:', { origin });
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting middleware (применяем перед body parsing)
app.use(rateLimitStats); // Логируем статистику устройств
app.use('/api/v1', rateLimiters.general); // Общий лимит для API

// Metrics middleware
app.use(metricsMiddleware);

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

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Failed to generate metrics', error);
    res.status(500).end('Failed to generate metrics');
  }
});

// Auth routes (OAuth) - строгий лимит
app.use('/api/v1/auth', rateLimiters.auth, authRoutes);

// Database routes - лимит для сообщений
app.use('/api/v1/database', rateLimiters.messages, databaseRoutes);
app.use('/api/v1/adaptive', rateLimiters.messages, adaptiveMessagesRoutes);
app.use('/api/v1/date-messages', rateLimiters.messages, dateMessagesRoutes);
app.use('/api/v1/pagination-messages', rateLimiters.messages, paginationMessagesRoutes);

// Admin routes - строгий лимит
app.use('/api/v1/admin', rateLimiters.auth, adminRoutes);

// Connect route - общий лимит
app.use('/api/v1/connect', rateLimiters.general, connectRoutes);

// YouTube Live Chat routes
const youtubeRoutes = youtubeRoutesFactory(() => app.get('wsHub'));
app.use('/api/v1/youtube', rateLimiters.general, youtubeRoutes);

// Twitch Chat routes
app.use('/api/v1/twitch', rateLimiters.general, twitchRoutes);

// Kick Chat routes
const kickRoutes = kickRoutesFactory(() => app.get('wsHub'));
app.use('/api/v1/kick', rateLimiters.general, kickRoutes);

// Emoji processing routes - лимит для поиска
app.use('/api/v1/emoji', rateLimiters.search, emojiRoutes);

// Messages routes - лимит для сообщений
app.use('/api/v1/messages', rateLimiters.messages, messagesRoutes);

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
const httpServer = app.listen(PORT, HOST, () => {
  logger.info(`API Gateway started on ${HOST}:${PORT}`, {
    host: HOST,
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
