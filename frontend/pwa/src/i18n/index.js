import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  ru: {
    translation: {
      // Navigation
      'nav.questions': 'Питання',
      'nav.messages': 'Повідомлення',
      'nav.settings': 'Налаштування',
      
      // Connect modal
      'connect.title': 'Підключити трансляцію',
      'connect.input.placeholder': 'Введіть URL трансляції...',
      'connect.button': 'Підключити',
      'connect.close': 'Закрити',
      
      // Stream info
      'stream.platform.youtube': 'YouTube',
      'stream.platform.twitch': 'Twitch',
      'stream.platform.kick': 'Kick',
      'stream.disconnect': 'Відключити',
      
      // Messages
      'messages.empty.title': 'Повідомлення відсутні',
      'messages.empty.description': 'Очікуйте повідомлення від глядачів',
      'messages.time.now': 'щойно',
      
      // Questions
      'questions.empty.title': 'Питання відсутні',
      'questions.empty.description': 'Очікуйте питання від глядачів',
      'questions.upvote': '👍',
      'questions.answered': 'Відповіли',
      
      // Theme settings
      'theme.title': 'Налаштування інтерфейсу',
      'theme.theme.label': 'Тема',
      'theme.theme.light': 'Світла',
      'theme.theme.dark': 'Темна',
      'theme.theme.auto': 'Авто',
      'theme.language.label': 'Мова',
      'theme.language.ru': 'Русский',
      'theme.language.en': 'English',
      'theme.language.uk': 'Українська',
      'theme.close': 'Закрити',
      
      // Errors
      'error.connection.failed': 'Не вдалося підключитися',
      'error.invalid.url': 'Невірний URL трансляції',
      'error.network': 'Помилка мережі',
      
      // Success
      'success.connected': 'Підключено до трансляції',
      'success.disconnected': 'Відключено від трансляції'
    }
  },
  en: {
    translation: {
      // Navigation
      'nav.questions': 'Questions',
      'nav.messages': 'Messages',
      'nav.settings': 'Settings',
      
      // Connect modal
      'connect.title': 'Connect Stream',
      'connect.input.placeholder': 'Enter stream URL...',
      'connect.button': 'Connect',
      'connect.close': 'Close',
      
      // Stream info
      'stream.platform.youtube': 'YouTube',
      'stream.platform.twitch': 'Twitch',
      'stream.platform.kick': 'Kick',
      'stream.disconnect': 'Disconnect',
      
      // Messages
      'messages.empty.title': 'No messages',
      'messages.empty.description': 'Waiting for viewer messages',
      'messages.time.now': 'now',
      
      // Questions
      'questions.empty.title': 'No questions',
      'questions.empty.description': 'Waiting for viewer questions',
      'questions.upvote': '👍',
      'questions.answered': 'Answered',
      
      // Theme settings
      'theme.title': 'Interface Settings',
      'theme.theme.label': 'Theme',
      'theme.theme.light': 'Light',
      'theme.theme.dark': 'Dark',
      'theme.theme.auto': 'Auto',
      'theme.language.label': 'Language',
      'theme.language.ru': 'Русский',
      'theme.language.en': 'English',
      'theme.language.uk': 'Українська',
      'theme.close': 'Close',
      
      // Errors
      'error.connection.failed': 'Failed to connect',
      'error.invalid.url': 'Invalid stream URL',
      'error.network': 'Network error',
      
      // Success
      'success.connected': 'Connected to stream',
      'success.disconnected': 'Disconnected from stream'
    }
  },
  uk: {
    translation: {
      // Navigation
      'nav.questions': 'Питання',
      'nav.messages': 'Повідомлення',
      'nav.settings': 'Налаштування',
      
      // Connect modal
      'connect.title': 'Підключити трансляцію',
      'connect.input.placeholder': 'Введіть URL трансляції...',
      'connect.button': 'Підключити',
      'connect.close': 'Закрити',
      
      // Stream info
      'stream.platform.youtube': 'YouTube',
      'stream.platform.twitch': 'Twitch',
      'stream.platform.kick': 'Kick',
      'stream.disconnect': 'Відключити',
      
      // Messages
      'messages.empty.title': 'Повідомлення відсутні',
      'messages.empty.description': 'Очікуйте повідомлення від глядачів',
      'messages.time.now': 'щойно',
      
      // Questions
      'questions.empty.title': 'Питання відсутні',
      'questions.empty.description': 'Очікуйте питання від глядачів',
      'questions.upvote': '👍',
      'questions.answered': 'Відповіли',
      
      // Theme settings
      'theme.title': 'Налаштування інтерфейсу',
      'theme.theme.label': 'Тема',
      'theme.theme.light': 'Світла',
      'theme.theme.dark': 'Темна',
      'theme.theme.auto': 'Авто',
      'theme.language.label': 'Мова',
      'theme.language.ru': 'Русский',
      'theme.language.en': 'English',
      'theme.language.uk': 'Українська',
      'theme.close': 'Закрити',
      
      // Errors
      'error.connection.failed': 'Не вдалося підключитися',
      'error.invalid.url': 'Невірний URL трансляції',
      'error.network': 'Помилка мережі',
      
      // Success
      'success.connected': 'Підключено до трансляції',
      'success.disconnected': 'Відключено від трансляції'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uk', // Default to Ukrainian
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mellchat-language'
    },
    
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
