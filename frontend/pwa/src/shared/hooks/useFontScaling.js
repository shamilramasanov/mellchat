import { useState, useEffect } from 'react';

export const useFontScaling = () => {
  const [fontScale, setFontScale] = useState(1);
  const [userFontScale, setUserFontScale] = useState(1);
  const [systemFontScale, setSystemFontScale] = useState(1);

  useEffect(() => {
    // Detect system font scale preference
    const detectSystemFontScale = () => {
      // Check for prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check for system font size (iOS Safari)
      const testElement = document.createElement('div');
      testElement.style.fontSize = '16px';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.textContent = 'M';
      document.body.appendChild(testElement);
      
      const actualSize = testElement.offsetHeight;
      document.body.removeChild(testElement);
      
      // Calculate scale factor (16px is the base)
      const scale = actualSize / 16;
      
      // Apply reduced motion scaling if needed
      const finalScale = prefersReducedMotion ? Math.min(scale, 1.2) : scale;
      
      setSystemFontScale(finalScale);
      return finalScale;
    };

    // Load user preference from localStorage
    const loadUserPreference = () => {
      const saved = localStorage.getItem('mellchat-font-scale');
      if (saved) {
        const scale = parseFloat(saved);
        if (scale >= 0.8 && scale <= 2.0) {
          setUserFontScale(scale);
          return scale;
        }
      }
      return 1;
    };

    // Calculate final font scale
    const calculateFontScale = () => {
      const systemScale = detectSystemFontScale();
      const userScale = loadUserPreference();
      
      // Combine system and user preferences
      const finalScale = systemScale * userScale;
      setFontScale(Math.max(0.8, Math.min(2.0, finalScale)));
    };

    // Initial calculation
    calculateFontScale();

    // Listen for system changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleSystemChange = () => calculateFontScale();
    
    mediaQuery.addEventListener('change', handleSystemChange);
    window.addEventListener('resize', handleSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('resize', handleSystemChange);
    };
  }, []);

  // Update font scale
  const updateFontScale = (scale) => {
    const clampedScale = Math.max(0.8, Math.min(2.0, scale));
    setUserFontScale(clampedScale);
    setFontScale(systemFontScale * clampedScale);
    localStorage.setItem('mellchat-font-scale', clampedScale.toString());
  };

  // Reset to system default
  const resetFontScale = () => {
    setUserFontScale(1);
    setFontScale(systemFontScale);
    localStorage.removeItem('mellchat-font-scale');
  };

  // Get font size with scaling applied
  const getScaledFontSize = (baseSize) => {
    return `${baseSize * fontScale}px`;
  };

  // Get CSS custom property for font scale
  const getFontScaleCSS = () => {
    return {
      '--font-scale': fontScale,
      '--font-scale-factor': fontScale
    };
  };

  return {
    fontScale,
    userFontScale,
    systemFontScale,
    updateFontScale,
    resetFontScale,
    getScaledFontSize,
    getFontScaleCSS
  };
};
