import { PATTERNS } from './constants';

/**
 * Validate stream URL
 * @param {string} url
 * @returns {boolean}
 */
export const isValidStreamURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  return (
    PATTERNS.YOUTUBE_URL.test(url) ||
    PATTERNS.TWITCH_URL.test(url) ||
    PATTERNS.KICK_URL.test(url)
  );
};

/**
 * Validate email
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * Validate URL
 * @param {string} url
 * @returns {boolean}
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate non-empty string
 * @param {string} str
 * @returns {boolean}
 */
export const isNonEmptyString = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * Validate number in range
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export const isInRange = (num, min, max) => {
  return typeof num === 'number' && num >= min && num <= max;
};

/**
 * Validate hex color
 * @param {string} color
 * @returns {boolean}
 */
export const isValidHexColor = (color) => {
  const pattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return pattern.test(color);
};

