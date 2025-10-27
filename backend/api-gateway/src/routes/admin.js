const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');
const messageQueueService = require('../services/messageQueueService');

// Очистить все активные подключения
router.post('/clear-all', (req, res) => {
  try {
    // Сначала отключаем все Kick клиенты
    global.activeKickConnections = global.activeKickConnections || new Map();
    for (const [connectionId, conn] of global.activeKickConnections.entries()) {
      try {
        if (conn.kickSimpleClient) {
          conn.kickSimpleClient.disconnect();
          logger.info(`🔌 KickSimpleClient disconnected: ${connectionId}`);
        }
        if (conn.kickJsClient) {
          conn.kickJsClient.disconnect();
          logger.info(`🔌 KickJsClient disconnected: ${connectionId}`);
        }
        if (conn.wsClient) {
          conn.wsClient.close();
          logger.info(`🔌 Kick WebSocket closed: ${connectionId}`);
        }
      } catch (error) {
        logger.error(`Error disconnecting Kick client ${connectionId}:`, error);
      }
    }
    global.activeKickConnections.clear();
    
    // Очищаем другие подключения если есть
    if (global.activeTwitchConnections) {
      for (const [connectionId, conn] of global.activeTwitchConnections.entries()) {
        try {
          if (conn.client) {
            conn.client.disconnect();
            logger.info(`🔌 Twitch client disconnected: ${connectionId}`);
          }
        } catch (error) {
          logger.error(`Error disconnecting Twitch client ${connectionId}:`, error);
        }
      }
      global.activeTwitchConnections.clear();
    }
    
    if (global.activeYoutubeConnections) {
      for (const [connectionId, conn] of global.activeYoutubeConnections.entries()) {
        try {
          if (conn.client) {
            conn.client.disconnect();
            logger.info(`🔌 YouTube client disconnected: ${connectionId}`);
          }
        } catch (error) {
          logger.error(`Error disconnecting YouTube client ${connectionId}:`, error);
        }
      }
      global.activeYoutubeConnections.clear();
    }
    
    logger.info('🧹 All active connections cleared and disconnected');
    
    res.json({
      success: true,
      message: 'All active connections cleared and disconnected'
    });
  } catch (error) {
    logger.error('Error clearing connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear connections',
      error: error.message
    });
  }
});

// Получить статус всех подключений
router.get('/status', (req, res) => {
  try {
    const kickConnections = global.activeKickConnections ? global.activeKickConnections.size : 0;
    const twitchConnections = global.activeTwitchConnections ? global.activeTwitchConnections.size : 0;
    const youtubeConnections = global.activeYoutubeConnections ? global.activeYoutubeConnections.size : 0;
    
    res.json({
      success: true,
      connections: {
        kick: kickConnections,
        twitch: twitchConnections,
        youtube: youtubeConnections,
        total: kickConnections + twitchConnections + youtubeConnections
      }
    });
  } catch (error) {
    logger.error('Error getting connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status',
      error: error.message
    });
  }
});

// Получить статистику очередей сообщений
router.get('/queues', async (req, res) => {
  try {
    const stats = await messageHandler.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue stats',
      error: error.message
    });
  }
});

// Принудительно сбросить все батчи
router.post('/flush-batches', async (req, res) => {
  try {
    await messageHandler.flushAllBatches();
    logger.info('🧹 All message batches flushed');
    
    res.json({
      success: true,
      message: 'All message batches flushed'
    });
  } catch (error) {
    logger.error('Error flushing batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flush batches',
      error: error.message
    });
  }
});

// Очистить все очереди
router.post('/clear-queues', async (req, res) => {
  try {
    await messageQueueService.clearQueues();
    logger.info('🧹 All message queues cleared');
    
    res.json({
      success: true,
      message: 'All message queues cleared'
    });
  } catch (error) {
    logger.error('Error clearing queues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear queues',
      error: error.message
    });
  }
});

// Настройка режима батчинга
router.post('/batch-mode', (req, res) => {
  try {
    const { enabled, batchSize } = req.body;
    
    if (typeof enabled === 'boolean') {
      messageHandler.setBatchMode(enabled);
    }
    
    if (typeof batchSize === 'number' && batchSize > 0) {
      messageHandler.setBatchSize(batchSize);
    }
    
    logger.info(`⚙️ Batch mode settings updated: enabled=${enabled}, size=${batchSize}`);
    
    res.json({
      success: true,
      message: 'Batch mode settings updated',
      settings: {
        batchMode: messageHandler.batchMode,
        batchSize: messageHandler.batchSize
      }
    });
  } catch (error) {
    logger.error('Error updating batch mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update batch mode',
      error: error.message
    });
  }
});

module.exports = router;
