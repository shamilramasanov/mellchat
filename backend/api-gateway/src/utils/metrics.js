const promClient = require('prom-client');
const logger = require('./logger');

// Создаем реестр метрик
const register = new promClient.Registry();

// Добавляем стандартные метрики Node.js
promClient.collectDefaultMetrics({ register });

logger.info('✅ Metrics initialized');

// Метрики для обработки сообщений
const messageProcessingDuration = new promClient.Histogram({
  name: 'message_processing_duration_seconds',
  help: 'Duration of message processing in seconds',
  labelNames: ['stream_id', 'platform', 'device_type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Метрики для WebSocket соединений
const activeConnections = new promClient.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['device_type', 'platform']
});

// Метрики для базы данных
const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state'] // total, idle, active
});

// Метрики для API запросов
const apiRequestDuration = new promClient.Histogram({
  name: 'api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'device_type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const apiRequestTotal = new promClient.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status_code', 'device_type']
});

// Метрики для rate limiting
const rateLimitHits = new promClient.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['route', 'device_type', 'limit_type']
});

// Метрики для ошибок
const errorTotal = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity', 'component']
});

// Метрики для памяти
const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'] // rss, heapTotal, heapUsed, external
});

// Регистрируем все метрики
register.registerMetric(messageProcessingDuration);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(databaseConnections);
register.registerMetric(apiRequestDuration);
register.registerMetric(apiRequestTotal);
register.registerMetric(rateLimitHits);
register.registerMetric(errorTotal);
register.registerMetric(memoryUsage);

// Функция для обновления метрик памяти
const updateMemoryMetrics = () => {
  const memUsage = process.memoryUsage();
  
  memoryUsage.set({ type: 'rss' }, memUsage.rss);
  memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
  memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
  memoryUsage.set({ type: 'external' }, memUsage.external);
};

// Обновляем метрики памяти каждые 30 секунд
setInterval(updateMemoryMetrics, 30000);

// Middleware для автоматического сбора метрик API
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const deviceType = req.get('X-Device-Type') || 'unknown';
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    apiRequestDuration
      .labels(req.method, route, res.statusCode, deviceType)
      .observe(duration);
      
    apiRequestTotal
      .labels(req.method, route, res.statusCode, deviceType)
      .inc();
      
    logger.performance('API request completed', {
      method: req.method,
      route,
      statusCode: res.statusCode,
      duration,
      deviceType
    });
  });
  
  next();
};

// Функция для логирования ошибок в метрики
const logError = (type, severity, component, error) => {
  errorTotal.labels(type, severity, component).inc();
  
  logger.error('Error occurred', {
    type,
    severity,
    component,
    error: error.message,
    stack: error.stack
  });
};

// Функция для обновления метрик WebSocket
const updateWebSocketMetrics = (connections) => {
  // Сбрасываем все метрики
  activeConnections.reset();
  
  // Обновляем метрики по типам устройств и платформам
  Object.entries(connections).forEach(([key, count]) => {
    const [deviceType, platform] = key.split(':');
    activeConnections.labels(deviceType || 'unknown', platform || 'unknown').set(count);
  });
};

// Функция для обновления метрик базы данных
const updateDatabaseMetrics = (poolStats) => {
  databaseConnections.labels('total').set(poolStats.totalCount);
  databaseConnections.labels('idle').set(poolStats.idleCount);
  databaseConnections.labels('active').set(poolStats.totalCount - poolStats.idleCount);
};

module.exports = {
  register,
  messageProcessingDuration,
  activeConnections,
  databaseQueryDuration,
  databaseConnections,
  apiRequestDuration,
  apiRequestTotal,
  rateLimitHits,
  errorTotal,
  memoryUsage,
  metricsMiddleware,
  logError,
  updateWebSocketMetrics,
  updateDatabaseMetrics
};
