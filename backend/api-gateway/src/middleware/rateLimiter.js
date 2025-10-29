const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../utils/logger');

// Создаем Redis клиент для rate limiting с fallback
let redisClient;
let useRedis = false;

try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 5000,
      lazyConnect: true
    }
  });

  redisClient.on('error', (err) => {
    logger.warn('Redis client error, falling back to memory store:', err.message);
    useRedis = false;
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected for rate limiting');
    useRedis = true;
  });

  // Пытаемся подключиться (async, не блокируем)
  redisClient.connect().catch(() => {
    logger.warn('Failed to connect to Redis, using memory store');
    useRedis = false;
  });
  
  logger.info('✅ Rate limiter initialized');
} catch (error) {
  logger.warn('Redis not available, using memory store:', error.message);
  useRedis = false;
}

// Функция для определения типа устройства
const detectDeviceType = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*Tablet)|Windows Phone/i.test(userAgent);
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};

// Базовый rate limiter с fallback
const createRateLimiter = (windowMs, maxRequests, message) => {
  const config = {
    windowMs,
    max: (req) => {
      const deviceType = detectDeviceType(req);
      // Адаптивные лимиты в зависимости от устройства
      const limits = {
        mobile: Math.floor(maxRequests * 0.5), // Мобильные - 50% от лимита
        tablet: Math.floor(maxRequests * 0.75), // Планшеты - 75% от лимита
        desktop: maxRequests // Десктоп - полный лимит
      };
      
      const limit = limits[deviceType];
      logger.debug(`Rate limit for ${deviceType}: ${limit} requests per ${windowMs}ms`);
      return limit;
    },
    message: {
      error: message,
      deviceType: 'auto-detected',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Пропускаем health checks
      return req.path === '/api/v1/health' || req.path === '/health';
    }
  };

  // Используем Redis store если доступен, иначе memory store
  if (useRedis && redisClient) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: 'mellchat:rl:',
    });
  }

  return rateLimit(config);
};

// Разные лимиты для разных типов запросов
const rateLimiters = {
  // Общий лимит для API
  general: createRateLimiter(
    15 * 60 * 1000, // 15 минут
    1000, // 1000 запросов для десктопа (было 100)
    'Слишком много запросов. Попробуйте позже.'
  ),
  
  // Строгий лимит для аутентификации
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 минут
    5, // 5 попыток входа
    'Слишком много попыток входа. Попробуйте через 15 минут.'
  ),
  
  // Лимит для WebSocket подключений
  websocket: createRateLimiter(
    60 * 1000, // 1 минута
    10, // 10 подключений в минуту
    'Слишком много подключений. Подождите минуту.'
  ),
  
  // Лимит для поиска
  search: createRateLimiter(
    60 * 1000, // 1 минута
    30, // 30 поисковых запросов
    'Слишком много поисковых запросов. Подождите минуту.'
  ),
  
  // Лимит для админ панели (более мягкий)
  admin: createRateLimiter(
    15 * 60 * 1000, // 15 минут
    500, // 500 запросов для админ панели
    'Слишком много запросов к админ панели. Попробуйте позже.'
  ),
  
  // Лимит для сообщений и запросов к базе данных
  messages: createRateLimiter(
    60 * 1000, // 1 минута
    100, // 100 запросов сообщений
    'Слишком много запросов сообщений. Подождите минуту.'
  ),
};

// Middleware для логирования статистики
const rateLimitStats = (req, res, next) => {
  const deviceType = detectDeviceType(req);
  
  // Добавляем информацию об устройстве в заголовки
  res.set('X-Device-Type', deviceType);
  
  next();
};

module.exports = {
  rateLimiters,
  rateLimitStats,
  detectDeviceType,
  redisClient
};
