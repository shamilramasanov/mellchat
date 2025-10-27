const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * GET /api/v1/pagination-messages/:streamId/older
 * Получает старые сообщения для стрима (ID-based пагинация)
 */
router.get('/:streamId/older', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { beforeId, limit = 20 } = req.query;

    if (!beforeId) {
      return res.status(400).json({
        success: false,
        error: 'beforeId parameter is required'
      });
    }

    logger.info('Older messages request:', { 
      streamId, 
      beforeId, 
      limit: parseInt(limit) 
    });

    const messages = await databaseService.getOlderMessages(
      streamId, 
      beforeId, 
      parseInt(limit)
    );

    const hasMore = await databaseService.hasOlderMessages(streamId, beforeId);

    logger.info('Older messages loaded:', {
      streamId,
      beforeId,
      loadedCount: messages.length,
      hasMore,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      messages,
      beforeId,
      limit: parseInt(limit),
      hasMore,
      loadedCount: messages.length
    });

  } catch (error) {
    logger.error('Error loading older messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load older messages'
    });
  }
});

module.exports = router;
