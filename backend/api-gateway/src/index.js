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
logger.info('Loading routes...');
const healthRoutes = require('./routes/health');
logger.info('✅ healthRoutes loaded');
const connectRoutes = require('./routes/connect');
logger.info('✅ connectRoutes loaded');
const authRoutes = require('./routes/auth');
logger.info('✅ authRoutes loaded');
const databaseRoutes = require('./routes/database');
logger.info('✅ databaseRoutes loaded, type:', typeof databaseRoutes);
const adminRoutes = require('./admin/routes/adminRoutes');
logger.info('✅ adminRoutes loaded');
const adaptiveMessagesRoutes = require('./routes/adaptiveMessages');
logger.info('✅ adaptiveMessagesRoutes loaded');
const dateMessagesRoutes = require('./routes/dateMessages');
logger.info('✅ dateMessagesRoutes loaded');
const paginationMessagesRoutes = require('./routes/paginationMessages');
logger.info('✅ paginationMessagesRoutes loaded');
let youtubeRoutesFactory = require('./routes/youtube');
logger.info('✅ youtubeRoutesFactory loaded');
const twitchRoutes = require('./routes/twitch');
logger.info('✅ twitchRoutes loaded');
let kickRoutesFactory = require('./routes/kick');
logger.info('✅ kickRoutesFactory loaded');
const emojiRoutes = require('./routes/emoji');
logger.info('✅ emojiRoutes loaded');
const messagesRoutes = require('./routes/messages');
logger.info('✅ messagesRoutes loaded');
const reputationRoutes = require('./routes/reputation');
logger.info('✅ reputationRoutes loaded');
const databaseMonitoringRoutes = require('./routes/database-monitoring');
logger.info('✅ databaseMonitoringRoutes loaded');
const aiRoutes = require('./routes/ai');
logger.info('✅ aiRoutes loaded');
const pollingRoutes = require('./routes/polling');
logger.info('✅ pollingRoutes loaded');
logger.info('✅ All routes loaded successfully');

const app = express();
const { createWsServer } = require('./ws/server');
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Railway автоматически устанавливает PORT, проверяем это
if (process.env.RAILWAY_ENVIRONMENT) {
  logger.info('Running on Railway, using Railway PORT:', process.env.PORT);
}

logger.info(`Starting server with config:`, {
  PORT,
  HOST,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET'
});

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Vite dev server (alternate port)
  'http://192.168.19.76:5173', // Local network access (mobile testing)
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
    
    // В production разрешаем только определенные домены
    if (process.env.NODE_ENV === 'production') {
      // Проверяем, что origin входит в список разрешенных
      if (allowedOrigins.includes(origin)) {
        logger.info('CORS allowed (production):', { origin });
        return callback(null, true);
      }
      
      // Разрешаем Vercel preview URLs
      if (origin && origin.includes('.vercel.app')) {
        logger.info('CORS allowed (Vercel preview):', { origin });
        return callback(null, true);
      }
      
      logger.warn('CORS blocked in production:', { origin });
      return callback(new Error('Not allowed by CORS in production'));
    }
    
    if (allowedOrigins.includes(origin)) {
      logger.info('CORS allowed:', { origin });
      return callback(null, true);
    }
    
    // Allow any Vercel preview URL
    if (origin && origin.includes('.vercel.app')) {
      logger.info('CORS allowed (Vercel):', { origin });
      return callback(null, true);
    }
    
    // Allow any local network IP (192.168.x.x)
    if (origin && origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      logger.info('CORS allowed (local network):', { origin });
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
logger.info('✅ CORS middleware configured');

// Handle preflight requests with same CORS configuration
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.19.76:5173',
      'https://mellchat.vercel.app',
      'https://mellchat-v5y7.vercel.app',
      'https://mellchat.live',
      'https://www.mellchat.live',
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (origin && origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS in production'));
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting middleware (применяем перед body parsing)
app.use(rateLimitStats); // Логируем статистику устройств
app.use('/api/v1', rateLimiters.general); // Общий лимит для API

// Metrics middleware
app.use(metricsMiddleware);

// Body parsing middleware
logger.info('Setting up body parsing middleware...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
logger.info('✅ Body parsing middleware configured');

// Initialize Passport
logger.info('Setting up Passport...');
app.use(passport.initialize());
logger.info('✅ Passport initialized');

// Request logging
logger.info('Setting up request logging...');
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});
logger.info('✅ Request logging configured');

// Health check route (no auth required)
logger.info('Setting up health routes...');
app.use('/api/v1/health', healthRoutes);
logger.info('✅ Health routes configured');

// Metrics endpoint for Prometheus
logger.info('Setting up metrics endpoint...');
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Failed to generate metrics', error);
    res.status(500).end('Failed to generate metrics');
  }
});
logger.info('✅ Metrics endpoint configured');

// Auth routes (OAuth) - строгий лимит
logger.info('Setting up auth routes...');
app.use('/api/v1/auth', rateLimiters.auth, authRoutes);
logger.info('✅ Auth routes configured');

// Database routes - лимит для сообщений
logger.info('Setting up database routes...');
try {
  logger.info('Loading databaseRoutes...');
  
  // Проверяем, что databaseRoutes не undefined
  if (!databaseRoutes) {
    throw new Error('databaseRoutes is undefined - import failed');
  }
  
  // Проверяем, что rateLimiters.messages не undefined
  if (!rateLimiters || !rateLimiters.messages) {
    throw new Error('rateLimiters.messages is undefined - rate limiter initialization failed');
  }
  
  logger.info('databaseRoutes type:', typeof databaseRoutes);
  logger.info('databaseRoutes constructor:', databaseRoutes.constructor.name);
  logger.info('rateLimiters.messages type:', typeof rateLimiters.messages);
  
  app.use('/api/v1/database', rateLimiters.messages, databaseRoutes);
  logger.info('✅ databaseRoutes loaded');
  
  logger.info('Loading adaptiveMessagesRoutes...');
  app.use('/api/v1/adaptive', rateLimiters.messages, adaptiveMessagesRoutes);
  logger.info('✅ adaptiveMessagesRoutes loaded');
  
  logger.info('Loading dateMessagesRoutes...');
  app.use('/api/v1/date-messages', rateLimiters.messages, dateMessagesRoutes);
  logger.info('✅ dateMessagesRoutes loaded');
  
  logger.info('Loading paginationMessagesRoutes...');
  app.use('/api/v1/pagination-messages', rateLimiters.messages, paginationMessagesRoutes);
  logger.info('✅ paginationMessagesRoutes loaded');
  
  logger.info('✅ Database routes configured');
} catch (error) {
  logger.error('❌ Error setting up database routes:', error);
  throw error;
}

// Admin routes - специальный лимит для админ панели
logger.info('Setting up admin routes...');
try {
  app.use('/api/v1/admin', rateLimiters.admin, adminRoutes);
  app.use('/api/v1/ai', rateLimiters.admin, aiRoutes);
  logger.info('✅ Admin routes configured');
  logger.info('✅ AI routes configured');
} catch (error) {
  logger.error('❌ Error setting up admin routes:', error);
  throw error;
}

// Polling routes (fallback for WebSocket)
logger.info('Setting up polling routes...');
try {
  app.use('/api/v1/polling', rateLimiters.general, pollingRoutes);
  logger.info('✅ Polling routes configured');
} catch (error) {
  logger.error('❌ Error setting up polling routes:', error);
  throw error;
}

// Connect route - общий лимит
logger.info('Setting up connect routes...');
try {
  app.use('/api/v1/connect', rateLimiters.general, connectRoutes);
  logger.info('✅ Connect routes configured');
} catch (error) {
  logger.error('❌ Error setting up connect routes:', error);
  throw error;
}

// Streams status check route
logger.info('Setting up streams routes...');
try {
  const streamsRoutes = require('./routes/streams');
  app.use('/api/v1/streams', rateLimiters.general, streamsRoutes);
  logger.info('✅ Streams routes configured');
} catch (error) {
  logger.error('❌ Error setting up streams routes:', error);
  throw error;
}

// YouTube Live Chat routes
logger.info('Setting up YouTube routes...');
try {
  const youtubeRoutes = youtubeRoutesFactory(() => app.get('wsHub'));
  app.use('/api/v1/youtube', rateLimiters.general, youtubeRoutes);
  logger.info('✅ YouTube routes configured');
} catch (error) {
  logger.error('❌ Error setting up YouTube routes:', error);
  throw error;
}

// Twitch Chat routes
logger.info('Setting up Twitch routes...');
try {
  app.use('/api/v1/twitch', rateLimiters.general, twitchRoutes);
  logger.info('✅ Twitch routes configured');
} catch (error) {
  logger.error('❌ Error setting up Twitch routes:', error);
  throw error;
}

// Kick Chat routes
logger.info('Setting up Kick routes...');
try {
  const kickRoutes = kickRoutesFactory(() => app.get('wsHub'));
  app.use('/api/v1/kick', rateLimiters.general, kickRoutes);
  logger.info('✅ Kick routes configured');
} catch (error) {
  logger.error('❌ Error setting up Kick routes:', error);
  throw error;
}

// Emoji processing routes - лимит для поиска
logger.info('Setting up emoji routes...');
try {
  app.use('/api/v1/emoji', rateLimiters.search, emojiRoutes);
  logger.info('✅ Emoji routes configured');
} catch (error) {
  logger.error('❌ Error setting up emoji routes:', error);
  throw error;
}

// Messages routes - лимит для сообщений
logger.info('Setting up messages routes...');
try {
  if (!rateLimiters.messages) {
    throw new Error('rateLimiters.messages is undefined - rate limiter initialization failed');
  }
  app.use('/api/v1/messages', rateLimiters.messages, messagesRoutes);
  logger.info('✅ Messages routes configured');
} catch (error) {
  logger.error('❌ Error setting up messages routes:', error);
  throw error;
}

// Reputation routes - общий лимит
logger.info('Setting up reputation routes...');
try {
  app.use('/api/v1/reputation', rateLimiters.general, reputationRoutes);
  logger.info('✅ Reputation routes configured');
} catch (error) {
  logger.error('❌ Error setting up reputation routes:', error);
  throw error;
}

// Database monitoring routes - лимит для мониторинга
logger.info('Setting up database monitoring routes...');
try {
  app.use('/api/v1/database/monitoring', rateLimiters.general, databaseMonitoringRoutes);
  logger.info('✅ Database monitoring routes configured');
} catch (error) {
  logger.error('❌ Error setting up database monitoring routes:', error);
  throw error;
}

// Error handling middleware
logger.info('Setting up error handling middleware...');
app.use(errorHandler);
logger.info('✅ Error handling middleware configured');

// 404 handler
logger.info('Setting up 404 handler...');
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});
logger.info('✅ 404 handler configured');

// Start server
logger.info('Attempting to start HTTP server...');
logger.info('App routes loaded:', app._router?.stack?.length || 'unknown');
logger.info('About to call app.listen with:', { PORT, HOST });

try {
  const httpServer = app.listen(PORT, HOST, () => {
    logger.info(`✅ API Gateway started successfully on ${HOST}:${PORT}`, {
      host: HOST,
      port: PORT,
      environment: process.env.NODE_ENV,
    });
  });

  // Обработка ошибок сервера
  httpServer.on('error', (error) => {
    logger.error('❌ HTTP Server error:', error);
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error('Server error:', error);
    }
    process.exit(1);
  });

  // Start WebSocket server on the same port as HTTP
  logger.info('Starting WebSocket server...');
  let wsHub;
  try {
    wsHub = createWsServer(httpServer);
    app.set('wsHub', wsHub);
    global.wsHub = wsHub; // Добавляем в глобальную переменную для AdminMetricsService
    logger.info('✅ WebSocket server started');
  } catch (error) {
    logger.error('❌ Failed to start WebSocket server:', error);
    logger.warn('⚠️ WebSocket disabled, using polling fallback');
    // Создаем mock wsHub для совместимости
    wsHub = {
      emitMessage: () => {}, // Пустая функция
      getStats: () => ({ totalConnections: 0, totalSubscribers: 0 })
    };
    app.set('wsHub', wsHub);
    global.wsHub = wsHub;
  }
  
  // Добавляем endpoint для проверки WebSocket статуса
  app.get('/ws/status', (req, res) => {
    res.json({
      status: 'active',
      path: '/ws',
      connections: wsHub.getStats().totalConnections,
      subscribers: wsHub.getStats().totalSubscribers
    });
  });

} catch (error) {
  logger.error('❌ Failed to start server:', error);
  logger.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  process.exit(1);
}

// Добавляем adminMetricsService в глобальную переменную (ленивая загрузка)
global.adminMetricsService = null;

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
