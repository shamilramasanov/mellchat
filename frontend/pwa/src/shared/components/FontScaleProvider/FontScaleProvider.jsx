import { createContext, useContext, useEffect } from 'react';
import { useFontScaling } from '@shared/hooks/useFontScaling';

const FontScaleContext = createContext();

export const useFontScale = () => {
  const context = useContext(FontScaleContext);
  if (!context) {
    throw new Error('useFontScale must be used within FontScaleProvider');
  }
  return context;
};

export const FontScaleProvider = ({ children }) => {
  const fontScale = useFontScaling();

  // Apply font scale to document root
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = fontScale.getFontScaleCSS();
    
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    return () => {
      // Reset on unmount
      Object.keys(cssVars).forEach(property => {
        root.style.removeProperty(property);
      });
    };
  }, [fontScale.fontScale]);

  return (
    <FontScaleContext.Provider value={fontScale}>
      {children}
    </FontScaleContext.Provider>
  );
};
