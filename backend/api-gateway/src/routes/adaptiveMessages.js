// backend/api-gateway/src/routes/adaptiveMessages.js
const express = require('express');
const router = express.Router();
const userSessionService = require('../services/userSessionService');
const logger = require('../utils/logger');

// Получить сообщения по адаптивной стратегии
router.get('/messages/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { 
      userId = 'anonymous', 
      deviceType = 'desktop', 
      sessionType = 'normal' 
    } = req.query;
    
    logger.info('Adaptive message loading request:', {
      streamId,
      userId,
      deviceType,
      sessionType
    });
    
    const result = await userSessionService.getMessagesByStrategy(
      userId, 
      streamId, 
      deviceType, 
      sessionType
    );
    
    res.json({
      success: true,
      messages: result.messages,
      strategy: result.strategy,
      session: result.session,
      hasMore: result.hasMore,
      count: result.messages.length
    });
  } catch (error) {
    logger.error('Failed to get adaptive messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load messages',
      error: error.message
    });
  }
});

// Загрузить больше сообщений (пагинация)
router.get('/messages/:streamId/more', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { 
      userId = 'anonymous',
      deviceType = 'desktop',
      offset = 0,
      limit = 20
    } = req.query;
    
    const messages = await userSessionService.loadMoreMessages(
      streamId,
      parseInt(offset),
      parseInt(limit),
      deviceType
    );
    
    res.json({
      success: true,
      messages,
      count: messages.length,
      hasMore: messages.length >= parseInt(limit)
    });
  } catch (error) {
    logger.error('Failed to load more messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load more messages',
      error: error.message
    });
  }
});

// Обновить время последнего просмотра
router.post('/sessions/:streamId/seen', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { userId = 'anonymous' } = req.body;
    
    const session = await userSessionService.updateLastSeen(userId, streamId);
    
    res.json({
      success: true,
      session,
      message: 'Last seen time updated'
    });
  } catch (error) {
    logger.error('Failed to update last seen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update last seen time',
      error: error.message
    });
  }
});

// Создать новую сессию (для "с чистого листа")
router.post('/sessions/:streamId/clean', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { userId = 'anonymous', deviceType = 'desktop' } = req.body;
    
    const session = await userSessionService.createUserSession(
      userId, 
      streamId, 
      'clean_start'
    );
    
    const result = await userSessionService.getMessagesByStrategy(
      userId, 
      streamId, 
      deviceType, 
      'clean_start'
    );
    
    res.json({
      success: true,
      session,
      messages: result.messages,
      strategy: result.strategy,
      message: 'Clean session created'
    });
  } catch (error) {
    logger.error('Failed to create clean session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create clean session',
      error: error.message
    });
  }
});

// Получить информацию о сессии
router.get('/sessions/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { userId = 'anonymous' } = req.query;
    
    const session = await userSessionService.getUserSession(userId, streamId);
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    logger.error('Failed to get session info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session info',
      error: error.message
    });
  }
});

module.exports = router;
