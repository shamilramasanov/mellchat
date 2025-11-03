import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderNewUI } from './components/HeaderNewUI.jsx';
import { StreamCards } from './components/StreamCards.jsx';
import { ChatContainer } from './components/ChatContainer.jsx';
import { BottomSearchBar } from './components/BottomSearchBar.jsx';
import { AddStreamModal } from './components/AddStreamModal.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { AIFilterModal } from './components/AIFilterModal.jsx';
import { WelcomeScreen } from './screens/WelcomeScreen.jsx';
import { PlatformSelectionScreen } from './screens/PlatformSelectionScreen.jsx';
import { AuthenticationScreen } from './screens/AuthenticationScreen.jsx';
import { RecentStreamsScreen } from './screens/RecentStreamsScreen.jsx';
import AdminScreen from './screens/AdminScreen.jsx';
import { UserProfilePage } from './screens/profile/UserProfilePage.jsx';
import './newui.css';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { STORAGE_KEYS } from '@shared/utils/constants';
import { normalizeStreamUrl } from './utils/platformHelpers.js';
import StreamSubscriptionManager from '@features/streams/components/StreamSubscriptionManager';
import { streamsAPI } from '@shared/services/api';
import { WebSocketProvider } from '@shared/components/WebSocketProvider.jsx';

export default function AppNewUI() {
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [isAddStreamModalOpen, setIsAddStreamModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [targetMessageId, setTargetMessageId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null); // null | 'questions' | 'allQuestions' | 'ai'
  const [aiFilteredMessageIds, setAiFilteredMessageIds] = useState([]); // IDs сообщений, выбранных AI
  const [aiFilterQuery, setAiFilterQuery] = useState(''); // Запрос для AI фильтра
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); // Модальное окно для AI запроса
  const [isAILoading, setIsAILoading] = useState(false); // Загрузка AI запроса

  // Читаем из store (Single Source of Truth)
  const activeStreams = useStreamsStore((s) => s.activeStreams) || [];
  const recentStreams = useStreamsStore((s) => s.recentStreams) || [];
  const activeStreamId = useStreamsStore((s) => s.activeStreamId);
  const collapsedStreamIds = useStreamsStore((s) => s.collapsedStreamIds) || [];
  const closedStreamIds = useStreamsStore((s) => s.closedStreamIds) || [];

  // Store actions
  const addStream = useStreamsStore((s) => s.addStream);
  const switchStream = useStreamsStore((s) => s.switchStream);
  const toggleStreamCard = useStreamsStore((s) => s.toggleStreamCard);
  const closeStream = useStreamsStore((s) => s.closeStream);
  const reopenStream = useStreamsStore((s) => s.reopenStream);
  const createStreamFromURL = useStreamsStore((s) => s.createStreamFromURL);
  const removeFromRecent = useStreamsStore((s) => s.removeFromRecent);
  const updateRecentStreamConnectionId = useStreamsStore((s) => s.updateRecentStreamConnectionId);
  const updateStream = useStreamsStore((s) => s.updateStream);

  // Chat store
  const allMessages = useChatStore((s) => s.messages) || [];
  const markMessagesAsRead = useChatStore((s) => s.markMessagesAsRead);
  
  // Получаем статистику всех стримов для счетчиков непрочитанных
  const streamsStats = useChatStore((s) => {
    const stats = s.getAllStreamsStats();
    return stats;
  }) || {};
  
  // Обновляем lastReadMessageId при переключении стрима
  // ВАЖНО: НЕ добавляем allMessages в зависимости - иначе будет срабатывать при каждом новом сообщении
  useEffect(() => {
    if (!activeStreamId) return;
    
    // Небольшая задержка, чтобы сообщения успели отфильтроваться
    const timer = setTimeout(() => {
      const streamMessages = allMessages.filter(m => m.streamId === activeStreamId);
      if (streamMessages.length === 0) return;
      
      // Помечаем последнее сообщение как прочитанное при переключении
      const lastMessage = streamMessages[streamMessages.length - 1];
      if (lastMessage) {
        markMessagesAsRead(activeStreamId, lastMessage.id);
        console.log('📌 Marked messages as read on stream switch:', {
          streamId: activeStreamId,
          lastMessageId: lastMessage.id
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeStreamId, markMessagesAsRead]); // ТОЛЬКО при смене activeStreamId, не при каждом сообщении!

  // Auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const skipAuth = useAuthStore((state) => state.skipAuth);
  
  // Generate guest session ID if needed and register it with fingerprint
  useEffect(() => {
    if (!isAuthenticated && skipAuth) {
      const initGuestSession = async () => {
        let sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
        
        if (!sessionId) {
          // Импортируем fingerprint утилиту
          const { getBrowserFingerprint } = await import('@shared/utils/fingerprint.js');
          const fingerprint = await getBrowserFingerprint();
          
          // Пытаемся найти существующую сессию по fingerprint
          try {
            const { authAPI } = await import('@shared/services/api');
            const response = await authAPI.findGuestSessionByFingerprint(fingerprint);
            if (response.data?.found && response.data?.sessionId) {
              sessionId = response.data.sessionId;
              localStorage.setItem(STORAGE_KEYS.GUEST_SESSION_ID, sessionId);
              console.log('✅ Найдена существующая сессия по fingerprint:', sessionId);
            }
          } catch (error) {
            console.log('No existing session found for fingerprint, creating new one');
          }
          
          // Если не нашли, создаем новую
          if (!sessionId) {
            sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem(STORAGE_KEYS.GUEST_SESSION_ID, sessionId);
          }
        }
        
        // Регистрируем/обновляем сессию на бэкенде
        try {
          const { authAPI } = await import('@shared/services/api');
          await authAPI.registerGuestSession();
        } catch (error) {
          console.warn('Failed to register guest session on load:', error);
        }
      };
      
      initGuestSession();
    }
  }, [isAuthenticated, skipAuth]);
  
  // Handle OAuth callback from URL - должен быть ПЕРВЫМ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');
    const tokenParam = params.get('token');
    const error = params.get('error');
    const reason = params.get('reason');

    if (auth === 'success' && tokenParam) {
      // OAuth успешен - сохраняем токен
      console.log('✅ OAuth success, saving token');
      (async () => {
        try {
          const { authAPI } = await import('@shared/services/api');
          const result = await authAPI.verifyToken(tokenParam);
          if (result.success && result.user) {
            // Сохраняем токен и пользователя
            useAuthStore.getState().login(tokenParam, result.user);
            
            // Убираем параметры из URL сразу
            window.history.replaceState({}, '', window.location.pathname + '#main');
            
            // Устанавливаем экран main сразу после login
            setCurrentScreen('main');
          } else {
            // Если verify не прошел, но токен есть - сохраняем его и пробуем войти
            console.warn('⚠️ Token verification failed, but saving token anyway:', result);
            useAuthStore.getState().login(tokenParam, { 
              email: 'user@google.com', // Временные данные
              id: 'temp-id'
            });
            window.history.replaceState({}, '', window.location.pathname + '#main');
            setCurrentScreen('main');
          }
        } catch (err) {
          console.error('❌ Error verifying token, but token is valid. Saving anyway:', err);
          // Даже если verify упал с ошибкой, токен валиден (пришел от Google OAuth)
          // Сохраняем его и пробуем войти
          useAuthStore.getState().login(tokenParam, { 
            email: 'user@google.com',
            id: 'temp-id'
          });
          window.history.replaceState({}, '', window.location.pathname + '#main');
          setCurrentScreen('main');
        }
      })();
      // Возвращаемся, чтобы другие useEffect не перезаписали экран
      return;
    } else if (auth === 'failed' || auth === 'error') {
      // OAuth провалился
      console.error('❌ OAuth failed:', error || reason);
      window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
    }
  }, []);

  // Проверка токена при загрузке (только один раз)
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      // Проверяем токен только если его нет в store и он есть в localStorage
      if (storedToken && !token && isMounted) {
        // Проверяем токен только один раз
        try {
          const { authAPI } = await import('@shared/services/api');
          const result = await authAPI.verifyToken(storedToken);
          if (isMounted && result.success && result.user) {
            useAuthStore.getState().login(storedToken, result.user);
          } else if (isMounted) {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          }
        } catch (err) {
          // Игнорируем rate limit ошибки - токен может быть валидным
          if (isMounted && err.response?.status !== 429) {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          }
        }
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Init from URL hash
  useEffect(() => {
    // Пропускаем, если обрабатывается OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success' && params.get('token')) {
      return; // OAuth callback обрабатывается в другом useEffect
    }

    // Если пользователь пропустил аутентификацию или авторизован, всегда показываем main
    if (isAuthenticated || skipAuth) {
      setCurrentScreen('main');
      window.location.hash = 'main';
      return;
    }

    const allowed = new Set(['welcome', 'platform-selection', 'authentication', 'main', 'recent-streams', 'admin', 'profile']);
    const hash = (window.location.hash || '').replace('#', '');
    
    if (hash && allowed.has(hash)) {
      setCurrentScreen(hash);
    } else {
      setCurrentScreen('welcome');
    }
  }, [isAuthenticated, skipAuth]);

  // Update URL hash when screen changes
  useEffect(() => {
    if (!currentScreen) return;
    window.location.hash = currentScreen;
  }, [currentScreen]);

  // === HANDLERS ===

  const handleAddStream = useCallback(async (url) => {
    const normalizedUrl = normalizeStreamUrl(url);
    console.log('➕ Adding stream:', normalizedUrl);

    const streamObj = createStreamFromURL(normalizedUrl);
    if (!streamObj) {
      console.error('❌ Failed to create stream from URL');
      return;
    }

    const result = addStream(streamObj);
    if (!result.success) {
      console.error('❌ Failed to add stream:', result.error);
      return;
    }

    console.log('✅ Stream added to store:', streamObj.id);

    // Подключаемся к платформе и сохраняем connectionId в store
    try {
      const resp = await streamsAPI.connect(normalizedUrl);
      const connectionId = resp?.connection?.id;
      if (connectionId) {
        // записываем connectionId и в activeStreams, и в recentStreams
        updateStream?.(streamObj.id, { connectionId });
        updateRecentStreamConnectionId?.(streamObj.id, connectionId);
        console.log('🔌 Connected stream:', streamObj.id, 'connectionId:', connectionId);
      } else {
        console.warn('⚠️ No connectionId returned for', streamObj.id);
      }
    } catch (e) {
      console.error('❌ Failed to connect stream via API:', e);
    }
  }, [createStreamFromURL, addStream]);

  const handleStreamSelect = useCallback((id) => {
    console.log('🎯 Selecting stream:', id);
    // Если карточка была свёрнута — разворачиваем
    if (collapsedStreamIds.includes(id)) {
      toggleStreamCard(id);
    }
    switchStream(id);
  }, [switchStream, collapsedStreamIds, toggleStreamCard]);

  const handleCollapseClick = useCallback((id) => {
    console.log('🔽 Toggling stream card:', id);
    toggleStreamCard(id);

    // Если сворачиваем активный стрим — переключаемся или уходим в историю
    if (id === activeStreamId) {
      const available = activeStreams
        .map(s => s.id)
        .filter(sid => sid !== id && !collapsedStreamIds.includes(sid) && !closedStreamIds.includes(sid));

      if (available.length > 0) {
        switchStream(available[0]);
      } else {
        // Нет видимых активных стримов → открываем историю
        setCurrentScreen('recent-streams');
      }
    }
  }, [toggleStreamCard, activeStreamId, activeStreams, collapsedStreamIds, closedStreamIds, switchStream]);

  const handleCloseStream = useCallback(async (id) => {
    console.log('❌ Closing stream:', id);
    await closeStream(id);
  }, [closeStream]);

  const handleStreamSelectFromHistory = useCallback(async (id) => {
    console.log('📜 Opening stream from history:', id);

    const stream = activeStreams.find(s => s.id === id);

    if (stream) {
      // Сценарий A: Стрим активен (возможно свёрнут)
      console.log('✅ Stream is active');
      
      // Если стрим свернут, разворачиваем его перед переключением
      if (collapsedStreamIds.includes(id)) {
        console.log('🔽 Expanding collapsed stream');
        toggleStreamCard(id);
        // Даем время на обновление состояния перед переключением
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Переключаемся на стрим - это устанавливает его как активный
      // switchStream не меняет collapsedStreamIds, так что стрим останется развернутым
      switchStream(id);
      
      // Финальная проверка: убеждаемся, что стрим развернут после всех операций
      await new Promise(resolve => setTimeout(resolve, 10));
      const currentState = useStreamsStore.getState();
      if (currentState.collapsedStreamIds.includes(id)) {
        console.log('🔽 Force expanding stream after switch (final check)');
        toggleStreamCard(id);
      }
    } else if (closedStreamIds.includes(id)) {
      // Сценарий B: Стрим закрыт - переоткрываем (проверка онлайн-статуса происходит внутри reopenStream)
      console.log('🔄 Reopening closed stream');
      const result = await reopenStream(id);

      if (!result.success) {
        console.error('❌ Failed to reopen stream:', result.error);
        
        // Показываем пользователю ошибку (можно заменить на toast/notification)
        if (result.error.includes('offline') || result.error.includes('not available')) {
          alert(`Стрим оффлайн или недоступен: ${result.error}`);
        } else if (result.error.includes('Maximum 3 streams')) {
          alert('Максимум 3 активных стрима. Закройте один из активных стримов, чтобы открыть новый.');
        } else {
          alert(`Ошибка при переоткрытии стрима: ${result.error}`);
        }
        return;
      }

      console.log('✅ Stream reopened successfully');
      // reopenStream уже убирает стрим из collapsedStreamIds, так что ничего делать не нужно
    } else {
      // Сценарий C: Стрим не найден
      console.warn('⚠️ Stream not found in activeStreams or closedStreamIds');
    }

    setCurrentScreen('main');
  }, [activeStreams, collapsedStreamIds, closedStreamIds, switchStream, toggleStreamCard, reopenStream]);

  const handleStreamDeleteFromHistory = useCallback((id) => {
    console.log('🗑️ Deleting stream from history:', id);
    removeFromRecent(id);
  }, [removeFromRecent]);

  // Обработчик клика по счетчику вопросов
  const handleQuestionsClick = useCallback((streamId) => {
    if (!streamId) return;
    
    const chatStore = useChatStore.getState();
    let nextQuestionId;
    
    // Если еще не было навигации или это другой стрим - начинаем с первого непрочитанного
    if (!currentQuestionId || currentQuestionId === null) {
      nextQuestionId = chatStore.getFirstUnreadQuestionId(streamId);
    } else {
      // Повторное нажатие - находим следующий непрочитанный вопрос
      nextQuestionId = chatStore.getNextUnreadQuestionId(streamId, currentQuestionId);
      
      // Если следующих нет - возвращаемся к первому (цикл)
      if (!nextQuestionId) {
        nextQuestionId = chatStore.getFirstUnreadQuestionId(streamId);
      }
    }
    
    if (nextQuestionId) {
      // Помечаем вопрос как прочитанный при переходе к нему
      // Пользователь явно нажал на счетчик и перешел к вопросу = прочитал его
      markMessagesAsRead(streamId, nextQuestionId);
      
      setCurrentQuestionId(nextQuestionId);
      setTargetMessageId(nextQuestionId);
      console.log('❓ Navigating to question and marking as read:', {
        streamId,
        questionId: nextQuestionId,
        isFirst: !currentQuestionId
      });
    } else {
      console.log('ℹ️ No unread questions found');
    }
  }, [currentQuestionId, markMessagesAsRead]);

  // Обработчик клика по счетчику сообщений
  const [currentMessageId, setCurrentMessageId] = useState(null);
  
  const handleMessagesClick = useCallback((streamId) => {
    if (!streamId) return;
    
    const chatStore = useChatStore.getState();
    let nextMessageId;
    
    // Если еще не было навигации или это другой стрим - начинаем с последнего непрочитанного
    if (!currentMessageId || currentMessageId === null) {
      nextMessageId = chatStore.getLastUnreadMessageId(streamId);
    } else {
      // Повторное нажатие - находим следующее непрочитанное сообщение
      nextMessageId = chatStore.getNextUnreadMessageId(streamId, currentMessageId);
      
      // Если следующих нет - возвращаемся к последнему (цикл)
      if (!nextMessageId) {
        nextMessageId = chatStore.getLastUnreadMessageId(streamId);
      }
    }
    
    if (nextMessageId) {
      // Помечаем сообщение как прочитанное при переходе к нему
      // Пользователь явно нажал на счетчик и перешел к сообщению = прочитал его
      markMessagesAsRead(streamId, nextMessageId);
      
      setCurrentMessageId(nextMessageId);
      setTargetMessageId(nextMessageId);
      console.log('📨 Navigating to unread message and marking as read:', {
        streamId,
        messageId: nextMessageId,
        isFirst: !currentMessageId
      });
    } else {
      console.log('ℹ️ No unread messages found');
    }
  }, [currentMessageId, markMessagesAsRead]);
  
  // Сбрасываем currentQuestionId и currentMessageId при смене стрима
  useEffect(() => {
    setCurrentQuestionId(null);
    setCurrentMessageId(null);
    setTargetMessageId(null);
  }, [activeStreamId]);

  // === RENDERING ===

  // Преобразуем activeStreams для UI (маппинг полей)
  const streamsForUI = activeStreams.map(stream => {
    // Получаем статистику для этого стрима
    const streamStats = streamsStats[stream.id] || {
      unreadCount: 0,
      unreadQuestionCount: 0
    };
    
    return {
      id: stream.id,
      platform: stream.platform,
      authorName: stream.streamId || 'Unknown',
      url: stream.streamUrl || stream.url,
      isOnline: stream.isLive ?? true,
      lastViewed: stream.lastViewed ? new Date(stream.lastViewed) : new Date(),
      unreadMessages: streamStats.unreadCount || 0,
      unreadQuestions: streamStats.unreadQuestionCount || 0,
    };
  });

  // Преобразуем recentStreams для UI (для экрана истории)
  const recentStreamsForUI = recentStreams.map(stream => {
    // Получаем статистику для этого стрима
    const streamStats = streamsStats[stream.id] || {
      unreadCount: 0,
      unreadQuestionCount: 0
    };
    
    return {
      id: stream.id,
      platform: stream.platform,
      authorName: stream.streamId || 'Unknown',
      url: stream.streamUrl || stream.url,
      isOnline: stream.isLive ?? false,
      lastViewed: stream.lastViewed ? new Date(stream.lastViewed) : (stream.connectedAt ? new Date(stream.connectedAt) : new Date()),
      unreadMessages: streamStats.unreadCount || 0,
      unreadQuestions: streamStats.unreadQuestionCount || 0,
    };
  });

  console.log('🎨 AppNewUI render:', {
    currentScreen,
    activeStreamsCount: activeStreams.length,
    streamsForUICount: streamsForUI.length,
    activeStreamId,
    collapsedCount: collapsedStreamIds.length,
    closedCount: closedStreamIds.length,
  });

  // Messages for active stream (только если активный стрим видим)
  const isActiveVisible = !!activeStreamId && !collapsedStreamIds.includes(activeStreamId) && !closedStreamIds.includes(activeStreamId);
  
  // Фильтрация сообщений в зависимости от активного фильтра
  // Получаем состояние настроения для фильтрации
  const moodEnabled = useChatStore(state => state.moodEnabled);

  const messagesForActive = useMemo(() => {
    // Фильтр "Все Вопросы" - вопросы из всех активных стримов (работает даже если активный стрим не виден)
    if (activeFilter === 'allQuestions') {
      const activeStreamIds = activeStreams.map(s => s.id);
      let allQuestions = allMessages
        .filter(m => activeStreamIds.includes(m.streamId) && m.isQuestion === true);
      
      // Применяем фильтр настроения к вопросам из всех стримов
      if (moodEnabled) {
        allQuestions = allQuestions.filter(m => {
          // Скрываем спам
          if (m.isSpam) return false;
          // Скрываем негативные сообщения
          if (m.sentiment === 'sad') return false;
          return true;
        });
      }
      
      return allQuestions.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); // Сортировка по времени
    }
    
    if (!isActiveVisible) return [];
    
    let filtered = allMessages.filter(m => m.streamId === activeStreamId);
    
    // Фильтр настроения (применяется первым)
    if (moodEnabled) {
      filtered = filtered.filter(m => {
        // Скрываем спам
        if (m.isSpam) return false;
        // Скрываем негативные сообщения
        if (m.sentiment === 'sad') return false;
        return true;
      });
    }
    
    // Фильтр "Вопросы" - вопросы только из активного стрима
    if (activeFilter === 'questions') {
      return filtered.filter(m => 
        m.streamId === activeStreamId && m.isQuestion === true
      );
    }
    
    // AI фильтр - только сообщения, выбранные AI
    if (activeFilter === 'ai' && aiFilteredMessageIds.length > 0) {
      return filtered.filter(m => aiFilteredMessageIds.includes(m.id));
    }
    
    // Обычный режим - все отфильтрованные сообщения активного стрима
    return filtered;
  }, [isActiveVisible, activeFilter, activeStreamId, activeStreams, allMessages, moodEnabled, aiFilteredMessageIds]);

  // Обработчик AI фильтрации
  const handleAIFilter = async (query) => {
    if (!query.trim() || !activeStreamId) return;
    
    setIsAILoading(true);
    try {
      // Получаем сообщения текущего стрима
      const streamMessages = allMessages.filter(m => m.streamId === activeStreamId);
      
      const response = await fetch('/api/v1/ai/filter-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: streamMessages,
          query: query.trim(),
          limit: 10
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.messageIds) {
        setAiFilteredMessageIds(data.messageIds);
        setAiFilterQuery(query.trim());
        setActiveFilter('ai');
        setIsAIModalOpen(false);
      } else {
        throw new Error(data.error || 'Ошибка AI фильтрации');
      }
    } catch (error) {
      console.error('AI filter error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Ошибка AI фильтрации: ${errorMessage}`);
    } finally {
      setIsAILoading(false);
    }
  };

  // Очистка AI фильтра
  const handleClearAIFilter = () => {
    setAiFilteredMessageIds([]);
    setAiFilterQuery('');
    setActiveFilter(null);
  };

  let content = null;

  if (currentScreen === 'welcome') {
    content = <WelcomeScreen onGetStarted={() => setCurrentScreen('authentication')} />;
  } else if (currentScreen === 'platform-selection') {
    content = <PlatformSelectionScreen onSignIn={() => setCurrentScreen('authentication')} onSkip={() => setCurrentScreen('main')} />;
  } else if (currentScreen === 'authentication') {
    // Не передаем onBack, если это начальный экран - пользователь должен авторизоваться
    content = <AuthenticationScreen onBack={isAuthenticated || skipAuth ? () => setCurrentScreen('main') : null} onSuccess={() => setCurrentScreen('main')} />;
  } else if (currentScreen === 'recent-streams') {
    content = (
      <RecentStreamsScreen
        streams={recentStreamsForUI}
        onBack={() => setCurrentScreen('main')}
        onStreamSelect={handleStreamSelectFromHistory}
        onStreamDelete={handleStreamDeleteFromHistory}
        onStreamClose={handleCloseStream}
        onAddStream={() => { setCurrentScreen('main'); setIsAddStreamModalOpen(true); }}
      />
    );
  } else if (currentScreen === 'admin') {
    content = <AdminScreen onBack={() => setCurrentScreen('main')} />;
  } else if (currentScreen === 'profile') {
    content = <UserProfilePage onBack={() => setCurrentScreen('main')} />;
  } else {
    // Main screen
    content = (
      <div className="newui min-h-screen flex flex-col bg-gray-50">
        <HeaderNewUI 
          onLogoClick={() => setCurrentScreen('recent-streams')} 
          onPersonalizationClick={() => {
            if (isAuthenticated) {
              setCurrentScreen('profile');
            } else {
              setCurrentScreen('authentication');
            }
          }} 
          onSettingsClick={() => setIsSettingsModalOpen(true)} 
          onAdminClick={() => setCurrentScreen('admin')} 
        />
        {/* Менеджер подписок находится теперь выше и монтируется всегда */}
        
        {streamsForUI.length === 0 ? (
          <EmptyState onAddStream={() => setIsAddStreamModalOpen(true)} />
        ) : (
          <>
            <StreamCards
              streams={streamsForUI}
              activeStreamId={activeStreamId}
              onStreamSelect={handleStreamSelect}
              onCollapseClick={handleCollapseClick}
              onCloseClick={handleCloseStream}
              onMessagesClick={handleMessagesClick}
              onQuestionsClick={handleQuestionsClick}
            />
            {isActiveVisible && (
              <div className="flex-1 overflow-hidden min-h-0">
                <ChatContainer
                  messages={messagesForActive}
                  searchQuery={searchQuery}
                  newMessagesCount={streamsStats[activeStreamId]?.unreadCount || 0}
                  onScrollToBottom={(lastMessageId) => {
                    // При прокрутке вниз помечаем сообщения как прочитанные
                    if (activeStreamId && lastMessageId) {
                      markMessagesAsRead(activeStreamId, lastMessageId);
                    }
                  }}
                  targetMessageId={targetMessageId}
                  activeFilter={activeFilter}
                  activeStreamId={activeStreamId}
                  activeStreams={streamsForUI}
                  aiFilterQuery={aiFilterQuery}
                  onClearFilter={() => {
                    if (activeFilter === 'ai') {
                      handleClearAIFilter();
                    } else {
                      setActiveFilter(null);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}

            <BottomSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAddStream={() => setIsAddStreamModalOpen(true)}
              onSettingsClick={() => setIsSettingsModalOpen(true)}
              searchPlaceholder={t('newui.searchMessagesPlaceholder')}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onAIClick={() => setIsAIModalOpen(true)}
            />

        <AIFilterModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onFilter={handleAIFilter}
          isLoading={isAILoading}
        />

        <AddStreamModal 
          isOpen={isAddStreamModalOpen} 
          onClose={() => setIsAddStreamModalOpen(false)} 
          onConnect={handleAddStream} 
        />
        
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      </div>
    );
  }

  return (
    <WebSocketProvider>
      {/* Всегда смонтирован: не теряем подписки при смене экранов */}
      <StreamSubscriptionManager />
      {content}
    </WebSocketProvider>
  );
}
