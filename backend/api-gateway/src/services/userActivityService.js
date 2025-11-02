// User Activity Service - детальное отслеживание активности пользователей
const logger = require('../utils/logger');
const databaseService = require('./databaseService');

const userActivityService = {
  /**
   * Логирование активности пользователя
   * @param {Object} data - Данные активности
   * @param {string|null} data.userId - ID пользователя (для зарегистрированных)
   * @param {string|null} data.sessionId - ID сессии (для гостей)
   * @param {string} data.streamId - ID стрима
   * @param {string} data.platform - Платформа (twitch, youtube, kick)
   * @param {string} data.action - Действие (open, close, view_message, scroll)
   * @param {Object} data.metadata - Дополнительные данные
   * @returns {Promise<Object>} - Созданная запись
   */
  async logActivity(data) {
    try {
      const { userId, sessionId, streamId, platform, channelName, action, metadata = {} } = data;
      
      // Должен быть либо userId, либо sessionId
      if (!userId && !sessionId) {
        throw new Error('Either userId or sessionId must be provided');
      }
      
      const query = `
        INSERT INTO user_activity_log 
        (user_id, session_id, stream_id, platform, channel_name, action, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, user_id, session_id, stream_id, platform, channel_name, action, metadata, created_at
      `;
      
      const result = await databaseService.query(query, [
        userId || null,
        sessionId || null,
        streamId,
        platform,
        channelName || null,
        action,
        JSON.stringify(metadata)
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error logging user activity:', error);
      throw error;
    }
  },

  /**
   * Получить активность пользователей за период
   * @param {Object} options - Опции фильтрации
   * @param {string} options.timeRange - Период (24h, 7d, 30d)
   * @param {string|null} options.userId - Фильтр по пользователю
   * @param {string|null} options.sessionId - Фильтр по сессии
   * @param {string|null} options.platform - Фильтр по платформе
   * @param {number} options.limit - Лимит записей
   * @returns {Promise<Object>} - Статистика активности
   */
  async getActivityStats(options = {}) {
    try {
      const { timeRange = '24h', userId = null, sessionId = null, platform = null, limit = 1000 } = options;
      
      const interval = this._getInterval(timeRange);
      
      // Базовый WHERE
      let whereConditions = [`created_at > NOW() - INTERVAL '${interval}'`];
      const params = [];
      let paramIndex = 1;
      
      if (userId) {
        whereConditions.push(`user_id = $${paramIndex}`);
        params.push(userId);
        paramIndex++;
      }
      
      if (sessionId) {
        whereConditions.push(`session_id = $${paramIndex}`);
        params.push(sessionId);
        paramIndex++;
      }
      
      if (platform) {
        whereConditions.push(`platform = $${paramIndex}`);
        params.push(platform);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';
      const whereParams = [...params]; // Параметры для WHERE условия
      
      // Общая статистика
      const statsQuery = `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT COALESCE(user_id, session_id)) as unique_users,
          COUNT(DISTINCT stream_id) as unique_streams,
          COUNT(DISTINCT platform) as unique_platforms,
          COUNT(*) FILTER (WHERE action = 'open') as streams_opened,
          COUNT(*) FILTER (WHERE action = 'close') as streams_closed,
          COUNT(*) FILTER (WHERE action = 'view_message') as messages_viewed
        FROM user_activity_log
        WHERE ${whereClause}
      `;
      
      // Активность по пользователям
      const usersQuery = `
        SELECT 
          COALESCE(user_id, session_id) as user_identifier,
          CASE WHEN user_id IS NOT NULL THEN 'registered' ELSE 'guest' END as user_type,
          COUNT(*) as total_actions,
          COUNT(DISTINCT stream_id) as streams_opened,
          COUNT(*) FILTER (WHERE action = 'open') as open_count,
          COUNT(*) FILTER (WHERE action = 'view_message') as messages_viewed,
          MAX(created_at) as last_activity,
          MIN(created_at) as first_activity
        FROM user_activity_log
        WHERE ${whereClause}
        GROUP BY COALESCE(user_id, session_id), user_id
        ORDER BY total_actions DESC
        LIMIT $${whereParams.length + 1}
      `;
      
      // Активность по стримам
      const streamsQuery = `
        SELECT 
          stream_id,
          platform,
          channel_name,
          COUNT(*) as total_actions,
          COUNT(DISTINCT COALESCE(user_id, session_id)) as unique_viewers,
          COUNT(*) FILTER (WHERE action = 'open') as open_count,
          COUNT(*) FILTER (WHERE action = 'close') as close_count,
          COUNT(*) FILTER (WHERE action = 'view_message') as messages_viewed,
          MAX(created_at) as last_activity,
          MIN(created_at) as first_activity
        FROM user_activity_log
        WHERE ${whereClause}
        GROUP BY stream_id, platform, channel_name
        ORDER BY unique_viewers DESC, total_actions DESC
        LIMIT $${whereParams.length + 1}
      `;
      
      // Детальный лог (последние действия)
      const logQuery = `
        SELECT 
          id,
          user_id,
          session_id,
          stream_id,
          platform,
          channel_name,
          action,
          metadata,
          created_at
        FROM user_activity_log
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${whereParams.length + 1}
      `;
      
      // Параметры для запросов с LIMIT
      const limitParams = [...whereParams, limit];
      
      const [statsResult, usersResult, streamsResult, logResult] = await Promise.all([
        databaseService.query(statsQuery, whereParams),
        databaseService.query(usersQuery, limitParams),
        databaseService.query(streamsQuery, limitParams),
        databaseService.query(logQuery, limitParams)
      ]);
      
      return {
        stats: {
          totalActions: parseInt(statsResult.rows[0]?.total_actions || 0),
          uniqueUsers: parseInt(statsResult.rows[0]?.unique_users || 0),
          uniqueStreams: parseInt(statsResult.rows[0]?.unique_streams || 0),
          uniquePlatforms: parseInt(statsResult.rows[0]?.unique_platforms || 0),
          streamsOpened: parseInt(statsResult.rows[0]?.streams_opened || 0),
          streamsClosed: parseInt(statsResult.rows[0]?.streams_closed || 0),
          messagesViewed: parseInt(statsResult.rows[0]?.messages_viewed || 0),
          timeRange
        },
        users: usersResult.rows.map(row => ({
          identifier: row.user_identifier,
          type: row.user_type,
          totalActions: parseInt(row.total_actions),
          streamsOpened: parseInt(row.streams_opened),
          openCount: parseInt(row.open_count),
          messagesViewed: parseInt(row.messages_viewed),
          lastActivity: row.last_activity,
          firstActivity: row.first_activity,
          duration: new Date(row.last_activity) - new Date(row.first_activity)
        })),
        streams: streamsResult.rows.map(row => ({
          streamId: row.stream_id,
          platform: row.platform,
          channelName: row.channel_name,
          totalActions: parseInt(row.total_actions),
          uniqueViewers: parseInt(row.unique_viewers),
          openCount: parseInt(row.open_count),
          closeCount: parseInt(row.close_count),
          messagesViewed: parseInt(row.messages_viewed),
          lastActivity: row.last_activity,
          firstActivity: row.first_activity,
          duration: new Date(row.last_activity) - new Date(row.first_activity)
        })),
        recentActivity: logResult.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          sessionId: row.session_id,
          streamId: row.stream_id,
          platform: row.platform,
          channelName: row.channel_name,
          action: row.action,
          metadata: row.metadata,
          createdAt: row.created_at
        })),
        generatedAt: new Date().toISOString(),
        timeRange
      };
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      throw error;
    }
  },

  /**
   * Получить активность конкретного пользователя/гостя
   * @param {string} identifier - ID пользователя или session_id
   * @param {string} timeRange - Период
   * @returns {Promise<Object>} - Активность пользователя
   */
  async getUserActivity(identifier, timeRange = '24h') {
    try {
      const interval = this._getInterval(timeRange);
      
      const query = `
        SELECT 
          stream_id,
          platform,
          channel_name,
          action,
          metadata,
          created_at,
          LAG(created_at) OVER (PARTITION BY stream_id ORDER BY created_at) as prev_action_at
        FROM user_activity_log
        WHERE (user_id = $1 OR session_id = $1)
          AND created_at > NOW() - INTERVAL '${interval}'
        ORDER BY created_at DESC
      `;
      
      const result = await databaseService.query(query, [identifier]);
      
      // Группируем по стримам
      const streamSessions = {};
      const now = new Date();
      
      result.rows.forEach(row => {
        const streamId = row.stream_id;
        if (!streamSessions[streamId]) {
          streamSessions[streamId] = {
            streamId,
            platform: row.platform,
            channelName: row.channel_name,
            sessions: [],
            totalMessagesViewed: 0,
            totalDuration: 0
          };
        }
        
        if (row.action === 'open') {
          streamSessions[streamId].sessions.push({
            openedAt: row.created_at,
            closedAt: null,
            messagesViewed: 0
          });
        } else if (row.action === 'close' && streamSessions[streamId].sessions.length > 0) {
          const lastSession = streamSessions[streamId].sessions[streamSessions[streamId].sessions.length - 1];
          if (!lastSession.closedAt) {
            lastSession.closedAt = row.created_at;
            const duration = new Date(row.created_at) - new Date(lastSession.openedAt);
            streamSessions[streamId].totalDuration += duration;
          }
        } else if (row.action === 'view_message') {
          streamSessions[streamId].totalMessagesViewed++;
          if (streamSessions[streamId].sessions.length > 0) {
            streamSessions[streamId].sessions[streamSessions[streamId].sessions.length - 1].messagesViewed++;
          }
        }
      });
      
      // Для открытых стримов считаем время до текущего момента
      Object.values(streamSessions).forEach(stream => {
        stream.sessions.forEach(session => {
          if (!session.closedAt) {
            const duration = now - new Date(session.openedAt);
            stream.totalDuration += duration;
          }
        });
      });
      
      return {
        identifier,
        streams: Object.values(streamSessions),
        totalStreams: Object.keys(streamSessions).length,
        totalDuration: Object.values(streamSessions).reduce((sum, s) => sum + s.totalDuration, 0),
        totalMessagesViewed: Object.values(streamSessions).reduce((sum, s) => sum + s.totalMessagesViewed, 0),
        timeRange
      };
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  },

  /**
   * Преобразование timeRange в SQL интервал
   */
  _getInterval(timeRange) {
    const intervals = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };
    return intervals[timeRange] || intervals['24h'];
  }
};

module.exports = userActivityService;

