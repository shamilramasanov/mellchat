import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { AnimatedBackground } from '@shared/components';
import AuthScreen from '@features/auth/components/AuthScreen';
import RecentStreams from '@features/streams/components/RecentStreams';
import StreamSubscriptionManager from '@features/streams/components/StreamSubscriptionManager';
import MainView from './MainView';
import Header from './Header';
import { initIOSPWA } from '../utils/iosPWA';
import './App.css';

function App() {
  const { t } = useTranslation();
  const isAuth = useAuthStore((state) => state.isAuth());
  const hasActiveStreams = useStreamsStore((state) => state.hasActiveStreams());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app and theme
  useEffect(() => {
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem('mellchat-theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
    
    // Initialize iOS PWA optimizations
    initIOSPWA();
    
    // Simulate initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <>
        <AnimatedBackground />
        <div className="app-loading">
          <div className="spinner" />
          <p>{t('common.loading')}</p>
        </div>
      </>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuth) {
    return (
      <>
        <AnimatedBackground />
        <AuthScreen />
      </>
    );
  }

  // Show recent streams if no active streams
  if (!hasActiveStreams) {
    return (
      <>
        <AnimatedBackground />
        <div className="app">
          <Header />
          <RecentStreams />
        </div>
      </>
    );
  }

  // Show main view
  return (
    <>
      <AnimatedBackground />
      <div className="app">
        <StreamSubscriptionManager />
        <Header />
        <MainView />
      </div>
    </>
  );
}

export default App;
