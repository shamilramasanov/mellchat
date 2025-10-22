import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Auth
      'auth.skip': 'Skip for now',
      'auth.login': 'Sign in with Google',
      'auth.logout': 'Logout',
      'auth.welcome': 'Welcome to MellChat',
      'auth.subtitle': 'Manage live chats from YouTube, Twitch, and Kick',
      
      // Main
      'main.noStreams': 'No active streams',
      'main.addStream': 'Add stream',
      'main.addStreamPlaceholder': 'Paste YouTube, Twitch, or Kick stream URL',
      'main.connect': 'Connect',
      'main.cancel': 'Cancel',
      
      // Add Stream Modal
      'addStream.errorEmpty': 'Please enter a URL',
      'addStream.errorInvalid': 'Invalid stream URL. Supported: YouTube, Twitch, Kick',
      'addStream.errorGeneric': 'Failed to add stream',
      
      // Stream Status
      'stream.live': 'LIVE',
      'stream.offline': 'Offline',
      'stream.viewers': 'viewers',
      'stream.messages': 'messages',
      
      // Filters
      'filter.all': 'All',
      'filter.questions': 'Questions',
      'filter.bookmarks': 'Bookmarks',
      'filter.spam': 'Spam',
      
      // Search
      'search.placeholder': 'Search messages...',
      
      // Sort
      'sort.time': 'New',
      'sort.popular': 'Top',
      'sort.active': 'Active',
      
      // Chat
      'chat.noMessages': 'No messages yet',
      'chat.newMessages': 'New messages',
      'chat.bookmark': 'Bookmark',
      'chat.bookmarked': 'Bookmarked',
      
      // Settings
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.translation': 'Auto-translate messages',
      'settings.fontSize': 'Font size',
      'settings.fontSizeSmall': 'Small',
      'settings.fontSizeMedium': 'Medium',
      'settings.fontSizeLarge': 'Large',
      'settings.fontSizeXLarge': 'Extra Large',
      'settings.autoScroll': 'Auto-scroll to new messages',
      'settings.autoScrollDelay': 'Auto-scroll delay (seconds)',
      'settings.density': 'Chat density',
      'settings.densityCompact': 'Compact',
      'settings.densityComfortable': 'Comfortable',
      'settings.densitySpacious': 'Spacious',
      'settings.notifications': 'Notifications',
      'settings.notifyMessages': 'New messages',
      'settings.notifyQuestions': 'New questions',
      'settings.historyRetention': 'History retention (days)',
      'settings.nicknameColors': 'Nickname colors',
      'settings.nicknameColorRandom': 'Random',
      'settings.nicknameColorPlatform': 'By platform',
      'settings.nicknameColorMono': 'Monochrome',
      
      // Languages
      'lang.en': 'English',
      'lang.ru': 'Русский',
      'lang.uk': 'Українська',
      
      // Common
      'common.close': 'Close',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.error': 'Error',
      'common.loading': 'Loading...',
    }
  },
  ru: {
    translation: {
      // Auth
      'auth.skip': 'Пропустить',
      'auth.login': 'Войти через Google',
      'auth.logout': 'Выйти',
      'auth.welcome': 'Добро пожаловать в MellChat',
      'auth.subtitle': 'Управляйте чатами YouTube, Twitch и Kick',
      
      // Main
      'main.noStreams': 'Нет активных трансляций',
      'main.addStream': 'Добавить трансляцию',
      'main.addStreamPlaceholder': 'Вставьте ссылку на YouTube, Twitch или Kick',
      'main.connect': 'Подключиться',
      'main.cancel': 'Отмена',
      
      // Add Stream Modal
      'addStream.errorEmpty': 'Пожалуйста, введите URL',
      'addStream.errorInvalid': 'Неверная ссылка. Поддерживаются: YouTube, Twitch, Kick',
      'addStream.errorGeneric': 'Не удалось добавить трансляцию',
      
      // Stream Status
      'stream.live': 'В ЭФИРЕ',
      'stream.offline': 'Не в сети',
      'stream.viewers': 'зрителей',
      'stream.messages': 'сообщений',
      
      // Filters
      'filter.all': 'Все',
      'filter.questions': 'Вопросы',
      'filter.bookmarks': 'Закладки',
      'filter.spam': 'Спам',
      
      // Search
      'search.placeholder': 'Поиск по чату...',
      
      // Sort
      'sort.time': 'Новые',
      'sort.popular': 'Топ',
      'sort.active': 'Активные',
      
      // Chat
      'chat.noMessages': 'Пока нет сообщений',
      'chat.newMessages': 'Новые сообщения',
      'chat.bookmark': 'В закладки',
      'chat.bookmarked': 'В закладках',
      
      // Settings
      'settings.title': 'Настройки',
      'settings.language': 'Язык',
      'settings.translation': 'Автоперевод сообщений',
      'settings.fontSize': 'Размер шрифта',
      'settings.fontSizeSmall': 'Маленький',
      'settings.fontSizeMedium': 'Средний',
      'settings.fontSizeLarge': 'Большой',
      'settings.fontSizeXLarge': 'Очень большой',
      'settings.autoScroll': 'Автопрокрутка к новым сообщениям',
      'settings.autoScrollDelay': 'Задержка автопрокрутки (секунды)',
      'settings.density': 'Плотность чата',
      'settings.densityCompact': 'Компактный',
      'settings.densityComfortable': 'Комфортный',
      'settings.densitySpacious': 'Просторный',
      'settings.notifications': 'Уведомления',
      'settings.notifyMessages': 'Новые сообщения',
      'settings.notifyQuestions': 'Новые вопросы',
      'settings.historyRetention': 'Хранение истории (дни)',
      'settings.nicknameColors': 'Цвета никнеймов',
      'settings.nicknameColorRandom': 'Случайные',
      'settings.nicknameColorPlatform': 'По платформе',
      'settings.nicknameColorMono': 'Монохром',
      
      // Languages
      'lang.en': 'English',
      'lang.ru': 'Русский',
      'lang.uk': 'Українська',
      
      // Common
      'common.close': 'Закрыть',
      'common.save': 'Сохранить',
      'common.delete': 'Удалить',
      'common.error': 'Ошибка',
      'common.loading': 'Загрузка...',
    }
  },
  uk: {
    translation: {
      // Auth
      'auth.skip': 'Пропустити',
      'auth.login': 'Увійти через Google',
      'auth.logout': 'Вийти',
      'auth.welcome': 'Ласкаво просимо до MellChat',
      'auth.subtitle': 'Керуйте чатами YouTube, Twitch та Kick',
      
      // Main
      'main.noStreams': 'Немає активних трансляцій',
      'main.addStream': 'Додати трансляцію',
      'main.addStreamPlaceholder': 'Вставте посилання на YouTube, Twitch або Kick',
      'main.connect': 'Підключитися',
      'main.cancel': 'Скасувати',
      
      // Add Stream Modal
      'addStream.errorEmpty': 'Будь ласка, введіть URL',
      'addStream.errorInvalid': 'Невірне посилання. Підтримуються: YouTube, Twitch, Kick',
      'addStream.errorGeneric': 'Не вдалося додати трансляцію',
      
      // Stream Status
      'stream.live': 'В ЕФІРІ',
      'stream.offline': 'Не в мережі',
      'stream.viewers': 'глядачів',
      'stream.messages': 'повідомлень',
      
      // Filters
      'filter.all': 'Всі',
      'filter.questions': 'Питання',
      'filter.bookmarks': 'Закладки',
      'filter.spam': 'Спам',
      
      // Search
      'search.placeholder': 'Пошук по чату...',
      
      // Sort
      'sort.time': 'Нові',
      'sort.popular': 'Топ',
      'sort.active': 'Активні',
      
      // Chat
      'chat.noMessages': 'Поки немає повідомлень',
      'chat.newMessages': 'Нові повідомлення',
      'chat.bookmark': 'У закладки',
      'chat.bookmarked': 'У закладках',
      
      // Settings
      'settings.title': 'Налаштування',
      'settings.language': 'Мова',
      'settings.translation': 'Автопереклад повідомлень',
      'settings.fontSize': 'Розмір шрифту',
      'settings.fontSizeSmall': 'Маленький',
      'settings.fontSizeMedium': 'Середній',
      'settings.fontSizeLarge': 'Великий',
      'settings.fontSizeXLarge': 'Дуже великий',
      'settings.autoScroll': 'Автопрокрутка до нових повідомлень',
      'settings.autoScrollDelay': 'Затримка автопрокрутки (секунди)',
      'settings.density': 'Щільність чату',
      'settings.densityCompact': 'Компактний',
      'settings.densityComfortable': 'Комфортний',
      'settings.densitySpacious': 'Просторий',
      'settings.notifications': 'Сповіщення',
      'settings.notifyMessages': 'Нові повідомлення',
      'settings.notifyQuestions': 'Нові питання',
      'settings.historyRetention': 'Зберігання історії (дні)',
      'settings.nicknameColors': 'Кольори нікнеймів',
      'settings.nicknameColorRandom': 'Випадкові',
      'settings.nicknameColorPlatform': 'За платформою',
      'settings.nicknameColorMono': 'Монохром',
      
      // Languages
      'lang.en': 'English',
      'lang.ru': 'Русский',
      'lang.uk': 'Українська',
      
      // Common
      'common.close': 'Закрити',
      'common.save': 'Зберегти',
      'common.delete': 'Видалити',
      'common.error': 'Помилка',
      'common.loading': 'Завантаження...',
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

