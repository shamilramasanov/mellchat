const http = require('http');
const WebSocket = require('ws');
const logger = require('../utils/logger');
const messageHandler = require('../handlers/messageHandler');
const sentimentService = require('../services/sentimentService');

// Simple WS hub with per-connectionId subscriptions
class WsHub {
  constructor(server, options = {}) {
    this.wss = new WebSocket.Server({ server, ...options });
    this.subscribers = new Map(); // connectionId -> Set(ws)
    this.lastActivity = new Map(); // connectionId -> timestamp
    this.adminSubscribers = new Set(); // WebSocket connections for admin panel

    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });
      
      // Сохраняем userId если он передается при подключении
      // Можно добавить через headers или initial message
      ws.userId = null; // Будет установлен через специальное сообщение или headers
      ws.userSessions = new Set(); // Храним все connectionId, на которые подписан этот пользователь

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw);
          if (msg.type === 'subscribe' && msg.connectionId) {
            const set = this.subscribers.get(msg.connectionId) || new Set();
            set.add(ws);
            this.subscribers.set(msg.connectionId, set);
            this.lastActivity.set(msg.connectionId, Date.now());
            logger.info(`Client subscribed to ${msg.connectionId}, total subscribers: ${set.size}`);
            
            // Сохраняем userId если он передается в сообщении
            if (msg.userId) {
              ws.userId = msg.userId;
              ws.userSessions.add(msg.connectionId);
            }
          } else if (msg.type === 'unsubscribe' && msg.connectionId) {
            const set = this.subscribers.get(msg.connectionId);
            if (set) { 
              set.delete(ws); 
              if (set.size === 0) this.subscribers.delete(msg.connectionId); 
              logger.info(`Client unsubscribed from ${msg.connectionId}`);
            }
            
            if (ws.userSessions) {
              ws.userSessions.delete(msg.connectionId);
            }
          } else if (msg.type === 'admin:subscribe') {
            // Админ подписка на метрики
            this.adminSubscribers.add(ws);
            logger.info(`Admin client subscribed, total admin subscribers: ${this.adminSubscribers.size}`);
          } else if (msg.type === 'admin:unsubscribe') {
            // Админ отписка
            this.adminSubscribers.delete(ws);
            logger.info(`Admin client unsubscribed, total admin subscribers: ${this.adminSubscribers.size}`);
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
        // Очищаем админ подписку
        this.adminSubscribers.delete(ws);
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
    
    // Mood updates - отключен автоматический broadcast
    // Теперь отправляем только когда реально меняется настроение
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
    
    // Проверяем блокировку пользователя перед обработкой сообщения
    try {
      const adminRoutes = require('../admin/routes/adminRoutes');
      const blockedUsers = adminRoutes.blockedUsers || new Map();
      
      // Извлекаем userId из сообщения (может быть username или userId)
      const userId = payload.userId || payload.username;
      
      // Если пользователь заблокирован, не обрабатываем сообщение
      if (userId && blockedUsers.has(userId)) {
        logger.debug(`🚫 Message from blocked user ${userId} filtered`);
        return;
      }
    } catch (error) {
      logger.error('Error checking user block status:', error);
      // Продолжаем обработку сообщения в случае ошибки проверки
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

  // Отправка метрик админ панели
  async broadcastAdminMetrics(metrics) {
    if (this.adminSubscribers.size === 0) return;

    try {
      const data = JSON.stringify({ 
        type: 'admin:metrics', 
        data: metrics,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Broadcasting admin metrics to ${this.adminSubscribers.size} admin subscribers`);
      for (const ws of this.adminSubscribers) {
        try { 
          ws.send(data); 
        } catch (e) { 
          logger.error('Admin WS send error:', e.message);
          this.adminSubscribers.delete(ws);
        }
      }
    } catch (error) {
      logger.error('Error broadcasting admin metrics:', error.message);
    }
  }

  // Отправка сообщения от админа конкретному пользователю
  async sendAdminMessageToUser(userId, message) {
    const adminMessage = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username: 'admin',
      text: message,
      content: message,
      timestamp: Date.now(),
      platform: 'admin',
      isAdmin: true,
      isQuestion: false,
      sentiment: 'neutral'
    };

    // Ищем все WebSocket соединения этого пользователя
    let sentCount = 0;
    const userConnectionIds = new Set();

    // Проходим по всем подпискам и ищем connectionId пользователя
    for (const [connectionId, wsSet] of this.subscribers.entries()) {
      for (const ws of wsSet) {
        if (ws.userId === userId && ws.readyState === WebSocket.OPEN) {
          userConnectionIds.add(connectionId);
        }
      }
    }

    // Если userId не найден через ws.userId, пытаемся найти через список подключенных пользователей
    // (это fallback - основная идентификация должна быть через ws.userId)
    if (userConnectionIds.size === 0) {
      // Используем альтернативный метод - ищем по IP/UserAgent или другим признакам
      // Пока используем простой подход - отправляем на все connectionId из списка пользователя
      logger.warn(`User ${userId} not found via ws.userId, trying alternative method`);
    }

    // Отправляем сообщение на все найденные connectionId пользователя
    for (const connectionId of userConnectionIds) {
      const wsSet = this.subscribers.get(connectionId);
      if (wsSet) {
        for (const ws of wsSet) {
          if (ws.userId === userId && ws.readyState === WebSocket.OPEN) {
            try {
              const connectionData = JSON.stringify({ 
                type: 'message', 
                connectionId, 
                payload: adminMessage 
              });
              ws.send(connectionData);
              sentCount++;
            } catch (e) {
              logger.error('Admin personal message WS send error:', e.message);
            }
          }
        }
      }
    }

    logger.info(`📬 Admin message sent to user ${userId}: ${sentCount} messages delivered`);
    return { success: true, sentCount };
  }

  // Отправка сообщения от админа всем подключенным пользователям
  async broadcastAdminMessage(message) {
    const adminMessage = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username: 'admin',
      text: message,
      content: message,
      timestamp: Date.now(),
      platform: 'admin',
      isAdmin: true,
      isQuestion: false,
      sentiment: 'neutral'
    };

    const data = JSON.stringify({ 
      type: 'admin:message', 
      payload: adminMessage,
      timestamp: new Date().toISOString()
    });

    // Отправляем всем подписчикам всех подключений
    let sentCount = 0;
    for (const [connectionId, wsSet] of this.subscribers.entries()) {
      for (const ws of wsSet) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            const connectionData = JSON.stringify({ 
              type: 'message', 
              connectionId, 
              payload: adminMessage 
            });
            ws.send(connectionData);
            sentCount++;
          } catch (e) {
            logger.error('Admin message WS send error:', e.message);
          }
        }
      }
    }

    logger.info(`📢 Admin message broadcast to ${sentCount} clients`);
    return { success: true, sentCount };
  }

  // Отправка алертов админ панели
  broadcastAdminAlert(alert) {
    if (this.adminSubscribers.size === 0) return;

    const data = JSON.stringify({ 
      type: 'admin:alert', 
      data: {
        ...alert,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`Broadcasting admin alert to ${this.adminSubscribers.size} admin subscribers`);
    for (const ws of this.adminSubscribers) {
      try { 
        ws.send(data); 
      } catch (e) { 
        logger.error('Admin alert WS send error:', e.message);
        this.adminSubscribers.delete(ws);
      }
    }
  }

  // Получение статистики WebSocket
  getStats() {
    return {
      totalClients: this.wss.clients.size,
      activeSubscriptions: this.subscribers.size,
      adminSubscribers: this.adminSubscribers.size,
      lastActivity: Object.fromEntries(this.lastActivity)
    };
  }
}

function createWsServer(httpServer) {
  logger.info('Creating WebSocket server...');
  
  try {
    // Настройка WebSocket сервера с поддержкой Railway
    const wssOptions = {
      server: httpServer,
      path: '/ws', // Добавляем путь для WebSocket
      perMessageDeflate: false, // Отключаем сжатие для лучшей совместимости
    };
    
    const hub = new WsHub(httpServer, wssOptions);
    logger.info(`✅ WebSocket server attached to HTTP server on /ws path`);
    
    // Периодическая отправка метрик админ панели каждые 30 секунд
    const metricsInterval = setInterval(async () => {
      try {
        // Ленивая загрузка adminMetricsService
        if (!global.adminMetricsService) {
          global.adminMetricsService = require('../services/adminMetricsService');
        }
        
        if (global.adminMetricsService) {
          const metrics = await global.adminMetricsService.getAllMetrics();
          await hub.broadcastAdminMetrics(metrics);
        }
      } catch (error) {
        logger.error('Error in metrics interval:', error.message);
      }
    }, 30000);
    metricsInterval.unref();
    
    return hub;
  } catch (error) {
    logger.error('❌ Failed to create WebSocket server:', error);
    throw error;
  }
}

module.exports = { createWsServer };

