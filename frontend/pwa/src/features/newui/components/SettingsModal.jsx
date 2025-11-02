import { X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SettingsModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  
  if (!isOpen) return null;

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' }
  ];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl elevation-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-black">{t('common.settings')}</h2>
          <button onClick={onClose} className="ripple p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors text-black" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-700">
              <Globe className="h-4 w-4" />
              <span className="text-sm">{t('common.language')}</span>
            </div>
            <div className="space-y-2">
              {languages.map((language) => (
                <button 
                  key={language.code}
                  onClick={() => changeLanguage(language.code)} 
                  className={`ripple w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    i18n.language === language.code 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{language.flag}</span>
                    <span className="text-sm text-black">{language.name}</span>
                  </div>
                  {i18n.language === language.code && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


