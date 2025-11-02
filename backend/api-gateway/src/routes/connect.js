const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');
const { optionalAuth } = require('../middleware/authMiddleware');

// Global activeKickConnections to share between kick.js and connect.js
global.activeKickConnections = global.activeKickConnections || new Map();
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
 * Start Kick WebSocket client using direct logic from kick.js
 */
const startKickConnection = async (connectionId, channelName, wsHub) => {
  try {
    logger.info(`🔌 Starting Kick connection for ${channelName} (${connectionId})`);
    
    // Import Kick services directly
    const KickSimpleClient = require('../services/kickSimpleClient');
    
    // Use global activeKickConnections
    const activeKickConnections = global.activeKickConnections;
    
    // Create connection object
    const conn = {
      platform: 'kick',
      channel: channelName,
      title: `Kick: ${channelName}`,
      connectedAt: new Date(),
      messages: []
    };
    activeKickConnections.set(connectionId, conn);

    // Try to connect using the simple Kick client
    const kickSimpleClient = new KickSimpleClient({
      channelName: channelName,
      onMessage: async (msg) => {
        const conn = activeKickConnections.get(connectionId);
        if (!conn) return;
        
        // Add message to connection
        if (!conn.messages) conn.messages = [];
        conn.messages.push(msg);
        conn.messages = conn.messages.slice(-200); // Keep last 200 messages
        
        // Сохраняем в базу данных
        try {
          await messageHandler.addMessage(msg, connectionId, 'Kick Client');
        } catch (error) {
          logger.error('Error saving Kick message to DB:', error);
        }
        
        // Emit via WebSocket
        try { 
          wsHub && wsHub.emitMessage(connectionId, msg); 
          logger.info(`Kick message emitted: ${msg.username}: ${msg.text}`);
        } catch (e) {
          logger.error('Kick WebSocket emit error', { error: e.message });
        }
      }
    });
    
    // Connect the client
    const success = await kickSimpleClient.connect();
    if (success) {
      logger.info(`✅ Kick simple client connected to ${channelName}`);
      conn.kickSimpleClient = kickSimpleClient;
      conn.title = kickSimpleClient.channelTitle || `Kick: ${channelName}`;
      conn.viewers = kickSimpleClient.viewerCount || 0;
      return { 
        success: true, 
        message: `Connected to Kick channel: ${channelName}`,
        viewers: kickSimpleClient.viewerCount || 0,
        title: kickSimpleClient.channelTitle || `Kick: ${channelName}`
      };
    } else {
      logger.warn(`⚠️ Kick simple client failed to connect to ${channelName}`);
      return { success: false, message: `Failed to connect to Kick channel: ${channelName}` };
    }
    
  } catch (error) {
    logger.error(`❌ Kick connection error: ${error.message}`);
    return { success: false, message: error.message };
  }
};

/**
 * POST /api/v1/connect
 * Connect to a streaming channel
 */
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { streamUrl, platform: providedPlatform, videoId: providedVideoId, channelName: providedChannelName } = req.body;
    
    if (!streamUrl) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Stream URL is required',
        },
      });
    }
    
    // Use provided platform or detect from URL
    let platform = providedPlatform || '';
    let channelName = providedChannelName || '';
    let videoId = providedVideoId || '';
    
    // If platform not provided, detect from URL
    if (!platform) {
      logger.info(`🔍 Detecting platform from URL: ${streamUrl}`);
      
      if (streamUrl.includes('twitch.tv')) {
        platform = 'twitch';
        const match = streamUrl.match(/twitch\.tv\/([^/?]+)/);
        channelName = match ? match[1] : '';
        logger.info(`📺 Detected Twitch: ${channelName}`);
        
      } else if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
        platform = 'youtube';
        // Support multiple YouTube URL formats
        let match = streamUrl.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        videoId = match ? match[1] : '';
        channelName = videoId; // Use videoId as channel name for YouTube
        logger.info(`📺 Detected YouTube: videoId=${videoId}, channelName=${channelName}`);
        
      } else if (streamUrl.includes('kick.com')) {
        platform = 'kick';
        const match = streamUrl.match(/kick\.com\/([^/?]+)/);
        channelName = match ? match[1] : '';
        logger.info(`📺 Detected Kick: ${channelName}`);
        
      } else {
        logger.error(`❌ Unsupported URL format: ${streamUrl}`);
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Unsupported platform. Supported: YouTube, Twitch, Kick',
          },
        });
      }
    } else {
      logger.info(`🔍 Using provided platform: ${platform} for URL: ${streamUrl}`);
      // Platform provided, extract channel/video info from URL
      if (platform === 'youtube') {
        let match = streamUrl.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        videoId = match ? match[1] : '';
        channelName = videoId;
        logger.info(`📺 YouTube extraction: videoId=${videoId}, channelName=${channelName}`);
      } else if (platform === 'twitch') {
        const match = streamUrl.match(/twitch\.tv\/([^/?]+)/);
        channelName = match ? match[1] : '';
        logger.info(`📺 Twitch extraction: ${channelName}`);
      } else if (platform === 'kick') {
        const match = streamUrl.match(/kick\.com\/([^/?]+)/);
        channelName = match ? match[1] : '';
        logger.info(`📺 Kick extraction: ${channelName}`);
      }
    }
    
    logger.info(`🔍 Final values: platform=${platform}, channelName=${channelName}, videoId=${videoId}`);
    
    if (!channelName) {
      logger.error(`❌ No channelName extracted from URL: ${streamUrl}`);
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
      viewers: 0, // Initialize viewers count
    });
    
    logger.info(`🔌 Connecting to ${platform} channel: ${channelName} (${connectionId})`);
    
    // Start platform-specific connection
    const wsHub = req.app.get('wsHub');
    
    if (platform === 'twitch') {
      startTwitchConnection(connectionId, channelName, wsHub);
    } else if (platform === 'youtube') {
      // Start YouTube connection using youtubePersistentManager
      try {
        const youtubeManager = require('../services/youtubePersistentManager');
        const conn = await youtubeManager.connect(videoId, streamUrl);
        logger.info(`✅ YouTube connected: ${conn.title}`);
        
        // Update connection with YouTube data
        const connData = activeConnections.get(connectionId);
        if (connData) {
          connData.title = conn.title;
          connData.channelName = conn.channelName;
          connData.liveChatId = conn.liveChatId;
        }
      } catch (error) {
        logger.error(`❌ YouTube connection failed: ${error.message}`);
        // Remove failed connection
        activeConnections.delete(connectionId);
        return res.status(500).json({
          error: {
            code: 'YOUTUBE_CONNECTION_FAILED',
            message: error.message,
          },
        });
      }
    } else if (platform === 'kick') {
      // Start Kick connection and wait for result
      const kickResult = await startKickConnection(connectionId, channelName, wsHub);
      logger.info(`Kick connection result:`, kickResult);
      
      if (!kickResult.success) {
        // Remove failed connection
        activeConnections.delete(connectionId);
        return res.status(500).json({
          error: {
            code: 'KICK_CONNECTION_FAILED',
            message: kickResult.message,
          },
        });
      }
      
      // Update connection with Kick data
      const connData = activeConnections.get(connectionId);
      if (connData && kickResult.viewers !== undefined) {
        connData.viewers = kickResult.viewers;
        connData.title = kickResult.title || connData.title;
      }
    }
    
    // Get final connection data
    const finalConnData = activeConnections.get(connectionId);
    
    // Логируем активность пользователя и обновляем счетчики гостевой сессии
    try {
      const userActivityService = require('../services/userActivityService');
      const userId = req.user?.userId || null;
      const sessionId = req.headers['x-session-id'] || null;
      
      // Логируем открытие стрима
      await userActivityService.logActivity({
        userId,
        sessionId,
        streamId: connectionId,
        platform,
        channelName,
        action: 'open',
        metadata: {
          streamUrl,
          title: finalConnData?.title || `${platform}: ${channelName}`,
          viewers: finalConnData?.viewers || 0
        }
      });
      
      // Обновляем счетчик открытых стримов для гостевой сессии
      if (sessionId && !userId) {
        const guestSessionService = require('../services/guestSessionService');
        const session = await guestSessionService.getSession(sessionId);
        if (session) {
          await guestSessionService.updateSessionStats(sessionId, {
            streamsCount: (session.streamsCount || 0) + 1
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to log user activity:', error.message);
      // Не прерываем запрос, если логирование не удалось
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
        viewers: finalConnData?.viewers || 0,
        title: finalConnData?.title || `${platform}: ${channelName}`,
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
router.post('/disconnect', optionalAuth, async (req, res, next) => {
  try {
    const { connectionId } = req.body;
    
    logger.info(`🔌 Disconnect request for: ${connectionId}`);
    logger.info(`📊 Active connections: ${Array.from(activeConnections.keys()).join(', ')}`);
    
    if (!connectionId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Connection ID is required',
        },
      });
    }
    
    // Check both activeConnections and activeKickConnections
    let connection = activeConnections.get(connectionId);
    let isKickConnection = false;
    
    if (!connection) {
      // Check if it's a Kick connection
      const activeKickConnections = global.activeKickConnections;
      const kickConn = activeKickConnections.get(connectionId);
      if (kickConn) {
        connection = kickConn;
        isKickConnection = true;
        logger.info(`✅ Found Kick connection: ${connectionId}`);
      }
    }
    
    if (!connection) {
      logger.warn(`❌ Connection not found in activeConnections or activeKickConnections: ${connectionId}`);
      logger.info(`📊 Active connections: ${Array.from(activeConnections.keys()).join(', ')}`);
      logger.info(`📊 Active Kick connections: ${Array.from(global.activeKickConnections.keys()).join(', ')}`);
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Connection not found',
        },
      });
    }
    
    logger.info(`✅ Found connection: ${connectionId}, platform: ${connection.platform || 'kick'}, isKick: ${isKickConnection}`);
    
    // Disconnect platform-specific client
    if (connection.client) {
      connection.client.disconnect();
      logger.info(`🔌 ${connection.platform} client disconnected for: ${connectionId}`);
    }
    
    // For Kick connections, also check activeKickConnections for client objects
    if (isKickConnection || connection.platform === 'kick') {
      const activeKickConnections = global.activeKickConnections;
      logger.info(`🔍 Disconnecting Kick connection: ${connectionId}`);
      
      // Get Kick connection from activeKickConnections if it exists
      const kickConn = activeKickConnections.get(connectionId);
      
      if (kickConn) {
        if (kickConn.kickSimpleClient) {
          kickConn.kickSimpleClient.disconnect();
          logger.info(`🔌 KickSimpleClient disconnected: ${connectionId}`);
        }
        if (kickConn.kickJsClient) {
          kickConn.kickJsClient.disconnect();
          logger.info(`🔌 KickJsClient disconnected: ${connectionId}`);
        }
        if (kickConn.wsClient) {
          kickConn.wsClient.close();
          logger.info(`🔌 Kick WebSocket closed: ${connectionId}`);
        }
        activeKickConnections.delete(connectionId);
        logger.info(`🔌 Kick connection removed from activeKickConnections: ${connectionId}`);
      } else {
        logger.warn(`⚠️ Kick connection not found in activeKickConnections: ${connectionId}`);
      }
    }
    
    // Remove from activeConnections if it exists there
    if (activeConnections.has(connectionId)) {
      activeConnections.delete(connectionId);
      logger.info(`🔌 Connection removed from activeConnections: ${connectionId}`);
    }
    logger.info(`🗑️ Connection removed: ${connectionId}`);
    
    // Final check - verify connection is really gone from both storages
    const finalCheckActive = activeConnections.get(connectionId);
    const finalCheckKick = global.activeKickConnections.get(connectionId);
    
    if (finalCheckActive || finalCheckKick) {
      logger.error(`❌ CRITICAL: Connection still exists after deletion: ${connectionId}`);
      logger.error(`❌ Still in activeConnections: ${!!finalCheckActive}`);
      logger.error(`❌ Still in activeKickConnections: ${!!finalCheckKick}`);
    } else {
      logger.info(`✅ Connection successfully removed from all storages: ${connectionId}`);
    }
    
    // Логируем активность пользователя при закрытии стрима
    try {
      const userActivityService = require('../services/userActivityService');
      const userId = req.user?.userId || null;
      const sessionId = req.headers['x-session-id'] || null;
      const platform = connection.platform || 'kick';
      const channelName = connection.channel || connection.channelName || '';
      
      await userActivityService.logActivity({
        userId,
        sessionId,
        streamId: connectionId,
        platform,
        channelName,
        action: 'close',
        metadata: {
          duration: connection.connectedAt ? (Date.now() - new Date(connection.connectedAt).getTime()) : 0
        }
      });
    } catch (error) {
      logger.warn('Failed to log disconnect activity:', error.message);
      // Не прерываем запрос
    }
    
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

// Debug endpoint to view active connections
router.get('/debug/connections', (req, res) => {
  const activeConnectionsList = Array.from(activeConnections.entries()).map(([id, conn]) => ({
    id,
    platform: conn.platform,
    channelName: conn.channelName,
    connectedAt: conn.connectedAt
  }));
  
  const activeKickConnectionsList = Array.from(global.activeKickConnections.entries()).map(([id, conn]) => ({
    id,
    platform: conn.platform || 'kick',
    channel: conn.channel,
    connectedAt: conn.connectedAt
  }));
  
  res.json({
    activeConnections: activeConnectionsList,
    activeKickConnections: activeKickConnectionsList,
    totalActive: activeConnections.size,
    totalKick: global.activeKickConnections.size
  });
});

// Экспортируем activeConnections для использования в других модулях
router.activeConnections = activeConnections;

module.exports = router;
