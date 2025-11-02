const { Pool } = require('pg');
const logger = require('../utils/logger');

logger.info('✅ DatabaseService loading');

let pool;

function ensurePool() {
  if (pool) return pool;
  
  // Поддержка Railway и других облачных провайдеров
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://mellchat:mellchat_password@localhost:5432/mellchat';
  
  // Определяем SSL настройки
  let sslConfig = false;
  if (process.env.POSTGRES_SSL === 'true' || process.env.DATABASE_SSL === 'true') {
    sslConfig = { rejectUnauthorized: false };
  } else if (process.env.NODE_ENV === 'production' && connectionString.includes('amazonaws.com')) {
    // Для AWS RDS используем SSL
    sslConfig = { rejectUnauthorized: false };
  } else if (connectionString.includes('ssl=true') || connectionString.includes('sslmode=require')) {
    sslConfig = { rejectUnauthorized: false };
  } else {
    // По умолчанию для локального PostgreSQL SSL отключен
    sslConfig = false;
  }

  pool = new Pool({
    connectionString,
    ssl: sslConfig,
    max: 20, // максимум соединений
    min: 5,  // минимум активных соединений
    idleTimeoutMillis: 30000, // 30 сек бездействия
    connectionTimeoutMillis: 30000, // 30 сек на подключение (увеличено для Railway)
    statement_timeout: 30000, // 30 сек timeout для запросов
    query_timeout: 30000, // 30 сек timeout для сложных запросов
    keepAlive: true, // поддерживаем соединения живыми
    keepAliveInitialDelayMillis: 10000, // начинаем keep-alive через 10 сек
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

// Валидация сообщения
function validateMessage(message) {
  if (!message) {
    throw new Error('Message is required');
  }
  
  if (!message.id || typeof message.id !== 'string') {
    throw new Error('Message ID is required and must be a string');
  }
  
  if (!message.streamId || typeof message.streamId !== 'string') {
    throw new Error('Stream ID is required and must be a string');
  }
  
  if (!message.username || typeof message.username !== 'string') {
    throw new Error('Username is required and must be a string');
  }
  
  if (!message.text || typeof message.text !== 'string') {
    throw new Error('Message text is required and must be a string');
  }
  
  if (!message.platform || typeof message.platform !== 'string') {
    throw new Error('Platform is required and must be a string');
  }
  
  // Валидация длины
  if (message.text.length > 1000) {
    throw new Error('Message text too long (max 1000 characters)');
  }
  
  if (message.username.length > 100) {
    throw new Error('Username too long (max 100 characters)');
  }
  
  return true;
}

const databaseService = {
  async query(text, params) {
    try {
      const client = ensurePool();
      logger.debug('🔍 Executing database query:', { 
        query: text.substring(0, 200), 
        params: params,
        paramsCount: params?.length || 0
      });
      const result = await client.query(text, params);
      logger.debug('✅ Query executed successfully:', { 
        rowCount: result.rows?.length || 0 
      });
      return result;
    } catch (error) {
      logger.error('❌ Database query error:', { 
        error: error.message,
        errorCode: error.code,
        errorDetail: error.detail,
        errorHint: error.hint,
        query: text.substring(0, 200),
        params: params,
        stack: error.stack
      });
      throw error;
    }
  },

  async getMessages(streamId, limit = 100, offset = 0) {
    try {
      if (!streamId) {
        logger.warn('⚠️ getMessages: streamId is empty');
        return [];
      }
      
      logger.info('📥 getMessages called:', { 
        streamId, 
        limit, 
        offset,
        streamIdType: typeof streamId,
        streamIdLength: streamId?.length
      });
      
      // Проверяем подключение к БД
      const pool = ensurePool();
      logger.debug('🔌 Database pool status:', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
      
      // Проверяем существование таблицы messages
      const tableExists = await this.checkTableExists('messages');
      logger.info('🔍 Table messages exists:', tableExists);
      
      if (!tableExists) {
        logger.warn('⚠️ Table messages does not exist in database');
        return [];
      }
      
      // Получаем все колонки таблицы одной проверкой
      const columns = await this.getTableColumns('messages');
      const hasColumn = (colName) => columns.includes(colName);
      
      logger.debug('🔍 Available columns:', columns);
      
      // Формируем WHERE условие в зависимости от наличия колонки
      const hasIsDeleted = hasColumn('is_deleted');
      const whereClause = hasIsDeleted 
        ? 'WHERE stream_id = $1 AND is_deleted = false'
        : 'WHERE stream_id = $1';
      
      // Используем content если есть, иначе text (для обратной совместимости)
      const hasTextColumn = hasColumn('text');
      const hasContentColumn = hasColumn('content');
      const textColumn = hasContentColumn ? 'content' : (hasTextColumn ? 'text' : 'content');
      
      // Формируем список колонок для SELECT
      const selectColumns = [
        'id',
        'stream_id',
        'username',
        `${textColumn} as text`,
        'platform',
        'timestamp',
        'created_at'
      ];
      
      // Добавляем опциональные колонки, если они существуют
      if (hasColumn('is_question')) {
        selectColumns.push('is_question');
      }
      if (hasColumn('sentiment')) {
        selectColumns.push('sentiment');
      }
      if (hasColumn('is_spam')) {
        selectColumns.push('is_spam');
      }
      
      const query = `
        SELECT 
          ${selectColumns.join(',\n          ')}
        FROM messages 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      logger.debug('📝 SQL query prepared:', {
        queryLength: query.length,
        param1: streamId,
        param2: limit,
        param3: offset
      });
      
      const result = await this.query(query, [streamId, limit, offset]);
      
      logger.info('✅ getMessages result:', { 
        streamId, 
        foundCount: result.rows?.length || 0,
        totalRows: result.rowCount || 0,
        sampleMessage: result.rows?.[0] ? {
          id: result.rows[0].id,
          stream_id: result.rows[0].stream_id,
          username: result.rows[0].username,
          hasText: !!result.rows[0].text
        } : null
      });
      
      return result.rows || [];
    } catch (error) {
      logger.error('❌ Failed to get messages from database:', {
        streamId,
        streamIdType: typeof streamId,
        limit,
        offset,
        error: error.message,
        errorCode: error.code,
        errorDetail: error.detail,
        errorHint: error.hint,
        errorTable: error.table,
        errorColumn: error.column,
        errorConstraint: error.constraint,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
      throw error;
    }
  },

  async saveMessage(message) {
    try {
      // Валидируем сообщение
      validateMessage(message);
      
      logger.debug('saveMessage input:', {
        id: message.id,
        streamId: message.streamId,
        username: message.username,
        text: message.text,
        text: message.text,
        platform: message.platform,
        isQuestion: message.isQuestion
      });
      
      // Проверяем лимит общего количества сообщений для стрима: максимум 10000
      const streamCountQuery = `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE stream_id = $1 AND (is_deleted = false OR is_deleted IS NULL)
      `;
      const streamCountResult = await this.query(streamCountQuery, [message.streamId]);
      const streamMessageCount = parseInt(streamCountResult.rows[0]?.count || 0, 10);
      
      if (streamMessageCount >= 10000) {
        // Удаляем самые старые сообщения, оставляя 10000
        const deleteOldQuery = `
          DELETE FROM messages 
          WHERE id IN (
            SELECT id FROM messages 
            WHERE stream_id = $1 AND (is_deleted = false OR is_deleted IS NULL)
            ORDER BY created_at ASC 
            LIMIT $2
          )
        `;
        const toDelete = streamMessageCount - 10000 + 1; // Удаляем на 1 больше, чтобы после вставки было 10000
        await this.query(deleteOldQuery, [message.streamId, toDelete]);
        logger.debug(`Removed ${toDelete} oldest messages from stream ${message.streamId} (had ${streamMessageCount} messages)`);
      }
      
      // Проверяем лимит: максимум 200 сообщений от одного автора
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE username = $1 AND stream_id = $2 AND (is_deleted = false OR is_deleted IS NULL)
      `;
      const countResult = await this.query(countQuery, [message.username, message.streamId]);
      const messageCount = parseInt(countResult.rows[0]?.count || 0, 10);
      
      if (messageCount >= 200) {
        // Удаляем самое старое сообщение этого автора
        const deleteQuery = `
          DELETE FROM messages 
          WHERE id = (
            SELECT id FROM messages 
            WHERE username = $1 AND stream_id = $2 AND (is_deleted = false OR is_deleted IS NULL)
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
          content,
          platform,
          timestamp,
          is_question,
          sentiment,
          is_spam,
          message_score,
          message_classification,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
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
        message.text, // content = text (дублируем для совместимости)
        message.platform,
        timestamp,
        message.isQuestion || false,
        message.sentiment || 'neutral',
        message.isSpam || false,
        message.messageScore || 50,
        message.messageClassification || 'normal'
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

  // Сохранение батча сообщений (оптимизированное с транзакциями)
  async saveMessageBatch(messages) {
    if (!messages || messages.length === 0) return [];
    
    // Валидируем все сообщения
    messages.forEach((message, index) => {
      try {
        validateMessage(message);
      } catch (error) {
        throw new Error(`Validation failed for message ${index}: ${error.message}`);
      }
    });
    
    const client = ensurePool();
    try {
      // Начинаем транзакцию
      await client.query('BEGIN');
      
      // Проверяем лимит общего количества сообщений для каждого уникального стрима
      const streamIds = [...new Set(messages.map(m => m.streamId))];
      for (const streamId of streamIds) {
        const streamCountQuery = `
          SELECT COUNT(*) as count 
          FROM messages 
          WHERE stream_id = $1 AND (is_deleted = false OR is_deleted IS NULL)
        `;
        const streamCountResult = await this.query(streamCountQuery, [streamId]);
        const streamMessageCount = parseInt(streamCountResult.rows[0]?.count || 0, 10);
        
        if (streamMessageCount >= 10000) {
          // Подсчитываем сколько сообщений будет добавлено для этого стрима
          const newMessagesForStream = messages.filter(m => m.streamId === streamId).length;
          const toDelete = streamMessageCount + newMessagesForStream - 10000;
          
          if (toDelete > 0) {
            // Удаляем самые старые сообщения
            const deleteOldQuery = `
              DELETE FROM messages 
              WHERE id IN (
                SELECT id FROM messages 
                WHERE stream_id = $1 AND (is_deleted = false OR is_deleted IS NULL)
                ORDER BY created_at ASC 
                LIMIT $2
              )
            `;
            await this.query(deleteOldQuery, [streamId, toDelete]);
            logger.debug(`Removed ${toDelete} oldest messages from stream ${streamId} (had ${streamMessageCount}, adding ${newMessagesForStream})`);
          }
        }
      }
      
      // Проверяем лимит для каждого уникального автора
      const authorCounts = {};
      for (const message of messages) {
        const key = `${message.username}_${message.streamId}`;
        if (!authorCounts[key]) {
          const countQuery = `
            SELECT COUNT(*) as count 
            FROM messages 
            WHERE username = $1 AND stream_id = $2 AND (is_deleted = false OR is_deleted IS NULL)
          `;
          const countResult = await this.query(countQuery, [message.username, message.streamId]);
          authorCounts[key] = parseInt(countResult.rows[0]?.count || 0, 10);
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
              WHERE username = $1 AND stream_id = $2 AND (is_deleted = false OR is_deleted IS NULL)
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
        const baseIndex = index * 12; // 12 полей вместо 7
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, NOW())`);
        
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
          message.text, // content = text
          message.platform,
          timestamp,
          message.isQuestion || false,
          message.sentiment || 'neutral',
          message.isSpam || false,
          message.messageScore || 50,
          message.messageClassification || 'normal'
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
          sentiment,
          is_spam,
          message_score,
          message_classification,
          created_at
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      const result = await client.query(query, values);
      
      // Коммитим транзакцию
      await client.query('COMMIT');
      
      logger.database('Batch saved to database', {
        messageCount: messages.length,
        savedCount: result.rows.length,
        streamId: messages[0]?.streamId
      });
      
      return result.rows;
    } catch (error) {
      // Откатываем транзакцию при ошибке
      await client.query('ROLLBACK');
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

  // Проверка существования таблицы messages
  async checkTableExists(tableName = 'messages') {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists;
      `;
      const result = await this.query(query, [tableName]);
      return result.rows[0]?.exists || false;
    } catch (error) {
      logger.error(`Failed to check if table ${tableName} exists:`, error);
      return false;
    }
  },

  // Проверка существования колонки в таблице
  async checkColumnExists(tableName, columnName) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        ) as exists;
      `;
      const result = await this.query(query, [tableName, columnName]);
      return result.rows[0]?.exists || false;
    } catch (error) {
      logger.error(`Failed to check if column ${columnName} exists in ${tableName}:`, error);
      return false;
    }
  },

  // Получить все колонки таблицы одной проверкой
  async getTableColumns(tableName = 'messages') {
    try {
      const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const result = await this.query(query, [tableName]);
      const columns = result.rows.map(row => row.column_name);
      logger.debug(`🔍 Table ${tableName} columns:`, columns);
      return columns;
    } catch (error) {
      logger.error(`Failed to get columns for table ${tableName}:`, error);
      return [];
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
  }
};

module.exports = databaseService;
