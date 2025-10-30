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
  const theme = useTheme();

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme CSS variables
    const themeCSS = theme.getThemeCSS();
    const themeColors = theme.getThemeColors();
    
    const allCSS = { ...themeCSS, ...themeColors };
    
    Object.entries(allCSS).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.isDark ? '#0f0f23' : '#ffffff');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme.isDark ? '#0f0f23' : '#ffffff';
      document.head.appendChild(meta);
    }

    // Add theme class to body for CSS targeting
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim() + ` theme-${theme.theme}`;

    return () => {
      // Reset on unmount
      Object.keys(allCSS).forEach(property => {
        root.style.removeProperty(property);
      });
    };
  }, [theme.theme, theme.isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
