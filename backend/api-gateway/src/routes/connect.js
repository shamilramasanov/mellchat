const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tmi = require('tmi.js');

// Store active connections across all platforms
const activeConnections = new Map();

/**
 * Start Twitch IRC client
 */
const startTwitchConnection = (connectionId, channelName, wsHub) => {
  const client = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    identity: undefined,
    channels: [channelName]
  });

  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username: tags['display-name'] || tags['username'] || 'unknown',
      text: message,
      timestamp: Date.now(),
      platform: 'twitch',
      color: tags['color'] || '#' + Math.floor(Math.random()*16777215).toString(16),
    };
    
    const conn = activeConnections.get(connectionId);
    if (conn) {
      conn.messages = [...(conn.messages || []), msg].slice(-200);
      
      // Emit to WebSocket subscribers
      if (wsHub) {
        try {
          wsHub.emitMessage(connectionId, msg);
        } catch (err) {
          logger.error('Failed to emit message:', err);
        }
      }
    }
  });

  client.on('connected', () => {
    logger.info(`✅ Twitch IRC connected to #${channelName}`);
  });

  client.on('disconnected', (reason) => {
    logger.warn(`🔌 Twitch IRC disconnected: ${reason}`);
  });

  client.connect().catch(err => {
    logger.error(`❌ Twitch IRC connect error: ${err.message}`);
  });

  const conn = activeConnections.get(connectionId);
  if (conn) {
    conn.client = client;
  }
};

/**
 * Start Kick WebSocket client
 */
const startKickConnection = (connectionId, channelName, wsHub) => {
  // Import Kick router to access its connection logic
  const kickRouter = require('./kick');
  
  // Create a mock request/response to trigger Kick connection
  const mockReq = { body: { channel: channelName } };
  const mockRes = {
    json: (data) => {
      if (data.success) {
        logger.info(`✅ Kick connected via kick.js: ${channelName}`);
      } else {
        logger.error(`❌ Kick connection failed: ${data.message}`);
      }
    },
    status: (code) => ({
      json: (data) => logger.error(`❌ Kick error ${code}: ${data.message}`)
    })
  };
  
  // Execute Kick connection using existing kick.js logic
  kickRouter(wsHub)(mockReq, mockRes);
  
  logger.info(`🔌 Kick WS connecting to ${channelName}`);
};

/**
 * POST /api/v1/connect
 * Connect to a streaming channel
 */
router.post('/', async (req, res, next) => {
  try {
    const { streamUrl } = req.body;
    
    if (!streamUrl) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Stream URL is required',
        },
      });
    }
    
    // Parse URL to determine platform and channel
    let platform = '';
    let channelName = '';
    let videoId = '';
    
    if (streamUrl.includes('twitch.tv')) {
      platform = 'twitch';
      const match = streamUrl.match(/twitch\.tv\/([^/?]+)/);
      channelName = match ? match[1] : '';
      
    } else if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      platform = 'youtube';
      const match = streamUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
      videoId = match ? match[1] : '';
      channelName = videoId; // Use videoId as channel name for YouTube
      
    } else if (streamUrl.includes('kick.com')) {
      platform = 'kick';
      const match = streamUrl.match(/kick\.com\/([^/?]+)/);
      channelName = match ? match[1] : '';
      
    } else {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsupported platform. Supported: YouTube, Twitch, Kick',
        },
      });
    }
    
    if (!channelName) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Could not extract channel/video ID from URL',
        },
      });
    }
    
    // Check if already connected to this channel (skip for Kick - it has its own deduplication)
    if (platform !== 'kick') {
      for (let [id, conn] of activeConnections.entries()) {
        if (conn.platform === platform && conn.channelName === channelName) {
          logger.info(`Already connected to ${platform} channel: ${channelName}`);
          return res.status(200).json({
            success: true,
            connection: {
              id,
              platform: conn.platform,
              channel: conn.channelName,
              streamUrl,
              connectedAt: conn.connectedAt,
              status: 'connected',
            },
            message: `Already connected to ${platform} channel: ${channelName}`,
          });
        }
      }
    }
    
    // Create new connection
    const connectionId = `${platform}-${channelName}-${Date.now()}`;
    
    activeConnections.set(connectionId, {
      platform,
      channelName,
      videoId,
      streamUrl,
      connectedAt: new Date(),
      messages: [],
    });
    
    logger.info(`🔌 Connecting to ${platform} channel: ${channelName} (${connectionId})`);
    
    // Start platform-specific connection
    const wsHub = req.app.get('wsHub');
    
    if (platform === 'twitch') {
      startTwitchConnection(connectionId, channelName, wsHub);
    } else if (platform === 'youtube') {
      // YouTube connection will be handled by youtubePersistentManager
      // Just return success, the manager will pick it up
      logger.info(`YouTube connection pending for: ${videoId}`);
    } else if (platform === 'kick') {
      // Start Kick connection
      startKickConnection(connectionId, channelName, wsHub);
    }
    
    res.status(200).json({
      success: true,
      connection: {
        id: connectionId,
        platform,
        channel: channelName,
        streamUrl,
        connectedAt: new Date(),
        status: 'connected',
      },
      message: `Successfully connected to ${platform} channel: ${channelName}`,
    });
    
  } catch (error) {
    logger.error('Connect error:', error);
    next(error);
  }
});

/**
 * POST /api/v1/disconnect
 * Disconnect from a channel
 */
router.post('/disconnect', async (req, res, next) => {
  try {
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Connection ID is required',
        },
      });
    }
    
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Connection not found',
        },
      });
    }
    
    // Disconnect platform-specific client
    if (connection.client) {
      connection.client.disconnect();
      logger.info(`🔌 ${connection.platform} client disconnected for: ${connectionId}`);
    }
    
    activeConnections.delete(connectionId);
    logger.info(`🗑️ Connection removed: ${connectionId}`);
    
    res.json({
      success: true,
      message: 'Successfully disconnected from channel',
    });
    
  } catch (error) {
    logger.error('Disconnect error:', error);
    next(error);
  }
});

/**
 * GET /api/v1/connect/status
 * Get connection status
 */
router.get('/status', async (req, res, next) => {
  try {
    const connections = Array.from(activeConnections.entries()).map(([id, data]) => ({
      id,
      platform: data.platform,
      channel: data.channelName,
      connectedAt: data.connectedAt,
      messageCount: data.messages?.length || 0,
    }));
    
    res.json({
      success: true,
      connections,
      total: connections.length,
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
