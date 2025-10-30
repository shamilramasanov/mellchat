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
 * Request interceptor - Add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  getGoogleAuthURL: () => `${API_URL}${API_ENDPOINTS.AUTH.GOOGLE}`,
  
  /**
   * Logout user
   */
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
  
  /**
   * Get user profile
   */
  getProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE),
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
 * Health check
 */
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

