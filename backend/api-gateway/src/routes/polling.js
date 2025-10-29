const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');

// Polling endpoint для получения новых сообщений
router.get('/messages/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { lastMessageId, limit = 50 } = req.query;
    
    logger.info(`📥 Polling messages for ${connectionId}, lastId: ${lastMessageId}`);
    
    // Получаем сообщения из базы данных
    const messages = await messageHandler.getMessages(connectionId, {
      limit: parseInt(limit),
      afterId: lastMessageId
    });
    
    res.json({
      success: true,
      messages: messages || [],
      connectionId,
      count: messages?.length || 0,
      lastMessageId: messages?.[messages.length - 1]?.id || lastMessageId
    });
    
  } catch (error) {
    logger.error('Polling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
});

// Polling endpoint для проверки новых сообщений
router.get('/check/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { lastMessageId } = req.query;
    
    // Проверяем, есть ли новые сообщения
    const hasNewMessages = await messageHandler.hasNewMessages(connectionId, lastMessageId);
    
    res.json({
      success: true,
      hasNewMessages,
      connectionId,
      lastMessageId
    });
    
  } catch (error) {
    logger.error('Check messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check messages',
      error: error.message
    });
  }
});

module.exports = router;
