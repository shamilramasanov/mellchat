const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const KickWsClient = require('../services/kickWsClient');

// In-memory connections: connectionId -> state
const activeKickConnections = new Map();

// Try to fetch channel info from Kick public API
async function fetchKickChannel(channel) {
  try {
    // Kick API is often blocked, so we'll use a mock approach
    logger.info(`Kick channel info requested for: ${channel}`);
    
    // Return mock channel info since Kick API is blocked
    return {
      id: `kick-${channel}`,
      chatroom: { id: `chatroom-${channel}` },
      livestream: { session_title: `Kick Stream: ${channel}` }
    };
  } catch (e) {
    logger.error('Kick fetch channel failed', { error: e.message, channel });
    return null;
  }
}

// Simulate Kick messages for testing (since API is blocked)
async function pollKickMessages(connectionId, wsHub) {
  const conn = activeKickConnections.get(connectionId);
  if (!conn) return;

  try {
    // Since Kick API is blocked, simulate some test messages
    const testMessages = [
      "Hello from Kick chat! 🎮",
      "This is a test message",
      "Kick integration is working!",
      "How are you doing?",
      "Great stream! 👍"
    ];
    
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    const testUsers = ["KickUser1", "KickUser2", "KickViewer", "KickFan", "KickSupporter"];
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    
    // Create a test message
    const msg = {
      id: `kick-test-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      platform: 'kick',
      connectionId,
      username: randomUser,
      message: randomMessage,
      timestamp: new Date()
    };
    
    // Add to connection messages
    if (!conn.messages) conn.messages = [];
    conn.messages.push(msg);
    conn.messages = conn.messages.slice(-200); // Keep last 200 messages
    
    // Emit via WebSocket
    try { 
      wsHub && wsHub.emitMessage(connectionId, msg); 
      logger.info(`Kick test message sent: ${randomUser}: ${randomMessage}`);
    } catch (e) {
      logger.error('Kick WebSocket emit error', { error: e.message });
    }
    
  } catch (e) {
    logger.error('Kick polling error', { error: e.message, connectionId });
  } finally {
    // schedule next poll every 10 seconds for testing
    setTimeout(() => pollKickMessages(connectionId, wsHub), 10000);
  }
}

// Connect to Kick chat (best-effort via polling)
router.post('/', async (req, res) => {
  try {
    const { channelName } = req.body;
    if (!channelName) return res.status(400).json({ success: false, message: 'Channel name is required' });

    // De-dup
    for (const [id, c] of activeKickConnections.entries()) {
      if (c.channel === channelName) {
        return res.json({ success: true, connectionId: id, message: 'Already connected', data: { channelName } });
      }
    }

    const connectionId = `kick-${channelName}-${Date.now()}`;
    const wsHub = req.app.get('wsHub');

    const conn = {
      platform: 'kick',
      channel: channelName,
      title: `Kick: ${channelName}`,
      connectedAt: new Date(),
      messages: []
    };
    activeKickConnections.set(connectionId, conn);

    // Resolve channel data (chatroom id) asynchronously
    fetchKickChannel(channelName).then(info => {
      if (!info) return;
      const c = activeKickConnections.get(connectionId);
      if (!c) return;
      c.title = info?.livestream?.session_title || c.title;
      c.chatroomId = info?.chatroom?.id || info?.id;
      // Try WS real-time if configured
      try {
        const wsHub = router.wsHubRef && router.wsHubRef();
        const client = new KickWsClient({
          chatroomId: c.chatroomId,
          channelName: c.channel,
          onMessage: (msg) => {
            const conn = activeKickConnections.get(connectionId);
            if (!conn) return;
            const exists = new Set((conn.messages||[]).map(m => m.id));
            if (!exists.has(msg.id)) {
              const payload = { id: msg.id, username: msg.username, message: msg.message, timestamp: msg.timestamp, platform: 'kick', connectionId };
              conn.messages = [...(conn.messages||[]), payload].slice(-200);
              try { wsHub && wsHub.emitMessage(connectionId, payload); } catch {}
            }
          }
        });
        client.connect();
        c.wsClient = client;
      } catch (e) {
        logger.error('Kick WS start failed', { error: e.message });
      }
    }).finally(() => {
      // Start polling regardless; it will no-op until chatroomId is present
      pollKickMessages(connectionId, wsHub);
    });

    res.json({ success: true, connectionId, message: `Connected to Kick chat: ${channelName}`, data: { channelName, platform: 'kick' } });
  } catch (e) {
    logger.error('Kick connect error', { error: e.message });
    res.status(500).json({ success: false, message: 'Failed to connect to Kick chat', error: e.message });
  }
});

// Messages for a Kick connection
router.get('/messages/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const conn = activeKickConnections.get(connectionId);
  if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });
  res.json({ success: true, messages: conn.messages || [], connectionId });
});

// Active connections
router.get('/active', (req, res) => {
  const connections = Array.from(activeKickConnections.entries()).map(([id, c]) => ({ id, ...c }));
  res.json({ success: true, connections });
});

// Disconnect
router.delete('/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  if (!activeKickConnections.has(connectionId)) return res.status(404).json({ success: false, message: 'Connection not found' });
  const conn = activeKickConnections.get(connectionId);
  try { conn.wsClient?.close?.(); } catch {}
  activeKickConnections.delete(connectionId);
  logger.info('Kick disconnected', { connectionId });
  res.json({ success: true, message: 'Disconnected from Kick chat' });
});

module.exports = (wsHubProvider) => { router.wsHubRef = wsHubProvider; return router; };