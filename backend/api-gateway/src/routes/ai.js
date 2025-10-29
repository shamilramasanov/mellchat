const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

// CORS middleware for AI routes
const addCorsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
};

// Handle OPTIONS requests for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// AI Chat endpoint
router.post('/chat', addCorsHeaders, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    logger.info('AI Chat request:', { 
      messageLength: message.length,
      historyLength: conversationHistory.length 
    });

    const result = await geminiService.chat(message, conversationHistory);
    
    res.json({
      success: true,
      response: result.response,
      timestamp: result.timestamp
    });

  } catch (error) {
    logger.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service unavailable'
    });
  }
});

// Get available Gemini models
router.get('/models', addCorsHeaders, async (req, res) => {
  try {
    const models = await geminiService.getAvailableModels();
    
    res.json({
      success: true,
      models: models.map(model => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedGenerationMethods: model.supportedGenerationMethods
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get Gemini models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available models',
      details: error.message
    });
  }
});

// Get AI recommendations
router.get('/recommendations', addCorsHeaders, async (req, res) => {
  try {
    const { metrics } = req.query;
    
    let parsedMetrics = {};
    if (metrics) {
      try {
        parsedMetrics = JSON.parse(metrics);
      } catch (e) {
        logger.warn('Failed to parse metrics for AI recommendations');
      }
    }

    const recommendations = await geminiService.getRecommendations(parsedMetrics);
    
    res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    logger.error('AI Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service unavailable'
    });
  }
});

// Analyze content
router.post('/analyze', addCorsHeaders, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    const analysis = await geminiService.analyzeContent(messages);
    
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error('AI Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service unavailable'
    });
  }
});

// Generate report
router.post('/report', addCorsHeaders, async (req, res) => {
  try {
    const { metrics, timeRange = '24h' } = req.body;
    
    if (!metrics) {
      return res.status(400).json({
        success: false,
        error: 'Metrics are required'
      });
    }

    const report = await geminiService.generateReport(metrics, timeRange);
    
    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('AI Report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service unavailable'
    });
  }
});

// System optimization
router.post('/optimize', addCorsHeaders, async (req, res) => {
  try {
    const { systemMetrics } = req.body;
    
    if (!systemMetrics) {
      return res.status(400).json({
        success: false,
        error: 'System metrics are required'
      });
    }

    const optimization = await geminiService.optimizeSystem(systemMetrics);
    
    res.json({
      success: true,
      optimization
    });

  } catch (error) {
    logger.error('AI Optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service unavailable'
    });
  }
});

// Troubleshoot issues
router.post('/troubleshoot', addCorsHeaders, async (req, res) => {
  try {
    const { errorLogs = [], systemState = {} } = req.body;
    
    const diagnosis = await geminiService.troubleshootIssue(errorLogs, systemState);
    
    res.json({
      success: true,
      diagnosis
    });

  } catch (error) {
    logger.error('AI Troubleshoot error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service unavailable'
    });
  }
});

module.exports = router;
