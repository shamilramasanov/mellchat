const express = require('express');
const router = express.Router();
const emojiService = require('../services/emojiService');
const logger = require('../utils/logger');

// Process message emojis
router.post('/process', async (req, res) => {
  try {
    const { message, platform = 'universal' } = req.body;
    
    if (!message || !message.text) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }
    
    const processedMessage = await emojiService.processMessage(message, platform);
    
    res.json({
      success: true,
      message: processedMessage
    });
  } catch (error) {
    logger.error('Failed to process emojis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process emojis'
    });
  }
});

// Get emoji statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = emojiService.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get emoji stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emoji stats'
    });
  }
});

// Parse emojis from text
router.post('/parse', async (req, res) => {
  try {
    const { text, platform = 'universal' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    const emojis = await emojiService.parseEmojis(text, platform);
    
    res.json({
      success: true,
      emojis
    });
  } catch (error) {
    logger.error('Failed to parse emojis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse emojis'
    });
  }
});

module.exports = router;
