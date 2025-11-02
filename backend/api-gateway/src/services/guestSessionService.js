// Guest Session Service - отслеживание гостевых сессий
const logger = require('../utils/logger');
const databaseService = require('./databaseService');
const { v4: uuidv4 } = require('uuid');

const guestSessionService = {
  /**
   * Найти существующую сессию по fingerprint
   * @param {string} fingerprint - Browser fingerprint
   * @returns {Promise<Object|null>} - Сессия гостя или null
   */
  async findSessionByFingerprint(fingerprint) {
    try {
      if (!fingerprint) return null;
      
      const query = `
        SELECT id, session_id, ip_address, user_agent, first_seen_at, last_seen_at, 
               streams_count, messages_viewed, is_active, metadata, fingerprint
        FROM guest_sessions
        WHERE fingerprint = $1
          AND is_active = true
        ORDER BY last_seen_at DESC
        LIMIT 1
      `;
      
      const result = await databaseService.query(query, [fingerprint]);
      
      if (result.rows.length > 0) {
        return this.mapSessionFromDB(result.rows[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding session by fingerprint:', error);
      return null;
    }
  },

  /**
   * Создать или обновить гостевую сессию
   * @param {string} sessionId - ID сессии (генерируется на фронтенде)
   * @param {Object} options - Опции (ip, userAgent, fingerprint, metadata)
   * @returns {Promise<Object>} - Сессия гостя
   */
  async createOrUpdateSession(sessionId, options = {}) {
    try {
      const { ip, userAgent, fingerprint, metadata = {} } = options;
      
      const query = `
        INSERT INTO guest_sessions (session_id, ip_address, user_agent, fingerprint, metadata, last_seen_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (session_id) 
        DO UPDATE SET
          last_seen_at = NOW(),
          ip_address = COALESCE(EXCLUDED.ip_address, guest_sessions.ip_address),
          user_agent = COALESCE(EXCLUDED.user_agent, guest_sessions.user_agent),
          fingerprint = COALESCE(EXCLUDED.fingerprint, guest_sessions.fingerprint),
          metadata = COALESCE(EXCLUDED.metadata, guest_sessions.metadata),
          is_active = true
        RETURNING id, session_id, ip_address, user_agent, fingerprint, first_seen_at, last_seen_at, streams_count, messages_viewed, is_active, metadata
      `;
      
      const result = await databaseService.query(query, [
        sessionId,
        ip || null,
        userAgent || null,
        fingerprint || null,
        JSON.stringify(metadata)
      ]);
      
      return this.mapSessionFromDB(result.rows[0]);
    } catch (error) {
      logger.error('Error creating/updating guest session:', error);
      throw error;
    }
  },

  /**
   * Обновить статистику сессии
   * @param {string} sessionId - ID сессии
   * @param {Object} updates - Обновления (streamsCount, messagesViewed)
   * @returns {Promise<Object>} - Обновленная сессия
   */
  async updateSessionStats(sessionId, updates = {}) {
    try {
      const { streamsCount, messagesViewed } = updates;
      
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (streamsCount !== undefined) {
        updateFields.push(`streams_count = $${paramIndex}`);
        values.push(streamsCount);
        paramIndex++;
      }
      
      if (messagesViewed !== undefined) {
        updateFields.push(`messages_viewed = $${paramIndex}`);
        values.push(messagesViewed);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        return await this.getSession(sessionId);
      }
      
      values.push(sessionId);
      
      const query = `
        UPDATE guest_sessions
        SET ${updateFields.join(', ')}, last_seen_at = NOW()
        WHERE session_id = $${paramIndex}
        RETURNING id, session_id, ip_address, user_agent, first_seen_at, last_seen_at, streams_count, messages_viewed, is_active, metadata
      `;
      
      const result = await databaseService.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapSessionFromDB(result.rows[0]);
    } catch (error) {
      logger.error('Error updating guest session stats:', error);
      throw error;
    }
  },

  /**
   * Получить сессию по ID
   * @param {string} sessionId - ID сессии
   * @returns {Promise<Object|null>} - Сессия или null
   */
  async getSession(sessionId) {
    try {
      const query = `
        SELECT id, session_id, ip_address, user_agent, fingerprint, first_seen_at, last_seen_at, streams_count, messages_viewed, is_active, metadata
        FROM guest_sessions
        WHERE session_id = $1
      `;
      
      const result = await databaseService.query(query, [sessionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapSessionFromDB(result.rows[0]);
    } catch (error) {
      logger.error('Error getting guest session:', error);
      throw error;
    }
  },

  /**
   * Получить все активные гостевые сессии
   * @param {Object} options - Опции фильтрации (limit, offset)
   * @returns {Promise<Object>} - Список сессий и общая статистика
   */
  async getActiveSessions(options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const query = `
        SELECT id, session_id, ip_address, user_agent, fingerprint, first_seen_at, last_seen_at, streams_count, messages_viewed, is_active, metadata
        FROM guest_sessions
        WHERE is_active = true
        ORDER BY last_seen_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM guest_sessions
        WHERE is_active = true
      `;
      
      const [sessionsResult, countResult] = await Promise.all([
        databaseService.query(query, [limit, offset]),
        databaseService.query(countQuery)
      ]);
      
      const sessions = sessionsResult.rows.map(row => this.mapSessionFromDB(row));
      const total = parseInt(countResult.rows[0].total, 10);
      
      return {
        sessions,
        total,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Error getting active guest sessions:', error);
      throw error;
    }
  },

  /**
   * Получить статистику гостей
   * @returns {Promise<Object>} - Статистика
   */
  async getGuestStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE is_active = true) as active_guests,
          COUNT(*) FILTER (WHERE is_active = false) as inactive_guests,
          COUNT(*) as total_guests,
          COUNT(DISTINCT ip_address) as unique_ips,
          SUM(streams_count) as total_streams_opened,
          SUM(messages_viewed) as total_messages_viewed,
          AVG(streams_count) as avg_streams_per_session,
          AVG(messages_viewed) as avg_messages_per_session
        FROM guest_sessions
      `;
      
      const result = await databaseService.query(query);
      
      if (result.rows.length === 0) {
        return {
          activeGuests: 0,
          inactiveGuests: 0,
          totalGuests: 0,
          uniqueIPs: 0,
          totalStreamsOpened: 0,
          totalMessagesViewed: 0,
          avgStreamsPerSession: 0,
          avgMessagesPerSession: 0
        };
      }
      
      const row = result.rows[0];
      return {
        activeGuests: parseInt(row.active_guests, 10) || 0,
        inactiveGuests: parseInt(row.inactive_guests, 10) || 0,
        totalGuests: parseInt(row.total_guests, 10) || 0,
        uniqueIPs: parseInt(row.unique_ips, 10) || 0,
        totalStreamsOpened: parseInt(row.total_streams_opened, 10) || 0,
        totalMessagesViewed: parseInt(row.total_messages_viewed, 10) || 0,
        avgStreamsPerSession: parseFloat(row.avg_streams_per_session) || 0,
        avgMessagesPerSession: parseFloat(row.avg_messages_per_session) || 0
      };
    } catch (error) {
      logger.error('Error getting guest stats:', error);
      throw error;
    }
  },

  /**
   * Деактивировать неактивные сессии (старше определенного времени)
   * @param {number} inactiveMinutes - Минут бездействия для деактивации
   * @returns {Promise<number>} - Количество деактивированных сессий
   */
  async deactivateInactiveSessions(inactiveMinutes = 30) {
    try {
      const query = `
        UPDATE guest_sessions
        SET is_active = false
        WHERE is_active = true 
          AND last_seen_at < NOW() - INTERVAL '${inactiveMinutes} minutes'
        RETURNING id
      `;
      
      const result = await databaseService.query(query);
      
      return result.rows.length;
    } catch (error) {
      logger.error('Error deactivating inactive guest sessions:', error);
      throw error;
    }
  },

  /**
   * Маппинг данных из БД в объект
   */
  mapSessionFromDB(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      sessionId: row.session_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      fingerprint: row.fingerprint || null,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      streamsCount: row.streams_count || 0,
      messagesViewed: row.messages_viewed || 0,
      isActive: row.is_active,
      metadata: row.metadata || {}
    };
  }
};

module.exports = guestSessionService;

