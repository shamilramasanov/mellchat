// frontend/pwa/src/shared/services/serverHealth.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mellchat-production.up.railway.app';

class ServerHealthService {
  constructor() {
    this.isOnline = false;
    this.lastCheck = null;
    this.checkInterval = null;
    this.listeners = new Set();
    this.retryCount = 0;
    this.maxRetries = 3;
    this.checkIntervalMs = 10000; // 10 секунд
  }

  // Подписаться на изменения статуса
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Уведомить всех подписчиков об изменении статуса
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          isOnline: this.isOnline,
          lastCheck: this.lastCheck,
          retryCount: this.retryCount
        });
      } catch (error) {
        console.error('Error in server health listener:', error);
      }
    });
  }

  // Проверить статус сервера
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

      const healthUrl = `${API_BASE_URL}/api/v1/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const wasOnline = this.isOnline;
        this.isOnline = data.status === 'healthy';
        this.lastCheck = new Date();
        
        if (this.isOnline) {
          this.retryCount = 0; // Сброс счетчика при успешном подключении
        }

        // Уведомляем только при изменении статуса
        if (wasOnline !== this.isOnline) {
          this.notifyListeners();
        }

        return {
          success: true,
          isOnline: this.isOnline,
          data,
          lastCheck: this.lastCheck
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      this.lastCheck = new Date();
      this.retryCount++;

      // Уведомляем только при изменении статуса
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }

      return {
        success: false,
        isOnline: false,
        error: error.message,
        lastCheck: this.lastCheck,
        retryCount: this.retryCount
      };
    }
  }

  // Запустить автоматическую проверку
  startAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Первая проверка сразу
    this.checkHealth();

    // Затем каждые 10 секунд
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, this.checkIntervalMs);
  }

  // Остановить автоматическую проверку
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Получить текущий статус
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastCheck: this.lastCheck,
      retryCount: this.retryCount
    };
  }

  // Принудительная проверка
  async forceCheck() {
    return await this.checkHealth();
  }
}

// Создаем единственный экземпляр
const serverHealthService = new ServerHealthService();

export default serverHealthService;
