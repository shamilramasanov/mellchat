const express = require('express');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/v1/database/monitoring/status
 * Получить текущий статус БД
 */
router.get('/status', async (req, res) => {
  try {
    const query = `
      SELECT * FROM current_db_status
      ORDER BY metric
    `;
    
    const result = await databaseService.query(query);
    
    const status = {
      timestamp: new Date().toISOString(),
      database: process.env.POSTGRES_DB || 'mellchat',
      metrics: result.rows.reduce((acc, row) => {
        acc[row.metric] = {
          value: row.value,
          unit: row.unit
        };
        return acc;
      }, {})
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Error getting database status:', error);
    res.status(500).json({
      error: 'Failed to get database status',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/database/monitoring/tables
 * Получить анализ таблиц
 */
router.get('/tables', async (req, res) => {
  try {
    const query = `
      SELECT * FROM table_analysis
      ORDER BY total_size DESC
    `;
    
    const result = await databaseService.query(query);
    
    res.json({
      timestamp: new Date().toISOString(),
      tables: result.rows
    });
  } catch (error) {
    logger.error('Error getting table analysis:', error);
    res.status(500).json({
      error: 'Failed to get table analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/database/monitoring/slow-queries
 * Получить медленные запросы
 */
router.get('/slow-queries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const hours = parseInt(req.query.hours) || 1;
    
    const query = `
      SELECT * FROM get_top_slow_queries($1)
    `;
    
    const result = await databaseService.query(query, [limit]);
    
    res.json({
      timestamp: new Date().toISOString(),
      period_hours: hours,
      slow_queries: result.rows
    });
  } catch (error) {
    logger.error('Error getting slow queries:', error);
    res.status(500).json({
      error: 'Failed to get slow queries',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/database/monitoring/index-usage
 * Получить статистику использования индексов
 */
router.get('/index-usage', async (req, res) => {
  try {
    const query = `
      SELECT * FROM analyze_index_usage()
      ORDER BY reads DESC
    `;
    
    const result = await databaseService.query(query);
    
    res.json({
      timestamp: new Date().toISOString(),
      index_usage: result.rows
    });
  } catch (error) {
    logger.error('Error getting index usage:', error);
    res.status(500).json({
      error: 'Failed to get index usage',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/database/monitoring/metrics
 * Получить метрики производительности
 */
router.get('/metrics', async (req, res) => {
  try {
    const metricName = req.query.metric || 'database_size_bytes';
    const hours = parseInt(req.query.hours) || 24;
    
    const query = `
      SELECT * FROM analyze_performance_metrics($1)
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      ORDER BY timestamp DESC
    `;
    
    const result = await databaseService.query(query, [metricName]);
    
    res.json({
      timestamp: new Date().toISOString(),
      metric_name: metricName,
      period_hours: hours,
      metrics: result.rows
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/database/monitoring/collect
 * Принудительно собрать метрики
 */
router.post('/collect', async (req, res) => {
  try {
    const query = `SELECT collect_all_metrics()`;
    await databaseService.query(query);
    
    res.json({
      success: true,
      message: 'Metrics collected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error collecting metrics:', error);
    res.status(500).json({
      error: 'Failed to collect metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/database/monitoring/cleanup
 * Очистить старые метрики
 */
router.post('/cleanup', async (req, res) => {
  try {
    const query = `SELECT cleanup_old_metrics()`;
    await databaseService.query(query);
    
    res.json({
      success: true,
      message: 'Old metrics cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error cleaning up metrics:', error);
    res.status(500).json({
      error: 'Failed to cleanup metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/database/monitoring/export
 * Экспортировать метрики в JSON
 */
router.get('/export', async (req, res) => {
  try {
    const query = `SELECT export_metrics_to_json() as metrics`;
    const result = await databaseService.query(query);
    
    res.json(result.rows[0].metrics);
  } catch (error) {
    logger.error('Error exporting metrics:', error);
    res.status(500).json({
      error: 'Failed to export metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/database/monitoring/health
 * Проверка здоровья БД с детальной информацией
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Проверяем подключение к БД
    const connectionTest = await databaseService.query('SELECT 1 as test');
    
    // Получаем базовые метрики
    const statusQuery = `SELECT * FROM current_db_status`;
    const statusResult = await databaseService.query(statusQuery);
    
    // Проверяем медленные запросы
    const slowQueriesQuery = `SELECT count(*) as count FROM slow_queries WHERE timestamp > NOW() - INTERVAL '1 hour'`;
    const slowQueriesResult = await databaseService.query(slowQueriesQuery);
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      database: {
        connected: connectionTest.rows[0].test === 1,
        metrics: statusResult.rows.reduce((acc, row) => {
          acc[row.metric] = {
            value: row.value,
            unit: row.unit
          };
          return acc;
        }, {}),
        slow_queries_count: parseInt(slowQueriesResult.rows[0].count)
      },
      performance: {
        response_time: responseTime < 1000 ? 'excellent' : responseTime < 3000 ? 'good' : 'poor',
        slow_queries: parseInt(slowQueriesResult.rows[0].count) === 0 ? 'excellent' : 'needs_attention'
      }
    };
    
    // Определяем общий статус
    if (responseTime > 5000 || parseInt(slowQueriesResult.rows[0].count) > 10) {
      health.status = 'degraded';
    }
    
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Error checking database health:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
