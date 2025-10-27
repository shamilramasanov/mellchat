/**
 * iOS PWA Utilities
 * Handles iOS-specific PWA behaviors and optimizations
 */

/**
 * Prevent iOS bounce/overscroll behavior
 */
export const preventIOSBounce = () => {
  // Prevent elastic scrolling on iOS
  document.addEventListener('touchmove', (e) => {
    // Allow scrolling within scrollable containers
    const target = e.target;
    const isScrollable = target.closest('.scrollable') || 
                        target.closest('[data-scrollable]') ||
                        target.classList.contains('scrollable');
    
    if (!isScrollable) {
      e.preventDefault();
    }
  }, { passive: false });
};

/**
 * Fix iOS 100vh issue (address bar overlap)
 */
export const fixIOSViewportHeight = () => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
};

/**
 * Detect if app is running in standalone mode (installed as PWA)
 */
export const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Detect if device is iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Show install prompt for iOS users
 */
export const shouldShowIOSInstallPrompt = () => {
  return isIOS() && !isStandalone();
};

/**
 * Initialize iOS PWA optimizations
 */
export const initIOSPWA = () => {
  if (!isIOS()) return;
  
  // Fix viewport height
  fixIOSViewportHeight();
  
  // Only prevent bounce if running as standalone app
  if (isStandalone()) {
    preventIOSBounce();
    
    // Add class to body for conditional styling
    document.body.classList.add('ios-standalone');
    
    // Prevent pinch-to-zoom
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });
  }
  
  console.log('✅ iOS PWA optimizations initialized', {
    isIOS: isIOS(),
    isStandalone: isStandalone(),
  });
};

