// iOS Safari Full Screen Utilities

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

export const setIOSFullscreen = () => {
  if (!isIOS()) return;

  // Set viewport height for iOS
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set initial height
  setViewportHeight();

  // Update on resize
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });

  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Prevent pull-to-refresh
  document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  // Hide address bar on scroll
  let ticking = false;
  const hideAddressBar = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        window.scrollTo(0, 1);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', hideAddressBar, { passive: true });
  window.addEventListener('touchstart', hideAddressBar, { passive: true });

  // Initial hide
  setTimeout(() => {
    window.scrollTo(0, 1);
  }, 100);
};

export const getIOSViewportHeight = () => {
  if (!isIOS()) return window.innerHeight;
  
  // Use the CSS custom property if set
  const vh = document.documentElement.style.getPropertyValue('--vh');
  if (vh) {
    return parseFloat(vh) * 100;
  }
  
  return window.innerHeight;
};
