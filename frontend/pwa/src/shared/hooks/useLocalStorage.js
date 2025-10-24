import { useState, useEffect } from 'react';

/**
 * Custom hook for localStorage with JSON support
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[*, Function]} - [value, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // Get from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = (value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch custom event for cross-tab communication
      window.dispatchEvent(
        new CustomEvent('local-storage', {
          detail: { key, value: valueToStore },
        })
      );
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    const handleCustomEvent = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleCustomEvent);
    };
  }, [key]);

  return [storedValue, setValue];
};

