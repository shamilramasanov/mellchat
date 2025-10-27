const http = require('http');
const WebSocket = require('ws');
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');

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
            logger.info(`Client subscribed to ${msg.connectionId}, total subscribers: ${set.size}`);
          } else if (msg.type === 'unsubscribe' && msg.connectionId) {
            const set = this.subscribers.get(msg.connectionId);
            if (set) { 
              set.delete(ws); 
              if (set.size === 0) this.subscribers.delete(msg.connectionId); 
              logger.info(`Client unsubscribed from ${msg.connectionId}`);
            }
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

  async emitMessage(connectionId, payload) {
    const set = this.subscribers.get(connectionId);
    if (!set || set.size === 0) {
      logger.debug(`No subscribers for ${connectionId}, message not sent`);
      return;
    }
    
    // Обрабатываем сообщение через messageHandler
    try {
      logger.debug('WebSocket emitMessage calling messageHandler:', { 
        connectionId, 
        payloadId: payload.id,
        username: payload.username 
      });
      
      const result = await messageHandler.addMessage({
        id: payload.id,
        username: payload.username,
        text: payload.text || payload.content,
        timestamp: payload.timestamp || Date.now(),
        platform: connectionId.split('-')[0] // Извлекаем платформу
      }, connectionId, 'WebSocket Client');
      
      // Добавляем isQuestion к payload если определилось
      if (result && result.isQuestion !== undefined) {
        payload.isQuestion = result.isQuestion;
        logger.debug(`📤 WebSocket payload updated: isQuestion=${payload.isQuestion} for message ${payload.id}`);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
      payload.isQuestion = false; // По умолчанию не вопрос
    }
    
    const data = JSON.stringify({ type: 'message', connectionId, payload });
    logger.debug(`Emitting message to ${set.size} subscribers of ${connectionId}`);
    for (const ws of set) {
      try { ws.send(data); } catch (e) { logger.error('WS send error:', e.message); }
    }
  }
}

function createWsServer(httpServer) {
  const hub = new WsHub(httpServer);
  logger.info(`WebSocket server attached to HTTP server`);
  return hub;
}

module.exports = { createWsServer };


