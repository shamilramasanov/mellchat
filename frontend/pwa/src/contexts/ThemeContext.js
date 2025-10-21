import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('mellchat-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('mellchat-language');
    if (savedLanguage) {
      return savedLanguage;
    }
    
    // Fallback to system language
    const systemLanguage = navigator.language || navigator.languages?.[0] || 'en';
    const supportedLanguages = ['ru', 'en', 'uk'];
    
    // Find best match
    for (const lang of supportedLanguages) {
      if (systemLanguage.startsWith(lang)) {
        return lang;
      }
    }
    
    return 'ru'; // Default fallback
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('mellchat-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for system language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      // Only auto-switch if user hasn't manually set a preference
      const savedLanguage = localStorage.getItem('mellchat-language');
      if (!savedLanguage) {
        const systemLanguage = navigator.language || 'en';
        const supportedLanguages = ['ru', 'en', 'uk'];
        
        for (const lang of supportedLanguages) {
          if (systemLanguage.startsWith(lang)) {
            setLanguage(lang);
            break;
          }
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

  // Save language preference
  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('mellchat-language', newLanguage);
  };

  // Reset to system preferences
  const resetToSystem = () => {
    localStorage.removeItem('mellchat-theme');
    localStorage.removeItem('mellchat-language');
    
    // Reset to system theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    
    // Reset to system language
    const systemLanguage = navigator.language || 'en';
    const supportedLanguages = ['ru', 'en', 'uk'];
    
    for (const lang of supportedLanguages) {
      if (systemLanguage.startsWith(lang)) {
        setLanguage(lang);
        break;
      }
    }
  };

  const value = {
    theme,
    language,
    updateTheme,
    updateLanguage,
    resetToSystem,
    isDark: theme === 'dark',
    isLight: theme === 'light'
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
