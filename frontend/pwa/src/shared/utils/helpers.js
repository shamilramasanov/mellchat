import { PLATFORMS, PATTERNS, PLATFORM_COLORS } from './constants';

/**
 * Detect platform from URL
 * @param {string} url - Stream URL
 * @returns {string|null} - Platform name or null
 */
export const detectPlatform = (url) => {
  if (PATTERNS.YOUTUBE_URL.test(url)) return PLATFORMS.YOUTUBE;
  if (PATTERNS.TWITCH_URL.test(url)) return PLATFORMS.TWITCH;
  if (PATTERNS.KICK_URL.test(url)) return PLATFORMS.KICK;
  return null;
};

/**
 * Extract stream ID from URL
 * @param {string} url - Stream URL
 * @returns {string|null} - Stream ID or null
 */
export const extractStreamId = (url) => {
  const youtubeMatch = url.match(PATTERNS.YOUTUBE_URL);
  if (youtubeMatch) return youtubeMatch[1];
  
  const twitchMatch = url.match(PATTERNS.TWITCH_URL);
  if (twitchMatch) return twitchMatch[1];
  
  const kickMatch = url.match(PATTERNS.KICK_URL);
  if (kickMatch) return kickMatch[1];
  
  return null;
};

/**
 * Check if message is a question
 * @param {string} text - Message text
 * @returns {boolean}
 */
export const isQuestion = (text) => {
  return PATTERNS.QUESTION.test(text);
};

/**
 * Format timestamp to relative time
 * @param {Date|string|number} timestamp
 * @returns {string}
 */
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
};

/**
 * Generate color from string (for usernames)
 * @param {string} str - String to generate color from
 * @returns {string} - Hex color
 */
export const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate bright colors only
  const hue = hash % 360;
  const saturation = 70 + (hash % 30); // 70-100%
  const lightness = 60 + (hash % 20); // 60-80%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Get platform color
 * @param {string} platform
 * @returns {string}
 */
export const getPlatformColor = (platform) => {
  return PLATFORM_COLORS[platform] || '#ffffff';
};

/**
 * Truncate text
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if device is iOS
 * @returns {boolean}
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Check if app is in standalone mode (installed PWA)
 * @returns {boolean}
 */
export const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

/**
 * Get browser language
 * @returns {string}
 */
export const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage;
  return lang.split('-')[0]; // 'en-US' -> 'en'
};

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Format number with K/M suffix
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Parse error message from API response
 * @param {Error} error
 * @returns {string}
 */
export const parseErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Sleep function (for testing/debugging)
 * @param {number} ms
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get contrast color (black or white) for given background
 * @param {string} hexColor
 * @returns {string}
 */
export const getContrastColor = (hexColor) => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Merge class names
 * @param  {...any} classes
 * @returns {string}
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

