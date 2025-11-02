// AI Filter Routes - маршруты для AI фильтра спама
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const aiFilterService = require('../services/aiFilterService');
const logger = require('../utils/logger');

/**
 * GET /api/v1/ai-filter/rules
 * Получить правила фильтра пользователя
 */
router.get('/rules', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    logger.info(`Getting AI filter rules for user: ${userId}`);
    
    const rules = await aiFilterService.getRules(userId);
    
    if (!rules) {
      return res.json({
        success: true,
        hasRules: false,
        message: 'Фильтр еще не обучен'
      });
    }
    
    res.json({
      success: true,
      hasRules: true,
      rules: rules.rules,
      stats: rules.stats,
      trainingMode: rules.trainingMode,
      updatedAt: rules.updatedAt
    });
  } catch (error) {
    logger.error('Error getting AI filter rules:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось получить правила фильтра'
    });
  }
});

/**
 * POST /api/v1/ai-filter/train
 * Обучить фильтр на выборке сообщений
 */
router.post('/train', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sampleSize = 10000, scope = 'all', trainingMode = 'moderate' } = req.body;
    
    // Валидация параметров
    if (!['all', 'active'].includes(scope)) {
      return res.status(400).json({
        success: false,
        error: 'scope должен быть "all" или "active"'
      });
    }
    
    if (!['strict', 'moderate', 'lenient'].includes(trainingMode)) {
      return res.status(400).json({
        success: false,
        error: 'trainingMode должен быть "strict", "moderate" или "lenient"'
      });
    }
    
    if (typeof sampleSize !== 'number' || sampleSize < 100 || sampleSize > 100000) {
      return res.status(400).json({
        success: false,
        error: 'sampleSize должен быть числом от 100 до 100000'
      });
    }
    
    logger.info(`Training AI filter for user ${userId}:`, {
      sampleSize,
      scope,
      trainingMode
    });
    
    const result = await aiFilterService.trainFilter(userId, {
      sampleSize,
      scope,
      trainingMode
    });
    
    res.json({
      success: true,
      rules: result.rules,
      stats: result.stats,
      trainingMode: result.trainingMode,
      updatedAt: result.updatedAt
    });
  } catch (error) {
    logger.error('Error training AI filter:', error);
    
    // Специальная обработка ошибок rate limit
    if (error.message.includes('Превышен лимит')) {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }
    
    // Ошибки Gemini API
    if (error.message.includes('Gemini API')) {
      return res.status(503).json({
        success: false,
        error: 'Ошибка AI сервиса. Проверьте GEMINI_API_KEY в .env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Не удалось обучить фильтр'
    });
  }
});

/**
 * DELETE /api/v1/ai-filter/rules
 * Удалить правила фильтра пользователя
 */
router.delete('/rules', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    logger.info(`Deleting AI filter rules for user: ${userId}`);
    
    await aiFilterService.deleteRules(userId);
    
    res.json({
      success: true,
      message: 'Правила фильтра удалены'
    });
  } catch (error) {
    logger.error('Error deleting AI filter rules:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось удалить правила фильтра'
    });
  }
});

module.exports = router;

