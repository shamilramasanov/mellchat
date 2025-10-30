import { useState, useEffect } from 'react';

// Responsive breakpoints utility
export const BREAKPOINTS = {
  xs: '320px',    // Small phones
  sm: '480px',    // Large phones
  md: '768px',    // Tablets
  lg: '1024px',   // Small laptops
  xl: '1280px',   // Large laptops
  '2xl': '1536px' // Large desktops
};

export const MEDIA_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.xs})`,
  sm: `(max-width: ${BREAKPOINTS.sm})`,
  md: `(max-width: ${BREAKPOINTS.md})`,
  lg: `(max-width: ${BREAKPOINTS.lg})`,
  xl: `(max-width: ${BREAKPOINTS.xl})`,
  '2xl': `(max-width: ${BREAKPOINTS['2xl']})`,
  
  // Min-width queries
  smUp: `(min-width: ${BREAKPOINTS.sm})`,
  mdUp: `(min-width: ${BREAKPOINTS.md})`,
  lgUp: `(min-width: ${BREAKPOINTS.lg})`,
  xlUp: `(min-width: ${BREAKPOINTS.xl})`,
  
  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Device features
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)'
};

// Hook for responsive values
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width <= 480) {
        setBreakpoint('xs');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width <= 768) {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width <= 1024) {
        setBreakpoint('md');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
      
      setIsTouch(window.matchMedia(MEDIA_QUERIES.touch).matches);
      setIsPortrait(window.matchMedia(MEDIA_QUERIES.portrait).matches);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    window.addEventListener('orientationchange', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
      window.removeEventListener('orientationchange', updateBreakpoint);
    };
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isPortrait,
    isLandscape: !isPortrait
  };
};

// Utility function to get responsive value
export const getResponsiveValue = (values, currentBreakpoint) => {
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i >= 0; i--) {
    if (values[breakpointOrder[i]] !== undefined) {
      return values[breakpointOrder[i]];
    }
  }
  
  return values.default || values.lg || Object.values(values)[0];
};
