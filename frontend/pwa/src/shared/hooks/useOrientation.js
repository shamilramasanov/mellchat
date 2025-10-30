import { useState, useEffect } from 'react';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    angle: 0,
    type: 'portrait-primary'
  });
  const [isPortrait, setIsPortrait] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      if (screen.orientation) {
        setOrientation({
          angle: screen.orientation.angle,
          type: screen.orientation.type
        });
        setIsPortrait(screen.orientation.type.includes('portrait'));
        setIsLandscape(screen.orientation.type.includes('landscape'));
      } else {
        // Fallback for older browsers
        const isPortraitMode = window.innerHeight > window.innerWidth;
        setIsPortrait(isPortraitMode);
        setIsLandscape(!isPortraitMode);
        setOrientation({
          angle: isPortraitMode ? 0 : 90,
          type: isPortraitMode ? 'portrait-primary' : 'landscape-primary'
        });
      }
    };

    // Initial check
    updateOrientation();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Small delay to ensure screen dimensions are updated
      setTimeout(updateOrientation, 100);
    };

    // Listen for resize events as fallback
    const handleResize = () => {
      const isPortraitMode = window.innerHeight > window.innerWidth;
      if (isPortraitMode !== isPortrait) {
        updateOrientation();
      }
    };

    // Add event listeners
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPortrait]);

  return {
    orientation,
    isPortrait,
    isLandscape,
    angle: orientation.angle,
    type: orientation.type
  };
};
