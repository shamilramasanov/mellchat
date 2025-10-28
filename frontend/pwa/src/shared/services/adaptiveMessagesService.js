// frontend/pwa/src/shared/services/adaptiveMessagesService.js
import deviceDetection from '../utils/deviceDetection';

const API_BASE_URL = '/api/v1';

class AdaptiveMessagesService {
  constructor() {
    this.requestQueue = new Map();
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = `${url}?${JSON.stringify(options)}`;
    
    // Проверяем, есть ли уже запрос в очереди (защита от дублирования)
    if (this.requestQueue.has(cacheKey)) {
      console.log('⏳ Request already in queue for:', url);
      return this.requestQueue.get(cacheKey);
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

    const requestPromise = (async () => {
      try {
        console.log('📤 Request config:', config);
        const response = await fetch(url, config);
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        // Без кэша - всегда возвращаем свежие данные
        return data;
      } catch (error) {
        console.error('Adaptive Messages API request failed:', error);
        throw error;
      } finally {
        // Удаляем из очереди
        this.requestQueue.delete(cacheKey);
      }
    })();

    // Добавляем в очередь
    this.requestQueue.set(cacheKey, requestPromise);
    
    return requestPromise;
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
