import axios from 'axios';
import { API_URL, API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  withCredentials: true, // For cookies/session
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generate or get guest session ID with fingerprint support
 */
async function getGuestSessionId() {
  let sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
  
  if (!sessionId) {
    // Импортируем fingerprint утилиту (динамический импорт чтобы избежать проблем с SSR)
    const { getBrowserFingerprint } = await import('../utils/fingerprint.js');
    
    // Получаем fingerprint браузера
    const fingerprint = await getBrowserFingerprint();
    
    // Пытаемся найти существующую сессию по fingerprint
    try {
      const response = await api.post('/auth/guest/find-by-fingerprint', { fingerprint });
      if (response.data?.sessionId) {
        sessionId = response.data.sessionId;
        localStorage.setItem(STORAGE_KEYS.GUEST_SESSION_ID, sessionId);
        return sessionId;
      }
    } catch (error) {
      // Если не нашли существующую сессию, создаем новую
      console.log('No existing session found for fingerprint, creating new one');
    }
    
    // Генерируем новый session ID
    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEYS.GUEST_SESSION_ID, sessionId);
    
    // Сохраняем fingerprint для следующего раза (опционально, для отладки)
    localStorage.setItem('mellchat_fingerprint', fingerprint);
  }
  
  return sessionId;
}

/**
 * Request interceptor - Add auth token and guest session ID
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If not authenticated, send guest session ID
      // Note: getGuestSessionId is async, but axios interceptors don't support async directly
      // We'll handle this differently - session ID should already be set in localStorage
      const guestSessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
      if (guestSessionId) {
        config.headers['X-Session-Id'] = guestSessionId;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors globally
 */
api.interceptors.response.use(
  (response) => {
    // Return just the data
    return response.data;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle specific status codes
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
          break;
          
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found');
          break;
          
        case 429:
          // Too many requests
          console.error('Rate limit exceeded');
          break;
          
        case 500:
          // Server error
          console.error('Server error');
          break;
          
        default:
          console.error(`Error ${status}:`, error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Auth API
 */
export const authAPI = {
  /**
   * Get Google OAuth URL
   */
  getGoogleAuthURL: () => `${API_URL}/api/v1${API_ENDPOINTS.AUTH.GOOGLE}`,
  
  /**
   * Logout user
   */
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
  
  /**
   * Get user profile
   */
  getProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE),
  
  /**
   * Send email code for authorization
   * @param {string} email - Email address
   */
  sendEmailCode: (email) => api.post(API_ENDPOINTS.AUTH.EMAIL_SEND_CODE, { email }),
  
  /**
   * Verify email code and login/register
   * @param {string} email - Email address
   * @param {string} code - Email code
   */
  verifyEmailCode: (email, code) => api.post(API_ENDPOINTS.AUTH.EMAIL_VERIFY_CODE, { email, code }),
  
  /**
   * Verify JWT token
   * @param {string} token - JWT token
   */
  verifyToken: (token) => api.post(API_ENDPOINTS.AUTH.VERIFY, { token }),
  
  /**
   * Find guest session by fingerprint
   */
  findGuestSessionByFingerprint: async (fingerprint) => {
    return api.post('/auth/guest/find-by-fingerprint', { fingerprint });
  },
  
  /**
   * Register guest session
   */
  registerGuestSession: async () => {
    // Получаем fingerprint перед регистрацией
    const { getBrowserFingerprint } = await import('../utils/fingerprint.js');
    const fingerprint = await getBrowserFingerprint();
    const sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID) || 
      'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    
    return api.post('/auth/guest/register', { 
      sessionId,
      fingerprint 
    });
  },
  
  /**
   * Log user activity (view message, open/close stream)
   */
  logActivity: async (data) => {
    // Используем невербатильный запрос для избежания блокировки UI
    try {
      // Получаем sessionId если его нет в data
      let sessionId = data.sessionId;
      if (!sessionId) {
        sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
      }
      
      // Добавляем sessionId в запрос
      const requestData = {
        ...data,
        sessionId: sessionId || undefined
      };
      
      // Также отправляем в заголовке для совместимости
      const headers = sessionId ? { 'x-session-id': sessionId } : {};
      
      await api.post('/admin/users/activity/log', requestData, { headers });
    } catch (error) {
      // Игнорируем ошибки логирования, чтобы не мешать пользователю
      console.debug('Activity log error (ignored):', error);
    }
  },
};

/**
 * Streams API
 */
export const streamsAPI = {
  /**
   * Connect to a stream
   * @param {string} url - Stream URL
   */
  connect: (url) => api.post(API_ENDPOINTS.STREAMS.CONNECT, { streamUrl: url }),
  
  /**
   * Disconnect from a stream
   * @param {string} streamId - Stream ID
   */
  disconnect: (streamId) => api.delete(API_ENDPOINTS.STREAMS.DISCONNECT(streamId)),
  
  /**
   * Get active streams
   */
  getActive: () => api.get('/streams'),
  
};

/**
 * Database API
 */
export const databaseAPI = {
  /**
   * Get messages from database for a stream
   * @param {string} streamId - Stream ID
   * @param {number} limit - Limit of messages
   * @param {number} offset - Offset
   */
  getMessages: (streamId, limit = 100, offset = 0) => 
    api.get(`/database/messages/${streamId}`, { params: { limit, offset } }),
};

/**
 * Emoji API
 */
export const emojiAPI = {
  /**
   * Get BTTV emojis
   */
  getBTTV: () => api.get(API_ENDPOINTS.EMOJI.BTTV),
  
  /**
   * Get FFZ emojis
   */
  getFFZ: () => api.get(API_ENDPOINTS.EMOJI.FFZ),
  
  /**
   * Get 7TV emojis
   */
  get7TV: () => api.get(API_ENDPOINTS.EMOJI.SEVENTV),
};

/**
 * User API
 */
export const userAPI = {
  /**
   * Get user settings
   */
  getSettings: () => api.get(API_ENDPOINTS.USER.SETTINGS),
  
  /**
   * Save user settings
   * @param {Object} settings - Settings object
   */
  saveSettings: (settings) => api.post(API_ENDPOINTS.USER.SETTINGS, settings),
};

/**
 * AI Filter API
 */
export const aiFilterAPI = {
  /**
   * Get AI filter rules
   */
  getRules: () => api.get('/ai-filter/rules'),
  
  /**
   * Train AI filter
   * @param {Object} config - Training configuration
   */
  train: (config) => api.post('/ai-filter/train', config),
  
  /**
   * Delete AI filter rules
   */
  deleteRules: () => api.delete('/ai-filter/rules'),
};

/**
 * Health check
 */
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

