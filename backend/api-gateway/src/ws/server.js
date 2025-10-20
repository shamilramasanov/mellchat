const http = require('http');
const WebSocket = require('ws');
const logger = require('../utils/logger');

// Simple WS hub with per-connectionId subscriptions
class WsHub {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.subscribers = new Map(); // connectionId -> Set(ws)

    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw);
          if (msg.type === 'subscribe' && msg.connectionId) {
            const set = this.subscribers.get(msg.connectionId) || new Set();
            set.add(ws);
            this.subscribers.set(msg.connectionId, set);
          } else if (msg.type === 'unsubscribe' && msg.connectionId) {
            const set = this.subscribers.get(msg.connectionId);
            if (set) { set.delete(ws); if (set.size === 0) this.subscribers.delete(msg.connectionId); }
          } else if (msg.type === 'ping') {
            // client keepalive
          }
        } catch (e) {
          logger.error('WS message parse error', { error: e.message });
        }
      });

      ws.on('close', () => {
        // cleanup from all subscriptions
        for (const set of this.subscribers.values()) set.delete(ws);
      });
    });

    // Heartbeat
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false; ws.ping();
      });
    }, 30000);
    interval.unref();
  }

  emitMessage(connectionId, payload) {
    const set = this.subscribers.get(connectionId);
    if (!set || set.size === 0) return;
    const data = JSON.stringify({ type: 'message', connectionId, payload });
    for (const ws of set) {
      try { ws.send(data); } catch {}
    }
  }
}

function createWsServer(port = 8080) {
  const server = http.createServer();
  const hub = new WsHub(server);
  server.listen(port, () => logger.info(`WebSocket server listening on ws://localhost:${port}`));
  return hub;
}

module.exports = { createWsServer };


