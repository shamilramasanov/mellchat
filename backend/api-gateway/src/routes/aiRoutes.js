const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// CORS middleware for AI routes
const addCorsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
};

// Handle OPTIONS requests for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// AI Chat endpoint
router.post('/chat', addCorsHeaders, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Mock AI response for now
    const responses = [
      "Анализирую данные системы MellChat...",
      "На основе текущих метрик рекомендую оптимизировать производительность WebSocket соединений.",
      "Обнаружены потенциальные проблемы с CORS политикой. Рекомендую проверить настройки сервера.",
      "Система работает стабильно. Рекомендую мониторить использование памяти.",
      "Для улучшения производительности рассмотрите возможность кэширования запросов к базе данных."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    res.json({
      success: true,
      response: randomResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// AI Recommendations endpoint
router.get('/recommendations', addCorsHeaders, async (req, res) => {
  try {
    const { metrics } = req.query;
    
    let parsedMetrics = {};
    if (metrics) {
      try {
        parsedMetrics = JSON.parse(decodeURIComponent(metrics));
      } catch (e) {
        logger.warn('Invalid metrics format:', e);
      }
    }

    // Generate recommendations based on metrics
    const recommendations = [
      {
        type: 'performance',
        title: 'Оптимизация производительности',
        description: 'Рекомендую включить виртуализацию для больших списков сообщений',
        priority: 'medium'
      },
      {
        type: 'database',
        title: 'Оптимизация базы данных',
        description: 'Добавьте индексы для часто используемых запросов',
        priority: 'high'
      },
      {
        type: 'caching',
        title: 'Кэширование',
        description: 'Внедрите Redis кэширование для часто запрашиваемых данных',
        priority: 'low'
      }
    ];

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
