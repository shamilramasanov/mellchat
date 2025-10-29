const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminMetricsService = require('../../services/adminMetricsService');
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
    // Получаем реальные метрики из системы
    const metrics = await adminMetricsService.getAllMetrics();
    
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
    
    // Получаем реальные данные для графиков
    const charts = await adminMetricsService.getChartData(range);
    
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

module.exports = router;