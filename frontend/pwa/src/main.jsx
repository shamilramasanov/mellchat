import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import App from './app/App';
import i18n from './i18n';
import { WebSocketProvider } from './shared/components/WebSocketProvider.jsx';
import './styles/globals.css';
import { TOAST_CONFIG } from './shared/utils/constants';

// Register Service Worker (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

// iOS viewport height fix
const setVH = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);

ReactDOM.createRoot(document.getElementById('root')).render(
  <I18nextProvider i18n={i18n}>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
    <Toaster {...TOAST_CONFIG} />
  </I18nextProvider>
);

// Vercel trigger
