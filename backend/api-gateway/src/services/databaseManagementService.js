const databaseService = require('./databaseService');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

class DatabaseManagementService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 120000; // 2 минуты для БД метрик
  }

  /**
   * Получение размеров таблиц
   */
  async getTableSizes() {
    try {
      const query = `
        SELECT 
          schemaname || '.' || tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      const result = await databaseService.query(query);
      
      return result.rows.map(row => ({
        name: row.table_name,
        totalSize: row.size,
        totalSizeBytes: parseInt(row.size_bytes),
        tableSize: row.table_size,
        indexesSize: row.indexes_size
      }));
    } catch (error) {
      logger.error('Get table sizes error:', error);
      throw error;
    }
  }

  /**
   * Использование индексов
   */
  async getIndexUsage() {
    try {
      const query = `
        SELECT 
          schemaname || '.' || tablename as table_name,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 50
      `;

      const result = await databaseService.query(query);
      
      return result.rows.map(row => ({
        table: row.table_name,
        index: row.indexname,
        scans: parseInt(row.index_scans || 0),
        tuplesRead: parseInt(row.tuples_read || 0),
        tuplesFetched: parseInt(row.tuples_fetched || 0)
      }));
    } catch (error) {
      logger.error('Get index usage error:', error);
      throw error;
    }
  }

  /**
   * Медленные запросы
   */
  async getSlowQueries(limit = 20) {
    try {
      // PostgreSQL не хранит историю запросов по умолчанию
      // Используем pg_stat_statements если доступен
      const query = `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT $1
      `;

      try {
        const result = await databaseService.query(query, [limit]);
        return result.rows.map(row => ({
          query: row.query.substring(0, 200),
          calls: parseInt(row.calls || 0),
          totalTime: parseFloat(row.total_time || 0),
          meanTime: parseFloat(row.mean_time || 0),
          maxTime: parseFloat(row.max_time || 0)
        }));
      } catch (e) {
        // pg_stat_statements не доступен
        logger.warn('pg_stat_statements not available');
        return [];
      }
    } catch (error) {
      logger.error('Get slow queries error:', error);
      return [];
    }
  }

  /**
   * Мониторинг пула соединений
   */
  async getConnectionPoolStats() {
    try {
      const pool = databaseService.query();
      
      // Получаем статистику через pg_stat_activity
      const query = `
        SELECT 
          COUNT(*) as total_connections,
          COUNT(*) FILTER (WHERE state = 'active') as active_connections,
          COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
          COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const result = await databaseService.query(query);
      const row = result.rows[0];

      return {
        total: parseInt(row.total_connections || 0),
        active: parseInt(row.active_connections || 0),
        idle: parseInt(row.idle_connections || 0),
        idleInTransaction: parseInt(row.idle_in_transaction || 0)
      };
    } catch (error) {
      logger.error('Get connection pool stats error:', error);
      throw error;
    }
  }

  /**
   * Анализ БД через Gemini
   */
  async analyzeDatabase() {
    try {
      if (!geminiService.isAvailable()) {
        return { recommendations: [], summary: 'Gemini not available' };
      }

      const [tableSizes, indexUsage, slowQueries, poolStats] = await Promise.all([
        this.getTableSizes(),
        this.getIndexUsage(),
        this.getSlowQueries(10),
        this.getConnectionPoolStats()
      ]);

      const dbMetrics = {
        tables: tableSizes,
        indexes: indexUsage.slice(0, 20),
        slowQueries: slowQueries,
        connections: poolStats
      };

      const prompt = `Проанализируй метрики базы данных PostgreSQL и предложи оптимизации:

Размеры таблиц: ${JSON.stringify(tableSizes.slice(0, 5), null, 2)}
Использование индексов: ${JSON.stringify(indexUsage.slice(0, 5), null, 2)}
Медленные запросы: ${JSON.stringify(slowQueries.slice(0, 3), null, 2)}
Пул соединений: ${JSON.stringify(poolStats, null, 2)}

Верни рекомендации в формате JSON:
{
  "recommendations": [
    {
      "title": "Название",
      "description": "Описание",
      "priority": "high/medium/low",
      "impact": "Ожидаемый эффект",
      "action": "Конкретные шаги"
    }
  ],
  "summary": "Краткое резюме"
}`;

      const response = await geminiService.makeRequest('gemini-pro', prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        logger.warn('Failed to parse database analysis JSON');
      }
      
      return {
        recommendations: [],
        summary: response
      };
    } catch (error) {
      logger.error('Analyze database error:', error);
      throw error;
    }
  }

  /**
   * Статистика пула соединений
   */
  async getConnectionPoolStats() {
    try {
      // Сначала проверим, есть ли таблица messages с новыми полями
      const checkMigration = await databaseService.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name IN ('connection_id', 'is_spam', 'is_deleted', 'moderation_reason', 'sentiment')
      `);
      
      logger.info('Migration check result:', checkMigration.rows.length, 'new columns found');

      const query = `
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const result = await databaseService.query(query);
      const row = result.rows[0];
      
      return {
        totalConnections: parseInt(row.total_connections),
        activeConnections: parseInt(row.active_connections),
        idleConnections: parseInt(row.idle_connections),
        idleInTransaction: parseInt(row.idle_in_transaction),
        utilizationRate: row.total_connections > 0 ? (parseInt(row.active_connections) / parseInt(row.total_connections)) * 100 : 0,
        migrationStatus: checkMigration.rows.length >= 5 ? 'applied' : 'pending'
      };
    } catch (error) {
      logger.error('Get connection pool stats error:', error);
      // Возвращаем базовую информацию если запрос не удался
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        idleInTransaction: 0,
        utilizationRate: 0,
        migrationStatus: 'error',
        error: error.message
      };
    }
  }

  /**
   * Полная сводка по БД
   */
  async getDatabaseOverview() {
    try {
      logger.info('Getting database overview...');
      
      // Проверяем подключение к БД
      const connectionTest = await databaseService.query('SELECT NOW() as current_time');
      logger.info('Database connection test successful:', connectionTest.rows[0]);

      // Получаем данные с обработкой ошибок
      const results = await Promise.allSettled([
        this.getTableSizes().catch(err => {
          logger.error('Table sizes error:', err);
          return { error: 'Failed to get table sizes', details: err.message };
        }),
        this.getIndexUsage().catch(err => {
          logger.error('Index usage error:', err);
          return { error: 'Failed to get index usage', details: err.message };
        }),
        this.getSlowQueries(10).catch(err => {
          logger.error('Slow queries error:', err);
          return { error: 'Failed to get slow queries', details: err.message };
        }),
        this.getConnectionPoolStats().catch(err => {
          logger.error('Connection pool stats error:', err);
          return { error: 'Failed to get connection pool stats', details: err.message };
        })
      ]);

      const [tableSizes, indexUsage, slowQueries, poolStats] = results.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      );

      return {
        tables: tableSizes,
        indexes: indexUsage,
        slowQueries: slowQueries,
        connectionPool: poolStats,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    } catch (error) {
      logger.error('Get database overview error:', error);
      return {
        error: 'Database overview failed',
        details: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      };
    }
  }
}

module.exports = new DatabaseManagementService();

