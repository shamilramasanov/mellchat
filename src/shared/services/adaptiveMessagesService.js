// frontend/pwa/src/shared/services/adaptiveMessagesService.js
import deviceDetection from '../utils/deviceDetection';

const API_BASE_URL = '/api/v1';

class AdaptiveMessagesService {
  constructor() {
    this.requestQueue = new Map(); // Очередь запросов для предотвращения дублирования
    this.rateLimitDelays = new Map(); // Задержки для rate limiting
  }

  // Получить задержку для запроса (экспоненциальная задержка при rate limiting)
  getRequestDelay(key) {
    const delay = this.rateLimitDelays.get(key) || 0;
    return delay;
  }

  // Установить задержку для запроса
  setRequestDelay(key, delay) {
    this.rateLimitDelays.set(key, delay);
    // Уменьшаем задержку со временем
    setTimeout(() => {
      const currentDelay = this.rateLimitDelays.get(key);
      if (currentDelay > 0) {
        this.rateLimitDelays.set(key, Math.max(0, currentDelay - 1000));
      }
    }, 5000);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const requestKey = `${endpoint}_${JSON.stringify(options)}`;
    
    // Проверяем, есть ли уже такой запрос в очереди
    if (this.requestQueue.has(requestKey)) {
      console.log('⏳ Request already in queue, skipping:', endpoint);
      return this.requestQueue.get(requestKey);
    }

    // Проверяем задержку для rate limiting
    const delay = this.getRequestDelay(requestKey);
    if (delay > 0) {
      console.log(`⏳ Rate limit delay: ${delay}ms for ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log('🌐 Making request to:', url);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
      ...options,
    };

    // Добавляем запрос в очередь
    const requestPromise = this.makeRequest(url, config, requestKey);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Удаляем запрос из очереди
      this.requestQueue.delete(requestKey);
    }
  }

  async makeRequest(url, config, requestKey) {
    try {
      console.log('📤 Request config:', config);
      const response = await fetch(url, config);
      console.log('📥 Response status:', response.status);
      
      // Обработка rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        this.setRequestDelay(requestKey, delay);
        throw new Error(`Rate limited. Retry after ${delay}ms`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Сбрасываем задержку при успешном запросе
      this.rateLimitDelays.delete(requestKey);

      return data;
    } catch (error) {
      console.error('Adaptive Messages API request failed:', error);
      throw error;
    }
  }

  // Получить сообщения по адаптивной стратегии
  async getMessages(streamId, options = {}) {
    const {
      userId = 'anonymous',
      deviceType = 'desktop',
      sessionType = 'normal'
    } = options;

    const params = new URLSearchParams({
      userId,
      deviceType,
      sessionType
    });

    return this.request(`/adaptive/messages/${streamId}?${params}`);
  }

  // Загрузить больше сообщений (пагинация)
  async loadMoreMessages(streamId, options = {}) {
    const {
      userId = 'anonymous',
      deviceType = 'desktop',
      offset = 0,
      limit = 20
    } = options;

    const params = new URLSearchParams({
      userId,
      deviceType,
      offset: offset.toString(),
      limit: limit.toString()
    });

    return this.request(`/adaptive/messages/${streamId}/more?${params}`);
  }

  // Обновить время последнего просмотра
  async updateLastSeen(streamId, userId = 'anonymous') {
    return this.request(`/adaptive/sessions/${streamId}/seen`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // Создать чистую сессию (для "с чистого листа")
  async createCleanSession(streamId, options = {}) {
    const {
      userId = 'anonymous',
      deviceType = 'desktop'
    } = options;

    return this.request(`/adaptive/sessions/${streamId}/clean`, {
      method: 'POST',
      body: JSON.stringify({ userId, deviceType })
    });
  }

  // Получить информацию о сессии
  async getSessionInfo(streamId, userId = 'anonymous') {
    const params = new URLSearchParams({ userId });
    return this.request(`/api/v1/adaptive/sessions/${streamId}?${params}`);
  }

  // Определить тип устройства
  detectDeviceType() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)|Windows Phone/i.test(userAgent);
    
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }

  // Получить стратегию загрузки для устройства
  getLoadingStrategy(deviceType) {
    const strategies = {
      mobile: {
        strategy: 'hybrid',
        initialLimit: 15,
        maxLimit: 50,
        enablePagination: true,
        enableVirtualization: true,
        loadAfterLastSeen: false
      },
      tablet: {
        strategy: 'hybrid',
        initialLimit: 30,
        maxLimit: 100,
        enablePagination: true,
        enableVirtualization: true,
        loadAfterLastSeen: false
      },
      desktop: {
        strategy: 'timeBased',
        initialLimit: 50,
        maxLimit: 200,
        enablePagination: false,
        enableVirtualization: false,
        loadAfterLastSeen: true
      }
    };

    return strategies[deviceType] || strategies.desktop;
  }
}

export const adaptiveMessagesService = new AdaptiveMessagesService();
export default adaptiveMessagesService;
