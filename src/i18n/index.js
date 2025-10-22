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

