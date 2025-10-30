import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState('dark');
  const [systemTheme, setSystemTheme] = useState('dark');

  useEffect(() => {
    // Detect system theme preference
    const detectSystemTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
      return 'dark'; // Default to dark
    };

    // Load user preference from localStorage
    const loadUserPreference = () => {
      const saved = localStorage.getItem('mellchat-theme');
      if (saved && ['dark', 'light', 'auto'].includes(saved)) {
        return saved;
      }
      return 'auto';
    };

    // Calculate current theme
    const calculateTheme = () => {
      const system = detectSystemTheme();
      const user = loadUserPreference();
      
      setSystemTheme(system);
      
      if (user === 'auto') {
        setTheme(system);
      } else {
        setTheme(user);
      }
    };

    // Initial calculation
    calculateTheme();

    // Listen for system theme changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleSystemThemeChange = () => calculateTheme();
    
    darkModeQuery.addEventListener('change', handleSystemThemeChange);
    lightModeQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleSystemThemeChange);
      lightModeQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Update theme
  const updateTheme = (newTheme) => {
    if (!['dark', 'light', 'auto'].includes(newTheme)) {
      console.warn('Invalid theme:', newTheme);
      return;
    }
    
    setTheme(newTheme === 'auto' ? systemTheme : newTheme);
    localStorage.setItem('mellchat-theme', newTheme);
  };

  // Toggle between dark and light
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme);
  };

  // Get theme CSS variables
  const getThemeCSS = () => {
    const isDark = theme === 'dark';
    
    return {
      '--theme-mode': theme,
      '--is-dark': isDark ? 1 : 0,
      '--is-light': isDark ? 0 : 1,
    };
  };

  // Get theme-specific colors
  const getThemeColors = () => {
    const isDark = theme === 'dark';
    
    if (isDark) {
      return {
        '--bg-primary': '#0f0f23',
        '--bg-secondary': '#1a1a2e',
        '--bg-tertiary': '#16213e',
        '--text-primary': '#ffffff',
        '--text-secondary': 'rgba(255, 255, 255, 0.7)',
        '--text-tertiary': 'rgba(255, 255, 255, 0.5)',
        '--glass-white': 'rgba(255, 255, 255, 0.1)',
        '--glass-white-hover': 'rgba(255, 255, 255, 0.15)',
        '--glass-border': 'rgba(255, 255, 255, 0.18)',
      };
    } else {
      return {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8f9fa',
        '--bg-tertiary': '#e9ecef',
        '--text-primary': '#212529',
        '--text-secondary': 'rgba(33, 37, 41, 0.7)',
        '--text-tertiary': 'rgba(33, 37, 41, 0.5)',
        '--glass-white': 'rgba(0, 0, 0, 0.05)',
        '--glass-white-hover': 'rgba(0, 0, 0, 0.1)',
        '--glass-border': 'rgba(0, 0, 0, 0.1)',
      };
    }
  };

  return {
    theme,
    systemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isAuto: localStorage.getItem('mellchat-theme') === 'auto',
    updateTheme,
    toggleTheme,
    getThemeCSS,
    getThemeColors
  };
};
