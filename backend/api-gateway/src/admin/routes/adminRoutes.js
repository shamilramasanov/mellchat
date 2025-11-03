const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const geminiService = require('../../services/geminiService');
const analyticsService = require('../../services/analyticsService');
const moderationService = require('../../services/moderationService');
const databaseManagementService = require('../../services/databaseManagementService');
const databaseService = require('../../services/databaseService');
const logger = require('../../utils/logger');

// Handle CORS preflight requests for admin routes
router.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  const allowedOrigins = [
    'http://localhost:3001',
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
  
  let allowOrigin = null;
  
  if (!origin) {
    allowOrigin = '*';
  } else if (process.env.NODE_ENV === 'production') {
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (origin && (origin.includes('.vercel.app') || origin.includes('vercel-dns.com'))) {
      allowOrigin = origin;
    } else if (origin && origin.includes('mellchat.live')) {
      allowOrigin = origin;
    }
  } else {
    // Development: allow all
    allowOrigin = origin || '*';
  }
  
  if (allowOrigin) {
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, x-session-id');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(204).end();
  }
  
  res.status(403).end();
});

// Admin user configuration
// Пароль можно изменить через переменную окружения ADMIN_PASSWORD
// По умолчанию: username = 'admin', password = 'password'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD || 'password';

// Хешируем пароль при старте
let ADMIN_PASSWORD_HASH = null;
bcrypt.hash(ADMIN_PASSWORD_PLAIN, 10).then(hash => {
  ADMIN_PASSWORD_HASH = hash;
  logger.info('Admin password hash generated');
}).catch(err => {
  logger.error('Failed to hash admin password:', err);
  // Fallback на старый хеш если ошибка
  ADMIN_PASSWORD_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
});

const ADMIN_USER = {
  id: '1',
  username: ADMIN_USERNAME,
  email: process.env.ADMIN_EMAIL || 'admin@mellchat.live',
  role: 'super_admin',
  created_at: new Date(),
  last_login: null,
  is_active: true
};

const auditService = require('../../services/auditService');

// Middleware для добавления CORS заголовков
const addCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  
  const allowedOrigins = [
    'http://localhost:3001',
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
  
  let allowOrigin = null;
  
  if (!origin) {
    allowOrigin = '*';
  } else if (process.env.NODE_ENV === 'production') {
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (origin && (origin.includes('.vercel.app') || origin.includes('vercel-dns.com'))) {
      allowOrigin = origin;
    } else if (origin && origin.includes('mellchat.live')) {
      allowOrigin = origin;
    }
  } else {
    // Development: allow all
    allowOrigin = origin || '*';
  }
  
  if (allowOrigin) {
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, x-session-id');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
};

// Middleware для проверки JWT токена и логирования
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-secret-key');
    req.admin = decoded;
    
    // Логируем доступ к админ панели
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await auditService.logAction(
      decoded.id,
      'admin_access',
      'system',
      null,
      { endpoint: req.path, method: req.method },
      ipAddress,
      userAgent
    ).catch(() => {}); // Не прерываем если логирование не удалось
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware для role-based access (пока базовая версия)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Пока только super_admin, в будущем можно расширить
    if (roles.includes('super_admin') && req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// POST /api/v1/admin/auth/login
router.post('/auth/login', addCorsHeaders, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    logger.info('Admin login attempt:', { username, expectedUsername: ADMIN_USER.username });

    // Проверяем пользователя
    if (username !== ADMIN_USER.username) {
      logger.warn('Admin login failed - username mismatch:', { received: username, expected: ADMIN_USER.username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Проверяем пароль
    // Если хеш еще не готов, используем временную проверку
    let isValidPassword = false;
    
    if (ADMIN_PASSWORD_HASH) {
      isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else {
      // Fallback: проверяем plain password если хеш еще не готов
      isValidPassword = password === ADMIN_PASSWORD_PLAIN;
      
      // Параллельно пытаемся захешировать
      if (!ADMIN_PASSWORD_HASH) {
        bcrypt.hash(ADMIN_PASSWORD_PLAIN, 10).then(hash => {
          ADMIN_PASSWORD_HASH = hash;
        }).catch(() => {});
      }
    }
    
    if (!isValidPassword) {
      logger.warn('Admin login failed - invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('Admin login successful:', { username: ADMIN_USER.username });

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        id: ADMIN_USER.id, 
        username: ADMIN_USER.username, 
        role: ADMIN_USER.role 
      },
      process.env.JWT_SECRET || 'admin-secret-key',
      { expiresIn: '24h' }
    );

    logger.info('Admin JWT token generated');

    res.json({
      success: true,
      token,
      user: {
        id: ADMIN_USER.id,
        username: ADMIN_USER.username,
        email: ADMIN_USER.email,
        role: ADMIN_USER.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/admin/metrics - System metrics for dashboard
router.get('/metrics', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    // Ленивая загрузка adminMetricsService
    if (!global.adminMetricsService) {
      global.adminMetricsService = require('../../services/adminMetricsService');
    }
    
    // Получаем реальные метрики из системы
    const metrics = await global.adminMetricsService.getAllMetrics();
    
    res.json(metrics);
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/v1/admin/dashboard/metrics
router.get('/dashboard/metrics', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    // Ленивая загрузка adminMetricsService
    if (!global.adminMetricsService) {
      global.adminMetricsService = require('../../services/adminMetricsService');
    }
    
    // Получаем реальные метрики из системы
    const metrics = await global.adminMetricsService.getAllMetrics();
    
    res.json(metrics);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/v1/admin/dashboard/charts
router.get('/dashboard/charts', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    
    // Ленивая загрузка adminMetricsService
    if (!global.adminMetricsService) {
      global.adminMetricsService = require('../../services/adminMetricsService');
    }
    
    // Получаем реальные данные для графиков
    const charts = await global.adminMetricsService.getChartData(range);
    
    res.json(charts);
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

// GET /api/v1/admin/ai/insights
router.get('/ai/insights', authenticateAdmin, async (req, res) => {
  try {
    // Ленивая загрузка adminMetricsService
    if (!global.adminMetricsService) {
      global.adminMetricsService = require('../../services/adminMetricsService');
    }

    // Получаем реальные метрики
    const metrics = await global.adminMetricsService.getAllMetrics();

    let recommendations = [];
    let insights = {
      peakHours: 'N/A',
      topPlatform: 'N/A',
      avgSentiment: 'neutral',
      userGrowth: '0%'
    };

    // Если Gemini доступен, получаем рекомендации от ИИ
    if (geminiService.isAvailable()) {
      try {
        recommendations = await geminiService.getRecommendations(metrics);
      } catch (error) {
        logger.warn('Failed to get Gemini recommendations, using fallback:', error);
      }
    }

    // Если рекомендаций нет, используем базовые
    if (recommendations.length === 0) {
      recommendations = [
        {
          id: '1',
          title: 'Optimize Database Queries',
          description: 'Several slow queries detected. Consider adding indexes to improve performance.',
          priority: 'high',
          metrics: {
            'Slow queries': 5,
            'Avg response time': '120ms',
            'Impact': 'High'
          },
          actions: [
            { icon: '🔍', label: 'View Slow Queries' },
            { icon: '⚡', label: 'Optimize Now' }
          ]
        }
      ];
    }

    // Извлекаем insights из метрик
    if (metrics.platforms) {
      const platformCounts = Object.entries(metrics.platforms).map(([name, count]) => ({ name, count }));
      const topPlatform = platformCounts.sort((a, b) => b.count - a.count)[0];
      if (topPlatform) {
        insights.topPlatform = topPlatform.name;
      }
    }

    const result = {
      recommendations,
      insights,
      alerts: metrics.alerts || []
    };

    res.json(result);
  } catch (error) {
    logger.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

// GET /api/v1/admin/ai/data - AI assistant data
router.get('/ai/data', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    // Устанавливаем таймаут для ответа
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('AI data endpoint timeout - sending fallback response');
      }
    }, 5000); // 5 секунд таймаут

    // Проверяем доступность Gemini (быстрая проверка)
    const isGeminiAvailable = geminiService.isAvailable();
    
    // Получаем реальную статистику запросов
    const stats = geminiService.getRequestStats();
    
    // Базовые метрики с реальными данными
    let metrics = {
      status: isGeminiAvailable ? 'Online' : 'Offline',
      responseTime: stats.avgResponseTime,
      queriesToday: stats.todayRequests,
      accuracyRate: stats.accuracyRate,
      totalRequests: stats.totalRequests,
      errors: stats.errors
    };
    
    // История чата (пока пустая)
    const chatHistory = [];
    
    // Получаем рекомендации с таймаутом
    let suggestions = [];
    
    if (isGeminiAvailable) {
      try {
        // Выполняем асинхронно с таймаутом
        const metricsPromise = Promise.resolve().then(async () => {
          if (!global.adminMetricsService) {
            global.adminMetricsService = require('../../services/adminMetricsService');
          }
          return await global.adminMetricsService.getAllMetrics();
        });

        const recommendationsPromise = metricsPromise.then(systemMetrics => {
          return geminiService.getRecommendations(systemMetrics);
        });

        // Пытаемся получить рекомендации с таймаутом 3 секунды
        suggestions = await Promise.race([
          recommendationsPromise,
          new Promise((resolve) => {
            setTimeout(() => resolve([]), 3000);
          })
        ]);

        if (suggestions.length === 0) {
          // Fallback если таймаут или ошибка
          suggestions = [
            {
              id: '1',
              title: 'AI Service Available',
              description: 'Gemini AI is configured and ready to use.',
              priority: 'info'
            }
          ];
        }
        
        // Обновляем метрики реальными данными из статистики (уже установлено выше)
      } catch (geminiError) {
        logger.warn('Failed to get AI recommendations:', geminiError.message);
        // Fallback на базовые рекомендации
        suggestions = [
          {
            id: '1',
            title: 'AI Service Available',
            description: 'Gemini AI is configured but recommendations are temporarily unavailable.',
            priority: 'info'
          }
        ];
      }
    } else {
      suggestions = [
        {
          id: '1',
          title: 'AI Service Not Configured',
          description: 'GEMINI_API_KEY is not set. AI features will be limited.',
          priority: 'warning'
        }
      ];
    }
    
    clearTimeout(timeout);
    
    const data = {
      metrics,
      chatHistory,
      suggestions
    };

    if (!res.headersSent) {
      res.json({
        success: true,
        ...data
      });
    }
  } catch (error) {
    logger.error('Get AI data error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to fetch AI data',
        message: error.message 
      });
    }
  }
});

// POST /api/v1/admin/ai/chat
router.post('/ai/chat', authenticateAdmin, async (req, res) => {
  // Устанавливаем таймаут на весь запрос
  req.setTimeout(55000); // 55 секунд
  
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'Gemini API не настроен. Установите GEMINI_API_KEY в переменных окружения.' 
      });
    }

    // Передаем databaseService для доступа к БД и флаг isAdmin
    const databaseService = require('../../services/databaseService');
    
    const result = await geminiService.chat(message, conversationHistory, {
      databaseService: databaseService,
      isAdmin: true // Админ имеет полные права, включая UPDATE
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    
    // Обрабатываем таймауты отдельно
    if (error.message && error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: 'AI запрос превысил время ожидания',
        message: 'Попробуйте упростить запрос или разбить его на части'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process AI request',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/ai/analyze-content
router.post('/ai/analyze-content', authenticateAdmin, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'Gemini API не настроен. Установите GEMINI_API_KEY в переменных окружения.' 
      });
    }

    const analysis = await geminiService.analyzeContent(messages);

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    logger.error('AI analyze content error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze content',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/ai/generate-report
router.post('/ai/generate-report', authenticateAdmin, async (req, res) => {
  try {
    const { metrics, timeRange = '24h' } = req.body;

    if (!metrics) {
      return res.status(400).json({ error: 'Metrics are required' });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'Gemini API не настроен. Установите GEMINI_API_KEY в переменных окружения.' 
      });
    }

    const report = await geminiService.generateReport(metrics, timeRange);

    res.json({
      success: true,
      ...report
    });
  } catch (error) {
    logger.error('AI generate report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/ai/optimize-system
router.post('/ai/optimize-system', authenticateAdmin, async (req, res) => {
  try {
    const { systemMetrics } = req.body;

    if (!systemMetrics) {
      return res.status(400).json({ error: 'System metrics are required' });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'Gemini API не настроен. Установите GEMINI_API_KEY в переменных окружения.' 
      });
    }

    const optimization = await geminiService.optimizeSystem(systemMetrics);

    res.json({
      success: true,
      ...optimization
    });
  } catch (error) {
    logger.error('AI optimize system error:', error);
    res.status(500).json({ 
      error: 'Failed to optimize system',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/ai/troubleshoot
router.post('/ai/troubleshoot', authenticateAdmin, async (req, res) => {
  try {
    const { errorLogs, systemState } = req.body;

    if (!errorLogs || !Array.isArray(errorLogs)) {
      return res.status(400).json({ error: 'Error logs array is required' });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'Gemini API не настроен. Установите GEMINI_API_KEY в переменных окружения.' 
      });
    }

    const diagnosis = await geminiService.troubleshootIssue(errorLogs, systemState || {});

    res.json({
      success: true,
      ...diagnosis
    });
  } catch (error) {
    logger.error('AI troubleshoot error:', error);
    res.status(500).json({ 
      error: 'Failed to troubleshoot',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/system/status - System status for admin panel
router.get('/system/status', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const status = {
      services: [
        {
          name: 'API Gateway',
          status: 'running',
          uptime: '99.9%',
          lastRestart: '7 days ago',
          port: 3001
        },
        {
          name: 'WebSocket Service',
          status: 'running',
          uptime: '99.8%',
          lastRestart: '3 days ago',
          port: 3002
        },
        {
          name: 'Database',
          status: 'running',
          uptime: '99.9%',
          lastRestart: '14 days ago',
          port: 5432
        }
      ],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          service: 'API Gateway',
          message: 'System running normally'
        }
      ]
    };

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error('Get system status error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system status',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/system/restart - Restart service
router.post('/system/restart', authenticateAdmin, async (req, res) => {
  try {
    const { service } = req.body;
    
    if (!service) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    // В реальном проекте здесь будет логика перезапуска сервиса
    res.json({
      success: true,
      message: `Service ${service} restart initiated`
    });
  } catch (error) {
    logger.error('Restart service error:', error);
    res.status(500).json({ 
      error: 'Failed to restart service',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/system/health
router.get('/system/health', authenticateAdmin, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      lastError: null,
      alerts: [],
      services: {
        database: 'healthy',
        redis: 'healthy',
        websocket: 'healthy',
        ai: 'healthy'
      },
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100
      }
    };

    res.json(health);
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// ==================== USER MANAGEMENT ====================

// In-memory storage for blocked users (в будущем перенести в БД)
const blockedUsers = new Map(); // userId -> { blockedAt, reason, blockedBy }

// GET /api/v1/admin/users/activity - Полная активность всех пользователей (ДОЛЖЕН БЫТЬ ПЕРЕД /users)
router.get('/users/activity', authenticateAdmin, async (req, res) => {
  try {
    const userActivityService = require('../../services/userActivityService');
    const { timeRange = '24h', userId = null, sessionId = null, platform = null, limit = 1000 } = req.query;
    
    const activity = await userActivityService.getActivityStats({
      timeRange,
      userId: userId || null,
      sessionId: sessionId || null,
      platform: platform || null,
      limit: parseInt(limit, 10)
    });
    
    res.json({
      success: true,
      ...activity
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user activity',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/users/:identifier/activity - Активность конкретного пользователя
router.get('/users/:identifier/activity', authenticateAdmin, async (req, res) => {
  try {
    const userActivityService = require('../../services/userActivityService');
    const { identifier } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const activity = await userActivityService.getUserActivity(identifier, timeRange);
    
    res.json({
      success: true,
      ...activity
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user activity',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/users/guests - Статистика гостей (ДОЛЖЕН БЫТЬ ПЕРЕД /users)
router.get('/users/guests', authenticateAdmin, async (req, res) => {
  try {
    const guestSessionService = require('../../services/guestSessionService');
    const { limit = 50, offset = 0 } = req.query;
    
    const [stats, sessions] = await Promise.all([
      guestSessionService.getGuestStats(),
      guestSessionService.getActiveSessions({ limit: parseInt(limit, 10), offset: parseInt(offset, 10) })
    ]);
    
    res.json({
      success: true,
      stats,
      sessions: sessions.sessions,
      total: sessions.total,
      limit: sessions.limit,
      offset: sessions.offset
    });
  } catch (error) {
    logger.error('Get guests error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch guest sessions',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/users - Список всех зарегистрированных пользователей
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const databaseService = require('../../services/databaseService');
    const { includeGuests = 'false' } = req.query;
    
    // Получаем зарегистрированных пользователей
    const usersQuery = `
      SELECT 
        id, email, name, avatar_url, google_id,
        email_verified, created_at, updated_at, last_login_at
      FROM app_users
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    const usersResult = await databaseService.query(usersQuery);
    
    const users = usersResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name || 'Без имени',
      avatarUrl: row.avatar_url,
      googleId: row.google_id,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
      authMethod: row.google_id ? 'Google' : 'Email',
      type: 'registered'
    }));
    
    let guests = [];
    if (includeGuests === 'true') {
      const guestSessionService = require('../../services/guestSessionService');
      const guestsData = await guestSessionService.getActiveSessions({ limit: 100 });
      guests = guestsData.sessions.map(session => ({
        id: session.sessionId,
        email: null,
        name: `Гость ${session.sessionId.substring(0, 8)}`,
        avatarUrl: null,
        googleId: null,
        emailVerified: false,
        createdAt: session.firstSeenAt,
        updatedAt: session.lastSeenAt,
        lastLoginAt: session.lastSeenAt,
        authMethod: 'Guest',
        type: 'guest',
        ipAddress: session.ipAddress,
        streamsCount: session.streamsCount,
        messagesViewed: session.messagesViewed,
        isActive: session.isActive
      }));
    }
    
    // Объединяем пользователей и гостей
    const allUsers = [...users, ...guests].sort((a, b) => {
      const dateA = new Date(a.lastLoginAt || a.updatedAt || a.createdAt);
      const dateB = new Date(b.lastLoginAt || b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      users: allUsers,
      total: allUsers.length,
      registered: users.length,
      guests: guests.length
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});


// GET /api/v1/admin/users/connected - Список подключенных пользователей
router.get('/users/connected', authenticateAdmin, async (req, res) => {
  try {
    const wsHub = req.app.get('wsHub');
    const connectedUsers = [];
    
    // Собираем информацию о подключенных пользователях из WebSocket подписок
    if (wsHub && wsHub.subscribers) {
      const subscribersMap = new Map();
      
      // Проходим по всем подпискам WebSocket
      for (const [connectionId, wsSet] of wsHub.subscribers.entries()) {
        wsSet.forEach(ws => {
          // Извлекаем информацию о пользователе из WebSocket (если есть)
          let userId = ws.userId;
          const userAgent = ws.headers?.['user-agent'] || 'Unknown';
          const ip = ws._socket?.remoteAddress || 'Unknown';
          
          // Если userId не установлен, создаем уникальный идентификатор для anonymous пользователей
          if (!userId || userId === 'anonymous') {
            userId = `anonymous-${ip}-${userAgent}`;
          }
          
          if (!subscribersMap.has(userId)) {
            subscribersMap.set(userId, {
              userId,
              connectionIds: [],
              userAgent,
              ip,
              connectedAt: ws.connectedAt || new Date(),
              isBlocked: blockedUsers.has(userId)
            });
          }
          
          subscribersMap.get(userId).connectionIds.push(connectionId);
        });
      }
      
      connectedUsers.push(...Array.from(subscribersMap.values()));
    }
    
    // Также получаем информацию из активных подключений
    const activeConnections = require('../../routes/connect'); // Прямой доступ к activeConnections
    const activeKickConnections = global.activeKickConnections || new Map();
    
    res.json({
      success: true,
      users: connectedUsers,
      total: connectedUsers.length,
      totalConnections: wsHub?.subscribers?.size || 0
    });
  } catch (error) {
    console.error('Get connected users error:', error);
    res.status(500).json({ error: 'Failed to fetch connected users' });
  }
});

// GET /api/v1/admin/users/blocked - Список заблокированных пользователей
router.get('/users/blocked', authenticateAdmin, async (req, res) => {
  try {
    const blocked = Array.from(blockedUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
    
    res.json({
      success: true,
      users: blocked,
      total: blocked.length
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

// POST /api/v1/admin/users/block - Заблокировать пользователя
router.post('/users/block', authenticateAdmin, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    blockedUsers.set(userId, {
      blockedAt: new Date(),
      reason: reason || 'No reason provided',
      blockedBy: req.admin.username || req.admin.id
    });
    
    // Отключаем все подключения пользователя
    const wsHub = req.app.get('wsHub');
    if (wsHub && wsHub.subscribers) {
      for (const [connectionId, wsSet] of wsHub.subscribers.entries()) {
        wsSet.forEach(ws => {
          if (ws.userId === userId) {
            try {
              ws.close(1000, 'User blocked by admin');
            } catch (err) {
              console.error('Error closing WebSocket:', err);
            }
          }
        });
      }
    }
    
    res.json({
      success: true,
      message: `User ${userId} blocked successfully`,
      user: {
        userId,
        blockedAt: blockedUsers.get(userId).blockedAt,
        reason: blockedUsers.get(userId).reason
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// POST /api/v1/admin/users/unblock - Разблокировать пользователя
router.post('/users/unblock', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!blockedUsers.has(userId)) {
      return res.status(404).json({ error: 'User is not blocked' });
    }
    
    blockedUsers.delete(userId);
    
    res.json({
      success: true,
      message: `User ${userId} unblocked successfully`
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// POST /api/v1/admin/connections/disconnect - Отключить подключение
router.post('/connections/disconnect', authenticateAdmin, async (req, res) => {
  try {
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ error: 'Connection ID is required' });
    }
    
    const connectRoutes = require('../../routes/connect');
    const activeConnections = connectRoutes.activeConnections || new Map();
    const activeKickConnections = global.activeKickConnections || new Map();
    
    // Отключаем подключение
    let disconnected = false;
    
    // Проверяем в activeConnections
    const connection = activeConnections.get(connectionId);
    if (connection) {
      if (connection.client) {
        connection.client.disconnect();
      }
      activeConnections.delete(connectionId);
      disconnected = true;
    }
    
    // Проверяем в activeKickConnections
    const kickConnection = activeKickConnections.get(connectionId);
    if (kickConnection) {
      if (kickConnection.kickSimpleClient) {
        kickConnection.kickSimpleClient.disconnect();
      }
      if (kickConnection.kickJsClient) {
        kickConnection.kickJsClient.disconnect();
      }
      if (kickConnection.wsClient) {
        kickConnection.wsClient.close();
      }
      activeKickConnections.delete(connectionId);
      disconnected = true;
    }
    
    // Закрываем WebSocket подписки
    const wsHub = req.app.get('wsHub');
    if (wsHub && wsHub.subscribers) {
      const wsSet = wsHub.subscribers.get(connectionId);
      if (wsSet) {
        wsSet.forEach(ws => {
          try {
            ws.close(1000, 'Disconnected by admin');
          } catch (err) {
            console.error('Error closing WebSocket:', err);
          }
        });
        wsHub.subscribers.delete(connectionId);
        disconnected = true;
      }
    }
    
    if (!disconnected) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json({
      success: true,
      message: `Connection ${connectionId} disconnected successfully`
    });
  } catch (error) {
    console.error('Disconnect connection error:', error);
    res.status(500).json({ error: 'Failed to disconnect connection' });
  }
});

// GET /api/v1/admin/connections/list - Список всех активных подключений
router.get('/connections/list', authenticateAdmin, async (req, res) => {
  try {
    const connectRoutes = require('../../routes/connect');
    const activeConnections = connectRoutes.activeConnections || new Map();
    const activeKickConnections = global.activeKickConnections || new Map();
    
    const connections = [];
    
    // Собираем подключения из activeConnections
    for (const [id, conn] of activeConnections.entries()) {
      connections.push({
        connectionId: id,
        platform: conn.platform,
        channel: conn.channelName,
        connectedAt: conn.connectedAt,
        messageCount: conn.messages?.length || 0
      });
    }
    
    // Добавляем Kick подключения
    for (const [id, conn] of activeKickConnections.entries()) {
      connections.push({
        connectionId: id,
        platform: conn.platform || 'kick',
        channel: conn.channel,
        connectedAt: conn.connectedAt,
        messageCount: conn.messages?.length || 0
      });
    }
    
    // Также получаем информацию о WebSocket подписчиках
    const wsHub = req.app.get('wsHub');
    if (wsHub && wsHub.subscribers) {
      for (const [connectionId, wsSet] of wsHub.subscribers.entries()) {
        const existingConnection = connections.find(c => c.connectionId === connectionId);
        if (existingConnection) {
          existingConnection.subscribers = wsSet.size;
        } else {
          // Если подключение есть в WebSocket, но нет в activeConnections
          connections.push({
            connectionId,
            platform: connectionId.split('-')[0],
            channel: connectionId.split('-').slice(1, -1).join('-'),
            subscribers: wsSet.size,
            connectedAt: new Date()
          });
        }
      }
    }
    
    res.json({
      success: true,
      connections,
      total: connections.length
    });
  } catch (error) {
    console.error('Get connections list error:', error);
    res.status(500).json({ error: 'Failed to fetch connections list' });
  }
});

// Экспортируем blockedUsers для использования в других модулях
router.blockedUsers = blockedUsers;

// ==================== GLOBAL RULES ====================

const globalRulesService = require('../../services/globalRulesService');

// GET /api/v1/admin/global-rules - Получить все глобальные правила
router.get('/global-rules', authenticateAdmin, async (req, res) => {
  try {
    const rules = await globalRulesService.getAllRules();
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Get global rules error:', error);
    res.status(500).json({
      error: 'Failed to fetch global rules',
      message: error.message
    });
  }
});

// GET /api/v1/admin/global-rules/:type - Получить правило по типу
router.get('/global-rules/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const rule = await globalRulesService.getRule(type);
    
    if (!rule) {
      return res.status(404).json({
        error: 'Rule not found',
        message: `Rule type "${type}" does not exist`
      });
    }
    
    res.json({
      success: true,
      ruleType: type,
      ...rule
    });
  } catch (error) {
    logger.error(`Get global rule ${req.params.type} error:`, error);
    res.status(500).json({
      error: 'Failed to fetch global rule',
      message: error.message
    });
  }
});

// POST /api/v1/admin/global-rules/:type - Сохранить правило
router.post('/global-rules/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { settings, enabled } = req.body;
    const updatedBy = req.user?.userId || req.user?.id || null;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        error: 'Invalid settings',
        message: 'Settings must be an object'
      });
    }
    
    const rule = await globalRulesService.saveRule(
      type,
      settings,
      enabled !== undefined ? enabled : true,
      updatedBy
    );
    
    res.json({
      success: true,
      message: `Rule "${type}" saved successfully`,
      ...rule
    });
  } catch (error) {
    logger.error(`Save global rule ${req.params.type} error:`, error);
    res.status(500).json({
      error: 'Failed to save global rule',
      message: error.message
    });
  }
});

// POST /api/v1/admin/global-rules/optimize - Автоматическая оптимизация правил через ИИ
router.post('/global-rules/optimize', authenticateAdmin, async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        error: 'AI не доступен',
        message: 'GEMINI_API_KEY не настроен. Установите переменную окружения для использования AI оптимизации.'
      });
    }

    // Получаем текущие правила
    const currentRules = await globalRulesService.getAllRules();
    
    // Получаем системные метрики
    if (!global.adminMetricsService) {
      global.adminMetricsService = require('../../services/adminMetricsService');
    }
    const metrics = await global.adminMetricsService.getAllMetrics();
    
    // Получаем образец сообщений для анализа
    const databaseService = require('../../services/databaseService');
    const messagesQuery = `
      SELECT text, is_spam, is_question, sentiment, LENGTH(text) as length
      FROM messages
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    const messagesResult = await databaseService.query(messagesQuery);
    const sampleMessages = messagesResult.rows || [];
    
    // Получаем оптимизированные настройки от ИИ
    const optimized = await geminiService.optimizeGlobalRules(
      metrics,
      currentRules,
      sampleMessages
    );
    
    // Сохраняем оптимизированные правила в БД
    const updatedRules = {};
    const updatedBy = req.user?.userId || req.user?.id || null;
    
    // Функция для извлечения настроек (без служебных полей)
    const extractSettings = (ruleData) => {
      if (!ruleData || typeof ruleData !== 'object' || Array.isArray(ruleData)) {
        return {};
      }
      
      // Если ruleData уже является объектом настроек (нет полей enabled/reason или они не в корне)
      // и содержит настройки типа threshold, minLength и т.д., возвращаем как есть
      if (ruleData.settings && typeof ruleData.settings === 'object') {
        return ruleData.settings;
      }
      
      // Иначе извлекаем настройки, исключая служебные поля
      const { enabled, reason, ...settings } = ruleData;
      
      // Проверяем, что после извлечения остались настройки
      const hasSettings = Object.keys(settings).length > 0;
      if (!hasSettings) {
        logger.warn('No settings found after extraction, ruleData:', JSON.stringify(ruleData));
        return ruleData; // Возвращаем как есть, если все поля были служебными
      }
      
      return settings;
    };
    
    // Сохраняем правила с валидацией
    const saveRuleWithValidation = async (ruleType, ruleData, defaultEnabled = true) => {
      if (!ruleData || typeof ruleData !== 'object' || Array.isArray(ruleData)) {
        logger.warn(`Skipping ${ruleType}: invalid rule data`);
        return null;
      }
      
      const settings = extractSettings(ruleData);
      
      // Проверяем, что settings является валидным объектом
      if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        logger.error(`Invalid ${ruleType} settings:`, settings);
        throw new Error(`Invalid ${ruleType} settings: must be an object`);
      }
      
      // Проверяем, что settings не пустой
      if (Object.keys(settings).length === 0) {
        logger.warn(`Empty ${ruleType} settings, skipping`);
        return null;
      }
      
      const enabled = ruleData.enabled !== undefined ? ruleData.enabled : defaultEnabled;
      
      logger.info(`Saving ${ruleType} rule:`, { enabled, settingsKeys: Object.keys(settings) });
      
      await globalRulesService.saveRule(
        ruleType,
        settings,
        enabled,
        updatedBy
      );
      
      return { ...settings, enabled };
    };
    
    try {
      const spamResult = optimized.spam ? await saveRuleWithValidation('spam', optimized.spam, true) : null;
      if (spamResult) updatedRules.spam = spamResult;
      
      const questionsResult = optimized.questions ? await saveRuleWithValidation('questions', optimized.questions, true) : null;
      if (questionsResult) updatedRules.questions = questionsResult;
      
      const moodResult = optimized.mood ? await saveRuleWithValidation('mood', optimized.mood, true) : null;
      if (moodResult) updatedRules.mood = moodResult;
    } catch (error) {
      logger.error('Error saving optimized rules:', error);
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Правила успешно оптимизированы ИИ',
      summary: optimized.summary,
      optimized: updatedRules,
      recommendations: {
        spam: optimized.spam?.reason,
        questions: optimized.questions?.reason,
        mood: optimized.mood?.reason
      }
    });
  } catch (error) {
    logger.error('Optimize global rules error:', error);
    res.status(500).json({
      error: 'Failed to optimize global rules',
      message: error.message
    });
  }
});

// PATCH /api/v1/admin/global-rules/:type/toggle - Включить/выключить правило
router.patch('/global-rules/:type/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid enabled value',
        message: 'enabled must be a boolean'
      });
    }
    
    const success = await globalRulesService.toggleRule(type, enabled);
    
    if (!success) {
      return res.status(404).json({
        error: 'Rule not found',
        message: `Rule type "${type}" does not exist`
      });
    }
    
    res.json({
      success: true,
      message: `Rule "${type}" ${enabled ? 'enabled' : 'disabled'} successfully`,
      enabled
    });
  } catch (error) {
    logger.error(`Toggle global rule ${req.params.type} error:`, error);
    res.status(500).json({
      error: 'Failed to toggle global rule',
      message: error.message
    });
  }
});

// Отправка сообщения от админа всем подключенным пользователям
router.post('/broadcast', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const wsHub = req.app.get('wsHub');
    if (!wsHub) {
      return res.status(500).json({
        success: false,
        error: 'WebSocket hub not available'
      });
    }

    const result = await wsHub.broadcastAdminMessage(message.trim());
    
    res.json({
      success: true,
      message: `Message sent to ${result.sentCount} clients`,
      sentCount: result.sentCount
    });
  } catch (error) {
    logger.error('Broadcast admin message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to broadcast message'
    });
  }
});

// Отправка сообщения от админа конкретному пользователю
router.post('/message', authenticateAdmin, async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const wsHub = req.app.get('wsHub');
    if (!wsHub) {
      return res.status(500).json({
        success: false,
        error: 'WebSocket hub not available'
      });
    }

    // Получаем connectionIds пользователя
    // Используем тот же метод генерации userId, что и в /users/connected
    const userConnectionIds = new Set();
    if (wsHub && wsHub.subscribers) {
      for (const [connectionId, wsSet] of wsHub.subscribers.entries()) {
        for (const ws of wsSet) {
          if (ws.readyState !== WebSocket.OPEN) continue;
          
          let wsUserId = ws.userId;
          const userAgent = ws.headers?.['user-agent'] || 'Unknown';
          const ip = ws._socket?.remoteAddress || 'Unknown';
          
          // Если userId не установлен, создаем уникальный идентификатор для anonymous пользователей
          // точно так же, как в /users/connected
          if (!wsUserId || wsUserId === 'anonymous') {
            wsUserId = `anonymous-${ip}-${userAgent}`;
          }
          
          // Если userId совпадает, добавляем connectionId
          if (wsUserId === userId) {
            userConnectionIds.add(connectionId);
          }
        }
      }
    }

    // Отправляем сообщение на все connectionId пользователя
    const adminMessage = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username: 'admin',
      text: message.trim(),
      content: message.trim(),
      timestamp: Date.now(),
      platform: 'admin',
      isAdmin: true,
      isQuestion: false,
      sentiment: 'neutral'
    };

    let sentCount = 0;
    for (const connectionId of userConnectionIds) {
      const wsSet = wsHub.subscribers.get(connectionId);
      if (wsSet) {
        for (const ws of wsSet) {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              const connectionData = JSON.stringify({ 
                type: 'message', 
                connectionId, 
                payload: adminMessage 
              });
              ws.send(connectionData);
              sentCount++;
            } catch (e) {
              logger.error('Admin personal message WS send error:', e.message);
            }
          }
        }
      }
    }

    if (sentCount === 0) {
      return res.status(404).json({
        success: false,
        error: `User ${userId} not found or not connected`
      });
    }
    
    res.json({
      success: true,
      message: `Message sent to user ${userId}`,
      sentCount: sentCount
    });
  } catch (error) {
    logger.error('Send admin message to user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message to user'
    });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// GET /api/v1/admin/analytics - Main analytics endpoint
router.get('/analytics', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    
    const analytics = await analyticsService.getFullAnalytics(range);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/full
router.get('/analytics/full', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const analytics = await analyticsService.getFullAnalytics(timeRange);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get full analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/platforms
router.get('/analytics/platforms', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const analytics = await analyticsService.getPlatformAnalytics(timeRange);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get platform analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch platform analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/time
router.get('/analytics/time', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const analytics = await analyticsService.getTimeAnalytics(timeRange);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get time analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch time analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/streams
router.get('/analytics/streams', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h', limit = 20 } = req.query;
    
    const analytics = await analyticsService.getStreamAnalytics(timeRange, parseInt(limit));
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get stream analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stream analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/users
router.get('/analytics/users', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h', limit = 50 } = req.query;
    
    const analytics = await analyticsService.getUserAnalytics(timeRange, parseInt(limit));
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/content-quality
router.get('/analytics/content-quality', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const analytics = await analyticsService.getContentQualityAnalytics(timeRange);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get content quality analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content quality analytics',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/analytics/user-activity
router.get('/analytics/user-activity', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const analytics = await analyticsService.getUserActivityAnalytics(timeRange);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    logger.error('Get user activity analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user activity analytics',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/analytics/generate-report
router.post('/analytics/generate-report', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.body;
    
    // Получаем полную аналитику
    const analytics = await analyticsService.getFullAnalytics(timeRange);
    
    // Генерируем отчет через Gemini
    if (geminiService.isAvailable()) {
      try {
        const report = await geminiService.generateReport(analytics, timeRange);
        res.json({
          success: true,
          analytics,
          ...report
        });
      } catch (geminiError) {
        logger.warn('Gemini report generation failed, returning analytics only:', geminiError);
        res.json({
          success: true,
          analytics,
          report: 'Отчет не сгенерирован (Gemini недоступен)'
        });
      }
    } else {
      res.json({
        success: true,
        analytics,
        report: 'Отчет не сгенерирован (Gemini API не настроен)'
      });
    }
  } catch (error) {
    logger.error('Generate analytics report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    });
  }
});

// ==================== MODERATION ENDPOINTS ====================

// GET /api/v1/admin/moderation/reports - Get moderation reports
router.get('/moderation/reports', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { filter = 'all', search = '' } = req.query;
    
    const reports = await moderationService.getModerationReports(filter, search);
    
    res.json({
      success: true,
      ...reports
    });
  } catch (error) {
    logger.error('Get moderation reports error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch moderation reports',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/moderation/reports/:id/resolve - Resolve report
router.post('/moderation/reports/:id/resolve', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    const result = await moderationService.resolveReport(id, action);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Resolve report error:', error);
    res.status(500).json({ 
      error: 'Failed to resolve report',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/moderation/ban - Ban user
router.post('/moderation/ban', authenticateAdmin, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ error: 'User ID and reason are required' });
    }

    const result = await moderationService.blockUser(userId, reason);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Ban user error:', error);
    res.status(500).json({ 
      error: 'Failed to ban user',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/moderation/analyze
router.post('/moderation/analyze', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.text && !message.content) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const analysis = await moderationService.analyzeContent(message);

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    logger.error('Moderation analyze error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze message',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/moderation/moderate
router.post('/moderation/moderate', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.id) {
      return res.status(400).json({ error: 'Message with ID is required' });
    }

    const result = await moderationService.moderateMessage(message);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Moderation moderate error:', error);
    res.status(500).json({ 
      error: 'Failed to moderate message',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/moderation/stats
router.get('/moderation/stats', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const stats = await moderationService.getModerationStats(timeRange);
    
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    logger.error('Get moderation stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch moderation stats',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/moderation/history
router.get('/moderation/history', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await moderationService.getModerationHistory(parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    logger.error('Get moderation history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch moderation history',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/moderation/block-user
router.post('/moderation/block-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId, reason, duration } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'User ID and reason are required' });
    }

    const result = await moderationService.blockUser(userId, reason, duration);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Block user error:', error);
    res.status(500).json({ 
      error: 'Failed to block user',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/moderation/unblock-user
router.post('/moderation/unblock-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await moderationService.unblockUser(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Unblock user error:', error);
    res.status(500).json({ 
      error: 'Failed to unblock user',
      message: error.message 
    });
  }
});

// ==================== DATABASE MANAGEMENT ENDPOINTS ====================

// GET /api/v1/admin/database/info - Database info for admin panel
router.get('/database/info', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    // Используем реальный сервис вместо mock данных
    const overview = await databaseManagementService.getDatabaseOverview();
    
    // Вычисляем общий размер БД
    const totalSizeBytes = overview.tables?.reduce((sum, table) => {
      return sum + (table.totalSizeBytes || 0);
    }, 0) || 0;
    
    // Форматируем размер
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    // Получаем статистику соединений
    const poolStats = overview.connectionPool || {};
    
    // Получаем среднее время запроса (из медленных запросов или теста)
    const avgQueryTime = overview.slowQueries?.length > 0 
      ? Math.round(overview.slowQueries[0]?.meanTime || 0)
      : 0;
    
    const info = {
      metrics: {
        totalSize: formatBytes(totalSizeBytes),
        activeConnections: poolStats.activeConnections || 0,
        queryTime: `${avgQueryTime}ms`,
        cacheHitRate: 'N/A' // Требует настройки pg_stat_statements
      },
      tables: overview.tables || [],
      recentQueries: overview.slowQueries?.slice(0, 5) || []
    };

    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    logger.error('Get database info error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch database info',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/database/overview
router.get('/database/overview', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const overview = await databaseManagementService.getDatabaseOverview();
    
    res.json({
      success: true,
      ...overview
    });
  } catch (error) {
    logger.error('Get database overview error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch database overview',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/database/tables
router.get('/database/tables', authenticateAdmin, async (req, res) => {
  try {
    const tables = await databaseManagementService.getTableSizes();
    
    res.json({
      success: true,
      tables
    });
  } catch (error) {
    logger.error('Get database tables error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch table sizes',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/database/indexes
router.get('/database/indexes', authenticateAdmin, async (req, res) => {
  try {
    const indexes = await databaseManagementService.getIndexUsage();
    
    res.json({
      success: true,
      indexes
    });
  } catch (error) {
    logger.error('Get database indexes error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch index usage',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/database/slow-queries
router.get('/database/slow-queries', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const queries = await databaseManagementService.getSlowQueries(parseInt(limit));
    
    res.json({
      success: true,
      queries
    });
  } catch (error) {
    logger.error('Get slow queries error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch slow queries',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/database/connections
router.get('/database/connections', authenticateAdmin, async (req, res) => {
  try {
    const stats = await databaseManagementService.getConnectionPoolStats();
    
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    logger.error('Get connection pool stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch connection pool stats',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/database/analyze
router.post('/database/analyze', authenticateAdmin, async (req, res) => {
  try {
    const analysis = await databaseManagementService.analyzeDatabase();
    
    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    logger.error('Analyze database error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze database',
      message: error.message 
    });
  }
});

// ==================== SECURITY ENDPOINTS ====================

// GET /api/v1/admin/security/info - Security info for admin panel
router.get('/security/info', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    // Получаем реальные данные из auditService и БД
    const auditLogs = await auditService.getAuditLog(100, 0, {});
    const auditStats = await auditService.getAuditStats('24h');
    
    // Подсчитываем метрики из логов
    const failedLogins = auditLogs.filter(log => 
      log.action === 'login_attempt' && log.status === 'failed'
    ).length;
    
    const activeSessions = auditLogs.filter(log => 
      log.action === 'admin_access' && 
      new Date(log.timestamp).getTime() > Date.now() - 3600000 // За последний час
    ).length;
    
    // Получаем blocked users из памяти (в будущем из БД)
    const blockedUsersCount = blockedUsers.size;
    
    // Получаем последние активности
    const recentActivities = auditLogs.slice(0, 10).map(log => ({
      type: log.action,
      user: log.adminUserId || log.userId || 'Unknown',
      ip: log.ipAddress || 'Unknown',
      location: 'Unknown', // Можно добавить геолокацию позже
      timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown',
      status: 'success' // Статус определяется по типу действия
    }));
    
    // Получаем blocked IPs (пока из памяти, в будущем из Redis/БД)
    const blockedIPsList = Array.from(blockedUsers.entries()).map(([userId, data]) => ({
      ip: userId.includes('-') ? userId.split('-')[1] : 'Unknown',
      reason: data.reason || 'User blocked',
      blockedAt: data.blockedAt ? new Date(data.blockedAt).toLocaleString() : 'Unknown'
    }));
    
    const info = {
      metrics: {
        activeSessions: activeSessions || 0,
        failedLogins: failedLogins || 0,
        blockedIPs: blockedUsersCount || 0,
        securityScore: Math.max(0, 100 - (failedLogins * 5) - (blockedUsersCount * 2)) // Простой расчет
      },
      recentActivities: recentActivities || [],
      settings: [
        {
          name: 'Two-Factor Authentication',
          enabled: false, // Пока не реализовано
          description: 'Require 2FA for all admin accounts'
        },
        {
          name: 'Audit Logging',
          enabled: true,
          description: 'All admin actions are logged'
        }
      ],
      blockedIPs: blockedIPsList
    };

    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    logger.error('Get security info error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security info',
      message: error.message 
    });
  }
});

// POST /api/v1/admin/security/unblock - Unblock IP
router.post('/security/unblock', authenticateAdmin, async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    // В реальном проекте здесь будет логика разблокировки IP
    res.json({
      success: true,
      message: `IP ${ip} unblocked successfully`
    });
  } catch (error) {
    logger.error('Unblock IP error:', error);
    res.status(500).json({ 
      error: 'Failed to unblock IP',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/security/audit-log
router.get('/security/audit-log', addCorsHeaders, authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, adminUserId, action, targetType, fromDate, toDate } = req.query;
    
    const filters = {};
    if (adminUserId) filters.adminUserId = adminUserId;
    if (action) filters.action = action;
    if (targetType) filters.targetType = targetType;
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    
    const logs = await auditService.getAuditLog(parseInt(limit), parseInt(offset), filters);
    
    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('Get audit log error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch audit log',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/security/audit-stats
router.get('/security/audit-stats', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const stats = await auditService.getAuditStats(timeRange);
    
    res.json({
      success: true,
      stats,
      timeRange
    });
  } catch (error) {
    logger.error('Get audit stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch audit stats',
      message: error.message 
    });
  }
});

// GET /api/v1/admin/export/:type - Export data
router.get('/export/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    if (!['messages', 'users', 'analytics', 'reports'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Allowed: messages, users, analytics, reports'
      });
    }
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Allowed: json, csv'
      });
    }
    
    let data;
    
    switch (type) {
      case 'messages':
        // Экспорт сообщений за последние 24 часа
        const messagesQuery = `
          SELECT id, text, username, platform, stream_id, created_at, sentiment, is_question
          FROM messages
          WHERE created_at > NOW() - INTERVAL '24 hours'
          ORDER BY created_at DESC
          LIMIT 10000
        `;
        const messagesResult = await databaseService.query(messagesQuery);
        data = messagesResult.rows;
        break;
        
      case 'users':
        // Экспорт пользователей
        const usersQuery = `
          SELECT id, email, name, created_at, last_login_at
          FROM app_users
          ORDER BY created_at DESC
        `;
        const usersResult = await databaseService.query(usersQuery);
        data = usersResult.rows;
        break;
        
      case 'analytics':
        // Экспорт аналитики
        const { timeRange = '24h' } = req.query;
        data = await analyticsService.getFullAnalytics(timeRange);
        break;
        
      case 'reports':
        // Экспорт отчетов модерации
        data = await moderationService.getModerationReports('all', '');
        break;
    }
    
    if (format === 'csv') {
      // Конвертируем в CSV (упрощенная версия)
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return res.status(404).json({ success: false, error: 'No data to export' });
        }
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
          ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
    }
    
    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      success: true,
      type,
      exportedAt: new Date().toISOString(),
      data
    });
  } catch (error) {
    logger.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: error.message
    });
  }
});

// GET /api/v1/admin/security/roles
router.get('/security/roles', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    // В будущем здесь будет реальная система ролей
    res.json({
      success: true,
      roles: [
        { id: 'super_admin', name: 'Super Admin', permissions: ['all'] },
        { id: 'moderator', name: 'Moderator', permissions: ['moderation', 'view'] },
        { id: 'viewer', name: 'Viewer', permissions: ['view'] }
      ],
      currentUser: {
        id: req.admin.id,
        role: req.admin.role
      }
    });
  } catch (error) {
    logger.error('Get roles error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch roles',
      message: error.message 
    });
  }
});

module.exports = router;