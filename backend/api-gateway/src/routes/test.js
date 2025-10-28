const express = require('express');
const router = express.Router();
const messageHandler = require('../handlers/messageHandler');
const logger = require('../utils/logger');

// Тестовый endpoint для сохранения сообщения
router.post('/save-message', async (req, res) => {
  try {
    const { message, connectionId } = req.body;
    
    if (!message || !connectionId) {
      return res.status(400).json({
        success: false,
        message: 'Message and connectionId are required'
      });
    }
    
    // Используем messageHandler для сохранения
    const result = await messageHandler.addMessage(message, connectionId, req.get('User-Agent') || 'test');
    
    res.json({
      success: true,
      message: 'Message saved successfully',
      data: result
    });
    
  } catch (error) {
    logger.error('Test save message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message',
      error: error.message
    });
  }
});

module.exports = router;
