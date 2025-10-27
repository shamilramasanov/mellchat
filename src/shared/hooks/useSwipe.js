import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling swipe gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {number} options.minSwipeDistance - Minimum distance for swipe (default: 50px)
 * @param {number} options.maxSwipeTime - Maximum time for swipe (default: 300ms)
 * @returns {Object} - Ref to attach to element
 */
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  maxSwipeTime = 300,
} = {}) => {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const touchTime = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
    touchTime.current = Date.now();
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const timeElapsed = Date.now() - touchTime.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance && timeElapsed < maxSwipeTime;

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left
        onSwipeLeft?.();
      } else {
        // Swiped right
        onSwipeRight?.();
      }
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
    touchTime.current = null;
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance, maxSwipeTime]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

