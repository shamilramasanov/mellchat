import { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('mellchat-theme');
    return savedTheme !== 'light';
  });

  useEffect(() => {
    // Apply theme to body
    if (isDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('mellchat-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('mellchat-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;

