import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

// Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('mellchat-theme');
    if (savedTheme && ['retro', 'win11', 'macos'].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Default to retro (Windows 95 style)
    return 'retro';
  });

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

  // No need to listen for system theme changes - we use style themes, not dark/light

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

  // Save theme preference
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('mellchat-theme', newTheme);
  };

  // Save language preference (optional - can be removed if always using system)
  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    localStorage.removeItem('mellchat-theme');
    setTheme('retro'); // Default to Retro theme
    
    // Reset to system language
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
    theme,
    language,
    updateTheme,
    updateLanguage,
    resetToDefaults,
    isRetro: theme === 'retro',
    isWin11: theme === 'win11',
    isMacOS: theme === 'macos'
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
