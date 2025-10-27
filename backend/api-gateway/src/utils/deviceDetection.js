// Утилита для определения типа устройства и его характеристик
const logger = require('./logger');

class DeviceDetection {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут кэш
  }

  // Основная функция детекции устройства
  detectDevice(userAgent, connectionInfo = {}) {
    const cacheKey = `${userAgent}-${JSON.stringify(connectionInfo)}`;
    
    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    const deviceInfo = this._analyzeDevice(userAgent, connectionInfo);
    
    // Кэшируем результат
    this.cache.set(cacheKey, {
      data: deviceInfo,
      timestamp: Date.now()
    });

    return deviceInfo;
  }

  // Анализ устройства
  _analyzeDevice(userAgent, connectionInfo) {
    const ua = userAgent || '';
    
    // Определение типа устройства
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android(?=.*Tablet)|Windows Phone/i.test(ua);
    const isDesktop = !isMobile && !isTablet;
    
    // Определение платформы
    const platform = this._detectPlatform(ua);
    
    // Определение браузера
    const browser = this._detectBrowser(ua);
    
    // Определение производительности устройства
    const performance = this._assessPerformance(ua, connectionInfo);
    
    // Определение возможностей устройства
    const capabilities = this._assessCapabilities(ua, connectionInfo);
    
    // Определение типа соединения
    const connectionType = connectionInfo.effectiveType || 'unknown';
    const connectionSpeed = this._assessConnectionSpeed(connectionType);
    
    const deviceInfo = {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      platform,
      browser,
      performance,
      capabilities,
      connection: {
        type: connectionType,
        speed: connectionSpeed,
        downlink: connectionInfo.downlink || 0,
        rtt: connectionInfo.rtt || 0
      },
      isTouch: 'ontouchstart' in (typeof window !== 'undefined' ? window : {}),
      userAgent: ua
    };

    logger.debug('Device detected', deviceInfo);
    return deviceInfo;
  }

  // Определение платформы
  _detectPlatform(userAgent) {
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macos';
    if (/Linux/i.test(userAgent)) return 'linux';
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Chrome OS/i.test(userAgent)) return 'chromeos';
    return 'unknown';
  }

  // Определение браузера
  _detectBrowser(userAgent) {
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return 'chrome';
    if (/Firefox/i.test(userAgent)) return 'firefox';
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'safari';
    if (/Edge/i.test(userAgent)) return 'edge';
    if (/Opera/i.test(userAgent)) return 'opera';
    return 'unknown';
  }

  // Оценка производительности устройства
  _assessPerformance(userAgent, connectionInfo) {
    // Простая эвристика на основе User Agent
    let score = 50; // Базовый балл
    
    // Мобильные устройства обычно менее производительные
    if (/Android/i.test(userAgent)) {
      if (/Android [1-4]\./i.test(userAgent)) score -= 30;
      else if (/Android [5-6]\./i.test(userAgent)) score -= 15;
      else if (/Android [7-8]\./i.test(userAgent)) score -= 5;
    }
    
    if (/iPhone/i.test(userAgent)) {
      // iPhone обычно более производительные
      if (/iPhone OS [1-9]_/i.test(userAgent)) score -= 20;
      else if (/iPhone OS 1[0-2]_/i.test(userAgent)) score -= 10;
      else score += 10;
    }
    
    // Старые браузеры
    if (/MSIE|Trident/i.test(userAgent)) score -= 20;
    if (/Chrome\/[1-5][0-9]/i.test(userAgent)) score -= 10;
    
    // Учитываем соединение
    if (connectionInfo.effectiveType) {
      switch (connectionInfo.effectiveType) {
        case 'slow-2g': score -= 20; break;
        case '2g': score -= 15; break;
        case '3g': score -= 10; break;
        case '4g': score += 5; break;
      }
    }
    
    // Нормализуем балл
    score = Math.max(0, Math.min(100, score));
    
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
  }

  // Оценка возможностей устройства
  _assessCapabilities(userAgent, connectionInfo) {
    const capabilities = {
      webGL: true,
      webRTC: true,
      serviceWorker: true,
      pushNotifications: true,
      backgroundSync: true,
      webAssembly: true,
      es6: true,
      cssGrid: true,
      flexbox: true
    };

    // Старые браузеры могут не поддерживать некоторые возможности
    if (/MSIE|Trident/i.test(userAgent)) {
      capabilities.webGL = false;
      capabilities.webRTC = false;
      capabilities.serviceWorker = false;
      capabilities.pushNotifications = false;
      capabilities.backgroundSync = false;
      capabilities.webAssembly = false;
      capabilities.es6 = false;
    }

    // Мобильные устройства могут иметь ограничения
    if (/Android [1-4]\./i.test(userAgent)) {
      capabilities.webAssembly = false;
      capabilities.backgroundSync = false;
    }

    return capabilities;
  }

  // Оценка скорости соединения
  _assessConnectionSpeed(connectionType) {
    switch (connectionType) {
      case 'slow-2g': return 'very-slow';
      case '2g': return 'slow';
      case '3g': return 'medium';
      case '4g': return 'fast';
      default: return 'unknown';
    }
  }

  // Получение адаптивных настроек для устройства
  getAdaptiveSettings(deviceInfo) {
    const baseSettings = {
      // Виртуализация
      virtualScroll: {
        enabled: deviceInfo.type === 'mobile' || deviceInfo.performance === 'low',
        itemHeight: deviceInfo.type === 'mobile' ? 70 : 80,
        overscan: deviceInfo.type === 'mobile' ? 3 : deviceInfo.type === 'tablet' ? 5 : 10
      },
      
      // Частота обновлений
      updateFrequency: {
        active: deviceInfo.type === 'mobile' ? 1000 : 500,
        idle: deviceInfo.type === 'mobile' ? 5000 : 2000,
        background: 10000
      },
      
      // Кэширование
      cache: {
        maxMessages: deviceInfo.type === 'mobile' ? 100 : deviceInfo.type === 'tablet' ? 150 : 200,
        maxQuestions: deviceInfo.type === 'mobile' ? 50 : deviceInfo.type === 'tablet' ? 75 : 100,
        ttl: deviceInfo.performance === 'low' ? 300000 : 600000 // 5 или 10 минут
      },
      
      // Анимации
      animations: {
        enabled: deviceInfo.performance !== 'low',
        duration: deviceInfo.type === 'mobile' ? 200 : 300,
        reducedMotion: deviceInfo.performance === 'low'
      },
      
      // WebSocket настройки
      websocket: {
        heartbeatInterval: deviceInfo.type === 'mobile' ? 60000 : 30000,
        reconnectDelay: deviceInfo.connection.speed === 'slow' ? 5000 : 2000,
        maxReconnectAttempts: deviceInfo.connection.speed === 'slow' ? 3 : 5
      },
      
      // Сжатие
      compression: {
        enabled: deviceInfo.connection.speed !== 'fast',
        threshold: deviceInfo.connection.speed === 'slow' ? 512 : 1024
      },
      
      // Rate limiting
      rateLimiting: {
        multiplier: deviceInfo.type === 'mobile' ? 0.5 : deviceInfo.type === 'tablet' ? 0.75 : 1.0
      }
    };

    logger.debug('Adaptive settings generated', { 
      deviceType: deviceInfo.type, 
      performance: deviceInfo.performance,
      settings: baseSettings 
    });

    return baseSettings;
  }

  // Очистка кэша
  clearCache() {
    this.cache.clear();
    logger.debug('Device detection cache cleared');
  }

  // Получение статистики кэша
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000, // Максимальный размер кэша
      timeout: this.cacheTimeout
    };
  }
}

// Создаем экземпляр
const deviceDetection = new DeviceDetection();

module.exports = deviceDetection;
