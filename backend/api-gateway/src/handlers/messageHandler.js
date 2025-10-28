const logger = require('../utils/logger');
const databaseService = require('../services/databaseService');
const messageQueueService = require('../services/messageQueueService');
const deviceDetection = require('../utils/deviceDetection');
const sentimentService = require('../services/sentimentService');
const messageScoringEngine = require('../services/messageScoringEngine');
const userReputationManager = require('../services/userReputationManager');

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
      
      // 🎯 Адаптивная детекция спама (получаем features)
      const adaptiveSpamDetector = require('../services/adaptiveSpamDetector');
      const features = adaptiveSpamDetector.extractFeatures(normalizedMessage.text);
      
      // 🧠 Интеллектуальная оценка качества сообщения (Message Score)
      const messageScore = messageScoringEngine.calculateMessageScore(normalizedMessage, features || {});
      const messageClassification = messageScoringEngine.classifyMessage(messageScore);
      
      // 🚫 Сообщения с низким Score считаем спамом
      const isSpam = messageClassification === 'spam';
      normalizedMessage.isSpam = isSpam;
      normalizedMessage.messageScore = messageScore;
      normalizedMessage.messageClassification = messageClassification;
      
      // Обновляем репутацию пользователя
      messageScoringEngine.updateUserReputation(normalizedMessage, messageScore);
      
      // 🚫 Спам не анализируем по sentiment и не сохраняем в БД
      if (isSpam) {
        logger.debug('🚫 Spam detected (score:', messageScore, '):', normalizedMessage.text.substring(0, 30));
        normalizedMessage.sentiment = 'neutral'; // Спаму ставим нейтральный sentiment
        // Возвращаем сообщение для WebSocket, но не сохраняем в БД и не учитываем в mood
        return normalizedMessage;
      }
      
      // Анализируем sentiment сообщения (только для НЕ-спама)
      const sentiment = sentimentService.analyzeSentiment(normalizedMessage);
      sentimentService.updateMood(sentiment);
      normalizedMessage.sentiment = sentiment;
      
      logger.info('🎭 Message analysis:', { 
        text: normalizedMessage.text.substring(0, 30), 
        sentiment,
        messageScore,
        messageClassification,
        isSpam,
        isQuestion
      });
      
      // Определяем тип устройства для адаптивной обработки
      const deviceInfo = deviceDetection.detectDevice(userAgent);
      const adaptiveSettings = deviceDetection.getAdaptiveSettings(deviceInfo);
      
      // Выбираем стратегию обработки (только для не-спама)
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

  // 🎯 Умная детекция спама
  detectSpam(text) {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    let spamScore = 0;
    
    // 1. Очень короткие сообщения (< 3 символов)
    if (trimmed.length < 3) {
      return true;
    }
    
    // 2. Словарь коротких спам-слов
    const spamWords = [
      'gg', 'no', 'pls', 'yes', 'ok', 'xd', 'lol', 'lmao', 'omg',
      'w', 'www', 'wtf', 'yup', 'nope', 'wow', 'f', 'rip', 'kys',
      'ez', 'op', 'nerf', 'buff', 'hf', 'gl', 'ty', 'ggs', 'wp',
      'cap', 'sus', 'fr', 'ur', 'u', 'y', 'n', 'r', 'c', 'v',
      'bro', 'dude', 'bruh', 'damn', 'ew', 'oof', 'ugh', 'ahh',
      'nah', 'yea', 'yeah', 'yep', 'naw', 'lmaoo', 'lmaooo',
      'pfft', 'tf', 'ggs', 'keks', 'kekw', 'kek', 'gah', 'sheesh'
    ];
    
    // Проверяем слово целиком
    if (spamWords.includes(trimmed.toLowerCase())) {
      return true;
    }
    
    // Проверяем спам-слова внутри сообщения (если сообщение состоит в основном из спам-слов)
    const words = trimmed.toLowerCase().split(/\s+/);
    const spamCount = words.filter(w => spamWords.includes(w)).length;
    if (words.length <= 3 && spamCount > 0) {
      // Если сообщение содержит 3 или меньше слов и хотя бы одно - спам
      return true;
    }
    
    // 3. Повторяющиеся символы (aaa, www, ???)
    if (/^([a-z?])\1{2,}$/i.test(trimmed)) {
      return true;
    }
    
    // 4. Много одинаковых символов подряд (> 5)
    if (/(.)\1{5,}/i.test(trimmed)) {
      spamScore += 2;
    }
    
    // 5. Большое количество эмодзи (> 5 эмодзи)
    const emojiMatch = trimmed.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    if (emojiMatch && emojiMatch.length > 5) {
      spamScore += 1;
    }
    
    // 6. Большое количество вопросительных/восклицательных знаков (> 3)
    const exclamations = (trimmed.match(/[!?]/g) || []).length;
    if (exclamations > 3) {
      spamScore += 1;
    }
    
    // 7. Только заглавные буквы (кричащие сообщения)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && /[A-Z]/.test(trimmed)) {
      spamScore += 1;
    }
    
    // 8. Большой процент повторяющихся слов
    const words2 = trimmed.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words2);
    if (words2.length > 3 && uniqueWords.size / words2.length < 0.5) {
      spamScore += 1;
    }
    
    // Более строгая фильтрация: spamScore >= 1
    return spamScore >= 1;
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