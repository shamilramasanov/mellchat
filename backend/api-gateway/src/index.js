const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize global connection maps
global.activeKickConnections = global.activeKickConnections || new Map();

console.log('🔍 index.js: loading modules...');
const logger = require('./utils/logger');
console.log('🔍 index.js: logger loaded');
const errorHandler = require('./middleware/errorHandler');
console.log('🔍 index.js: errorHandler loaded');
const { rateLimiters, rateLimitStats } = require('./middleware/rateLimiter');
console.log('🔍 index.js: rateLimiter loaded');
const { metricsMiddleware, register } = require('./utils/metrics');
console.log('🔍 index.js: metrics loaded');
const auth = require('./middleware/auth');
console.log('🔍 index.js: auth loaded');
console.log('🔍 index.js: loading passport...');
const passport = require('./config/passport');
console.log('🔍 index.js: passport loaded');

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
const userRoutes = require('./routes/user');
logger.info('✅ userRoutes loaded');
const aiFilterRoutes = require('./routes/aiFilter');
logger.info('✅ aiFilterRoutes loaded');
logger.info('✅ All routes loaded successfully');

console.log('🔍 Creating Express app...');
const app = express();
console.log('✅ Express app created');

console.log('🔍 Loading WebSocket server...');
let createWsServer;
try {
  const wsModule = require('./ws/server');
  createWsServer = wsModule.createWsServer;
  console.log('✅ WebSocket server module loaded');
} catch (error) {
  console.error('❌ Failed to load WebSocket server:', error);
  throw error;
}

// Railway автоматически устанавливает PORT - используем его напрямую
// PORT должен быть числом, не строкой
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🔍 Server configuration:', { 
  PORT, 
  HOST, 
  NODE_ENV: process.env.NODE_ENV,
  'process.env.PORT (raw)': process.env.PORT,
  'PORT type': typeof PORT
});

// Railway автоматически устанавливает PORT, проверяем это
if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY) {
  logger.info('Running on Railway, using Railway PORT:', { 
    port: PORT, 
    rawPort: process.env.PORT,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT 
  });
}

logger.info(`Starting server with config:`, {
  PORT,
  HOST,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET'
});

// CORS configuration - ДОЛЖНО БЫТЬ ПЕРЕД HELMET
// Нормализуем переменные окружения (убираем кавычки и пробелы, если есть)
const normalizeEnvVar = (val) => val ? val.trim().replace(/^["']|["']$/g, '') : null;

const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Vite dev server (alternate port)
  'http://192.168.19.76:5173', // Local network access (mobile testing)
  'https://mellchat.vercel.app', // Production Vercel
  'https://mellchat-v5y7.vercel.app', // Old Vercel (legacy)
  'https://mellchat.live', // Custom domain
  'https://www.mellchat.live', // Custom domain with www
  normalizeEnvVar(process.env.CORS_ORIGIN),
  normalizeEnvVar(process.env.FRONTEND_URL)
].filter(Boolean);

// Убираем дубликаты
const uniqueOrigins = [...new Set(allowedOrigins)];

// Log allowed origins for debugging
logger.info('CORS allowed origins:', { allowedOrigins: uniqueOrigins });

// Handle preflight requests FIRST (before CORS middleware)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  logger.info('Preflight OPTIONS request:', { origin, path: req.path });
  
  let allowOrigin = null;
  
  if (!origin) {
    allowOrigin = '*';
  } else if (process.env.NODE_ENV === 'production') {
    if (uniqueOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (origin && (origin.includes('.vercel.app') || origin.includes('vercel-dns.com'))) {
      allowOrigin = origin;
    } else if (origin && origin.includes('mellchat.live')) {
      allowOrigin = origin;
    }
  } else {
    allowOrigin = origin || '*';
  }
  
  if (allowOrigin) {
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, x-session-id, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    logger.info('Preflight allowed:', { origin, allowOrigin });
    return res.status(204).end();
  }
  
  logger.warn('Preflight blocked:', { origin });
  res.status(403).end();
});

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info('CORS request:', { origin, allowedOrigins: uniqueOrigins });
    }
    
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      if (uniqueOrigins.includes(origin)) {
        logger.info('CORS allowed (production):', { origin });
        return callback(null, true);
      }
      
      if (origin && origin.includes('.vercel.app')) {
        logger.info('CORS allowed (Vercel):', { origin });
        return callback(null, true);
      }
      
      if (origin && (origin.includes('vercel.app') || origin.includes('vercel-dns.com'))) {
        logger.info('CORS allowed (Vercel domain):', { origin });
        return callback(null, true);
      }
      
      if (origin && origin.includes('mellchat.live')) {
        logger.info('CORS allowed (mellchat.live):', { origin });
        return callback(null, true);
      }
      
      logger.warn('CORS blocked in production:', { origin });
      return callback(new Error('Not allowed by CORS in production'));
    }
    
    if (uniqueOrigins.includes(origin)) {
      logger.info('CORS allowed:', { origin });
      return callback(null, true);
    }
    
    logger.info('CORS allowed (development):', { origin });
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'x-session-id', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));
logger.info('✅ CORS middleware configured');

// Security middleware - после CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting middleware (применяем перед body parsing)
// НО: пропускаем OPTIONS запросы для CORS preflight
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Пропускаем OPTIONS без rate limiting
  }
  rateLimitStats(req, res, next);
});
app.use('/api/v1', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Пропускаем OPTIONS без rate limiting
  }
  rateLimiters.general(req, res, next);
});

// Metrics middleware
app.use(metricsMiddleware);

// Body parsing middleware (пропускаем OPTIONS чтобы не парсить body)
logger.info('Setting up body parsing middleware...');
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Пропускаем OPTIONS без парсинга body
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Пропускаем OPTIONS без парсинга body
  }
  express.urlencoded({ extended: true })(req, res, next);
});
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

// Root endpoint for Railway health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mellchat-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      metrics: '/metrics'
    }
  });
});

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

// Auth routes - применяем rate limiter только для критичных endpoints
// Отдельные endpoints (verify, guest/register) используют свои лимиты
logger.info('Setting up auth routes...');
app.use('/api/v1/auth', (req, res, next) => {
  // Для критичных endpoints (login, register) используем строгий лимит
  // Остальные используют свои лимиты в роутах
  if (req.path === '/google' || req.path === '/google/callback' || 
      req.path === '/email/send-code' || req.path === '/email/verify-code') {
    return rateLimiters.auth(req, res, next);
  }
  next();
}, authRoutes);
logger.info('✅ Auth routes configured');

// Activity logging route - доступен всем (использует optionalAuth)
logger.info('Setting up activity logging route...');
app.post('/api/v1/admin/users/activity/log', (req, res, next) => {
  // Используем optionalAuth для получения userId или sessionId
  const { optionalAuth } = require('./middleware/authMiddleware');
  optionalAuth(req, res, async () => {
    try {
      const userActivityService = require('./services/userActivityService');
      const { streamId, platform, channelName, action, metadata } = req.body;
      
      if (!streamId || !platform || !action) {
        return res.status(400).json({ error: 'streamId, platform, and action are required' });
      }
      
      const userId = req.user?.userId || null;
      const sessionId = req.headers['x-session-id'] || null;
      
      if (!userId && !sessionId) {
        return res.status(400).json({ error: 'Either userId or sessionId must be provided' });
      }
      
      await userActivityService.logActivity({
        userId,
        sessionId,
        streamId,
        platform,
        channelName,
        action,
        metadata: metadata || {}
      });
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Activity log error:', error);
      res.status(500).json({ error: 'Failed to log activity', message: error.message });
    }
  });
});
logger.info('✅ Activity logging route configured');

// User routes (settings) - требует авторизации
logger.info('Setting up user routes...');
try {
  app.use('/api/v1/user', rateLimiters.general, userRoutes);
  logger.info('✅ User routes configured');
} catch (error) {
  logger.error('❌ Error setting up user routes:', error);
  throw error;
}

// AI Filter routes - требует авторизации
logger.info('Setting up AI filter routes...');
try {
  app.use('/api/v1/ai-filter', rateLimiters.general, aiFilterRoutes);
  logger.info('✅ AI Filter routes configured');
} catch (error) {
  logger.error('❌ Error setting up AI filter routes:', error);
  throw error;
}

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

// Streams status check route - REMOVED (functionality moved to connect.js)
// logger.info('Setting up streams routes...');
// try {
//   const streamsRoutes = require('./routes/streams');
//   app.use('/api/v1/streams', rateLimiters.general, streamsRoutes);
//   logger.info('✅ Streams routes configured');
// } catch (error) {
//   logger.error('❌ Error setting up streams routes:', error);
//   throw error;
// }

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

// Static resource handlers (to avoid 404 noise in logs)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// 404 handler
logger.info('Setting up 404 handler...');
app.use('*', (req, res) => {
  // Ignore common browser requests that cause 404 noise
  if (req.path === '/google' || req.path.startsWith('/static/')) {
    return res.status(204).end();
  }
  // Ignore WebSocket upgrade requests - они обрабатываются отдельно
  if (req.path === '/ws' || req.headers.upgrade === 'websocket') {
    return res.status(204).end();
  }
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

let httpServer;
try {
  httpServer = app.listen(PORT, HOST, () => {
    const message = `✅ API Gateway started successfully on ${HOST}:${PORT}`;
    console.log(message);
    logger.info(message, {
      host: HOST,
      port: PORT,
      portType: typeof PORT,
      environment: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT,
      railway: process.env.RAILWAY,
      rawPort: process.env.PORT
    });
    
    // Дополнительная проверка для Railway
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY) {
      console.log('🚂 Railway environment detected');
      console.log(`🌐 Server listening on http://${HOST}:${PORT}`);
      console.log(`✅ Ready to accept connections`);
    }
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

  // Добавляем adminMetricsService в глобальную переменную (ленивая загрузка)
  global.adminMetricsService = null;

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    if (httpServer) {
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    if (httpServer) {
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
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

module.exports = app;
