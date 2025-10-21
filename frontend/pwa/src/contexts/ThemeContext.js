import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

// Theme Context (simplified - Material Design only)
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Always use system language first
    const systemLanguage = navigator.language || navigator.languages?.[0] || 'en';
    const supportedLanguages = ['ru', 'en', 'uk'];
    
    // Find best match
    for (const lang of supportedLanguages) {
      if (systemLanguage.startsWith(lang)) {
        return lang;
      }
    }
    
    return 'uk'; // Default fallback
  });

  // Sync language with i18n on mount
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Listen for system language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const systemLanguage = navigator.language || 'en';
      const supportedLanguages = ['ru', 'en', 'uk'];
      
      for (const lang of supportedLanguages) {
        if (systemLanguage.startsWith(lang)) {
          setLanguage(lang);
          i18n.changeLanguage(lang);
          break;
        }
      }
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  // Update language preference
  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  // Reset to system language
  const resetToDefaults = () => {
    const systemLanguage = navigator.language || 'en';
    const supportedLanguages = ['ru', 'en', 'uk'];
    
    for (const lang of supportedLanguages) {
      if (systemLanguage.startsWith(lang)) {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        break;
      }
    }
  };

  const value = {
    language,
    updateLanguage,
    resetToDefaults
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
