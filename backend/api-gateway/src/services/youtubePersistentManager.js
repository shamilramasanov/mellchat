const { google } = require('googleapis');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const redis = require('./redisService');

class YouTubePersistentManager extends EventEmitter {
  constructor() {
    super();
    this.youtube = google.youtube('v3');
    this.connections = new Map(); // videoId -> connection state
    this.pollingTimers = new Map(); // videoId -> timerId
    this.messagesCache = new Map(); // videoId -> last N messages

    // API Keys rotation
    this.apiKeys = [
      process.env.YOUTUBE_API_KEY,
      process.env.YOUTUBE_API_KEY_1,
      process.env.YOUTUBE_API_KEY_2,
      process.env.YOUTUBE_API_KEY_3
    ].filter(Boolean);
    
    this.currentKeyIndex = 0;
    this.keyUsageStats = new Map(); // key -> { calls: number, lastUsed: timestamp, quotaExceeded: boolean }

    // API Usage Tracking
    this.apiCallCount = 0;
    this.apiCallStartTime = Date.now();
    this.lastApiCallTime = null;

    // Config
    this.POLL_INTERVAL = 30000; // 30 seconds - более частый polling
    this.MIN_POLL_INTERVAL = 15000; // 15 seconds minimum
    this.RETRY_INTERVAL = 5000; // 5 seconds
    this.MAX_RETRIES = 10; // больше попыток
    this.API_TIMEOUT = 30000; // 30 seconds timeout для API вызовов
    this.STATE_KEY_PREFIX = 'youtube:connection:';
    this.STATE_TTL_SECONDS = 3600; // 1 hour

    // Restore connections on startup (async, after Redis connects)
    setTimeout(() => {
      this.restoreConnections().catch(err => {
        logger.error('Failed to restore connections on startup:', err);
      });
    }, 1000);
    
    // Периодический health check каждые 5 минут
    setInterval(async () => {
      try {
        const health = await this.healthCheck();
        if (!health.healthy) {
          logger.warn('YouTube connections health issues:', health.issues);
        }
      } catch (err) {
        logger.error('Health check failed:', err);
      }
    }, 5 * 60 * 1000); // 5 минут
    
    // Сброс квоты API ключей каждые 30 минут
    setInterval(() => {
      try {
        this.resetQuotaStatus();
      } catch (err) {
        logger.error('Quota reset failed:', err);
      }
    }, 30 * 60 * 1000); // 30 минут
  }

  // Get current API key
  getCurrentApiKey() {
    if (this.apiKeys.length === 0) {
      throw new Error('No YouTube API keys configured');
    }
    return this.apiKeys[this.currentKeyIndex];
  }

  // Новый метод для API вызовов с retry логикой
  async makeApiCallWithRetry(apiCall, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Добавляем timeout для API вызова
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API call timeout')), this.API_TIMEOUT);
        });
        
        const result = await Promise.race([apiCall(), timeoutPromise]);
        return result;
        
      } catch (error) {
        lastError = error;
        logger.warn(`API call attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        // Если это ошибка квоты, сразу переключаемся на следующий ключ
        if (error.message && error.message.includes('quota')) {
          this.markKeyQuotaExceeded();
          logger.warn('API quota exceeded, switching to next key');
        }
        
        // Если это не последняя попытка, ждем перед retry
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Switch to next API key
  switchToNextKey() {
    const oldKey = this.getCurrentApiKey();
    const oldIndex = this.currentKeyIndex;
    
    // Ищем следующий доступный ключ
    let attempts = 0;
    do {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      attempts++;
      
      if (attempts >= this.apiKeys.length) {
        logger.error('All API keys are exhausted, resetting to first key');
        this.currentKeyIndex = 0;
        break;
      }
    } while (this.isKeyQuotaExceeded(this.getCurrentApiKey()));
    
    const newKey = this.getCurrentApiKey();
    logger.warn(`Switching YouTube API key from ${oldKey.substring(0, 10)}... to ${newKey.substring(0, 10)}... (index ${oldIndex} -> ${this.currentKeyIndex})`);
    return newKey;
  }

  // Check if key has quota exceeded
  isKeyQuotaExceeded(key) {
    const stats = this.keyUsageStats.get(key);
    return stats && stats.quotaExceeded;
  }

  // Mark current key as quota exceeded
  markKeyQuotaExceeded() {
    const currentKey = this.getCurrentApiKey();
    const stats = this.keyUsageStats.get(currentKey) || { calls: 0, lastUsed: Date.now(), quotaExceeded: false };
    stats.quotaExceeded = true;
    stats.lastUsed = Date.now();
    this.keyUsageStats.set(currentKey, stats);
    
    logger.error(`YouTube API key quota exceeded: ${currentKey.substring(0, 10)}...`);
    
    // Try to switch to next key
    if (this.apiKeys.length > 1) {
      this.switchToNextKey();
    }
  }

  // Track API calls and get usage statistics
  trackApiCall() {
    this.apiCallCount++;
    this.lastApiCallTime = Date.now();
    
    // Track per-key usage
    const currentKey = this.getCurrentApiKey();
    const keyStats = this.keyUsageStats.get(currentKey) || { calls: 0, lastUsed: 0, quotaExceeded: false };
    keyStats.calls++;
    keyStats.lastUsed = Date.now();
    this.keyUsageStats.set(currentKey, keyStats);
    
    // Log every 10 calls
    if (this.apiCallCount % 10 === 0) {
      const timeElapsed = (Date.now() - this.apiCallStartTime) / 1000 / 60; // minutes
      const callsPerMinute = this.apiCallCount / timeElapsed;
      const estimatedDailyCalls = callsPerMinute * 60 * 24;
      
      logger.info(`YouTube API Usage Stats`, {
        totalCalls: this.apiCallCount,
        timeElapsedMinutes: Math.round(timeElapsed),
        callsPerMinute: Math.round(callsPerMinute),
        estimatedDailyCalls: Math.round(estimatedDailyCalls),
        quotaLimit: 10000,
        quotaUsedPercent: Math.round((estimatedDailyCalls / 10000) * 100),
        currentKey: currentKey.substring(0, 10) + '...',
        keyCalls: keyStats.calls,
        availableKeys: this.apiKeys.length - Array.from(this.keyUsageStats.values()).filter(s => s.quotaExceeded).length
      });
    }
  }

  // Reset quota for all keys (call this periodically)
  resetQuotaStatus() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    let resetCount = 0;
    
    for (const [key, stats] of this.keyUsageStats.entries()) {
      // Сбрасываем статус квоты если прошло больше часа
      if (stats.quotaExceeded && (now - stats.lastUsed) > oneHour) {
        stats.quotaExceeded = false;
        stats.calls = 0;
        resetCount++;
        logger.info(`Reset quota status for API key ${key.substring(0, 10)}...`);
      }
    }
    
    if (resetCount > 0) {
      logger.info(`Reset quota status for ${resetCount} API keys`);
    }
  }

  getApiUsageStats() {
    const timeElapsed = (Date.now() - this.apiCallStartTime) / 1000 / 60; // minutes
    const callsPerMinute = timeElapsed > 0 ? this.apiCallCount / timeElapsed : 0;
    const estimatedDailyCalls = callsPerMinute * 60 * 24;
    
    return {
      totalCalls: this.apiCallCount,
      timeElapsedMinutes: Math.round(timeElapsed),
      callsPerMinute: Math.round(callsPerMinute),
      estimatedDailyCalls: Math.round(estimatedDailyCalls),
      quotaLimit: 10000 * this.apiKeys.length, // Total quota across all keys
      quotaUsedPercent: Math.round((estimatedDailyCalls / (10000 * this.apiKeys.length)) * 100),
      lastApiCallTime: this.lastApiCallTime,
      currentKeyIndex: this.currentKeyIndex,
      totalKeys: this.apiKeys.length,
      keyStats: Array.from(this.keyUsageStats.entries()).map(([key, stats]) => ({
        key: key.substring(0, 10) + '...',
        calls: stats.calls,
        quotaExceeded: stats.quotaExceeded,
        lastUsed: stats.lastUsed
      }))
    };
  }

  async saveConnectionState(videoId, state) {
    try {
      const key = `${this.STATE_KEY_PREFIX}${videoId}`;
      const payload = JSON.stringify({
        videoId,
        liveChatId: state.liveChatId,
        url: state.url,
        title: state.title,
        channelName: state.channelName,
        isLive: state.isLive,
        connectedAt: state.connectedAt,
        lastMessageId: state.lastMessageId,
        nextPageToken: state.nextPageToken,
        lastPollAt: Date.now()
      });
      await redis.set(key, payload, this.STATE_TTL_SECONDS);
      logger.debug(`Saved connection state for ${videoId}`);
    } catch (error) {
      logger.error(`Failed to save connection state for ${videoId}:`, error);
    }
  }

  async loadConnectionState(videoId) {
    try {
      const key = `${this.STATE_KEY_PREFIX}${videoId}`;
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
      return null;
    } catch (error) {
      logger.error(`Failed to load connection state for ${videoId}:`, error);
      return null;
    }
  }

  async deleteConnectionState(videoId) {
    try {
      const key = `${this.STATE_KEY_PREFIX}${videoId}`;
      await redis.del(key);
      logger.debug(`Deleted connection state for ${videoId}`);
    } catch (error) {
      logger.error(`Failed to delete connection state for ${videoId}:`, error);
    }
  }

  async restoreConnections() {
    try {
      const pattern = `${this.STATE_KEY_PREFIX}*`;
      const keys = (await redis.keys(pattern)) || [];
      logger.info(`Found ${keys.length} YouTube connections to restore`);
      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (!data) continue;
          const state = JSON.parse(data);
          const videoId = state.videoId;
          const age = Date.now() - (state.lastPollAt || state.connectedAt || 0);
          if (age > 600000) { // 10 minutes
            logger.info(`Connection ${videoId} too old, skipping restore`);
            await this.deleteConnectionState(videoId);
            continue;
          }
          logger.info(`Restoring YouTube connection: ${videoId}`);
          await this.connect(videoId, state.url, true);
        } catch (err) {
          logger.error('Failed to restore a connection:', err);
        }
      }
    } catch (error) {
      logger.error('Failed to restore connections:', error);
    }
  }

  async connect(videoId, url, isRestore = false) {
    if (this.connections.has(videoId)) {
      logger.warn(`Already connected to ${videoId}`);
      return this.connections.get(videoId);
    }
    try {
      const videoInfo = await this.getVideoInfo(videoId);
      if (!videoInfo.isLive) throw new Error('Video is not live');
      const connection = {
        videoId,
        liveChatId: videoInfo.liveChatId,
        url,
        title: videoInfo.title,
        channelName: videoInfo.channelName,
        isLive: true,
        connectedAt: Date.now(),
        lastMessageId: null,
        nextPageToken: null,
        pollingInterval: this.POLL_INTERVAL,
        retries: 0,
        messageCount: 0
      };
      this.connections.set(videoId, connection);
      await this.saveConnectionState(videoId, connection);
      this.startPolling(videoId);
      if (!isRestore) this.emit('connected', { videoId, connection });
      logger.info(`Connected to YouTube: ${videoId} (${connection.title})`);
      return connection;
    } catch (error) {
      logger.error(`Failed to connect to YouTube ${videoId}:`, error);
      throw error;
    }
  }

  async getVideoInfo(videoId) {
    try {
      this.trackApiCall();
      const response = await this.youtube.videos.list({
        key: this.getCurrentApiKey(),
        part: 'snippet,liveStreamingDetails',
        id: videoId
      });
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }
      const video = response.data.items[0];
      const liveChatId = video.liveStreamingDetails?.activeLiveChatId;
      if (!liveChatId) throw new Error('No active live chat found');
      return {
        videoId,
        liveChatId,
        title: video.snippet.title,
        channelName: video.snippet.channelTitle,
        isLive: video.snippet.liveBroadcastContent === 'live'
      };
    } catch (error) {
      if (error.message && error.message.includes('quota')) {
        this.markKeyQuotaExceeded();
        // Retry with next key if available
        if (this.apiKeys.length > 1) {
          logger.info(`Retrying with next API key for video: ${videoId}`);
          return this.getVideoInfo(videoId);
        }
      }
      throw error;
    }
  }

  startPolling(videoId) {
    const connection = this.connections.get(videoId);
    if (!connection) return;
    
    // Очищаем существующий таймер если есть
    const existingTimer = this.pollingTimers.get(videoId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const poll = async () => {
      try {
        await this.pollMessages(videoId);
        connection.retries = 0;
        
        // Используем динамический интервал polling
        const nextPollDelay = connection.pollingInterval || this.POLL_INTERVAL;
        const timer = setTimeout(poll, nextPollDelay);
        this.pollingTimers.set(videoId, timer);
        
        await this.saveConnectionState(videoId, connection);
        
      } catch (error) {
        logger.error(`Polling error for ${videoId}:`, error);
        connection.retries = (connection.retries || 0) + 1;
        
        if (connection.retries >= this.MAX_RETRIES) {
          logger.error(`Max retries reached for ${videoId}, disconnecting`);
          await this.disconnect(videoId, 'max_retries');
          return;
        }
        
        // Exponential backoff с jitter для избежания thundering herd
        const baseDelay = this.RETRY_INTERVAL * Math.pow(2, connection.retries - 1);
        const jitter = Math.random() * 1000; // до 1 секунды jitter
        const retryDelay = Math.min(baseDelay + jitter, 60000); // max 60 секунд
        
        logger.info(`Retrying ${videoId} in ${Math.round(retryDelay)}ms (attempt ${connection.retries})`);
        const timer = setTimeout(poll, retryDelay);
        this.pollingTimers.set(videoId, timer);
      }
    };
    
    // Запускаем polling немедленно
    poll();
  }

  async pollMessages(videoId) {
    const connection = this.connections.get(videoId);
    if (!connection) return;
    
    try {
      this.trackApiCall();
      
      // Добавляем timeout и retry логику для API вызовов
      const response = await this.makeApiCallWithRetry(async () => {
        return await this.youtube.liveChatMessages.list({
        key: this.getCurrentApiKey(),
        liveChatId: connection.liveChatId,
        part: 'snippet,authorDetails',
        pageToken: connection.nextPageToken
        });
      });
    connection.nextPageToken = response.data.nextPageToken;
    // Use API-provided interval, but enforce minimum to avoid quota issues
    const apiInterval = response.data.pollingIntervalMillis || this.POLL_INTERVAL;
    connection.pollingInterval = Math.max(apiInterval, this.MIN_POLL_INTERVAL);
    const items = response.data.items || [];
    const buffer = this.messagesCache.get(videoId) || [];
    for (const item of items) {
      if (connection.lastMessageId && item.id <= connection.lastMessageId) continue;
      const message = {
        id: item.id,
        platform: 'youtube',
        channel: videoId,
        username: item.authorDetails.displayName,
        message: item.snippet.displayMessage,
        timestamp: new Date(item.snippet.publishedAt).getTime(),
        avatar: item.authorDetails.profileImageUrl,
        isModerator: item.authorDetails.isChatModerator,
        isSponsor: item.authorDetails.isChatSponsor,
        isOwner: item.authorDetails.isChatOwner
      };
      connection.messageCount++;
      // buffer and emit
      buffer.push(message);
      if (buffer.length > 200) buffer.shift();
      this.emit('message', message);
    }
    this.messagesCache.set(videoId, buffer);
    if (items.length > 0) {
      connection.lastMessageId = items[items.length - 1].id;
    }
    
    // Сбрасываем счетчик ошибок при успешном polling
    if (connection) {
      connection.errorCount = 0;
      connection.lastPollAt = Date.now();
    }
    } catch (error) {
        logger.error(`Error polling messages for ${videoId}:`, error);
      
      // Увеличиваем счетчик ошибок для соединения
      if (connection) {
        connection.errorCount = (connection.errorCount || 0) + 1;
        connection.lastError = error.message;
        connection.lastErrorAt = Date.now();
      }
      
      // Если слишком много ошибок подряд, отключаем соединение
      if (connection && connection.errorCount > 5) {
        logger.error(`Too many errors for ${videoId}, disconnecting`);
        await this.disconnect(videoId, 'too_many_errors');
        return;
      }
      
      // Не выбрасываем ошибку, чтобы polling продолжился
      logger.warn(`Continuing polling for ${videoId} despite error`);
    }
  }

  async disconnect(videoId, reason = 'user_request') {
    const connection = this.connections.get(videoId);
    if (!connection) {
      logger.warn(`Connection not found: ${videoId}`);
      return;
    }
    logger.info(`Disconnecting from YouTube ${videoId}, reason: ${reason}`);
    const timer = this.pollingTimers.get(videoId);
    if (timer) {
      clearTimeout(timer);
      this.pollingTimers.delete(videoId);
    }
    this.connections.delete(videoId);
    await this.deleteConnectionState(videoId);
    this.emit('disconnected', { videoId, reason });
  }

  async disconnectAll() {
    logger.info(`Disconnecting all YouTube connections (${this.connections.size})`);
    const videoIds = Array.from(this.connections.keys());
    await Promise.all(videoIds.map(id => this.disconnect(id, 'shutdown')));
  }

  getConnection(videoId) { return this.connections.get(videoId); }
  getAllConnections() { return Array.from(this.connections.values()); }
  getMessages(videoId) { return this.messagesCache.get(videoId) || []; }

  async healthCheck() {
    const connections = Array.from(this.connections.values());
    const issues = [];
    
    for (const conn of connections) {
      const now = Date.now();
      const timeSinceLastPoll = now - (conn.lastPollAt || conn.connectedAt);
      const expectedInterval = (conn.pollingInterval || this.POLL_INTERVAL) * 2; // 2x интервал для tolerance
      
      // Проверяем stalled polling
      if (timeSinceLastPoll > expectedInterval) {
        issues.push({ 
          videoId: conn.videoId, 
          issue: 'stalled_polling', 
          timeSinceLastPoll: Math.round(timeSinceLastPoll / 1000) + 's',
          expectedInterval: Math.round(expectedInterval / 1000) + 's'
        });
        logger.warn(`Restarting stalled polling for ${conn.videoId} (${Math.round(timeSinceLastPoll / 1000)}s since last poll)`);
        this.startPolling(conn.videoId);
      }
      
      // Проверяем слишком много ошибок
      if (conn.errorCount > 3) {
        issues.push({ 
          videoId: conn.videoId, 
          issue: 'high_error_count', 
          errorCount: conn.errorCount,
          lastError: conn.lastError
        });
      }
      
      // Проверяем старые соединения без активности
      const timeSinceConnected = now - conn.connectedAt;
      if (timeSinceConnected > 24 * 60 * 60 * 1000 && conn.messageCount === 0) { // 24 часа без сообщений
        issues.push({ 
          videoId: conn.videoId, 
          issue: 'inactive_connection', 
          timeSinceConnected: Math.round(timeSinceConnected / (60 * 60 * 1000)) + 'h'
        });
      }
    }
    
    return { 
      healthy: issues.length === 0, 
      connections: connections.length, 
      issues,
      stats: {
        totalConnections: connections.length,
        activeConnections: connections.filter(c => c.errorCount < 3).length,
        errorConnections: connections.filter(c => c.errorCount >= 3).length
      }
    };
  }
}

const youtubeManager = new YouTubePersistentManager();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, disconnecting YouTube connections...');
  await youtubeManager.disconnectAll();
});
process.on('SIGINT', async () => {
  logger.info('SIGINT received, disconnecting YouTube connections...');
  await youtubeManager.disconnectAll();
});
setInterval(async () => {
  try {
    const health = await youtubeManager.healthCheck();
    if (!health.healthy) logger.warn('YouTube manager health check failed:', health.issues);
  } catch {}
}, 60000).unref();

module.exports = youtubeManager;

