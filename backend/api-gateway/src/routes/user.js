// User routes - маршруты для работы с настройками пользователя
const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const userSettingsService = require('../services/userSettingsService');
const userGlobalRulesService = require('../services/userGlobalRulesService');
const geminiService = require('../services/geminiService');
const globalRulesService = require('../services/globalRulesService');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/v1/user/settings - Получить настройки пользователя
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = await userSettingsService.getSettings(userId);
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    logger.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings'
    });
  }
});

// POST /api/v1/user/settings - Сохранить настройки пользователя
router.post('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = req.body;
    
    const savedSettings = await userSettingsService.saveSettings(userId, settings);
    
    res.json({
      success: true,
      settings: savedSettings
    });
  } catch (error) {
    logger.error('Save user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save user settings'
    });
  }
});

// GET /api/v1/user/rules - Получить пользовательские правила
router.get('/rules', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const rules = await userGlobalRulesService.getUserRules(userId);
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Get user rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user rules'
    });
  }
});

// POST /api/v1/user/rules/create - Создать пользовательское правило через ИИ
router.post('/rules/create', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { userRequest } = req.body;
    
    if (!userRequest || !userRequest.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User request is required'
      });
    }

    // Получаем глобальные правила для контекста (но НЕ передаем их пользователю)
    const globalRules = await globalRulesService.getAllRules();
    
    // Создаем правило через ИИ
    const ruleData = await geminiService.createUserRule(userRequest.trim(), userId, globalRules);
    
    if (!ruleData || ruleData === null) {
      return res.status(400).json({
        success: false,
        message: 'Не удалось распознать запрос. Попробуйте сформулировать его иначе, например: "Фильтруй сообщения с избытком эмодзи" или "Показывай только вопросы"'
      });
    }

    // Сохраняем правило в БД
    const savedRule = await userGlobalRulesService.saveUserRule(
      userId,
      ruleData.ruleType,
      ruleData.settings,
      ruleData.description || userRequest.trim(),
      ruleData.enabled !== false
    );
    
    res.json({
      success: true,
      rule: savedRule,
      message: 'Правило успешно создано!'
    });
  } catch (error) {
    logger.error('Create user rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user rule'
    });
  }
});

// PATCH /api/v1/user/rules/:ruleType/toggle - Включить/выключить правило
router.patch('/rules/:ruleType/toggle', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ruleType } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled must be a boolean'
      });
    }

    const success = await userGlobalRulesService.toggleUserRule(userId, ruleType, enabled);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }
    
    res.json({
      success: true,
      message: enabled ? 'Правило включено' : 'Правило выключено'
    });
  } catch (error) {
    logger.error('Toggle user rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user rule'
    });
  }
});

// DELETE /api/v1/user/rules/:ruleType - Удалить правило
router.delete('/rules/:ruleType', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ruleType } = req.params;
    
    const success = await userGlobalRulesService.deleteUserRule(userId, ruleType);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Правило удалено'
    });
  } catch (error) {
    logger.error('Delete user rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user rule'
    });
  }
});

module.exports = router;

