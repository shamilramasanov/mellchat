// Adaptive Spam Detection Service - система самообучения для определения спама
const logger = require('../utils/logger');

class AdaptiveSpamDetector {
  constructor() {
    // Статистика сообщений
    this.messageStats = {
      spam: [],      // Примеры спама
      normal: [],    // Примеры нормальных сообщений
      features: {    // Средние значения признаков
        spamLength: 0,
        normalLength: 0,
        spamRepetition: 0,
        normalRepetition: 0,
        spamEmojiCount: 0,
        normalEmojiCount: 0,
        spamCapsRatio: 0,
        normalCapsRatio: 0
      }
    };
    
    // Пороги для определения спама (адаптивные)
    // НАЧАЛЬНЫЙ РЕЖИМ: ОЧЕНЬ СТРОГИЙ (скрываем почти всё)
    this.thresholds = {
      length: 20,          // Минимальная длина нормального сообщения (строго!)
      repetition: 0.1,     // Порог повторяющихся символов (строго!)
      emojiRatio: 0.2,     // Доля эмодзи в сообщении (строго!)
      capsRatio: 0.5,      // Доля заглавных букв (строго!)
      spamWordsRatio: 0.3  // Доля спам-слов (строго!)
    };
    
    // Счетчики для адаптации
    this.samplesCount = 0;
    this.maxSamples = 1000; // Максимум примеров для обучения
  }
  
  /**
   * Извлекает признаки из сообщения
   */
  extractFeatures(text) {
    if (!text) return null;
    
    const trimmed = text.trim();
    
    return {
      length: trimmed.length,
      wordCount: trimmed.split(/\s+/).length,
      repetitionScore: this.calculateRepetition(trimmed),
      emojiRatio: this.calculateEmojiRatio(trimmed),
      capsRatio: this.calculateCapsRatio(trimmed),
      exclamationRatio: this.calculateExclamationRatio(trimmed),
      spamWordsRatio: this.calculateSpamWordsRatio(trimmed),
      hasUrl: /http/i.test(trimmed),
      digitRatio: (trimmed.match(/\d/g) || []).length / trimmed.length
    };
  }
  
  /**
   * Подсчитывает повторяющиеся символы
   */
  calculateRepetition(text) {
    const matches = text.match(/(.)\1{1,}/g) || [];
    const totalRepetition = matches.reduce((sum, match) => sum + match.length, 0);
    return totalRepetition / text.length;
  }
  
  /**
   * Подсчитывает долю эмодзи
   */
  calculateEmojiRatio(text) {
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = (text.match(emojiPattern) || []).length;
    return emojiCount / text.length;
  }
  
  /**
   * Подсчитывает долю заглавных букв
   */
  calculateCapsRatio(text) {
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const lettersCount = (text.match(/[A-Za-z]/g) || []).length;
    return lettersCount > 0 ? capsCount / lettersCount : 0;
  }
  
  /**
   * Подсчитывает долю восклицательных знаков
   */
  calculateExclamationRatio(text) {
    const exclamationCount = (text.match(/[!?]/g) || []).length;
    return exclamationCount / text.length;
  }
  
  /**
   * Подсчитывает долю спам-слов
   */
  calculateSpamWordsRatio(text) {
    const spamWords = ['gg', 'lol', 'omg', 'wtf', 'bro', 'dude', 'yea', 'yeah', 'yep', 'nah'];
    const words = text.toLowerCase().split(/\s+/);
    const spamCount = words.filter(w => spamWords.includes(w)).length;
    return words.length > 0 ? spamCount / words.length : 0;
  }
  
  /**
   * Определяет, является ли сообщение спамом (на основе признаков)
   */
  detectSpam(text) {
    const features = this.extractFeatures(text);
    if (!features) return false;
    
    // Быстрые проверки
    if (features.length < 3) return true;
    
    // ✅ ПРОВЕРКА ПОВТОРЯЮЩИХСЯ СЛОВ (новый способ обнаружения спама)
    // Пример: "DinoDance DinoDance DinoDance" = спам
    // Пример: "evelon1Angry evelon1Angry evelon1Angry" = спам
    const words = text.trim().split(/\s+/);
    if (words.length > 1) {
      const wordCounts = {};
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
      
      // Если одно слово повторяется >= 3 раза - это спам
      const maxRepeat = Math.max(...Object.values(wordCounts));
      if (maxRepeat >= 3 && words.length >= 3) {
        logger.debug('🚫 Spam detected by word repetition:', { text: text.substring(0, 50), maxRepeat, words });
        return true;
      }
      
      // Если большинство слов одинаковые (>= 50% повторений) - строже для коротких сообщений
      const totalRepeats = Object.values(wordCounts).filter(count => count > 1).reduce((sum, count) => sum + count, 0);
      
      // Для 3+ слов: если >= 50% повторений
      if (words.length >= 3 && totalRepeats / words.length >= 0.5) {
        logger.debug('🚫 Spam detected by high repetition ratio:', { text: text.substring(0, 50), ratio: totalRepeats / words.length });
        return true;
      }
      
      // Строже для 4-7 слов: если >= 40% повторений
      if (words.length >= 4 && words.length <= 7 && totalRepeats / words.length >= 0.4) {
        logger.debug('🚫 Spam detected by moderate repetition ratio:', { text: text.substring(0, 50), ratio: totalRepeats / words.length });
        return true;
      }
    }
    
    // Начальная оценка на основе признаков
    let spamScore = 0;
    
    // Короткие сообщения
    if (features.length < this.thresholds.length) {
      spamScore += 2;
    }
    
    // Много повторений
    if (features.repetitionScore > this.thresholds.repetition) {
      spamScore += 2;
    }
    
    // Много эмодзи
    if (features.emojiRatio > this.thresholds.emojiRatio) {
      spamScore += 1;
    }
    
    // Только заглавные
    if (features.capsRatio > this.thresholds.capsRatio && features.length > 5) {
      spamScore += 1;
    }
    
    // Много спам-слов
    if (features.spamWordsRatio > this.thresholds.spamWordsRatio) {
      spamScore += 2;
    }
    
    // Много восклицательных знаков
    if (features.exclamationRatio > 0.2) {
      spamScore += 1;
    }
    
    // СТРОГИЙ РЕЖИМ: считаем спамом почти всё
    // Обучение в реальном времени
    if (this.samplesCount < this.maxSamples) {
      if (spamScore >= 2) {
        this.addSpamSample(features);
      } else if (spamScore === 0 && features.length >= this.thresholds.length) {
        // Добавляем в нормальные только длинные сообщения без спам-признаков
        this.addNormalSample(features);
      }
    }
    
    // СТРОГИЙ РЕЖИМ: даже 1 балл = спам
    return spamScore >= 1;
  }
  
  /**
   * Добавляет пример спама
   */
  addSpamSample(features) {
    if (this.messageStats.spam.length >= this.maxSamples / 2) {
      this.messageStats.spam.shift(); // Удаляем старый
    }
    
    this.messageStats.spam.push(features);
    this.samplesCount++;
    this.updateThresholds();
  }
  
  /**
   * Добавляет пример нормального сообщения
   */
  addNormalSample(features) {
    if (this.messageStats.normal.length >= this.maxSamples / 2) {
      this.messageStats.normal.shift();
    }
    
    this.messageStats.normal.push(features);
    this.samplesCount++;
    this.updateThresholds();
  }
  
  /**
   * Обновляет пороги на основе статистики
   */
  updateThresholds() {
    const spamCount = this.messageStats.spam.length;
    const normalCount = this.messageStats.normal.length;
    
    if (spamCount === 0 || normalCount === 0) return;
    
    // Вычисляем средние значения признаков для спама
    this.messageStats.features.spamLength = 
      this.messageStats.spam.reduce((sum, f) => sum + f.length, 0) / spamCount;
    this.messageStats.features.spamRepetition = 
      this.messageStats.spam.reduce((sum, f) => sum + f.repetitionScore, 0) / spamCount;
    this.messageStats.features.spamEmojiRatio = 
      this.messageStats.spam.reduce((sum, f) => sum + f.emojiRatio, 0) / spamCount;
    
    // Вычисляем средние значения для нормальных сообщений
    this.messageStats.features.normalLength = 
      this.messageStats.normal.reduce((sum, f) => sum + f.length, 0) / normalCount;
    this.messageStats.features.normalRepetition = 
      this.messageStats.normal.reduce((sum, f) => sum + f.repetitionScore, 0) / normalCount;
    
    // Адаптируем пороги
    // Длина: среднее между спамом и нормальными
    this.thresholds.length = Math.max(3, Math.min(
      (this.messageStats.features.spamLength + this.messageStats.features.normalLength) / 2,
      20
    ));
    
    // Повторения: между спамом и нормальными
    this.thresholds.repetition = Math.max(0.1, Math.min(
      (this.messageStats.features.spamRepetition + this.messageStats.features.normalRepetition) / 2,
      0.5
    ));
    
    if (this.samplesCount % 50 === 0) {
      logger.info('🎓 Adaptive spam detector updated:', {
        samples: this.samplesCount,
        spamSamples: spamCount,
        normalSamples: normalCount,
        thresholds: this.thresholds
      });
    }
  }
  
  /**
   * Получить статистику
   */
  getStats() {
    return {
      samples: this.samplesCount,
      spamSamples: this.messageStats.spam.length,
      normalSamples: this.messageStats.normal.length,
      thresholds: this.thresholds,
      features: this.messageStats.features
    };
  }
  
  /**
   * Сбросить статистику
   */
  reset() {
    this.messageStats = { spam: [], normal: [], features: {} };
    this.samplesCount = 0;
    logger.info('🎓 Adaptive spam detector reset');
  }
}

// Singleton instance
const adaptiveSpamDetector = new AdaptiveSpamDetector();

module.exports = adaptiveSpamDetector;

