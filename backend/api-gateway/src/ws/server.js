const http = require('http');
const WebSocket = require('ws');
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');
const sentimentService = require('../services/sentimentService');

// Simple WS hub with per-connectionId subscriptions
class WsHub {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.subscribers = new Map(); // connectionId -> Set(ws)
    this.lastActivity = new Map(); // connectionId -> timestamp

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
            this.lastActivity.set(msg.connectionId, Date.now());
            logger.info(`Client subscribed to ${msg.connectionId}, total subscribers: ${set.size}`);
          } else if (msg.type === 'unsubscribe' && msg.connectionId) {
            const set = this.subscribers.get(msg.connectionId);
            if (set) { 
              set.delete(ws); 
              if (set.size === 0) this.subscribers.delete(msg.connectionId); 
              logger.info(`Client unsubscribed from ${msg.connectionId}`);
            }
          } else if (msg.type === 'ping') {
            // client keepalive - обновляем активность
            if (msg.connectionId) {
              this.lastActivity.set(msg.connectionId, Date.now());
            }
          }
        } catch (e) {
          logger.error('WS message parse error', { error: e.message });
        }
      });

      ws.on('close', () => {
        // cleanup from all subscriptions
        for (const set of this.subscribers.values()) set.delete(ws);
        // Очищаем активность при закрытии соединения
        for (const [connectionId, set] of this.subscribers.entries()) {
          if (set.size === 0) {
            this.lastActivity.delete(connectionId);
          }
        }
      });
    });

    // Heartbeat
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false; ws.ping();
      });
      
      // Проверяем неактивные соединения каждые 30 секунд
      this.checkInactiveConnections();
    }, 30000);
    interval.unref();
    
    // Mood updates broadcast каждые 2 секунды
    const moodInterval = setInterval(() => {
      this.broadcastMoodUpdates();
    }, 2000);
    moodInterval.unref();
  }
  
  // Broadcast mood updates to all connected clients
  broadcastMoodUpdates() {
    const moodStats = sentimentService.getMoodStats();
    
    logger.info('🎭 Mood stats:', moodStats);
    
    if (moodStats.total === 0) return; // No data yet
    
    const data = JSON.stringify({
      type: 'mood_update',
      data: moodStats
    });
    
    // Send to all connected WebSocket clients
    let sentCount = 0;
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(data);
          sentCount++;
        } catch (e) {
          logger.error('WS mood broadcast error:', e.message);
        }
      }
    });
    logger.info(`📤 Mood update sent to ${sentCount} clients`);
  }

  checkInactiveConnections() {
    const now = Date.now();
    const inactiveTimeout = 30 * 60 * 1000; // 30 минут
    
    for (const [connectionId, lastActivity] of this.lastActivity.entries()) {
      if (now - lastActivity > inactiveTimeout) {
        logger.info(`Disconnecting inactive stream: ${connectionId}`);
        this.disconnectInactiveStream(connectionId);
      }
    }
  }

  async disconnectInactiveStream(connectionId) {
    // Удаляем из подписчиков
    this.subscribers.delete(connectionId);
    this.lastActivity.delete(connectionId);
    
    // Отключаем соединения платформ
    const platform = connectionId.split('-')[0];
    
    try {
      switch (platform) {
        case 'twitch':
          await this.disconnectTwitchConnection(connectionId);
          break;
        case 'kick':
          await this.disconnectKickConnection(connectionId);
          break;
        case 'youtube':
          await this.disconnectYouTubeConnection(connectionId);
          break;
      }
    } catch (error) {
      logger.error(`Error disconnecting ${platform} connection ${connectionId}:`, error);
    }
  }

  async disconnectTwitchConnection(connectionId) {
    const activeTwitchConnections = require('../routes/twitch').activeTwitchConnections;
    const connection = activeTwitchConnections.get(connectionId);
    
    if (connection && connection.client) {
      await connection.client.disconnect();
      activeTwitchConnections.delete(connectionId);
      logger.info(`Twitch connection ${connectionId} disconnected due to inactivity`);
    }
  }

  async disconnectKickConnection(connectionId) {
    const activeKickConnections = global.activeKickConnections;
    const connection = activeKickConnections.get(connectionId);
    
    if (connection && connection.client) {
      connection.client.disconnect();
      activeKickConnections.delete(connectionId);
      logger.info(`Kick connection ${connectionId} disconnected due to inactivity`);
    }
  }

  async disconnectYouTubeConnection(connectionId) {
    const youtubeManager = require('../services/youtubePersistentManager');
    const videoId = connectionId.split('-')[1];
    
    youtubeManager.stopPolling(videoId);
    logger.info(`YouTube connection ${connectionId} disconnected due to inactivity`);
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
      
      // Добавляем isQuestion, sentiment и isSpam к payload если определилось
      if (result) {
        if (result.isQuestion !== undefined) {
          payload.isQuestion = result.isQuestion;
        }
        if (result.isSpam !== undefined) {
          payload.isSpam = result.isSpam;
        }
        if (result.sentiment) {
          payload.sentiment = result.sentiment;
          logger.info(`📤 WebSocket: sentiment=${payload.sentiment}, isSpam=${payload.isSpam} for ${payload.id}`);
        } else {
          payload.sentiment = 'neutral';
        }
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
      payload.isQuestion = false; // По умолчанию не вопрос
      payload.sentiment = 'neutral'; // По умолчанию neutral
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


