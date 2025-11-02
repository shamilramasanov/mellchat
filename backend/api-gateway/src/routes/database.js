const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

// Get messages from database for a specific stream
router.get('/messages/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    logger.info('📥 Loading messages from database:', { streamId, limit, offset });
    
    const messages = await databaseService.getMessages(streamId, parseInt(limit), parseInt(offset));
    
    logger.info('✅ Messages loaded from database:', { streamId, count: messages.length });
    
    res.json({
      success: true,
      messages: messages,
      streamId,
      count: messages.length
    });
  } catch (error) {
    logger.error('❌ Failed to get messages from database:', {
      streamId: req.params.streamId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get messages from database',
      error: error.message,
      streamId: req.params.streamId
    });
  }
});

// Get questions from database for a specific stream
router.get('/questions/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const questions = await databaseService.getQuestions(streamId, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      questions: questions,
      streamId,
      count: questions.length
    });
  } catch (error) {
    logger.error('Failed to get questions from database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get questions from database',
      error: error.message
    });
  }
});

// Search messages in database
router.get('/search/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { q: searchQuery, limit = 50, offset = 0 } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const messages = await databaseService.searchMessages(streamId, searchQuery, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      messages: messages,
      streamId,
      searchQuery,
      count: messages.length
    });
  } catch (error) {
    logger.error('Failed to search messages in database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages in database',
      error: error.message
    });
  }
});

// Get stream statistics
router.get('/stats/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    
    const stats = await databaseService.getStreamStats(streamId);
    
    res.json({
      success: true,
      stats: stats,
      streamId
    });
  } catch (error) {
    logger.error('Failed to get stream stats from database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stream stats from database',
      error: error.message
    });
  }
});

// Test database connection
router.get('/health', async (req, res) => {
  try {
    const result = await databaseService.testConnection();
    
    res.json({
      success: true,
      database: result
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message
    });
  }
});

module.exports = router;
