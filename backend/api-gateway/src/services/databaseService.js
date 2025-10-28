const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

function ensurePool() {
  if (pool) return pool;
  
  // Поддержка Railway и других облачных провайдеров
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://mellchat:mellchat_password@localhost:5432/mellchat';
  
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
          content as text,
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
        text: message.text,
        platform: message.platform,
        isQuestion: message.isQuestion
      });
      
      // Проверяем лимит: максимум 200 сообщений от одного автора
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE username = $1 AND stream_id = $2
      `;
      const countResult = await this.query(countQuery, [message.username, message.streamId]);
      const messageCount = parseInt(countResult.rows[0].count, 10);
      
      if (messageCount >= 200) {
        // Удаляем самое старое сообщение этого автора
        const deleteQuery = `
          DELETE FROM messages 
          WHERE id = (
            SELECT id FROM messages 
            WHERE username = $1 AND stream_id = $2 
            ORDER BY created_at ASC 
            LIMIT 1
          )
        `;
        await this.query(deleteQuery, [message.username, message.streamId]);
        logger.debug(`Removed oldest message from ${message.username} (had ${messageCount} messages)`);
      }
      
      const query = `
        INSERT INTO messages (
          id,
          stream_id,
          username,
          text,
          platform,
          timestamp,
          is_question,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      // Преобразуем timestamp в число (bigint)
      let timestamp = message.timestamp;
      if (timestamp instanceof Date) {
        timestamp = timestamp.getTime();
      } else if (typeof timestamp === 'string') {
        // Убираем timezone из строки ISO для корректного парсинга
        timestamp = new Date(timestamp.replace(/[+-]\d{2}:\d{2}$/, '')).getTime();
      } else if (!timestamp) {
        timestamp = Date.now();
      }
      
      const values = [
        message.id,
        message.streamId,
        message.username,
        message.text,
        message.platform,
        timestamp,
        message.isQuestion || false
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
      // Проверяем лимит для каждого уникального автора
      const authorCounts = {};
      for (const message of messages) {
        const key = `${message.username}_${message.streamId}`;
        if (!authorCounts[key]) {
          const countQuery = `
            SELECT COUNT(*) as count 
            FROM messages 
            WHERE username = $1 AND stream_id = $2
          `;
          const countResult = await this.query(countQuery, [message.username, message.streamId]);
          authorCounts[key] = parseInt(countResult.rows[0].count, 10);
        }
      }
      
      // Удаляем старые сообщения если нужно
      for (const [key, count] of Object.entries(authorCounts)) {
        if (count >= 200) {
          const [username, streamId] = key.split('_');
          const deleteQuery = `
            DELETE FROM messages 
            WHERE id = (
              SELECT id FROM messages 
              WHERE username = $1 AND stream_id = $2 
              ORDER BY created_at ASC 
              LIMIT 1
            )
          `;
          await this.query(deleteQuery, [username, streamId]);
          authorCounts[key]--;
          logger.debug(`Removed oldest message from ${username} (had ${count} messages)`);
        }
      }
      
      // Создаем VALUES строку для батча
      const values = [];
      const placeholders = [];
      
      messages.forEach((message, index) => {
        const baseIndex = index * 7;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, NOW())`);
        
        // Преобразуем timestamp в число (bigint)
        let timestamp = message.timestamp;
        if (timestamp instanceof Date) {
          timestamp = timestamp.getTime();
        } else if (typeof timestamp === 'string') {
          // Убираем timezone из строки ISO для корректного парсинга
          timestamp = new Date(timestamp.replace(/[+-]\d{2}:\d{2}$/, '')).getTime();
        } else if (!timestamp) {
          timestamp = Date.now();
        }
        
        values.push(
          message.id,
          message.streamId,
          message.username,
          message.text,
          message.platform,
          timestamp,
          message.isQuestion || false
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
          created_at
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
          content as text,
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
          content as text,
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
          text,
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
