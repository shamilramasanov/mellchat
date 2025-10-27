// backend/api-gateway/src/services/userSessionService.js
const databaseService = require('./databaseService');
const logger = require('../utils/logger');

class UserSessionService {
  constructor() {
    this.sessions = new Map(); // Кэш активных сессий
  }

  // Получить или создать сессию пользователя
  async getUserSession(userId, streamId) {
    try {
      const query = `
        SELECT * FROM user_sessions 
        WHERE user_id = $1::text AND stream_id = $2::text 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const result = await databaseService.query(query, [userId, streamId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      // Создаем новую сессию
      return await this.createUserSession(userId, streamId);
    } catch (error) {
      logger.error('Failed to get user session:', error);
      throw error;
    }
  }

  // Создать новую сессию пользователя
  async createUserSession(userId, streamId, sessionType = 'normal') {
    try {
      // Для новой сессии устанавливаем last_seen_at на вчера, чтобы загрузить последние сообщения
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const query = `
        INSERT INTO user_sessions (user_id, stream_id, session_type, last_seen_at)
        VALUES ($1::text, $2::text, $3::text, $4::timestamp)
        RETURNING *
      `;
      
      const result = await databaseService.query(query, [userId, streamId, sessionType, yesterday.toISOString()]);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create user session:', error);
      throw error;
    }
  }

  // Обновить время последнего просмотра
  async updateLastSeen(userId, streamId) {
    try {
      const query = `
        UPDATE user_sessions 
        SET last_seen_at = NOW(), updated_at = NOW()
        WHERE user_id = $1::text AND stream_id = $2::text
        RETURNING *
      `;
      
      const result = await databaseService.query(query, [userId, streamId]);
      
      if (result.rows.length === 0) {
        // Если сессии нет, создаем новую
        return await this.createUserSession(userId, streamId);
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update last seen:', error);
      throw error;
    }
  }

  // Получить стратегию загрузки сообщений по типу устройства
  getLoadingStrategy(deviceType, sessionType = 'normal') {
    const strategies = {
      mobile: {
        strategy: 'hybrid',
        initialLimit: 15,
        maxLimit: 50,
        enablePagination: true,
        enableVirtualization: true,
        loadAfterLastSeen: false // Для мобильных не используем временной подход
      },
      tablet: {
        strategy: 'hybrid',
        initialLimit: 30,
        maxLimit: 100,
        enablePagination: true,
        enableVirtualization: true,
        loadAfterLastSeen: false
      },
      desktop: {
        strategy: sessionType === 'clean_start' ? 'hybrid' : 'timeBased',
        initialLimit: 50,
        maxLimit: 200,
        enablePagination: false,
        enableVirtualization: false,
        loadAfterLastSeen: sessionType !== 'clean_start'
      }
    };

    return strategies[deviceType] || strategies.desktop;
  }

  // Получить сообщения по стратегии
  async getMessagesByStrategy(userId, streamId, deviceType, sessionType = 'normal') {
    try {
      const strategy = this.getLoadingStrategy(deviceType, sessionType);
      const session = await this.getUserSession(userId, streamId);
      
      let messages;
      
      if (strategy.loadAfterLastSeen && session.last_seen_at) {
        // Временной подход - загружаем сообщения после last_seen_at
        // НО только если last_seen_at не слишком свежий (не сегодня)
        const lastSeenDate = new Date(session.last_seen_at);
        const now = new Date();
        const hoursDiff = (now - lastSeenDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 1) { // Если прошло больше часа
          messages = await this.getMessagesAfterLastSeen(streamId, session.last_seen_at, strategy.initialLimit);
        } else {
          // Если last_seen_at слишком свежий, загружаем последние сообщения
          messages = await this.getRecentMessages(streamId, strategy.initialLimit);
        }
      } else {
        // Гибридный подход - загружаем последние сообщения
        messages = await this.getRecentMessages(streamId, strategy.initialLimit);
      }
      
      // Обновляем время последнего просмотра
      await this.updateLastSeen(userId, streamId);
      
      return {
        messages,
        strategy,
        session,
        hasMore: messages.length >= strategy.initialLimit
      };
    } catch (error) {
      logger.error('Failed to get messages by strategy:', error);
      throw error;
    }
  }

  // Получить сообщения после определенного времени
  async getMessagesAfterLastSeen(streamId, lastSeenAt, limit) {
    try {
      const query = `
        SELECT * FROM messages 
        WHERE stream_id = $1::text AND created_at > $2::timestamp
        ORDER BY created_at ASC
        LIMIT $3::integer
      `;
      
      const result = await databaseService.query(query, [streamId, lastSeenAt, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get messages after last seen:', error);
      throw error;
    }
  }

  // Получить последние сообщения
  async getRecentMessages(streamId, limit) {
    try {
      const query = `
        SELECT * FROM messages 
        WHERE stream_id = $1::text
        ORDER BY created_at DESC
        LIMIT $2::integer
      `;
      
      const result = await databaseService.query(query, [streamId, limit]);
      return result.rows.reverse(); // Возвращаем в хронологическом порядке
    } catch (error) {
      logger.error('Failed to get recent messages:', error);
      throw error;
    }
  }

  // Загрузить больше сообщений (пагинация)
  async loadMoreMessages(streamId, offset, limit, deviceType) {
    try {
      const strategy = this.getLoadingStrategy(deviceType);
      const actualLimit = Math.min(limit, strategy.maxLimit);
      
      const query = `
        SELECT * FROM messages 
        WHERE stream_id = $1::text
        ORDER BY created_at DESC
        LIMIT $2::integer OFFSET $3::integer
      `;
      
      const result = await databaseService.query(query, [streamId, actualLimit, offset]);
      return result.rows.reverse();
    } catch (error) {
      logger.error('Failed to load more messages:', error);
      throw error;
    }
  }
}

module.exports = new UserSessionService();
