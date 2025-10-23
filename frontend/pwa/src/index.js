import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import './styles/animations.css';
import App from './App';
import './i18n';
import { setIOSFullscreen } from './utils/iosFullscreen';

// Initialize iOS fullscreen support
setIOSFullscreen();

// Prevent body scroll on iOS to avoid "jumping" behavior
document.body.addEventListener('touchmove', (e) => {
  if (!e.target.closest('.scrollable')) {
    e.preventDefault();
  }
}, { passive: false });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

