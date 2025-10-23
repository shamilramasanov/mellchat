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
      
      // Auth
      'auth.subtitle': 'Connect your favorite streaming platforms',
      'auth.login': 'Login with Google',
      'auth.skip': 'Skip for now',
      
      // Recent Streams
      'recent.title': 'Recent Streams',
      'recent.subtitle': 'Click on a stream to reconnect, or add a new one using the + button',
      'recent.empty.title': 'No recent streams',
      'recent.empty.subtitle': 'Add your first stream using the + button above',
      'recent.remove': 'Remove from history',
      
      // Stream Cards
      'stream.live': 'LIVE',
      'stream.offline': 'Offline',
      'stream.viewers': 'viewers',
      'stream.messages': 'messages',
      
      // Chat Actions
      'chat.like': 'Like',
      'chat.dislike': 'Dislike',
      'chat.bookmark': 'Bookmark',
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
      
      // Auth
      'auth.subtitle': 'Подключите ваши любимые платформы для стримов',
      'auth.login': 'Войти через Google',
      'auth.skip': 'Пропустить',
      
      // Recent Streams
      'recent.title': 'Недавние стримы',
      'recent.subtitle': 'Нажмите на стрим для переподключения или добавьте новый с помощью кнопки +',
      'recent.empty.title': 'Нет недавних стримов',
      'recent.empty.subtitle': 'Добавьте ваш первый стрим с помощью кнопки + выше',
      'recent.remove': 'Удалить из истории',
      
      // Stream Cards
      'stream.live': 'В ЭФИРЕ',
      'stream.offline': 'Офлайн',
      'stream.viewers': 'зрителей',
      'stream.messages': 'сообщений',
      
      // Chat Actions
      'chat.like': 'Нравится',
      'chat.dislike': 'Не нравится',
      'chat.bookmark': 'Закладка',
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
      
      // Auth
      'auth.subtitle': 'Підключіть ваші улюблені платформи для стрімів',
      'auth.login': 'Увійти через Google',
      'auth.skip': 'Пропустити',
      
      // Recent Streams
      'recent.title': 'Недавні стріми',
      'recent.subtitle': 'Натисніть на стрім для перепідключення або додайте новий за допомогою кнопки +',
      'recent.empty.title': 'Немає недавніх стрімів',
      'recent.empty.subtitle': 'Додайте ваш перший стрім за допомогою кнопки + вище',
      'recent.remove': 'Видалити з історії',
      
      // Stream Cards
      'stream.live': 'В ЕФІРІ',
      'stream.offline': 'Офлайн',
      'stream.viewers': 'глядачів',
      'stream.messages': 'повідомлень',
      
      // Chat Actions
      'chat.like': 'Подобається',
      'chat.dislike': 'Не подобається',
      'chat.bookmark': 'Закладка',
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

