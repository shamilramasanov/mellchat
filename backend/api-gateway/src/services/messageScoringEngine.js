// Message Scoring Engine - интеллектуальная оценка качества сообщений
const logger = require('../utils/logger');
const userReputationManager = require('./userReputationManager');

class MessageScoringEngine {
  constructor() {
    // Словари для анализа
    this.spamWords = [
      'gg', 'lol', 'omg', 'wtf', 'bro', 'dude', 'yea', 'yeah', 'yep', 'nah',
      'xd', 'lmao', 'w', 'f', 'rip', 'kys', 'ez', 'op', 'nerf', 'buff'
    ];
    
    this.semanticWords = [
      'how', 'what', 'where', 'when', 'why', 'who', 'which', 'can', 'will', 'should',
      'good', 'great', 'nice', 'best', 'love', 'like', 'hate', 'bad', 'worst', 'better',
      'think', 'know', 'see', 'want', 'need', 'help', 'play', 'watch', 'work', 'do',
      'вопрос', 'ответ', 'проблема', 'решение', 'игра', 'трансляция', 'стрим', 'чат',
      'как', 'что', 'где', 'когда', 'почему', 'кто', 'какой', 'могу', 'нужно', 'помощь'
    ];
  }
  
  /**
   * Рассчитать семантическую плотность сообщения
   * @param {string} text - Текст сообщения
   * @returns {number} - Плотность от 0 до 1
   */
  calculateSemanticDensity(text) {
    if (!text || text.trim().length === 0) return 0;
    
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    // Подсчитываем смысловые слова
    let semanticCount = 0;
    words.forEach(word => {
      // Удаляем пунктуацию и проверяем вхождение
      const cleanWord = word.replace(/[^\w\u0400-\u04FF]/g, '');
      if (this.semanticWords.includes(cleanWord)) {
        semanticCount++;
      }
    });
    
    // Плотность = доля смысловых слов
    const density = semanticCount / totalWords;
    
    return Math.min(1, density);
  }
  
  /**
   * Рассчитать штрафные баллы
   * @param {Object} features - Признаки сообщения
   * @returns {number} - Суммарный штраф
   */
  calculatePenalties(features) {
    let penalties = 0;
    
    // Штраф за повторения (>30% повторов)
    if (features.repetitionScore > 0.3) {
      penalties += (features.repetitionScore - 0.3) * 20; // До -14 баллов
    }
    
    // Штраф за избыток эмодзи (>50% эмодзи - только реальное злоупотребление)
    if (features.emojiRatio > 0.5) {
      penalties += (features.emojiRatio - 0.5) * 20; // До -10 баллов
    }
    
    // Штраф за злоупотребление CAPS (>70% заглавных - только крики)
    if (features.capsRatio > 0.7 && features.length > 5) {
      penalties += (features.capsRatio - 0.7) * 10; // До -3 баллов
    }
    
    // Штраф за спам-слова (>70% спам-слов - только реальный спам)
    if (features.spamWordsRatio > 0.7) {
      penalties += (features.spamWordsRatio - 0.7) * 10; // До -3 баллов
    }
    
    return Math.min(50, penalties); // Максимум -50 баллов
  }
  
  /**
   * Рассчитать финальную оценку сообщения
   * @param {Object} message - Объект сообщения
   * @param {Object} features - Признаки сообщения (из adaptiveSpamDetector)
   * @returns {number} - Message Score (0-100)
   */
  calculateMessageScore(message, features) {
    const text = message.text || message.content || '';
    
    // Рассчитываем семантическую плотность
    const semanticDensity = this.calculateSemanticDensity(text);
    
    // Базовая оценка на основе семантической плотности
    let score = semanticDensity * 40; // До 40 баллов
    
    // Бонус за отсутствие повторений
    score += (1 - features.repetitionScore) * 10; // До 10 баллов
    
    // Бонус за отсутствие спам-слов (уменьшаем влияние)
    score += (1 - features.spamWordsRatio) * 5; // До 5 баллов (вместо 10)
    
    // Бонус за длину сообщения (до 20 баллов)
    if (features.length > 15) {
      score += Math.min(20, (features.length - 15) / 3); // Более мягкий бонус
    } else if (features.length < 3) {
      // Штраф только за ОЧЕНЬ короткие сообщения (< 3 символа)
      score -= 20;
    }
    
    // Получаем модификатор репутации
    const username = message.username || message.sender?.username || 'unknown';
    const reputation = userReputationManager.getReputation(username);
    const filterModifier = userReputationManager.getFilterModifier(username);
    
    // Вычитаем штрафы (с учетом модификатора репутации)
    const penalties = this.calculatePenalties(features);
    
    // Применяем модификатор репутации к штрафам
    const adjustedPenalties = penalties / filterModifier;
    score -= adjustedPenalties;
    
    // Для надежных пользователей добавляем бонус
    if (reputation > 10) {
      score += Math.min(15, reputation * 0.5);
    }
    // Для проблемных пользователей добавляем штраф
    else if (reputation < -10) {
      score -= Math.min(15, Math.abs(reputation) * 0.5);
    }
    
    // Ограничиваем результат (0-100)
    const finalScore = Math.max(0, Math.min(100, score));
    
    // Логируем для дебага
    if (finalScore < 25 && features.length > 3) {
      logger.debug('📊 Message scoring:', {
        username,
        text: text.substring(0, 30),
        semanticDensity,
        penalties,
        finalScore,
        reputation,
        classification: finalScore < 25 ? 'spam' : finalScore < 40 ? 'low-quality' : 'quality'
      });
    }
    
    return finalScore;
  }
  
  /**
   * Классифицировать сообщение
   * @param {number} score - Message Score
   * @returns {string} - 'spam', 'low-quality', 'quality'
   */
  classifyMessage(score) {
    if (score < 25) return 'spam';
    if (score < 40) return 'low-quality';
    return 'quality';
  }
  
  /**
   * Обновить репутацию пользователя на основе оценки
   * @param {Object} message - Объект сообщения
   * @param {number} score - Message Score
   */
  updateUserReputation(message, score) {
    const username = message.username || message.sender?.username || 'unknown';
    userReputationManager.updateReputation(username, score);
  }
}

// Singleton instance
const messageScoringEngine = new MessageScoringEngine();

module.exports = messageScoringEngine;

