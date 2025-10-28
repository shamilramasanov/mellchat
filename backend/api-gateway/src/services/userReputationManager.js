// User Reputation Manager - управление репутацией пользователей
const logger = require('../utils/logger');

class UserReputationManager {
  constructor() {
    // Репутация пользователей: username -> score
    this.userReputations = new Map();
    
    // История репутационных изменений (для адаптации)
    this.reputationHistory = new Map();
    
    // Пороги репутации
    this.thresholds = {
      reliable: 10,      // Надежный пользователь
      normalMin: -10,    // Нижняя граница нормального режима
      normalMax: 10,     // Верхняя граница нормального режима
      problematic: -10   // Проблемный пользователь
    };
    
    // Максимальная история на пользователя
    this.maxHistorySize = 100;
  }
  
  /**
   * Получить репутацию пользователя
   * @param {string} username - Имя пользователя
   * @returns {number} - Текущая репутация
   */
  getReputation(username) {
    return this.userReputations.get(username) || 0;
  }
  
  /**
   * Обновить репутацию на основе Message Score
   * @param {string} username - Имя пользователя
   * @param {number} messageScore - Оценка сообщения
   * @returns {number} - Новая репутация
   */
  updateReputation(username, messageScore) {
    const currentReputation = this.getReputation(username);
    let newReputation = currentReputation;
    
    // Обновляем репутацию на основе оценки сообщения
    if (messageScore > 40) {
      // Качественное сообщение → +1
      newReputation = currentReputation + 1;
    } else if (messageScore < 25) {
      // Спам → -1
      newReputation = currentReputation - 1;
    }
    
    // Сохраняем новую репутацию
    this.userReputations.set(username, newReputation);
    
    // Добавляем в историю
    this.addToHistory(username, {
      messageScore,
      oldReputation: currentReputation,
      newReputation,
      timestamp: Date.now()
    });
    
    // Логируем изменения
    if (Math.abs(currentReputation - newReputation) > 0) {
      logger.debug('📊 Reputation updated:', {
        username,
        oldScore: currentReputation,
        newScore: newReputation,
        messageScore
      });
    }
    
    return newReputation;
  }
  
  /**
   * Получить модификатор фильтра на основе репутации
   * @param {string} username - Имя пользователя
   * @returns {number} - Модификатор (1.0 = стандарт, >1.0 = мягче, <1.0 = строже)
   */
  getFilterModifier(username) {
    const reputation = this.getReputation(username);
    
    if (reputation > this.thresholds.reliable) {
      // Надежный пользователь - фильтр мягче (×0.7 к порогу спама)
      return 0.7;
    } else if (reputation < this.thresholds.problematic) {
      // Проблемный пользователь - фильтр строже (×1.5 к порогу спама)
      return 1.5;
    } else {
      // Нормальный режим
      return 1.0;
    }
  }
  
  /**
   * Получить статус пользователя
   * @param {string} username - Имя пользователя
   * @returns {string} - 'reliable', 'normal', 'problematic'
   */
  getUserStatus(username) {
    const reputation = this.getReputation(username);
    
    if (reputation > this.thresholds.reliable) {
      return 'reliable';
    } else if (reputation < this.thresholds.problematic) {
      return 'problematic';
    } else {
      return 'normal';
    }
  }
  
  /**
   * Добавить запись в историю
   * @param {string} username - Имя пользователя
   * @param {Object} record - Запись истории
   */
  addToHistory(username, record) {
    if (!this.reputationHistory.has(username)) {
      this.reputationHistory.set(username, []);
    }
    
    const history = this.reputationHistory.get(username);
    history.push(record);
    
    // Ограничиваем размер истории
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }
  
  /**
   * Получить историю пользователя
   * @param {string} username - Имя пользователя
   * @param {number} limit - Лимит записей
   * @returns {Array} - Массив записей истории
   */
  getHistory(username, limit = 10) {
    const history = this.reputationHistory.get(username) || [];
    return history.slice(-limit);
  }
  
  /**
   * Получить статистику по всем пользователям
   * @returns {Object} - Статистика
   */
  getStats() {
    const users = Array.from(this.userReputations.entries());
    
    return {
      totalUsers: users.length,
      reliableUsers: users.filter(([_, score]) => score > this.thresholds.reliable).length,
      normalUsers: users.filter(([_, score]) => 
        score >= this.thresholds.normalMin && score <= this.thresholds.normalMax
      ).length,
      problematicUsers: users.filter(([_, score]) => score < this.thresholds.problematic).length,
      averageReputation: users.length > 0 
        ? users.reduce((sum, [_, score]) => sum + score, 0) / users.length 
        : 0
    };
  }
  
  /**
   * Сбросить репутацию
   */
  resetReputation(username) {
    this.userReputations.delete(username);
    this.reputationHistory.delete(username);
    logger.info('🔄 Reputation reset for user:', username);
  }
  
  /**
   * Сбросить всю репутацию
   */
  resetAll() {
    this.userReputations.clear();
    this.reputationHistory.clear();
    logger.info('🔄 All reputations reset');
  }
}

// Singleton instance
const userReputationManager = new UserReputationManager();

module.exports = userReputationManager;

