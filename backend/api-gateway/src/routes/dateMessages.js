const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * GET /api/v1/date-messages/:streamId
 * Загружает сообщения за конкретную дату по 20 штук
 * Query params:
 * - date: YYYY-MM-DD формат даты
 * - offset: количество пропущенных сообщений (по умолчанию 0)
 * - limit: количество сообщений (по умолчанию 20)
 */
router.get('/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { date, offset = 0, limit = 20 } = req.query;

    // Валидация параметров
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }

    // Проверяем формат даты
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    logger.info('Date messages request:', {
      streamId,
      date,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    // Получаем сообщения за конкретную дату
    const messages = await databaseService.getMessagesByDate(
      streamId,
      date,
      parseInt(offset),
      parseInt(limit)
    );

    // Проверяем, есть ли еще сообщения за эту дату
    const hasMore = messages.length === parseInt(limit);
    
    // Получаем общее количество сообщений за эту дату
    const totalCount = await databaseService.getMessagesCountByDate(streamId, date);

    logger.info('Date messages loaded:', {
      streamId,
      date,
      loadedCount: messages.length,
      hasMore,
      totalCount
    });

    res.json({
      success: true,
      messages,
      date,
      offset: parseInt(offset),
      limit: parseInt(limit),
      hasMore,
      totalCount,
      loadedCount: messages.length
    });

  } catch (error) {
    logger.error('Error loading date messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load messages for date'
    });
  }
});

/**
 * GET /api/v1/date-messages/:streamId/available-dates
 * Получает список доступных дат для стрима
 */
router.get('/:streamId/available-dates', async (req, res) => {
  try {
    const { streamId } = req.params;

    logger.info('Available dates request:', { streamId });

    const availableDates = await databaseService.getAvailableDates(streamId);

    logger.info('Available dates loaded:', {
      streamId,
      datesCount: availableDates.length,
      dates: availableDates
    });

    res.json({
      success: true,
      dates: availableDates
    });

  } catch (error) {
    logger.error('Error loading available dates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load available dates'
    });
  }
});

module.exports = router;
