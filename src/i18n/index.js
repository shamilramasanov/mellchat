import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGES, STORAGE_KEYS } from '../shared/utils/constants';
import { getBrowserLanguage } from '../shared/utils/helpers';

// Import translations
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

// Get saved language or detect from browser
const getSavedLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (saved && Object.values(LANGUAGES).includes(saved)) {
    return saved;
  }
  
  // Detect from browser
  const browserLang = getBrowserLanguage();
  if (Object.values(LANGUAGES).includes(browserLang)) {
    return browserLang;
  }
  
  // Default to English
  return LANGUAGES.EN;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      uk: { translation: uk },
    },
    lng: getSavedLanguage(),
    fallbackLng: LANGUAGES.EN,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
  document.documentElement.lang = lng;
});

export default i18n;

