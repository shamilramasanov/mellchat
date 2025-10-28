// Pattern 2: Measurement Cache - храним измеренные высоты навсегда
class MeasurementCache {
  constructor() {
    this.cache = new Map(); // { messageId: height }
    this.contentHashes = new Map(); // { messageId: contentHash } для обнаружения изменений
  }

  // Вычисляем простой hash содержимого сообщения
  getContentHash(message) {
    const content = (message.text || message.content || '') + 
                    (message.username || '') + 
                    (message.isQuestion ? '?q?' : '');
    return content.length; // Простой hash по длине
  }

  // Получить высоту из кэша или измерить
  getHeight(message, element) {
    if (!message || !message.id) return null;

    const contentHash = this.getContentHash(message);
    const cachedHash = this.contentHashes.get(message.id);
    
    // Если контент изменился, нужно измерить заново
    if (cachedHash && cachedHash !== contentHash) {
      console.log(`📐 Content changed for message ${message.id}, re-measuring...`);
      this.cache.delete(message.id);
    }

    // Если есть в кэше - возвращаем
    if (this.cache.has(message.id)) {
      return this.cache.get(message.id);
    }

    // Если есть элемент для измерения
    if (element && element.offsetHeight > 0) {
      const height = element.offsetHeight;
      this.cache.set(message.id, height);
      this.contentHashes.set(message.id, contentHash);
      console.log(`📏 Measured and cached: ${message.id} = ${height}px`);
      return height;
    }

    return null;
  }

  // Предустановить высоту (например, из smart estimation)
  setHeight(messageId, height, contentHash = null) {
    this.cache.set(messageId, height);
    if (contentHash !== null) {
      this.contentHashes.set(messageId, contentHash);
    }
  }

  // Очистить кэш для конкретного сообщения
  clear(messageId) {
    this.cache.delete(messageId);
    this.contentHashes.delete(messageId);
  }

  // Очистить весь кэш
  clearAll() {
    this.cache.clear();
    this.contentHashes.clear();
  }

  // Получить статистику кэша
  getStats() {
    return {
      size: this.cache.size,
      totalHeight: Array.from(this.cache.values()).reduce((sum, h) => sum + h, 0),
      avgHeight: this.cache.size > 0 
        ? Array.from(this.cache.values()).reduce((sum, h) => sum + h, 0) / this.cache.size 
        : 0
    };
  }
}

// Создаем глобальный экземпляр
const measurementCache = new MeasurementCache();

export default measurementCache;

