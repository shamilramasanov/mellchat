import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import App from './app/App';
import i18n from './i18n';
// Removed WebSocketProvider: NewUI не использует глобальный WS провайдер
import './styles/globals.css';
import './styles/tailwind.css';
import { TOAST_CONFIG } from './shared/utils/constants';

// Register Service Worker (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Проверяем доступность файла перед регистрацией
    const registerSW = async (swPath) => {
      try {
        // Проверяем, что файл существует и возвращает JavaScript
        const response = await fetch(swPath, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        
        if (!response.ok || !contentType?.includes('javascript')) {
          console.warn(`Service Worker file ${swPath} not available or wrong content type:`, contentType);
          return false;
        }
        
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('✅ Service Worker registered:', swPath, registration);
        return true;
      } catch (error) {
        console.warn(`Failed to register ${swPath}:`, error.message);
        return false;
      }
    };
    
    // Try sw-v3.js first, then sw.js, then service-worker.js
    registerSW('/sw-v3.js')
      .then(success => !success && registerSW('/sw.js'))
      .then(success => !success && registerSW('/service-worker.js'))
      .catch(error => {
        console.warn('All Service Worker registration attempts failed:', error);
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
      <App />
    <Toaster {...TOAST_CONFIG} />
  </I18nextProvider>
);

// Vercel trigger
// Force Service Worker update Wed Oct 29 22:09:22 EET 2025
