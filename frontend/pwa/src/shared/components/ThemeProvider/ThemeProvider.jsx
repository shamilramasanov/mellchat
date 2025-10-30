import { createContext, useContext, useEffect } from 'react';
import { useTheme } from '@shared/hooks/useTheme';

const ThemeContext = createContext();

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Принудительно устанавливаем только темную тему
  const theme = {
    theme: 'dark',
    isDark: true,
    toggleTheme: () => {}, // Отключаем переключение
    getThemeCSS: () => ({}),
    getThemeColors: () => ({})
  };

  // Apply dark theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Принудительно устанавливаем темную тему
    root.setAttribute('data-theme', 'dark');
    document.body.className = 'theme-dark';

    // Update meta theme-color for mobile browsers - только темный
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0f0f23');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0f0f23';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
