const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { createRateLimiter } = require('./middleware/rateLimiterCustom');
const auth = require('./middleware/auth');

// Routes
const messagesRoutes = require('./routes/messages');
const questionsRoutes = require('./routes/questions');
const upvotesRoutes = require('./routes/upvotes');
const healthRoutes = require('./routes/health');
const connectRoutes = require('./routes/connect');
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
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Base global limiter (dev-friendly)
app.use('/api/', createRateLimiter({ windowMs: 60_000, max: 1000 }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// API routes with authentication
app.use('/api/v1/messages', auth, messagesRoutes);
app.use('/api/v1/questions', auth, questionsRoutes);
app.use('/api/v1/upvotes', auth, upvotesRoutes);

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
