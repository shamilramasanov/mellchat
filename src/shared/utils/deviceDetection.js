// Утилита для определения типа устройства на фронтенде
import performanceLogger from './performanceLogger';

class DeviceDetection {
  constructor() {
    // Флаг для включения/отключения логов оптимизации
    this.ENABLE_LOGS = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут кэш
    this.deviceInfo = null;
    this.adaptiveSettings = null;
    
    // Инициализируем при создании
    this.init();
  }

  // Инициализация
  init() {
    this.deviceInfo = this.detectDevice();
    this.adaptiveSettings = this._getAdaptiveSettings(this.deviceInfo);
    
    // Логируем определение устройства
    if (this.ENABLE_LOGS) {
      performanceLogger.logDeviceDetection({
        deviceType: this.deviceInfo.type,
        performance: this.deviceInfo.performance,
        adaptiveSettings: this.adaptiveSettings
      });
    }
    
    // Слушаем изменения размера окна для адаптации
    window.addEventListener('resize', this.debounce(() => {
      this.deviceInfo = this.detectDevice();
      this.adaptiveSettings = this._getAdaptiveSettings(this.deviceInfo);
      
      // Логируем изменение устройства
      if (this.ENABLE_LOGS) {
        performanceLogger.logDeviceDetection({
          deviceType: this.deviceInfo.type,
          performance: this.deviceInfo.performance,
          adaptiveSettings: this.adaptiveSettings
        });
      }
    }, 300));
  }

  // Простой debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Определение типа устройства
  detectDevice() {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Определение типа устройства
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                     screenWidth < 768;
    const isTablet = /iPad|Android(?=.*Tablet)|Windows Phone/i.test(userAgent) || 
                     (screenWidth >= 768 && screenWidth < 1024);
    const isDesktop = !isMobile && !isTablet;
    
    // Определение платформы
    const platform = this.detectPlatform(userAgent);
    
    // Определение браузера
    const browser = this.detectBrowser(userAgent);
    
    // Оценка производительности
    const performance = this.assessPerformance(userAgent, screenWidth, screenHeight);
    
    // Определение возможностей
    const capabilities = this.assessCapabilities();
    
    // Определение типа соединения
    const connection = this.getConnectionInfo();
    
    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      platform,
      browser,
      performance,
      capabilities,
      connection,
      screenWidth,
      screenHeight,
      userAgent
    };
  }

  // Определение платформы
  detectPlatform(userAgent) {
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macos';
    if (/Linux/i.test(userAgent)) return 'linux';
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Chrome OS/i.test(userAgent)) return 'chromeos';
    return 'unknown';
  }

  // Определение браузера
  detectBrowser(userAgent) {
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return 'chrome';
    if (/Firefox/i.test(userAgent)) return 'firefox';
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'safari';
    if (/Edge/i.test(userAgent)) return 'edge';
    if (/Opera/i.test(userAgent)) return 'opera';
    return 'unknown';
  }

  // Оценка производительности устройства
  assessPerformance(userAgent, screenWidth, screenHeight) {
    let score = 50; // Базовый балл
    
    // Размер экрана влияет на производительность
    if (screenWidth < 480) score -= 20; // Очень маленькие экраны
    else if (screenWidth < 768) score -= 10; // Мобильные
    else if (screenWidth >= 1920) score += 10; // Большие экраны
    
    // Старые браузеры
    if (/MSIE|Trident/i.test(userAgent)) score -= 30;
    if (/Chrome\/[1-5][0-9]/i.test(userAgent)) score -= 15;
    
    // Мобильные устройства обычно менее производительные
    if (/Android/i.test(userAgent)) {
      if (/Android [1-4]\./i.test(userAgent)) score -= 25;
      else if (/Android [5-6]\./i.test(userAgent)) score -= 15;
      else if (/Android [7-8]\./i.test(userAgent)) score -= 5;
    }
    
    if (/iPhone/i.test(userAgent)) {
      // iPhone обычно более производительные
      if (/iPhone OS [1-9]_/i.test(userAgent)) score -= 20;
      else if (/iPhone OS 1[0-2]_/i.test(userAgent)) score -= 10;
      else score += 10;
    }
    
    // Проверяем доступность WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) score -= 10;
    } catch (e) {
      score -= 10;
    }
    
    // Нормализуем балл
    score = Math.max(0, Math.min(100, score));
    
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
  }

  // Оценка возможностей устройства
  assessCapabilities() {
    return {
      webGL: !!window.WebGLRenderingContext,
      webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      webAssembly: typeof WebAssembly === 'object',
      es6: typeof Symbol !== 'undefined',
      cssGrid: CSS.supports('display', 'grid'),
      flexbox: CSS.supports('display', 'flex'),
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window
    };
  }

  // Получение информации о соединении
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {
        type: 'unknown',
        speed: 'unknown',
        downlink: 0,
        rtt: 0
      };
    }
    
    return {
      type: connection.effectiveType || 'unknown',
      speed: this.assessConnectionSpeed(connection.effectiveType),
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0
    };
  }

  // Оценка скорости соединения
  assessConnectionSpeed(connectionType) {
    switch (connectionType) {
      case 'slow-2g': return 'very-slow';
      case '2g': return 'slow';
      case '3g': return 'medium';
      case '4g': return 'fast';
      default: return 'unknown';
    }
  }

  // Получение информации об устройстве
  getDeviceInfo() {
    return this.deviceInfo || this.detectDevice();
  }

  // Получение адаптивных настроек (приватный метод)
  _getAdaptiveSettings(deviceInfo) {
    // Проверяем принудительные настройки из localStorage
    const forceVirtualization = localStorage.getItem('mellchat-force-virtualization');
    const virtualizationEnabled = forceVirtualization !== null ? 
      forceVirtualization === 'true' : 
      false; // Отключаем виртуализацию по умолчанию

    const baseSettings = {
      // Виртуализация
      virtualScroll: {
        enabled: virtualizationEnabled,
        itemHeight: deviceInfo.type === 'mobile' ? 100 : deviceInfo.type === 'tablet' ? 90 : 85,
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
        reducedMotion: deviceInfo.performance === 'low' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

    return baseSettings;
  }

  // Получение текущей информации об устройстве
  getDeviceInfo() {
    return this.deviceInfo;
  }

  // Получение текущих адаптивных настроек
  getAdaptiveSettings() {
    // Если настройки не инициализированы, инициализируем их
    if (!this.adaptiveSettings) {
      this.deviceInfo = this.detectDevice();
      this.adaptiveSettings = this._getAdaptiveSettings(this.deviceInfo);
    }
    return this.adaptiveSettings;
  }

  // Проверка, является ли устройство мобильным
  isMobile() {
    return this.deviceInfo?.type === 'mobile';
  }

  // Проверка, является ли устройство планшетом
  isTablet() {
    return this.deviceInfo?.type === 'tablet';
  }

  // Проверка, является ли устройство десктопом
  isDesktop() {
    return this.deviceInfo?.type === 'desktop';
  }

  // Проверка производительности
  isLowPerformance() {
    return this.deviceInfo?.performance === 'low';
  }

  // Проверка медленного соединения
  isSlowConnection() {
    return this.deviceInfo?.connection.speed === 'slow' || 
           this.deviceInfo?.connection.speed === 'very-slow';
  }

  // Переключение виртуализации
  toggleVirtualization(enabled) {
    localStorage.setItem('mellchat-force-virtualization', enabled.toString());
    // Перезагружаем настройки
    this.adaptiveSettings = this._getAdaptiveSettings(this.deviceInfo);
    
    // Логируем изменение
    if (this.ENABLE_LOGS) {
      performanceLogger.logDeviceDetection({
        deviceType: this.deviceInfo.type,
        performance: this.deviceInfo.performance,
        adaptiveSettings: this.adaptiveSettings,
        virtualizationToggled: true
      });
    }
  }

  // Получение статистики
  getStats() {
    return {
      deviceInfo: this.deviceInfo,
      adaptiveSettings: this.adaptiveSettings,
      cacheSize: this.cache.size,
      timestamp: Date.now()
    };
  }
}

// Создаем глобальный экземпляр
const deviceDetection = new DeviceDetection();

// Экспортируем функции для совместимости
export const detectDevice = () => deviceDetection.detectDevice();
export const getAdaptiveSettings = () => deviceDetection.getAdaptiveSettings();

export default deviceDetection;
