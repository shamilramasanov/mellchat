const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

function ensurePool() {
  if (pool) return pool;
  
  const connectionString = process.env.POSTGRES_URL || 'postgresql://mellchat:mellchat_password@localhost:5432/mellchat';
  
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // максимум соединений
    min: 5,  // минимум активных соединений
    idleTimeoutMillis: 30000, // 30 сек бездействия
    connectionTimeoutMillis: 2000, // 2 сек на подключение
    statement_timeout: 5000, // 5 сек timeout для запросов
    query_timeout: 10000, // 10 сек timeout для сложных запросов
    keepAlive: true, // поддерживаем соединения живыми
    keepAliveInitialDelayMillis: 0, // сразу начинаем keep-alive
  });

  pool.on('error', (err) => {
    logger.error('PostgreSQL pool error:', err);
  });

  // Мониторинг пула соединений
  pool.on('connect', (client) => {
    logger.info('New database client connected', { 
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount 
    });
  });

  pool.on('remove', (client) => {
    logger.info('Database client removed', { 
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount 
    });
  });

  return pool;
}

const databaseService = {
  async query(text, params) {
    try {
      const client = ensurePool();
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', { error: error.message, query: text });
      throw error;
    }
  },

  async getMessages(streamId, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT 
          id,
          stream_id,
          username,
          content,
          platform,
          created_at,
          is_question
        FROM messages 
        WHERE stream_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.query(query, [streamId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get messages from database:', error);
      throw error;
    }
  },

  async saveMessage(message) {
    try {
      logger.debug('saveMessage input:', {
        id: message.id,
        streamId: message.streamId,
        username: message.username,
        text: message.text,
        content: message.content,
        platform: message.platform,
        isQuestion: message.isQuestion
      });
      
      const query = `
        INSERT INTO messages (
          id,
          stream_id,
          username,
          content,
          platform,
          timestamp,
          is_question,
          created_at,
          user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      // Преобразуем timestamp в число (bigint)
      let timestamp = message.timestamp;
      if (timestamp instanceof Date) {
        timestamp = timestamp.getTime();
      } else if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp).getTime();
      } else if (!timestamp) {
        timestamp = Date.now();
      }
      
      const values = [
        message.id,
        message.streamId,
        message.username,
        message.text || message.content,
        message.platform,
        timestamp,
        message.isQuestion || false,
        message.userId || 'anonymous'
      ];
      
      logger.debug('saveMessage values:', { values });
      
      const result = await this.query(query, values);
      logger.debug('saveMessage result:', { result: result.rows });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to save message to database:', error);
      throw error;
    }
  },

  // Сохранение батча сообщений (оптимизированное)
  async saveMessageBatch(messages) {
    if (!messages || messages.length === 0) return [];
    
    try {
      // Создаем VALUES строку для батча
      const values = [];
      const placeholders = [];
      
      messages.forEach((message, index) => {
        const baseIndex = index * 8;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, NOW(), $${baseIndex + 8})`);
        
        // Преобразуем timestamp в число (bigint)
        let timestamp = message.timestamp;
        if (timestamp instanceof Date) {
          timestamp = timestamp.getTime();
        } else if (typeof timestamp === 'string') {
          timestamp = new Date(timestamp).getTime();
        } else if (!timestamp) {
          timestamp = Date.now();
        }
        
        values.push(
          message.id,
          message.streamId,
          message.username,
          message.text || message.content,
          message.platform,
          timestamp,
          message.isQuestion || false,
          message.userId || 'anonymous'
        );
      });
      
      const query = `
        INSERT INTO messages (
          id,
          stream_id,
          username,
          content,
          platform,
          timestamp,
          is_question,
          created_at,
          user_id
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      const result = await this.query(query, values);
      
      logger.database('Batch saved to database', {
        messageCount: messages.length,
        savedCount: result.rows.length,
        streamId: messages[0]?.streamId
      });
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to save message batch to database:', error);
      throw error;
    }
  },

  async getStreamStats(streamId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN is_question = true THEN 1 END) as question_count
        FROM messages 
        WHERE stream_id = $1
      `;
      
      const result = await this.query(query, [streamId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get stream stats from database:', error);
      throw error;
    }
  },

  async getQuestions(streamId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          id,
          stream_id,
          username,
          content,
          platform,
          created_at,
          is_question
        FROM messages 
        WHERE stream_id = $1 AND is_question = true
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.query(query, [streamId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get questions from database:', error);
      throw error;
    }
  },

  async searchMessages(streamId, searchQuery, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          id,
          stream_id,
          username,
          content,
          platform,
          created_at,
          is_question
        FROM messages 
        WHERE stream_id = $1 
        AND (
          LOWER(username) LIKE LOWER($2) 
          OR LOWER(content) LIKE LOWER($2)
        )
        ORDER BY created_at DESC 
        LIMIT $3 OFFSET $4
      `;
      
      const searchPattern = `%${searchQuery}%`;
      const result = await this.query(query, [streamId, searchPattern, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to search messages in database:', error);
      throw error;
    }
  },

  async testConnection() {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      return { connected: true, time: result.rows[0].current_time };
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return { connected: false, error: error.message };
    }
  },

  // Получение статистики пула соединений
  getPoolStats() {
    const pool = ensurePool();
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      maxConnections: pool.options.max,
      minConnections: pool.options.min
    };
  },

  // Новые методы для ID-based пагинации
  async getOlderMessages(streamId, beforeId, limit = 20) {
    try {
      const query = `
        SELECT 
          id,
          stream_id,
          username,
          content,
          platform,
          timestamp,
          created_at,
          is_question
        FROM messages 
        WHERE stream_id = $1 
        AND id < $2
        ORDER BY timestamp DESC 
        LIMIT $3
      `;
      
      const result = await this.query(query, [streamId, beforeId, limit]);
      return result.rows.reverse(); // Возвращаем в правильном порядке (старые первыми)
    } catch (error) {
      logger.error('Failed to get older messages:', error);
      throw error;
    }
  },

  async hasOlderMessages(streamId, beforeId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM messages 
        WHERE stream_id = $1 
        AND id < $2
      `;
      
      const result = await this.query(query, [streamId, beforeId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Failed to check for older messages:', error);
      throw error;
    }
  },
};

module.exports = databaseService;
