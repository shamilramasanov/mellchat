const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../utils/logger');
const databaseService = require('../services/databaseService');
const { messageProcessingDuration, logError } = require('../utils/metrics');

// Создаем Redis соединение для BullMQ с fallback
let redisConnection;
let useBullMQ = false;

try {
  redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000
  });

  redisConnection.on('error', (err) => {
    logger.warn('Redis connection error for BullMQ, falling back to direct processing:', err.message);
    useBullMQ = false;
  });

  redisConnection.on('connect', () => {
    logger.info('Redis connected for BullMQ queues');
    useBullMQ = true;
  });

  // Пытаемся подключиться
  redisConnection.connect().catch(() => {
    logger.warn('Failed to connect to Redis for BullMQ, using direct processing');
    useBullMQ = false;
  });
} catch (error) {
  logger.warn('Redis not available for BullMQ, using direct processing:', error.message);
  useBullMQ = false;
}

// Создаем очереди только если Redis доступен
let messageQueue, batchQueue, messageWorker, batchWorker;

if (useBullMQ && redisConnection) {
  messageQueue = new Queue('message-processing', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 100, // Храним последние 100 завершенных задач
      removeOnFail: 50,      // Храним последние 50 неудачных задач
      attempts: 3,           // 3 попытки
      backoff: {
        type: 'exponential',
        delay: 2000,          // Начинаем с 2 сек, экспоненциально увеличиваем
      },
      delay: 0,               // Без задержки
    }
  });

  batchQueue = new Queue('batch-processing', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      delay: 100,             // Небольшая задержка для группировки
    }
  });

  // Воркер для обработки одиночных сообщений
  messageWorker = new Worker('message-processing', async (job) => {
    const startTime = Date.now();
    const { message } = job.data;
    
    try {
      logger.debug('Processing single message', { 
        messageId: message.id, 
        streamId: message.streamId,
        platform: message.platform 
      });

      // Сохраняем сообщение в БД
      await databaseService.saveMessage(message);
      
      // Обновляем метрики
      const duration = (Date.now() - startTime) / 1000;
      messageProcessingDuration
        .labels(message.streamId, message.platform, 'single')
        .observe(duration);

      logger.debug('Message processed successfully', { 
        messageId: message.id,
        duration 
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      logger.error('Failed to process message', { 
        messageId: message.id, 
        error: error.message 
      });
      
      logError('message_processing', 'error', 'database', error);
      throw error;
    }
  }, {
    connection: redisConnection,
    concurrency: 5, // Обрабатываем до 5 сообщений параллельно
  });

  // Воркер для обработки батчей сообщений
  batchWorker = new Worker('batch-processing', async (job) => {
    const startTime = Date.now();
    const { messages, streamId } = job.data;
    
    try {
      logger.debug('Processing message batch', { 
        streamId,
        messageCount: messages.length 
      });

      // Сохраняем батч в БД
      await databaseService.saveMessageBatch(messages);
      
      // Обновляем метрики
      const duration = (Date.now() - startTime) / 1000;
      messageProcessingDuration
        .labels(streamId, 'batch', 'batch')
        .observe(duration);

      logger.debug('Message batch processed successfully', { 
        streamId,
        messageCount: messages.length,
        duration 
      });

      return { success: true, messageCount: messages.length };
    } catch (error) {
      logger.error('Failed to process message batch', { 
        streamId,
        messageCount: messages.length,
        error: error.message 
      });
      
      logError('batch_processing', 'error', 'database', error);
      throw error;
    }
  }, {
    connection: redisConnection,
    concurrency: 2, // Обрабатываем до 2 батчей параллельно
  });

  // Обработчики событий для воркеров
  messageWorker.on('completed', (job) => {
    logger.debug('Message job completed', { 
      jobId: job.id,
      messageId: job.data.message.id 
    });
  });

  messageWorker.on('failed', (job, err) => {
    logger.error('Message job failed', { 
      jobId: job.id,
      messageId: job.data.message.id,
      error: err.message 
    });
  });

  batchWorker.on('completed', (job) => {
    logger.debug('Batch job completed', { 
      jobId: job.id,
      messageCount: job.data.messages.length 
    });
  });

  batchWorker.on('failed', (job, err) => {
    logger.error('Batch job failed', { 
      jobId: job.id,
      messageCount: job.data.messages.length,
      error: err.message 
    });
  });
} else {
  logger.info('BullMQ queues not available, using direct processing');
}

// Класс для управления очередями сообщений
class MessageQueueService {
  constructor() {
    this.batches = new Map(); // streamId -> messages[]
    this.batchSize = 50;      // Размер батча
    this.flushInterval = 1000; // Интервал сброса батча (1 сек)
    this.flushTimer = null;
    
    this.startBatchFlushTimer();
  }

  // Добавление сообщения в очередь
  async addMessage(message) {
    try {
      if (!useBullMQ || !messageQueue) {
        // Fallback: прямое сохранение в БД
        await databaseService.saveMessage(message);
        logger.debug('Message saved directly to DB (fallback)', { 
          messageId: message.id 
        });
        return { success: true, messageId: message.id };
      }

      // Определяем приоритет (вопросы имеют высший приоритет)
      const priority = message.isQuestion ? 1 : 2;
      
      const job = await messageQueue.add('process-message', { message }, {
        priority,
        jobId: `msg-${message.id}`, // Уникальный ID для предотвращения дубликатов
      });

      logger.debug('Message added to queue', { 
        messageId: message.id,
        jobId: job.id,
        priority 
      });

      return job;
    } catch (error) {
      logger.error('Failed to add message to queue', { 
        messageId: message.id,
        error: error.message 
      });
      throw error;
    }
  }

  // Добавление сообщения в батч
  addToBatch(message) {
    const streamId = message.streamId;
    
    if (!this.batches.has(streamId)) {
      this.batches.set(streamId, []);
    }
    
    this.batches.get(streamId).push(message);
    
    // Если батч заполнен, обрабатываем сразу
    if (this.batches.get(streamId).length >= this.batchSize) {
      this.flushBatch(streamId);
    }
  }

  // Сброс батча
  async flushBatch(streamId) {
    const messages = this.batches.get(streamId);
    if (!messages || messages.length === 0) return;
    
    try {
      if (!useBullMQ || !batchQueue) {
        // Fallback: прямое сохранение батча в БД
        await databaseService.saveMessageBatch([...messages]);
        logger.debug('Batch saved directly to DB (fallback)', { 
          streamId,
          messageCount: messages.length 
        });
        this.batches.set(streamId, []);
        return;
      }

      const job = await batchQueue.add('process-batch', { 
        messages: [...messages], 
        streamId 
      }, {
        priority: 1, // Батчи имеют высший приоритет
        jobId: `batch-${streamId}-${Date.now()}`, // Уникальный ID
      });

      logger.debug('Batch flushed to queue', { 
        streamId,
        messageCount: messages.length,
        jobId: job.id 
      });

      // Очищаем батч
      this.batches.set(streamId, []);
    } catch (error) {
      logger.error('Failed to flush batch', { 
        streamId,
        messageCount: messages.length,
        error: error.message 
      });
    }
  }

  // Сброс всех батчей
  async flushAllBatches() {
    const promises = [];
    for (const streamId of this.batches.keys()) {
      promises.push(this.flushBatch(streamId));
    }
    await Promise.all(promises);
  }

  // Таймер для периодического сброса батчей
  startBatchFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flushAllBatches();
    }, this.flushInterval);
  }

  // Остановка таймера
  stopBatchFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Получение статистики очередей
  async getQueueStats() {
    try {
      if (!useBullMQ || !messageQueue || !batchQueue) {
        return {
          messageQueue: { waiting: 0, active: 0, completed: 0, failed: 0 },
          batchQueue: { waiting: 0, active: 0, completed: 0, failed: 0 },
          batches: {
            count: this.batches.size,
            totalMessages: Array.from(this.batches.values()).reduce((sum, batch) => sum + batch.length, 0)
          },
          mode: 'fallback'
        };
      }

      const [messageWaiting, messageActive, messageCompleted, messageFailed] = await Promise.all([
        messageQueue.getWaiting(),
        messageQueue.getActive(),
        messageQueue.getCompleted(),
        messageQueue.getFailed()
      ]);

      const [batchWaiting, batchActive, batchCompleted, batchFailed] = await Promise.all([
        batchQueue.getWaiting(),
        batchQueue.getActive(),
        batchQueue.getCompleted(),
        batchQueue.getFailed()
      ]);

      return {
        messageQueue: {
          waiting: messageWaiting.length,
          active: messageActive.length,
          completed: messageCompleted.length,
          failed: messageFailed.length
        },
        batchQueue: {
          waiting: batchWaiting.length,
          active: batchActive.length,
          completed: batchCompleted.length,
          failed: batchFailed.length
        },
        batches: {
          count: this.batches.size,
          totalMessages: Array.from(this.batches.values()).reduce((sum, batch) => sum + batch.length, 0)
        },
        mode: 'bullmq'
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { error: error.message });
      return null;
    }
  }

  // Очистка очередей
  async clearQueues() {
    try {
      await Promise.all([
        messageQueue.obliterate({ force: true }),
        batchQueue.obliterate({ force: true })
      ]);
      
      // Очищаем батчи
      this.batches.clear();
      
      logger.info('Queues cleared successfully');
    } catch (error) {
      logger.error('Failed to clear queues', { error: error.message });
      throw error;
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down message queue service...');
    
    // Сбрасываем все батчи
    await this.flushAllBatches();
    
    // Останавливаем таймер
    this.stopBatchFlushTimer();
    
    if (useBullMQ && messageWorker && batchWorker) {
      // Закрываем воркеры
      await Promise.all([
        messageWorker.close(),
        batchWorker.close()
      ]);
      
      // Закрываем очереди
      await Promise.all([
        messageQueue.close(),
        batchQueue.close()
      ]);
    }
    
    // Закрываем Redis соединение
    if (redisConnection) {
      await redisConnection.quit();
    }
    
    logger.info('Message queue service shutdown complete');
  }
}

// Создаем экземпляр сервиса
const messageQueueService = new MessageQueueService();

// Graceful shutdown при завершении процесса
process.on('SIGTERM', async () => {
  await messageQueueService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await messageQueueService.shutdown();
  process.exit(0);
});

module.exports = messageQueueService;
