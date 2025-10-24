import { useEffect, useState } from 'react';

/**
 * Key press hook
 * @param {string} targetKey - Key to listen for
 * @returns {boolean} - True if key is pressed
 */
export const useKeyPress = (targetKey) => {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
};

/**
 * Keyboard shortcut hook
 * @param {Object} keys - { ctrl, shift, alt, key }
 * @param {Function} callback - Function to call when shortcut is pressed
 */
export const useKeyboardShortcut = (keys, callback) => {
  useEffect(() => {
    const handler = (event) => {
      const { ctrl, shift, alt, key } = keys;
      
      const ctrlPressed = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftPressed = shift ? event.shiftKey : !event.shiftKey;
      const altPressed = alt ? event.altKey : !event.altKey;
      const keyPressed = event.key.toLowerCase() === key.toLowerCase();
      
      if (ctrlPressed && shiftPressed && altPressed && keyPressed) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys, callback]);
};

