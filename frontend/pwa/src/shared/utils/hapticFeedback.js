// Haptic Feedback utility for mobile devices
export const HapticFeedback = {
  // Light haptic feedback
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Medium haptic feedback
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  
  // Heavy haptic feedback
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
  
  // Success feedback
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  },
  
  // Error feedback
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },
  
  // Selection feedback
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }
};
