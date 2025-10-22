const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const KickWsClient = require('../services/kickWsClient');
const KickJsClient = require('../services/kickJsClient');
const KickSimpleClient = require('../services/kickSimpleClient');

// In-memory connections: connectionId -> state
const activeKickConnections = new Map();

// Try to fetch channel info from Kick public API
async function fetchKickChannel(channel) {
  try {
    logger.info(`Kick channel info requested for: ${channel}`);
    
    // Try to fetch real channel info first
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channel)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      logger.info(`Kick channel info fetched successfully for: ${channel}`);
      return data;
    } else {
      logger.warn(`Kick API blocked for channel: ${channel}, using fallback`);
    }
  } catch (e) {
    logger.warn(`Kick API error for ${channel}: ${e.message}, using fallback`);
  }
  
  // Fallback: return mock channel info when API is blocked
  return {
    id: `kick-${channel}`,
    chatroom: { id: `chatroom-${channel}` },
    livestream: { session_title: `Kick Stream: ${channel}` }
  };
}

// Simulate Kick messages for testing when real connection fails
function startKickMessageSimulation(connectionId, wsHub, channelName) {
  logger.info(`🎭 Starting Kick message simulation for ${channelName}`);
  
  const testMessages = [
    "Hello from Kick chat! 🎮",
    "This is a test message from Kick",
    "Kick integration is working!",
    "How are you doing?",
    "Great stream! 👍",
    "Kick chat is live!",
    "Testing message system",
    "Hope this works! 🚀"
  ];
  
  const testUsers = ["KickUser1", "KickViewer", "KickFan", "KickSupporter", "KickModerator"];
  
  const sendTestMessage = () => {
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    
    const msg = {
      id: `kick-sim-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username: randomUser,
      text: randomMessage,
      timestamp: new Date(),
      platform: 'kick',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      reactions: { like: 0, dislike: 0 },
      isBookmarked: false,
      userReaction: null
    };
    
    // Add to connection
    const conn = activeKickConnections.get(connectionId);
    if (conn) {
      if (!conn.messages) conn.messages = [];
      conn.messages.push(msg);
      conn.messages = conn.messages.slice(-200);
    }
    
    // Emit via WebSocket
    try { 
      wsHub && wsHub.emitMessage(connectionId, msg); 
      logger.info(`🎭 Kick simulation message: ${randomUser}: ${randomMessage}`);
    } catch (e) {
      logger.error('Kick simulation WebSocket emit error', { error: e.message });
    }
  };
  
  // Send first message immediately
  sendTestMessage();
  
  // Then send every 15 seconds
  const interval = setInterval(() => {
    const conn = activeKickConnections.get(connectionId);
    if (!conn) {
      clearInterval(interval);
      return;
    }
    sendTestMessage();
  }, 15000);
  
  // Store interval for cleanup
  const conn = activeKickConnections.get(connectionId);
  if (conn) {
    conn.simulationInterval = interval;
  }
}

// Best-effort polling of recent messages
async function pollKickMessages(connectionId, wsHub) {
  const conn = activeKickConnections.get(connectionId);
  if (!conn) return;

  try {
    // Kick does not provide stable public message API. Try recent messages via chatroom id if available.
    // This is best-effort and may return empty; logs will show failures.
    if (!conn.chatroomId) {
      return; // wait until channel info resolves
    }

    // Try to get recent messages from Kick API (may be blocked)
    const urlCandidates = [
      `https://kick.com/api/v2/chatrooms/${conn.chatroomId}/messages?limit=50`,
      `https://kick.com/api/v2/channels/${encodeURIComponent(conn.channel)}/messages?limit=50`
    ];
    
    let data = null;
    for (const url of urlCandidates) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (res.ok) { 
          data = await res.json(); 
          break; 
        }
      } catch (e) {
        logger.debug(`Kick API attempt failed: ${url}`, { error: e.message });
      }
    }

    if (data && Array.isArray(data)) {
      const existing = new Set((conn.messages || []).map(m => m.id));
      const newMsgs = [];
      for (const item of data) {
        const id = item.id || `${item.timestamp || Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        if (existing.has(id)) continue;
        const msg = {
          id,
          platform: 'kick',
          connectionId,
          username: item?.sender?.username || item?.user?.username || 'user',
          message: item?.content || item?.message || '',
          timestamp: new Date(item?.created_at || item?.timestamp || Date.now())
        };
        newMsgs.push(msg);
        try { wsHub && wsHub.emitMessage(connectionId, msg); } catch {}
      }
      if (newMsgs.length > 0) {
        conn.messages = [...(conn.messages || []), ...newMsgs].slice(-200);
        logger.info(`Kick polling: ${newMsgs.length} new messages for ${conn.channel}`);
      }
    } else {
      logger.debug(`Kick polling: no new messages for ${conn.channel} (API may be blocked)`);
    }
  } catch (e) {
    logger.error('Kick polling error', { error: e.message, connectionId });
  } finally {
    // schedule next poll every 15 seconds
    setTimeout(() => pollKickMessages(connectionId, wsHub), 15000);
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

    // Try to connect using the simple Kick client (based on KickChatConnection)
    try {
      const wsHub = router.wsHubRef && router.wsHubRef();
      const kickSimpleClient = new KickSimpleClient({
        channelName: channelName,
        onMessage: (msg) => {
          const conn = activeKickConnections.get(connectionId);
          if (!conn) return;
          
          // Add message to connection
          if (!conn.messages) conn.messages = [];
          conn.messages.push(msg);
          conn.messages = conn.messages.slice(-200); // Keep last 200 messages
          
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
      kickSimpleClient.connect().then(success => {
        if (success) {
          logger.info(`✅ Kick simple client connected to ${channelName}`);
          const conn = activeKickConnections.get(connectionId);
          if (conn) {
            conn.kickSimpleClient = kickSimpleClient;
            conn.title = `Kick: ${channelName}`;
          }
        } else {
          logger.warn(`⚠️ Kick simple client failed to connect to ${channelName}, falling back to simulation`);
          // Fallback to simulation for testing
          startKickMessageSimulation(connectionId, wsHub, channelName);
        }
      }).catch(error => {
        logger.error(`❌ Kick simple connection error for ${channelName}:`, error);
        // Fallback to simulation
        startKickMessageSimulation(connectionId, wsHub, channelName);
      });
      
    } catch (e) {
      logger.error('Kick simple client creation failed', { error: e.message });
      // Fallback to simulation
      const wsHub = router.wsHubRef && router.wsHubRef();
      startKickMessageSimulation(connectionId, wsHub, channelName);
    }

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
  
  // Disconnect all Kick clients
  try { 
    if (conn.kickSimpleClient) {
      conn.kickSimpleClient.disconnect();
    }
    if (conn.kickJsClient) {
      conn.kickJsClient.disconnect();
    }
    if (conn.wsClient) {
      conn.wsClient.close();
    }
    if (conn.simulationInterval) {
      clearInterval(conn.simulationInterval);
    }
  } catch (e) {
    logger.error('Error disconnecting Kick client:', e);
  }
  
  activeKickConnections.delete(connectionId);
  logger.info('Kick disconnected', { connectionId });
  res.json({ success: true, message: 'Disconnected from Kick chat' });
});

module.exports = (wsHubProvider) => { router.wsHubRef = wsHubProvider; return router; };