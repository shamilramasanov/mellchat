const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');
const youtubeManager = require('../services/youtubePersistentManager');
const emojiService = require('../services/emojiService');

// Connect to YouTube Live chat
router.post('/', async (req, res) => {
  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Video ID is required' 
      });
    }

    logger.info(`Connecting to YouTube Live chat: ${videoId}`);

    const conn = await youtubeManager.connect(videoId, `https://youtube.com/watch?v=${videoId}`);

    const connectionId = `youtube-${videoId}`;

    res.json({
      success: true,
      connectionId,
      message: `Connected to YouTube Live chat: ${conn.title}`,
      data: {
        videoId,
        title: conn.title,
        channelTitle: conn.channelName,
        liveChatId: conn.liveChatId
      }
    });

  } catch (error) {
    logger.error('YouTube connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to YouTube Live chat',
      error: error.message
    });
  }
});

// Push messages to WS hub on manager events
youtubeManager.on('message', async (msg) => {
  try {
    const connectionId = `youtube-${msg.channel}`;
    const wsHub = router.wsHubRef && router.wsHubRef();
    
    logger.info(`📨 YouTube message received: ${msg.username}: ${msg.message}`);
    
    // Сохраняем в базу данных
    try {
      await messageHandler.addMessage(msg, connectionId);
      logger.info(`💾 YouTube message saved to DB: ${connectionId}`);
    } catch (error) {
      logger.error('Error saving YouTube message to DB:', error);
    }
    
    if (wsHub && typeof wsHub.emitMessage === 'function') {
      // Process emojis before sending to WebSocket
      try {
        const processedMsg = await emojiService.processMessage(msg, 'youtube');
        wsHub.emitMessage(connectionId, processedMsg);
        logger.info(`📡 YouTube message sent via WebSocket: ${connectionId}`);
      } catch (error) {
        logger.error('Failed to process emojis for WS message:', error);
        wsHub.emitMessage(connectionId, msg); // Send original message
        logger.info(`📡 YouTube message sent via WebSocket (fallback): ${connectionId}`);
      }
    } else {
      logger.warn(`⚠️ WebSocket not available, message not sent: ${connectionId}`);
    }
  } catch (error) {
    logger.error('Error in YouTube message event:', error);
  }
});

// Disconnect from YouTube Live chat
router.delete('/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  const match = connectionId.match(/^youtube-(.+)$/);
  if (!match) return res.status(400).json({ success: false, message: 'Invalid connectionId' });
  const videoId = match[1];
  await youtubeManager.disconnect(videoId, 'api_request');
  logger.info(`YouTube connection disconnected: ${connectionId}`);
  res.json({ success: true, message: 'Disconnected from YouTube Live chat' });
});

// Get messages for a specific connection
router.get('/messages/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const match = connectionId.match(/^youtube-(.+)$/);
    if (!match) return res.status(400).json({ success: false, message: 'Invalid connectionId' });
    
    const videoId = match[1];
    const messages = youtubeManager.getMessages(videoId);
    
    // Process emojis for each message
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        try {
          return await emojiService.processMessage(message, 'youtube');
        } catch (error) {
          logger.error('Failed to process emojis for message:', error);
          return message; // Return original message if emoji processing fails
        }
      })
    );
    
    res.json({ success: true, messages: processedMessages, connectionId });
  } catch (error) {
    logger.error('Failed to get messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

// Get active connections
router.get('/active', async (req, res) => {
  try {
    const connections = youtubeManager.getActiveConnections();
    res.json({
      success: true,
      connections: Array.from(connections.values())
    });
  } catch (error) {
    logger.error('Failed to get active connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active connections'
    });
  }
});

// Get API usage statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = youtubeManager.getApiUsageStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get API stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API stats'
    });
  }
});

module.exports = (wsHubProvider) => {
  // allow wsHub access inside events
  router.wsHubRef = wsHubProvider;
  return router;
};
