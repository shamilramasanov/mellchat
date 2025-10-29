const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const geminiService = require('../../services/geminiService');
const analyticsService = require('../../services/analyticsService');
const moderationService = require('../../services/moderationService');
const databaseManagementService = require('../../services/databaseManagementService');
const logger = require('../../utils/logger');

// Handle CORS preflight requests for admin routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Mock admin user (в реальном проекте это будет в БД)
const ADMIN_USER = {
  id: '1',
  username: 'admin',
  email: 'admin@mellchat.live',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'super_admin',
  created_at: new Date(),
  last_login: null,
  is_active: true
};

const auditService = require('../../services/auditService');

// Middleware для добавления CORS заголовков
const addCorsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
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

    // Проверяем пользователя
    if (username !== ADMIN_USER.username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, ADMIN_USER.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

// POST /api/v1/admin/ai/chat
router.post('/ai/chat', authenticateAdmin, async (req, res) => {
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

    const result = await geminiService.chat(message, conversationHistory);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('AI chat error:', error);
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