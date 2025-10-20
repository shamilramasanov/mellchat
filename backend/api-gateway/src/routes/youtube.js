const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const youtubeManager = require('../services/youtubePersistentManager');

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
youtubeManager.on('message', (msg) => {
  try {
    const connectionId = `youtube-${msg.channel}`;
    const wsHub = router.wsHubRef && router.wsHubRef();
    if (wsHub) wsHub.emitMessage(connectionId, msg);
  } catch {}
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
router.get('/messages/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const match = connectionId.match(/^youtube-(.+)$/);
  if (!match) return res.status(400).json({ success: false, message: 'Invalid connectionId' });
  const videoId = match[1];
  const messages = youtubeManager.getMessages(videoId);
  res.json({ success: true, messages, connectionId });
});

// Get active connections
router.get('/active', (req, res) => {
  const conns = youtubeManager.getAllConnections().map((c) => ({
    id: `youtube-${c.videoId}`,
    platform: 'youtube',
    videoId: c.videoId,
    liveChatId: c.liveChatId,
    title: c.title,
    channelTitle: c.channelName,
    connectedAt: new Date(c.connectedAt),
    lastMessageId: c.lastMessageId
  }));
  res.json({ success: true, connections: conns });
});

module.exports = (wsHubProvider) => {
  // allow wsHub access inside events
  router.wsHubRef = wsHubProvider;
  return router;
};
