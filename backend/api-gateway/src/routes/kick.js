const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const KickWsClient = require('../services/kickWsClient');

// In-memory connections: connectionId -> state
const activeKickConnections = new Map();

// Try to fetch channel info from Kick public API
async function fetchKickChannel(channel) {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channel)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    logger.error('Kick fetch channel failed', { error: e.message, channel });
    return null;
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

    // Hypothetical endpoint (can change). We keep best-effort and avoid crashing.
    // If endpoint fails, we just skip.
    const urlCandidates = [
      `https://kick.com/api/v2/chatrooms/${conn.chatroomId}/messages?limit=50`,
      `https://kick.com/api/v2/channels/${encodeURIComponent(conn.channel)}/messages?limit=50`
    ];
    let data = null;
    for (const url of urlCandidates) {
      try {
        const res = await fetch(url);
        if (res.ok) { data = await res.json(); break; }
      } catch {}
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
      }
    }
  } catch (e) {
    logger.error('Kick polling error', { error: e.message, connectionId });
  } finally {
    // schedule next poll
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


