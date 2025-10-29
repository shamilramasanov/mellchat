const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

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

// Middleware для проверки JWT токена
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-secret-key');
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/v1/admin/auth/login
router.post('/auth/login', async (req, res) => {
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
router.get('/dashboard/metrics', authenticateAdmin, async (req, res) => {
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
router.get('/dashboard/charts', authenticateAdmin, async (req, res) => {
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
    const insights = {
      recommendations: [
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
          ],
          details: {
            queries: ['SELECT * FROM messages WHERE...', 'SELECT COUNT(*) FROM users...']
          }
        },
        {
          id: '2',
          title: 'Increase Spam Detection Sensitivity',
          description: 'Spam detection rate is below optimal. Consider adjusting thresholds.',
          priority: 'medium',
          metrics: {
            'Detection rate': '78%',
            'False positives': '2%',
            'Target rate': '85%'
          },
          actions: [
            { icon: '⚙️', label: 'Adjust Settings' },
            { icon: '📊', label: 'View Analytics' }
          ]
        },
        {
          id: '3',
          title: 'Scale Redis Memory',
          description: 'Redis memory usage is approaching limits. Consider scaling up.',
          priority: 'low',
          metrics: {
            'Memory usage': '78%',
            'Available': '22%',
            'Keys count': '8,542'
          },
          actions: [
            { icon: '📈', label: 'Scale Up' },
            { icon: '🧹', label: 'Clean Cache' }
          ]
        }
      ],
      insights: {
        peakHours: '14:00-18:00',
        topPlatform: 'Twitch',
        avgSentiment: 'positive',
        userGrowth: '+12%'
      },
      alerts: [
        {
          id: '1',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'System memory usage is above 80%',
          timestamp: new Date().toISOString(),
          actions: [
            { icon: '🔍', label: 'View Details' },
            { icon: '⚡', label: 'Restart Services' }
          ]
        }
      ]
    };

    res.json(insights);
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

// POST /api/v1/admin/ai/chat
router.post('/ai/chat', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Простая имитация ИИ ответа (в реальном проекте здесь будет OpenAI API)
    const responses = [
      "Based on current system metrics, I recommend checking the database performance. There are 5 slow queries that could be optimized.",
      "The spam detection rate is currently at 78%. Consider adjusting the threshold to 0.65 for better accuracy.",
      "Memory usage is at 78%. I suggest scaling up Redis or cleaning old cache entries.",
      "User activity peaks between 14:00-18:00. Consider scaling resources during these hours.",
      "The sentiment analysis shows 65% positive messages. This is within normal range.",
      "I've detected 3 potential security issues. Would you like me to investigate further?",
      "System performance is optimal. No immediate actions required.",
      "Based on the analytics, Twitch is your most active platform with 45% of total messages."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      success: true,
      response: randomResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
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
          const userId = ws.userId || 'anonymous';
          const userAgent = ws.headers?.['user-agent'] || 'Unknown';
          const ip = ws._socket?.remoteAddress || 'Unknown';
          
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

module.exports = router;