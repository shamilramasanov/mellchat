// Система логирования производительности для мониторинга оптимизаций
class PerformanceLogger {
  constructor() {
    // Флаг для включения/отключения логов оптимизации
    this.ENABLE_LOGS = false;
    this.logs = [];
    this.metrics = {
      virtualization: {
        enabled: false,
        renderedItems: 0,
        totalItems: 0,
        renderTime: 0,
        lastUpdate: null
      },
      deviceDetection: {
        deviceType: 'unknown',
        performance: 'unknown',
        adaptiveSettings: null,
        lastUpdate: null
      },
      cache: {
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0,
        lastCleanup: null
      },
      scroll: {
        debouncedEvents: 0,
        totalEvents: 0,
        debounceRate: 0,
        lastScroll: null
      },
      prefetching: {
        prefetchedPages: 0,
        cacheHits: 0,
        lastPrefetch: null
      }
    };
    
    this.maxLogs = 1000;
    this.enabled = process.env.NODE_ENV === 'development' || localStorage.getItem('mellchat-debug') === 'true';
    
    // Периодически выводим статистику
    this.startPeriodicLogging();
  }

  // Логирование виртуализации
  logVirtualization(data) {
    if (!this.enabled) return;
    
    const log = {
      type: 'virtualization',
      timestamp: Date.now(),
      data: {
        enabled: data.enabled,
        renderedItems: data.renderedItems,
        totalItems: data.totalItems,
        renderTime: data.renderTime,
        performance: data.performance
      }
    };
    
    if (!this.ENABLE_LOGS) return;
    
    this.logs.push(log);
    this.metrics.virtualization = {
      enabled: data.enabled,
      renderedItems: data.renderedItems,
      totalItems: data.totalItems,
      renderTime: data.renderTime,
      lastUpdate: Date.now()
    };

  }

  // Логирование определения устройства
  logDeviceDetection(data) {
    if (!this.ENABLE_LOGS) return;
    
    const log = {
      type: 'deviceDetection',
      timestamp: Date.now(),
      data: {
        deviceType: data.deviceType,
        performance: data.performance,
        adaptiveSettings: data.adaptiveSettings
      }
    };
    
    this.logs.push(log);
    this.metrics.deviceDetection = {
      deviceType: data.deviceType,
      performance: data.performance,
      adaptiveSettings: data.adaptiveSettings,
      lastUpdate: Date.now()
    };

  }

  // Логирование кэша
  logCache(data) {
    if (!this.ENABLE_LOGS) return;
    
    const hitRate = data.hits / (data.hits + data.misses) * 100;
    
    const log = {
      type: 'cache',
      timestamp: Date.now(),
      data: {
        hits: data.hits,
        misses: data.misses,
        size: data.size,
        hitRate: hitRate
      }
    };
    
    this.logs.push(log);
    this.metrics.cache = {
      hits: data.hits,
      misses: data.misses,
      size: data.size,
      hitRate: hitRate,
      lastCleanup: Date.now()
    };
    
    console.log(`💾 [Cache] Hits: ${data.hits} | Misses: ${data.misses} | Hit Rate: ${hitRate.toFixed(1)}% | Size: ${data.size}`);
  }

  // Логирование скролла
  logScroll(data) {
    if (!this.ENABLE_LOGS) return;
    
    const debounceRate = data.debouncedEvents / data.totalEvents * 100;
    
    const log = {
      type: 'scroll',
      timestamp: Date.now(),
      data: {
        debouncedEvents: data.debouncedEvents,
        totalEvents: data.totalEvents,
        debounceRate: debounceRate
      }
    };
    
    this.logs.push(log);
    this.metrics.scroll = {
      debouncedEvents: data.debouncedEvents,
      totalEvents: data.totalEvents,
      debounceRate: debounceRate,
      lastScroll: Date.now()
    };
    
    console.log(`📜 [Scroll] Debounced: ${data.debouncedEvents}/${data.totalEvents} | Rate: ${debounceRate.toFixed(1)}%`);
  }

  // Логирование prefetching
  logPrefetching(data) {
    if (!this.ENABLE_LOGS) return;
    
    const log = {
      type: 'prefetching',
      timestamp: Date.now(),
      data: {
        prefetchedPages: data.prefetchedPages,
        cacheHits: data.cacheHits,
        performance: data.performance
      }
    };
    
    this.logs.push(log);
    this.metrics.prefetching = {
      prefetchedPages: data.prefetchedPages,
      cacheHits: data.cacheHits,
      lastPrefetch: Date.now()
    };

  }

  // Общее логирование производительности
  logPerformance(component, action, duration, details = {}) {
    if (!this.ENABLE_LOGS) return;
    
    const log = {
      type: 'performance',
      timestamp: Date.now(),
      data: {
        component,
        action,
        duration,
        details
      }
    };
    
    this.logs.push(log);
    
    const emoji = duration < 10 ? '⚡' : duration < 50 ? '✅' : duration < 100 ? '⚠️' : '🐌';

  }

  // Получение статистики
  getStats() {
    return {
      metrics: this.metrics,
      totalLogs: this.logs.length,
      enabled: this.enabled,
      timestamp: Date.now()
    };
  }

  // Получение логов по типу
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }

  // Очистка старых логов
  cleanup() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  // Периодическое логирование статистики
  startPeriodicLogging() {
    if (!this.enabled) return;
    
    setInterval(() => {
      this.logSummary();
    }, 30000); // Каждые 30 секунд
  }

  // Сводка по производительности
  logSummary() {
    if (!this.ENABLE_LOGS) return;
    
    console.group('📊 MellChat Performance Summary');

    console.groupEnd();
  }

  // Включение/выключение логирования
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('mellchat-debug', enabled.toString());
    if (this.ENABLE_LOGS) {

    }
  }

  // Экспорт логов для анализа
  exportLogs() {
    return {
      logs: this.logs,
      metrics: this.metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    };
  }
}

// Создаем глобальный экземпляр
const performanceLogger = new PerformanceLogger();

// Экспортируем для использования
export default performanceLogger;

// Добавляем в window для отладки
if (typeof window !== 'undefined') {
  window.mellchatPerformance = performanceLogger;
}
