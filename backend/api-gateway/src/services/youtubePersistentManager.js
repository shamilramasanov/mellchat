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

    // API Usage Tracking
    this.apiCallCount = 0;
    this.apiCallStartTime = Date.now();
    this.lastApiCallTime = null;

    // Config
    this.POLL_INTERVAL = 5000; // 5 seconds
    this.RETRY_INTERVAL = 10000; // 10 seconds
    this.MAX_RETRIES = 5;
    this.STATE_KEY_PREFIX = 'youtube:connection:';
    this.STATE_TTL_SECONDS = 3600; // 1 hour

    // Restore connections on startup
    this.restoreConnections();
  }

  // Track API calls and get usage statistics
  trackApiCall() {
    this.apiCallCount++;
    this.lastApiCallTime = Date.now();
    
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
        quotaUsedPercent: Math.round((estimatedDailyCalls / 10000) * 100)
      });
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
      quotaLimit: 10000,
      quotaUsedPercent: Math.round((estimatedDailyCalls / 10000) * 100),
      lastApiCallTime: this.lastApiCallTime
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
    this.trackApiCall();
    const response = await this.youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
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
  }

  startPolling(videoId) {
    const connection = this.connections.get(videoId);
    if (!connection) return;
    const poll = async () => {
      try {
        await this.pollMessages(videoId);
        connection.retries = 0;
        const timer = setTimeout(poll, connection.pollingInterval);
        this.pollingTimers.set(videoId, timer);
        await this.saveConnectionState(videoId, connection);
      } catch (error) {
        logger.error(`Polling error for ${videoId}:`, error);
        connection.retries++;
        if (connection.retries >= this.MAX_RETRIES) {
          logger.error(`Max retries reached for ${videoId}, disconnecting`);
          await this.disconnect(videoId, 'max_retries');
          return;
        }
        const retryDelay = this.RETRY_INTERVAL * Math.pow(2, connection.retries - 1);
        logger.info(`Retrying ${videoId} in ${retryDelay}ms (attempt ${connection.retries})`);
        const timer = setTimeout(poll, retryDelay);
        this.pollingTimers.set(videoId, timer);
      }
    };
    poll();
  }

  async pollMessages(videoId) {
    const connection = this.connections.get(videoId);
    if (!connection) return;
    this.trackApiCall();
    const response = await this.youtube.liveChatMessages.list({
      key: process.env.YOUTUBE_API_KEY,
      liveChatId: connection.liveChatId,
      part: 'snippet,authorDetails',
      pageToken: connection.nextPageToken
    });
    connection.nextPageToken = response.data.nextPageToken;
    connection.pollingInterval = response.data.pollingIntervalMillis || this.POLL_INTERVAL;
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
      const timeSinceLastPoll = Date.now() - (conn.lastPollAt || conn.connectedAt);
      if (timeSinceLastPoll > (conn.pollingInterval || this.POLL_INTERVAL) * 3) {
        issues.push({ videoId: conn.videoId, issue: 'stalled_polling', timeSinceLastPoll });
        logger.warn(`Restarting stalled polling for ${conn.videoId}`);
        this.startPolling(conn.videoId);
      }
    }
    return { healthy: issues.length === 0, connections: connections.length, issues };
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


