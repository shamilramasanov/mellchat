const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');

// Routes
const messagesRoutes = require('./routes/messages');
const questionsRoutes = require('./routes/questions');
const upvotesRoutes = require('./routes/upvotes');
const healthRoutes = require('./routes/health');
const connectRoutes = require('./routes/connect');
const youtubeRoutes = require('./routes/youtube');
const twitchRoutes = require('./routes/twitch');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting - более мягкие лимиты для разработки
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 минута
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 запросов в минуту
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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

// YouTube Live Chat routes
app.use('/api/v1/youtube', youtubeRoutes);

// Twitch Chat routes
app.use('/api/v1/twitch', twitchRoutes);

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
app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
  });
});

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
