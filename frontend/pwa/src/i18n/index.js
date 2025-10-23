import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Filters
      'filter.all': 'All',
      'filter.questions': 'Questions',
      'filter.allQuestions': 'All Questions',
      'filter.bookmarks': 'Bookmarks',
      'filter.spam': 'Spam',
      
      // Sort
      'sort.time': 'Time',
      'sort.popular': 'Popular',
      'sort.active': 'Active',
      
      // Search
      'search.placeholder': 'Search by username or message...',
      
      // Chat
      'chat.noMessages': 'No messages yet',
      'chat.newMessages': 'New Messages',
      
      // Settings
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.translation': 'Auto Translation',
      'settings.fontSize': 'Font Size',
      'settings.fontSizeSmall': 'Small',
      'settings.fontSizeMedium': 'Medium',
      'settings.fontSizeLarge': 'Large',
      'settings.fontSizeXlarge': 'Extra Large',
      'settings.autoScroll': 'Auto Scroll',
      'settings.autoScrollDelay': 'Auto Scroll Delay',
      'settings.density': 'Display Density',
      'settings.densityCompact': 'Compact',
      'settings.densityComfortable': 'Comfortable',
      'settings.densitySpacious': 'Spacious',
      'settings.notifications': 'Notifications',
      'settings.notifyMessages': 'Notify New Messages',
      
      // Languages
      'lang.en': 'English',
      'lang.ru': 'Русский',
      'lang.uk': 'Українська',
      
      // Common
      'common.close': 'Close',
    }
  },
  ru: {
    translation: {
      // Filters
      'filter.all': 'Все',
      'filter.questions': 'Вопросы',
      'filter.allQuestions': 'Все вопросы',
      'filter.bookmarks': 'Закладки',
      'filter.spam': 'Спам',
      
      // Sort
      'sort.time': 'Время',
      'sort.popular': 'Популярные',
      'sort.active': 'Активные',
      
      // Search
      'search.placeholder': 'Поиск по нику или сообщению...',
      
      // Chat
      'chat.noMessages': 'Пока нет сообщений',
      'chat.newMessages': 'Новые сообщения',
      
      // Settings
      'settings.title': 'Настройки',
      'settings.language': 'Язык',
      'settings.translation': 'Автоперевод',
      'settings.fontSize': 'Размер шрифта',
      'settings.fontSizeSmall': 'Малый',
      'settings.fontSizeMedium': 'Средний',
      'settings.fontSizeLarge': 'Большой',
      'settings.fontSizeXlarge': 'Очень большой',
      'settings.autoScroll': 'Автопрокрутка',
      'settings.autoScrollDelay': 'Задержка автопрокрутки',
      'settings.density': 'Плотность отображения',
      'settings.densityCompact': 'Компактная',
      'settings.densityComfortable': 'Комфортная',
      'settings.densitySpacious': 'Просторная',
      'settings.notifications': 'Уведомления',
      'settings.notifyMessages': 'Уведомлять о новых сообщениях',
      
      // Languages
      'lang.en': 'English',
      'lang.ru': 'Русский',
      'lang.uk': 'Українська',
      
      // Common
      'common.close': 'Закрыть',
    }
  },
  uk: {
    translation: {
      // Filters
      'filter.all': 'Всі',
      'filter.questions': 'Питання',
      'filter.allQuestions': 'Всі питання',
      'filter.bookmarks': 'Закладки',
      'filter.spam': 'Спам',
      
      // Sort
      'sort.time': 'Час',
      'sort.popular': 'Популярні',
      'sort.active': 'Активні',
      
      // Search
      'search.placeholder': 'Пошук по ніку або повідомленню...',
      
      // Chat
      'chat.noMessages': 'Поки немає повідомлень',
      'chat.newMessages': 'Нові повідомлення',
      
      // Settings
      'settings.title': 'Налаштування',
      'settings.language': 'Мова',
      'settings.translation': 'Автопереклад',
      'settings.fontSize': 'Розмір шрифту',
      'settings.fontSizeSmall': 'Малий',
      'settings.fontSizeMedium': 'Середній',
      'settings.fontSizeLarge': 'Великий',
      'settings.fontSizeXlarge': 'Дуже великий',
      'settings.autoScroll': 'Автопрокрутка',
      'settings.autoScrollDelay': 'Затримка автопрокрутки',
      'settings.density': 'Щільність відображення',
      'settings.densityCompact': 'Компактна',
      'settings.densityComfortable': 'Зручна',
      'settings.densitySpacious': 'Простора',
      'settings.notifications': 'Сповіщення',
      'settings.notifyMessages': 'Повідомляти про нові повідомлення',
      
      // Languages
      'lang.en': 'English',
      'lang.ru': 'Русский',
      'lang.uk': 'Українська',
      
      // Common
      'common.close': 'Закрити',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'htmlTag'],
      caches: []
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

