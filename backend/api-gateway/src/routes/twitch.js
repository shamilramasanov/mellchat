const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Twitch API configuration
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN;
const tmi = require('tmi.js');

// Store active Twitch connections
const activeTwitchConnections = new Map();

// Start anonymous IRC client and pipe real messages into memory
const startTwitchIRC = (connectionId, channelLogin, wsHub) => {
  const connection = activeTwitchConnections.get(connectionId);
  if (!connection) return;

  const client = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    identity: undefined,
    channels: [channelLogin]
  });

  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username: tags['display-name'] || tags['username'] || 'unknown',
      message,
      timestamp: new Date(),
      platform: 'twitch',
      connectionId
    };
    const conn = activeTwitchConnections.get(connectionId);
    if (!conn) return;
    conn.messages = [...(conn.messages || []), msg].slice(-200);
    // Push to WS subscribers if hub exists
    try { wsHub && wsHub.emitMessage(connectionId, msg); } catch {}
  });

  client.on('connected', () => {
    logger.info(`Twitch IRC connected to #${channelLogin}`);
  });

  client.on('disconnected', (reason) => {
    logger.warn(`Twitch IRC disconnected: ${reason}`);
  });

  client.connect().catch(err => {
    logger.error(`Twitch IRC connect error: ${err.message}`);
  });

  connection.ircClient = client;
};

// Connect to Twitch chat using real API
router.post('/', async (req, res) => {
  try {
    const { channelName } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Channel name is required' 
      });
    }

    // Allow anonymous IRC without validating Helix tokens

    logger.info(`Connecting to Twitch chat: ${channelName}`);

    // Check if already connected
    for (let [id, conn] of activeTwitchConnections.entries()) {
      if (conn.channelName === channelName) {
        logger.info(`Already connected to Twitch chat: ${channelName}`);
        return res.status(200).json({
          success: true,
          connectionId: id,
          message: `Already connected to Twitch chat: ${conn.title}`,
          data: {
            channelName: conn.channelName,
            title: conn.title,
            platform: 'twitch'
          }
        });
      }
    }

    // Get channel info from Twitch API
    // Resolve channel without Helix (best-effort)
    const channel = { id: channelName, display_name: channelName, login: channelName };
    const connectionId = `twitch-${channelName}-${Date.now()}`;
    
    // Store connection
    activeTwitchConnections.set(connectionId, {
      platform: 'twitch',
      channelName,
      channelId: channel.id,
      title: `Twitch: ${channel.display_name}`,
      connectedAt: new Date(),
      messages: [],
      questions: []
    });

    logger.info(`Twitch chat connected: ${connectionId}`);

    // Start IRC anonymous client for real chat messages
    const wsHub = req.app.get('wsHub');
    startTwitchIRC(connectionId, channel.login || channelName, wsHub);

    res.json({
      success: true,
      connectionId,
      message: `Connected to Twitch chat: ${channel.display_name}`,
      data: {
        channelName,
        channelId: channel.id,
        title: `Twitch: ${channel.display_name}`,
        platform: 'twitch'
      }
    });

  } catch (error) {
    logger.error('Twitch connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Twitch chat',
      error: error.message
    });
  }
});

// Get messages for a specific Twitch connection
router.get('/messages/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  
  const connection = activeTwitchConnections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Connection not found'
    });
  }

  res.json({
    success: true,
    messages: connection.messages || [],
    connectionId
  });
});

// Disconnect from Twitch chat
router.delete('/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  
  if (activeTwitchConnections.has(connectionId)) {
    const connection = activeTwitchConnections.get(connectionId);
    
    // Disconnect IRC client if exists
    if (connection.ircClient) {
      connection.ircClient.disconnect();
      logger.info(`Twitch IRC client disconnected for: ${connectionId}`);
    }
    
    activeTwitchConnections.delete(connectionId);
    logger.info(`Twitch connection disconnected: ${connectionId}`);
    
    res.json({
      success: true,
      message: 'Disconnected from Twitch chat'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Connection not found'
    });
  }
});

// Get active Twitch connections
router.get('/active', (req, res) => {
  const connections = Array.from(activeTwitchConnections.entries()).map(([id, data]) => ({
    id,
    ...data
  }));

  res.json({
    success: true,
    connections
  });
});

module.exports = router;
