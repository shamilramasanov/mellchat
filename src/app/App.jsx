import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { AnimatedBackground, ServerErrorBanner, ApiErrorToast } from '@shared/components';
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
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const loadMessagesAdaptive = useChatStore((state) => state.loadMessagesAdaptive);
  const isHome = useStreamsStore((state) => state.activeStreamId === null);
  
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

  // Load messages from database when active stream changes
  useEffect(() => {
    if (!isAuth || !hasActiveStreams || !activeStreamId) return;

    // Используем адаптивную загрузку - она сама проверит кэш
    loadMessagesAdaptive(activeStreamId).then((result) => {
      if (result.success) {
      } else {
        console.error('❌ App: Failed to load messages adaptively:', result.error);
      }
    });
  }, [isAuth, hasActiveStreams, activeStreamId, loadMessagesAdaptive]); // Убираем messages из зависимостей!

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
        <ServerErrorBanner />
        <ApiErrorToast />
        <AuthScreen />
      </>
    );
  }

  // Show recent streams if on home page (no active stream selected)
  if (isHome) {
    return (
      <>
        <AnimatedBackground />
        <ServerErrorBanner />
        <ApiErrorToast />
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
      <ServerErrorBanner />
      <ApiErrorToast />
      <div className="app">
        <StreamSubscriptionManager />
        <Header />
        <MainView />
      </div>
      {/* PerformanceDashboard отключен - не рендерится */}
    </>
  );
}

export default App;
