// API routes for user reputation management
const express = require('express');
const router = express.Router();
const userReputationManager = require('../services/userReputationManager');
const logger = require('../utils/logger');

/**
 * GET /api/v1/reputation/stats
 * Получить общую статистику по репутации
 */
router.get('/stats', (req, res) => {
  try {
    const stats = userReputationManager.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting reputation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reputation statistics'
    });
  }
});

/**
 * GET /api/v1/reputation/user/:username
 * Получить репутацию конкретного пользователя
 */
router.get('/user/:username', (req, res) => {
  try {
    const { username } = req.params;
    const reputation = userReputationManager.getReputation(username);
    const status = userReputationManager.getUserStatus(username);
    const history = userReputationManager.getHistory(username, 20);
    
    res.json({
      success: true,
      data: {
        username,
        reputation,
        status,
        history,
        filterModifier: userReputationManager.getFilterModifier(username)
      }
    });
  } catch (error) {
    logger.error('Error getting user reputation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user reputation'
    });
  }
});

/**
 * POST /api/v1/reputation/user/:username/reset
 * Сбросить репутацию пользователя
 */
router.post('/user/:username/reset', (req, res) => {
  try {
    const { username } = req.params;
    userReputationManager.resetReputation(username);
    
    res.json({
      success: true,
      message: `Reputation reset for user ${username}`
    });
  } catch (error) {
    logger.error('Error resetting user reputation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user reputation'
    });
  }
});

/**
 * POST /api/v1/reputation/reset-all
 * Сбросить всю репутацию (только для разработки)
 */
router.post('/reset-all', (req, res) => {
  try {
    userReputationManager.resetAll();
    
    res.json({
      success: true,
      message: 'All reputations reset'
    });
  } catch (error) {
    logger.error('Error resetting all reputations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset all reputations'
    });
  }
});

module.exports = router;

