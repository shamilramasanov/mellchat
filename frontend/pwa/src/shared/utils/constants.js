// API Configuration  
export const API_URL = import.meta.env.VITE_API_URL || 'https://mellchat-production.up.railway.app';
// Native WebSocket URL (not Socket.io)
const wsUrl = import.meta.env.VITE_WS_URL || 'https://mellchat-production.up.railway.app';
export const WS_URL = wsUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MellChat';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.0.0';

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  STREAM_CONNECTED: 'stream:connected',
  STREAM_DISCONNECTED: 'stream:disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
  RECONNECT_FAILED: 'reconnect_failed',
};

// Connection Status
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
};

// Platforms
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  TWITCH: 'twitch',
  KICK: 'kick',
};

export const PLATFORM_COLORS = {
  [PLATFORMS.YOUTUBE]: '#FF0000',
  [PLATFORMS.TWITCH]: '#9146FF',
  [PLATFORMS.KICK]: '#53FC18',
};

export const PLATFORM_ICONS = {
  [PLATFORMS.YOUTUBE]: '📺',
  [PLATFORMS.TWITCH]: '🎮',
  [PLATFORMS.KICK]: '⚡',
};

export const PLATFORM_LOGOS = {
  [PLATFORMS.YOUTUBE]: '/youtube-ar21.svg',
  [PLATFORMS.TWITCH]: '/twitch-ar21.svg',
  [PLATFORMS.KICK]: '/Kick_idgV2zzJP__0.svg',
};

export const PLATFORM_NAMES = {
  [PLATFORMS.YOUTUBE]: 'YouTube',
  [PLATFORMS.TWITCH]: 'Twitch',
  [PLATFORMS.KICK]: 'Kick',
};

// Filters
export const FILTERS = {
  ALL: 'all',
  QUESTIONS: 'questions',
  ALL_QUESTIONS: 'all_questions',
  SPAM: 'spam',
};

// Sort Options
export const SORT_OPTIONS = {
  TIME: 'time',
  POPULAR: 'popular',
  ACTIVE: 'active',
};

// Settings
export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
};

export const FONT_SIZE_VALUES = {
  [FONT_SIZES.SMALL]: '0.875rem',
  [FONT_SIZES.MEDIUM]: '1rem',
  [FONT_SIZES.LARGE]: '1.125rem',
  [FONT_SIZES.XLARGE]: '1.25rem',
};

export const DISPLAY_DENSITY = {
  COMPACT: 'compact',
  COMFORTABLE: 'comfortable',
  SPACIOUS: 'spacious',
};

export const DENSITY_VALUES = {
  [DISPLAY_DENSITY.COMPACT]: {
    padding: '0.5rem',
    gap: '0.5rem',
  },
  [DISPLAY_DENSITY.COMFORTABLE]: {
    padding: '1rem',
    gap: '0.75rem',
  },
  [DISPLAY_DENSITY.SPACIOUS]: {
    padding: '1.5rem',
    gap: '1rem',
  },
};

export const NICKNAME_COLOR_MODES = {
  RANDOM: 'random',
  PLATFORM: 'platform',
  MONO: 'mono',
};

// Languages
export const LANGUAGES = {
  EN: 'en',
  RU: 'ru',
  UK: 'uk',
};

export const LANGUAGE_NAMES = {
  [LANGUAGES.EN]: 'English',
  [LANGUAGES.RU]: 'Русский',
  [LANGUAGES.UK]: 'Українська',
};

export const LANGUAGE_FLAGS = {
  [LANGUAGES.EN]: '🇺🇸',
  [LANGUAGES.RU]: '🇷🇺',
  [LANGUAGES.UK]: '🇺🇦',
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  LANGUAGE: 'language',
  SETTINGS: 'settings',
  RECENT_STREAMS: 'recent_streams',
  SKIP_AUTH: 'skip_auth',
};

// Limits
export const LIMITS = {
  MAX_RECENT_STREAMS: 20,
  MAX_MESSAGES_CACHE: 500,
  SEARCH_DEBOUNCE_MS: 300,
  AUTO_SCROLL_DELAY_MS: 5000,
  HISTORY_RETENTION_DAYS: 30,
};

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 767,
  TABLET: 1023,
  DESKTOP: 1024,
};

// z-index Scale
export const Z_INDEX = {
  BASE: 1,
  MESSAGES: 10,
  CARDS: 50,
  HEADER: 100,
  FAB: 1000,
  MODAL: 2000,
  TOAST: 3000,
  TOOLTIP: 4000,
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  STREAMS: {
    CONNECT: '/connect',
    DISCONNECT: (streamId) => `/streams/${streamId}`,
  },
  EMOJI: {
    BTTV: '/emoji/bttv',
    FFZ: '/emoji/ffz',
    SEVENTV: '/emoji/7tv',
  },
};

// Regex Patterns
export const PATTERNS = {
  YOUTUBE_URL: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  TWITCH_URL: /twitch\.tv\/([a-zA-Z0-9_]+)/,
  KICK_URL: /kick\.com\/([a-zA-Z0-9_-]+)/,
  QUESTION: /\?/,
};

// Toast Configuration
export const TOAST_CONFIG = {
  duration: 3000,
  position: 'top-right',
  style: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '12px',
    color: 'white',
    padding: '16px',
  },
};

