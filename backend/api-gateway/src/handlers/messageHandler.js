const logger = require('../utils/logger');
const databaseService = require('../services/databaseService');
const messageQueueService = require('../services/messageQueueService');
const deviceDetection = require('../utils/deviceDetection');

// Централизованный обработчик сообщений с очередями
class MessageHandler {
  constructor() {
    this.messageQueue = [];
    this.processing = false;
    this.batchMode = true; // Используем батчинг по умолчанию
    this.batchSize = 50;
  }

  // Добавить сообщение в очередь для обработки
  async addMessage(message, connectionId, userAgent = '') {
    try {
      // Нормализуем сообщение
      const normalizedMessage = this.normalizeMessage(message, connectionId);
      
      // Определяем, является ли сообщение вопросом
      const isQuestion = this.detectQuestion(normalizedMessage.text);
      normalizedMessage.isQuestion = isQuestion;
      
      // Определяем тип устройства для адаптивной обработки
      const deviceInfo = deviceDetection.detectDevice(userAgent);
      const adaptiveSettings = deviceDetection.getAdaptiveSettings(deviceInfo);
      
      // Выбираем стратегию обработки
      if (this.batchMode && adaptiveSettings.performance !== 'low') {
        // Используем батчинг для производительных устройств
        messageQueueService.addToBatch(normalizedMessage);
        logger.debug('Message added to batch', { 
          messageId: normalizedMessage.id,
          deviceType: deviceInfo.type,
          performance: deviceInfo.performance
        });
      } else {
        // Используем одиночную обработку для слабых устройств или критичных сообщений
        await messageQueueService.addMessage(normalizedMessage);
        logger.debug('Message added to single queue', { 
          messageId: normalizedMessage.id,
          deviceType: deviceInfo.type,
          isQuestion
        });
      }
      
      return normalizedMessage;
    } catch (error) {
      logger.error('Error adding message to handler:', error);
      throw error;
    }
  }

  // Нормализация сообщения для базы данных
  normalizeMessage(message, connectionId) {
    // Извлекаем streamId из connectionId
    const streamId = this.extractStreamId(connectionId);
    
    const normalizedMessage = {
      id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      streamId: streamId,
      username: message.username || message.sender?.username || 'unknown',
      text: message.text || message.content || message.message || '',
      platform: message.platform || this.extractPlatform(connectionId),
      timestamp: message.timestamp || Date.now(),
      isQuestion: message.isQuestion || false,
      connectionId: connectionId
    };
    
    logger.debug('normalizeMessage result:', { 
      originalConnectionId: connectionId,
      extractedStreamId: streamId,
      normalizedMessage: {
        id: normalizedMessage.id,
        streamId: normalizedMessage.streamId,
        username: normalizedMessage.username,
        platform: normalizedMessage.platform
      }
    });
    
    return normalizedMessage;
  }

  // Извлечь streamId из connectionId
  extractStreamId(connectionId) {
    if (!connectionId) {
      logger.warn('extractStreamId: connectionId is null or undefined');
      return 'unknown';
    }
    
    logger.debug('extractStreamId input:', { connectionId });
    
    // Формат: platform-channel-timestamp
    // Например: twitch-dyrachyo-1761486741039
    const parts = connectionId.split('-');
    if (parts.length >= 2) {
      const streamId = `${parts[0]}-${parts[1]}`;
      logger.debug('extractStreamId result:', { connectionId, streamId, parts });
      return streamId;
    }
    
    logger.warn('extractStreamId: invalid connectionId format', { connectionId, parts });
    return connectionId;
  }

  // Извлечь платформу из connectionId
  extractPlatform(connectionId) {
    if (!connectionId) return 'unknown';
    
    const parts = connectionId.split('-');
    return parts[0] || 'unknown';
  }

  // Принудительный сброс всех батчей
  async flushAllBatches() {
    try {
      await messageQueueService.flushAllBatches();
      logger.info('All message batches flushed');
    } catch (error) {
      logger.error('Error flushing batches:', error);
    }
  }

  // Переключение режима обработки
  setBatchMode(enabled) {
    this.batchMode = enabled;
    logger.info(`Batch mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Настройка размера батча
  setBatchSize(size) {
    this.batchSize = size;
    logger.info(`Batch size set to ${size}`);
  }

  // Простое определение вопросов
  detectQuestion(text) {
    if (!text || typeof text !== 'string') return false;
    
    const questionWords = [
      'как', 'что', 'где', 'когда', 'почему', 'зачем', 'кто', 'чей', 'который',
      'how', 'what', 'where', 'when', 'why', 'who', 'which'
    ];
    
    const questionMarks = ['?', '？'];
    
    const lowerText = text.toLowerCase().trim();
    
    // Проверяем знаки вопроса
    if (questionMarks.some(mark => text.includes(mark))) {
      return true;
    }
    
    // Проверяем вопросительные слова в начале
    if (questionWords.some(word => lowerText.startsWith(word + ' '))) {
      return true;
    }
    
    // Проверяем вопросительные слова в середине
    if (questionWords.some(word => lowerText.includes(' ' + word + ' '))) {
      return true;
    }
    
    return false;
  }

  // Получить статистику обработки
  async getStats() {
    try {
      const queueStats = await messageQueueService.getQueueStats();
      return {
        batchMode: this.batchMode,
        batchSize: this.batchSize,
        queues: queueStats,
        deviceDetection: deviceDetection.getCacheStats()
      };
    } catch (error) {
      logger.error('Error getting handler stats:', error);
      return {
        batchMode: this.batchMode,
        batchSize: this.batchSize,
        error: error.message
      };
    }
  }
}

// Создаем глобальный экземпляр
const messageHandler = new MessageHandler();

module.exports = messageHandler;