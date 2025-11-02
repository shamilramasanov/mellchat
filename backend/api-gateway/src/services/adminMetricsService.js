const databaseService = require('../services/databaseService');
const redisService = require('../services/redisService');
const logger = require('../utils/logger');

class AdminMetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 секунд кэш
  }

  // Получение активных соединений
  async getActiveConnections() {
    try {
      // Получаем количество активных WebSocket соединений через глобальную переменную
      if (global.wsHub && global.wsHub.wss) {
        return global.wsHub.wss.clients.size;
      }
      return 0;
    } catch (error) {
      logger.error('Error getting active connections:', error.message);
      return 0;
    }
  }

  // Получение сообщений в секунду
  async getMessagesPerSecond() {
    try {
      const cacheKey = 'messages_per_second';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      // Получаем количество сообщений за последнюю минуту
      const query = `
        SELECT COUNT(*) as count
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '1 minute'
      `;
      
      const result = await databaseService.query(query);
      const messagesPerMinute = result.rows[0]?.count || 0;
      const messagesPerSecond = messagesPerMinute / 60;

      this.cache.set(cacheKey, {
        value: messagesPerSecond,
        timestamp: Date.now()
      });

      return messagesPerSecond;
    } catch (error) {
      logger.error('Error getting messages per second:', error.message);
      return 0;
    }
  }

  // Получение пользователей онлайн
  async getUsersOnline() {
    try {
      const cacheKey = 'users_online';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      // Получаем уникальных пользователей за последний час
      const query = `
        SELECT COUNT(DISTINCT username) as count
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `;
      
      const result = await databaseService.query(query);
      const usersOnline = result.rows[0]?.count || 0;

      this.cache.set(cacheKey, {
        value: usersOnline,
        timestamp: Date.now()
      });

      return usersOnline;
    } catch (error) {
      logger.error('Error getting users online:', error.message);
      return 0;
    }
  }

  // Получение статуса платформ
  async getPlatformStatus() {
    try {
      const cacheKey = 'platform_status';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      // Получаем количество сообщений по платформам за последние 5 минут
      const query = `
        SELECT platform, COUNT(*) as count
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '5 minutes'
        GROUP BY platform
      `;
      
      const result = await databaseService.query(query);
      const platformCounts = {};
      
      result.rows.forEach(row => {
        platformCounts[row.platform] = parseInt(row.count);
      });

      // Определяем статус платформ
      const status = {
        twitch: platformCounts.twitch > 0 ? 'healthy' : 'warning',
        youtube: platformCounts.youtube > 0 ? 'healthy' : 'warning',
        kick: platformCounts.kick > 0 ? 'healthy' : 'warning'
      };

      this.cache.set(cacheKey, {
        value: status,
        timestamp: Date.now()
      });

      return status;
    } catch (error) {
      logger.error('Error getting platform status:', error.message);
      return {
        twitch: 'unknown',
        youtube: 'unknown',
        kick: 'unknown'
      };
    }
  }

  // Получение производительности БД
  async getDatabasePerformance() {
    try {
      const cacheKey = 'db_performance';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      // Тестируем время выполнения простого запроса
      const startTime = Date.now();
      await databaseService.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      // Получаем количество медленных запросов (если есть таблица логов)
      const slowQueries = 0; // Пока заглушка

      const performance = {
        avgResponseTime: responseTime,
        slowQueries: slowQueries
      };

      this.cache.set(cacheKey, {
        value: performance,
        timestamp: Date.now()
      });

      return performance;
    } catch (error) {
      logger.error('Error getting database performance:', error.message);
      return {
        avgResponseTime: 0,
        slowQueries: 0
      };
    }
  }

  // Получение статуса Redis
  async getRedisStatus() {
    try {
      const cacheKey = 'redis_status';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      // Получаем информацию о Redis
      const client = await redisService.getClient();
      if (!client) {
        return {
          memoryUsage: 0,
          keyCount: 0
        };
      }

      const info = await client.info('memory');
      const dbSize = await client.dbSize();

      // Парсим информацию о памяти
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      const status = {
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
        keyCount: dbSize
      };

      this.cache.set(cacheKey, {
        value: status,
        timestamp: Date.now()
      });

      return status;
    } catch (error) {
      logger.error('Error getting Redis status:', { error: error.message, stack: error.stack });
      return {
        memoryUsage: 0,
        keyCount: 0
      };
    }
  }

  // Получение статуса ИИ
  async getAIStatus() {
    try {
      // Проверяем доступность ИИ сервисов
      const sentimentService = require('../services/sentimentService');
      const spamDetector = require('../services/adaptiveSpamDetector');

      const status = {
        available: true,
        lastUpdate: new Date().toISOString(),
        services: {
          sentiment: sentimentService ? 'available' : 'unavailable',
          spamDetection: spamDetector ? 'available' : 'unavailable'
        }
      };

      return status;
    } catch (error) {
      logger.error('Error getting AI status:', error.message);
      return {
        available: false,
        lastUpdate: new Date().toISOString(),
        services: {
          sentiment: 'unavailable',
          spamDetection: 'unavailable'
        }
      };
    }
  }

  // Получение общего количества сообщений в БД
  async getTotalMessagesCount() {
    try {
      const cacheKey = 'total_messages_count';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) { // Кэш на 60 секунд
        return cached.value;
      }

      const query = `SELECT COUNT(*) as total FROM messages WHERE is_deleted = false`;
      const result = await databaseService.query(query);
      const total = parseInt(result.rows[0]?.total || 0);

      this.cache.set(cacheKey, {
        value: total,
        timestamp: Date.now()
      });

      return total;
    } catch (error) {
      logger.error('Error getting total messages count:', error.message);
      return 0;
    }
  }

  // Получение статистики гостей
  async getGuestsStats() {
    try {
      const guestSessionService = require('./guestSessionService');
      const stats = await guestSessionService.getGuestStats();
      return stats;
    } catch (error) {
      logger.error('Error getting guests stats:', error.message);
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
  }

  // Получение всех метрик
  async getAllMetrics() {
    try {
      const [
        activeConnections,
        messagesPerSecond,
        usersOnline,
        platformStatus,
        dbPerformance,
        redisStatus,
        aiStatus,
        guestsStats,
        totalMessagesCount
      ] = await Promise.all([
        this.getActiveConnections(),
        this.getMessagesPerSecond(),
        this.getUsersOnline(),
        this.getPlatformStatus(),
        this.getDatabasePerformance(),
        this.getRedisStatus(),
        this.getAIStatus(),
        this.getGuestsStats(),
        this.getTotalMessagesCount()
      ]);

      return {
        activeConnections,
        messagesPerSecond,
        usersOnline,
        platformStatus,
        dbPerformance,
        redisStatus,
        aiStatus,
        guestsStats,
        totalMessagesCount
      };
    } catch (error) {
      logger.error('Error getting all metrics:', error.message);
      return {
        activeConnections: 0,
        messagesPerSecond: 0,
        usersOnline: 0,
        platformStatus: {
          twitch: 'unknown',
          youtube: 'unknown',
          kick: 'unknown'
        },
        dbPerformance: {
          avgResponseTime: 0,
          slowQueries: 0
        },
        redisStatus: {
          memoryUsage: 0,
          keyCount: 0
        },
        aiStatus: {
          available: false,
          lastUpdate: new Date().toISOString()
        },
        guestsStats: {
          activeGuests: 0,
          inactiveGuests: 0,
          totalGuests: 0,
          uniqueIPs: 0,
          totalStreamsOpened: 0,
          totalMessagesViewed: 0,
          avgStreamsPerSession: 0,
          avgMessagesPerSession: 0
        },
        totalMessagesCount: 0
      };
    }
  }

  // Получение данных для графиков
  async getChartData(timeRange = '24h') {
    try {
      const intervals = {
        '1h': '5 minutes',
        '24h': '1 hour',
        '7d': '1 day',
        '30d': '1 day'
      };

      const interval = intervals[timeRange] || '1 hour';
      
      // Получаем данные о потоке сообщений
      const messageFlowQuery = `
        SELECT 
          DATE_TRUNC('${interval}', created_at) as time_bucket,
          COUNT(*) as message_count
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '${timeRange}'
        GROUP BY time_bucket
        ORDER BY time_bucket
      `;

      const messageFlowResult = await databaseService.query(messageFlowQuery);
      
      // Получаем распределение по платформам
      const platformDistributionQuery = `
        SELECT 
          platform,
          COUNT(*) as message_count
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '${timeRange}'
        GROUP BY platform
      `;

      const platformResult = await databaseService.query(platformDistributionQuery);

      // Получаем тренды настроений
      const sentimentQuery = `
        SELECT 
          DATE_TRUNC('${interval}', created_at) as time_bucket,
          sentiment,
          COUNT(*) as count
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '${timeRange}'
          AND sentiment IS NOT NULL
        GROUP BY time_bucket, sentiment
        ORDER BY time_bucket
      `;

      const sentimentResult = await databaseService.query(sentimentQuery);

      // Форматируем данные для графиков
      const messageFlow = messageFlowResult.rows.map(row => ({
        x: row.time_bucket.toISOString(),
        y: parseInt(row.message_count)
      }));

      const platformDistribution = {
        labels: platformResult.rows.map(row => row.platform),
        datasets: [{
          data: platformResult.rows.map(row => parseInt(row.message_count)),
          backgroundColor: ['#9146ff', '#ff0000', '#53fc18']
        }]
      };

      // Группируем данные настроений
      const sentimentData = {};
      sentimentResult.rows.forEach(row => {
        const timeKey = row.time_bucket.toISOString();
        if (!sentimentData[timeKey]) {
          sentimentData[timeKey] = { happy: 0, neutral: 0, sad: 0 };
        }
        sentimentData[timeKey][row.sentiment] = parseInt(row.count);
      });

      const sentimentTrends = Object.entries(sentimentData).map(([time, data]) => ({
        x: time,
        happy: data.happy,
        neutral: data.neutral,
        sad: data.sad
      }));

      return {
        messageFlow: {
          datasets: [{
            label: 'Messages',
            data: messageFlow,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        },
        platformDistribution,
        sentimentTrends: {
          datasets: [
            {
              label: 'Happy',
              data: sentimentTrends.map(item => ({ x: item.x, y: item.happy })),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4
            },
            {
              label: 'Neutral',
              data: sentimentTrends.map(item => ({ x: item.x, y: item.neutral })),
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4
            },
            {
              label: 'Sad',
              data: sentimentTrends.map(item => ({ x: item.x, y: item.sad })),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4
            }
          ]
        },
        systemLoad: {
          labels: ['CPU', 'Memory', 'Network', 'Database'],
          datasets: [{
            label: 'Usage %',
            data: [65, 78, 45, 82], // Пока заглушка
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }]
        }
      };
    } catch (error) {
      logger.error('Error getting chart data:', error.message);
      return {
        messageFlow: { datasets: [] },
        platformDistribution: { labels: [], datasets: [] },
        sentimentTrends: { datasets: [] },
        systemLoad: { labels: [], datasets: [] }
      };
    }
  }

  // Очистка кэша
  clearCache() {
    this.cache.clear();
    logger.info('Admin metrics cache cleared');
  }
}

module.exports = new AdminMetricsService();
