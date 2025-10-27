// Умный кэш с автоочисткой для фронтенда
import performanceLogger from './performanceLogger';

class SmartCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 минут
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 минута
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      cleanups: 0
    };
    
    // Запускаем автоочистку
    this.startCleanup();
  }

  // Установка значения в кэш
  set(key, value, ttl = this.defaultTTL) {
    const now = Date.now();
    const expiresAt = now + ttl;
    
    // Если кэш переполнен, удаляем старые записи
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now
    });
    
    this.stats.sets++;
    return true;
  }

  // Получение значения из кэша
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    
    // Проверяем срок действия
    if (now > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Обновляем статистику доступа
    item.accessCount++;
    item.lastAccessed = now;
    
    this.stats.hits++;
    
    // Логируем статистику кэша периодически
    if (this.stats.hits % 10 === 0 || this.stats.misses % 10 === 0) {
      performanceLogger.logCache({
        hits: this.stats.hits,
        misses: this.stats.misses,
        size: this.cache.size,
        hitRate: this.getHitRate()
      });
    }
    
    return item.value;
  }

  // Проверка существования ключа
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    const now = Date.now();
    
    // Проверяем срок действия
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Удаление значения из кэша
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // Очистка всего кэша
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      cleanups: 0
    };
  }

  // Получение размера кэша
  size() {
    return this.cache.size;
  }

  // Получение статистики
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    // Подсчитываем истекшие записи
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  // Удаление самых старых записей
  evictOldest() {
    const entries = Array.from(this.cache.entries());
    
    // Сортируем по времени создания
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    // Удаляем 10% самых старых записей
    const toDelete = Math.ceil(entries.length * 0.1);
    
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Автоочистка истекших записей
  cleanup() {
    const now = Date.now();
    const toDelete = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      this.stats.cleanups++;
    }
    
    return toDelete.length;
  }

  // Запуск автоочистки
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Остановка автоочистки
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Получение всех ключей
  keys() {
    return Array.from(this.cache.keys());
  }

  // Получение всех значений
  values() {
    const now = Date.now();
    const validValues = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now <= item.expiresAt) {
        validValues.push(item.value);
      }
    }
    
    return validValues;
  }

  // Получение всех записей
  entries() {
    const now = Date.now();
    const validEntries = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now <= item.expiresAt) {
        validEntries.push([key, item.value]);
      }
    }
    
    return validEntries;
  }

  // Установка TTL для существующего ключа
  extendTTL(key, additionalTTL) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    const now = Date.now();
    
    // Проверяем, не истек ли уже
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    item.expiresAt += additionalTTL;
    return true;
  }

  // Получение информации о записи
  getInfo(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    const now = Date.now();
    
    return {
      key,
      value: item.value,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      accessCount: item.accessCount,
      lastAccessed: item.lastAccessed,
      isExpired: now > item.expiresAt,
      ttl: item.expiresAt - now
    };
  }
}

// Создаем глобальные экземпляры кэша для разных типов данных
const messageCache = new SmartCache({
  maxSize: 500,
  defaultTTL: 600000, // 10 минут
  cleanupInterval: 120000 // 2 минуты
});

const questionCache = new SmartCache({
  maxSize: 200,
  defaultTTL: 300000, // 5 минут
  cleanupInterval: 60000 // 1 минута
});

const userCache = new SmartCache({
  maxSize: 100,
  defaultTTL: 1800000, // 30 минут
  cleanupInterval: 300000 // 5 минут
});

const streamCache = new SmartCache({
  maxSize: 50,
  defaultTTL: 3600000, // 1 час
  cleanupInterval: 600000 // 10 минут
});

// Экспортируем кэши
export {
  SmartCache,
  messageCache,
  questionCache,
  userCache,
  streamCache
};

export default SmartCache;
