const databaseService = require('./databaseService');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 минута кэш
  }

  /**
   * Получение аналитики по платформам
   */
  async getPlatformAnalytics(timeRange = '24h') {
    try {
      const cacheKey = `platform_analytics_${timeRange}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const interval = this._getInterval(timeRange);
      
      const query = `
        SELECT 
          platform,
          COUNT(*) as message_count,
          COUNT(DISTINCT username) as unique_users,
          COUNT(*) FILTER (WHERE is_question = true) as questions_count,
          AVG(LENGTH(text)) as avg_message_length,
          MAX(created_at) as last_message_at
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY platform
        ORDER BY message_count DESC
      `;

      const result = await databaseService.query(query);
      
      const analytics = {
        platforms: result.rows.map(row => ({
          name: row.platform,
          messageCount: parseInt(row.message_count),
          uniqueUsers: parseInt(row.unique_users),
          questionsCount: parseInt(row.questions_count),
          avgMessageLength: parseFloat(row.avg_message_length || 0),
          lastMessageAt: row.last_message_at
        })),
        totalMessages: result.rows.reduce((sum, row) => sum + parseInt(row.message_count), 0),
        totalUniqueUsers: new Set(result.rows.map(row => row.platform)).size,
        timeRange
      };

      this.cache.set(cacheKey, {
        value: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting platform analytics:', error);
      throw error;
    }
  }

  /**
   * Аналитика по времени (часовые паттерны)
   */
  async getTimeAnalytics(timeRange = '24h') {
    try {
      const cacheKey = `time_analytics_${timeRange}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const interval = this._getInterval(timeRange);
      
      const query = `
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as message_count,
          COUNT(DISTINCT username) as unique_users,
          platform
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY hour, platform
        ORDER BY hour DESC
      `;

      const result = await databaseService.query(query);
      
      // Группируем по часам
      const hourlyData = {};
      result.rows.forEach(row => {
        const hour = new Date(row.hour).toISOString();
        if (!hourlyData[hour]) {
          hourlyData[hour] = {
            hour,
            totalMessages: 0,
            totalUsers: new Set(),
            platforms: {}
          };
        }
        hourlyData[hour].totalMessages += parseInt(row.message_count);
        hourlyData[hour].totalUsers.add(row.platform);
        hourlyData[hour].platforms[row.platform] = {
          messages: parseInt(row.message_count),
          users: parseInt(row.unique_users)
        };
      });

      const analytics = {
        hourly: Object.values(hourlyData).map(data => ({
          hour: data.hour,
          messageCount: data.totalMessages,
          uniqueUsers: data.totalUsers.size,
          platforms: data.platforms
        })),
        peakHour: Object.values(hourlyData).reduce((max, data) => 
          data.totalMessages > (max.totalMessages || 0) ? data : max, {}
        ),
        timeRange
      };

      this.cache.set(cacheKey, {
        value: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting time analytics:', error);
      throw error;
    }
  }

  /**
   * Аналитика по стримам (топ активные каналы)
   */
  async getStreamAnalytics(timeRange = '24h', limit = 20) {
    try {
      const cacheKey = `stream_analytics_${timeRange}_${limit}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const interval = this._getInterval(timeRange);
      
      const query = `
        SELECT 
          stream_id,
          platform,
          COUNT(*) as message_count,
          COUNT(DISTINCT username) as unique_users,
          COUNT(*) FILTER (WHERE is_question = true) as questions_count,
          MAX(created_at) as last_message_at,
          MIN(created_at) as first_message_at
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY stream_id, platform
        ORDER BY message_count DESC
        LIMIT $1
      `;

      const result = await databaseService.query(query, [limit]);
      
      const analytics = {
        streams: result.rows.map(row => ({
          streamId: row.stream_id,
          platform: row.platform,
          messageCount: parseInt(row.message_count),
          uniqueUsers: parseInt(row.unique_users),
          questionsCount: parseInt(row.questions_count),
          lastMessageAt: row.last_message_at,
          firstMessageAt: row.first_message_at,
          activityPeriod: {
            start: row.first_message_at,
            end: row.last_message_at,
            duration: new Date(row.last_message_at) - new Date(row.first_message_at)
          }
        })),
        totalStreams: result.rows.length,
        timeRange
      };

      this.cache.set(cacheKey, {
        value: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting stream analytics:', error);
      throw error;
    }
  }

  /**
   * Аналитика по пользователям (топ активные)
   */
  async getUserAnalytics(timeRange = '24h', limit = 50) {
    try {
      const cacheKey = `user_analytics_${timeRange}_${limit}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const interval = this._getInterval(timeRange);
      
      const query = `
        SELECT 
          username,
          COUNT(*) as message_count,
          COUNT(DISTINCT stream_id) as streams_count,
          COUNT(DISTINCT platform) as platforms_count,
          COUNT(*) FILTER (WHERE is_question = true) as questions_count,
          AVG(LENGTH(text)) as avg_message_length,
          MAX(created_at) as last_activity_at
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY username
        ORDER BY message_count DESC
        LIMIT $1
      `;

      const result = await databaseService.query(query, [limit]);
      
      const analytics = {
        users: result.rows.map(row => ({
          username: row.username,
          messageCount: parseInt(row.message_count),
          streamsCount: parseInt(row.streams_count),
          platformsCount: parseInt(row.platforms_count),
          questionsCount: parseInt(row.questions_count),
          avgMessageLength: parseFloat(row.avg_message_length || 0),
          lastActivityAt: row.last_activity_at
        })),
        totalUsers: result.rows.length,
        timeRange
      };

      this.cache.set(cacheKey, {
        value: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Аналитика качества контента (спам, sentiment, вопросы)
   */
  async getContentQualityAnalytics(timeRange = '24h') {
    try {
      const cacheKey = `content_quality_${timeRange}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      const interval = this._getInterval(timeRange);
      
      // Спам статистика (если есть поле is_spam или score)
      const spamQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE is_spam = true OR spam_score > 0.7) as spam_count,
          COUNT(*) as total_count
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
      `;

      // Sentiment статистика
      const sentimentQuery = `
        SELECT 
          sentiment,
          COUNT(*) as count
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
          AND sentiment IS NOT NULL
        GROUP BY sentiment
      `;

      // Вопросы статистика
      const questionsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE is_question = true) as questions_count,
          COUNT(*) as total_count
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
      `;

      const [spamResult, sentimentResult, questionsResult] = await Promise.all([
        databaseService.query(spamQuery).catch(() => ({ rows: [{ spam_count: 0, total_count: 0 }] })),
        databaseService.query(sentimentQuery),
        databaseService.query(questionsQuery)
      ]);

      const totalMessages = parseInt(spamResult.rows[0]?.total_count || 0);
      const spamCount = parseInt(spamResult.rows[0]?.spam_count || 0);
      const questionsCount = parseInt(questionsResult.rows[0]?.questions_count || 0);

      const analytics = {
        spam: {
          totalBlocked: spamCount,
          percentage: totalMessages > 0 ? (spamCount / totalMessages * 100).toFixed(2) : 0,
          rate: totalMessages > 0 ? (1 - spamCount / totalMessages) : 1
        },
        sentiment: sentimentResult.rows.reduce((acc, row) => {
          acc[row.sentiment] = parseInt(row.count);
          return acc;
        }, {}),
        questions: {
          totalQuestions: questionsCount,
          percentage: totalMessages > 0 ? (questionsCount / totalMessages * 100).toFixed(2) : 0,
          questionsPer100Messages: totalMessages > 0 ? (questionsCount / totalMessages * 100).toFixed(2) : 0
        },
        timeRange
      };

      this.cache.set(cacheKey, {
        value: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting content quality analytics:', error);
      throw error;
    }
  }

  /**
   * Пользовательская активность (retention, session duration)
   */
  async getUserActivityAnalytics(timeRange = '7d') {
    try {
      const cacheKey = `user_activity_${timeRange}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) {
        return cached.value;
      }

      const interval = this._getInterval(timeRange);
      
      // Сессии пользователей (приблизительно по активности в пределах часа)
      const sessionQuery = `
        SELECT 
          username,
          DATE_TRUNC('hour', created_at) as session_start,
          COUNT(*) as messages_in_session,
          MAX(created_at) - MIN(created_at) as session_duration
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY username, DATE_TRUNC('hour', created_at)
      `;

      const result = await databaseService.query(sessionQuery);
      
      const sessions = result.rows.map(row => ({
        username: row.username,
        sessionStart: row.session_start,
        messagesCount: parseInt(row.messages_in_session),
        duration: row.session_duration ? parseInt(row.session_duration) : 0
      }));

      const avgSessionDuration = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0;

      const analytics = {
        totalSessions: sessions.length,
        avgSessionDuration: Math.round(avgSessionDuration / 1000), // в секундах
        avgMessagesPerSession: sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.messagesCount, 0) / sessions.length
          : 0,
        sessions: sessions.slice(0, 100), // первые 100 сессий
        timeRange
      };

      this.cache.set(cacheKey, {
        value: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting user activity analytics:', error);
      throw error;
    }
  }

  /**
   * Полная сводка аналитики
   */
  async getFullAnalytics(timeRange = '24h') {
    try {
      const [
        platformAnalytics,
        timeAnalytics,
        streamAnalytics,
        userAnalytics,
        contentQuality,
        userActivity
      ] = await Promise.all([
        this.getPlatformAnalytics(timeRange),
        this.getTimeAnalytics(timeRange),
        this.getStreamAnalytics(timeRange),
        this.getUserAnalytics(timeRange),
        this.getContentQualityAnalytics(timeRange),
        this.getUserActivityAnalytics(timeRange.includes('d') ? timeRange : '7d')
      ]);

      return {
        platform: platformAnalytics,
        time: timeAnalytics,
        streams: streamAnalytics,
        users: userAnalytics,
        contentQuality,
        userActivity,
        generatedAt: new Date().toISOString(),
        timeRange
      };
    } catch (error) {
      logger.error('Error getting full analytics:', error);
      throw error;
    }
  }

  /**
   * Преобразование timeRange в SQL интервал
   */
  _getInterval(timeRange) {
    const intervals = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    return intervals[timeRange] || intervals['24h'];
  }

  /**
   * Очистка кэша
   */
  clearCache() {
    this.cache.clear();
    logger.info('Analytics cache cleared');
  }
}

module.exports = new AnalyticsService();

