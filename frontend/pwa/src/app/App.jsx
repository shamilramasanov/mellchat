import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { AnimatedBackground, ServerErrorBanner, ApiErrorToast } from '@shared/components';
// import PerformanceDashboard from '@shared/components/PerformanceDashboard';
import AuthScreen from '@features/auth/components/AuthScreen';
import RecentStreams from '@features/streams/components/RecentStreams';
import StreamSubscriptionManager from '@features/streams/components/StreamSubscriptionManager';
import AdminLayout from '../admin/components/AdminLayout';
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
  const messages = useChatStore((state) => state.messages);
  const isHome = useStreamsStore((state) => state.activeStreamId === null);
  const disconnectAllStreams = useStreamsStore((state) => state.disconnectAllStreams);
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  
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

  // Disconnect only active streams when user closes the browser tab
  // Recent streams should continue receiving messages
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Отключаем только activeStreams, но НЕ recentStreams
      // чтобы они продолжали получать сообщения после перезагрузки страницы
      if ('sendBeacon' in navigator) {
        // Use sendBeacon for reliable delivery during page unload
        activeStreams.forEach(stream => {
          const data = JSON.stringify({ connectionId: stream.connectionId });
          navigator.sendBeacon('/api/v1/connect/disconnect', data);
        });
      }
      
      // Disconnect only active streams, not recent streams
      disconnectAllStreams();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [disconnectAllStreams, activeStreams]);

  // Load messages from database when active stream changes
  useEffect(() => {
    if (!isAuth || !hasActiveStreams || !activeStreamId) return;

    console.log('🚀 App: Loading messages adaptively for active stream:', activeStreamId);
    
    // Проверяем, есть ли уже сообщения для этого стрима
    const existingMessages = messages.filter(m => m.streamId === activeStreamId);
    
    // Если сообщения уже есть, не загружаем заново
    if (existingMessages.length > 0) {
      console.log(`✅ App: Using cached ${existingMessages.length} messages for stream ${activeStreamId}`);
      return;
    }
    
    // Используем адаптивную загрузку только если сообщений нет
    loadMessagesAdaptive(activeStreamId).then((result) => {
      if (result.success) {
        console.log(`✅ App: Loaded ${result.count} messages with ${result.strategy.strategy} strategy`);
      } else {
        console.error('❌ App: Failed to load messages adaptively:', result.error);
      }
    });
  }, [isAuth, hasActiveStreams, activeStreamId, loadMessagesAdaptive]);

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

  // Always show main view with modal overlay
  return (
    <Router>
      <AnimatedBackground />
      <ServerErrorBanner />
      <ApiErrorToast />
      <Routes>
        {/* Admin Panel Route */}
        <Route path="/admin/*" element={<AdminLayout />} />
        
        {/* Main App Routes */}
        <Route path="/*" element={
          <div className="app">
            <StreamSubscriptionManager />
            <Header />
            <MainView />
          </div>
        } />
      </Routes>
      {/* <PerformanceDashboard /> */}
    </Router>
  );
}

export default App;
