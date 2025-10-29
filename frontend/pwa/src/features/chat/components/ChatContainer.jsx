import { useTranslation } from 'react-i18next';
import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import VirtualizedMessageList from '@shared/components/VirtualizedMessageList';
import SearchBar from './SearchBar';
import { useWebSocketContext } from '@shared/components/WebSocketProvider';
// import DatabaseStatus from './DatabaseStatus'; // Убрали для продакшена
import { useAdaptiveUpdates, usePerformanceMonitor } from '@shared/hooks/useOptimization';
import deviceDetection from '@shared/utils/deviceDetection';
import './ChatContainer.css';

// Флаг для включения/отключения логов скролла
const ENABLE_SCROLL_LOGS = false;

const THRESHOLD = 120; // px — когда считать "внизу"
const SCROLL_RESET_DELAY = 500; // Увеличили с 200ms до 500ms

const ChatContainer = ({ onAddStream }) => {
  const { t } = useTranslation();

  // === Zustand ===
  const activeStreamId = useStreamsStore((s) => s.activeStreamId);
  const activeStreams = useStreamsStore((s) => s.activeStreams);
  const shouldAutoScroll = useStreamsStore((s) => s.shouldAutoScroll);
  const clearAutoScrollFlag = useStreamsStore((s) => s.clearAutoScrollFlag);
  const setScrollFunctions = useStreamsStore((s) => s.setScrollFunctions);
  const messages = useChatStore((s) => s.messages);
  const markMessagesAsRead = useChatStore((s) => s.markMessagesAsRead);
  const getStreamStats = useChatStore((s) => s.getStreamStats);
  const getStreamMessages = useChatStore((s) => s.getStreamMessages);
  const getFirstUnreadMessageId = useChatStore((s) => s.getFirstUnreadMessageId);
  const getFirstUnreadQuestionId = useChatStore((s) => s.getFirstUnreadQuestionId);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const loadMessagesFromDatabase = useChatStore((s) => s.loadMessagesFromDatabase);
  const loadMessagesAdaptive = useChatStore((s) => s.loadMessagesAdaptive) || (() => Promise.resolve({ success: false }));
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages) || false;
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages) || (() => Promise.resolve({ success: false }));
  const loadingStrategy = useChatStore((s) => s.loadingStrategy) || { enablePagination: false };
  const setActiveStreamId = useChatStore((s) => s.setActiveStreamId);
  const clearSearchTimeout = useChatStore((s) => s.clearSearchTimeout);
  const setCurrentMood = useChatStore((s) => s.setCurrentMood);
  const moodEnabled = useChatStore((s) => s.moodEnabled);
  
  // Новые методы для работы с датами
  const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
  const getOldestMessageId = useChatStore((s) => s.getOldestMessageId);

  // === Refs ===
  const containerRef = useRef(null);
  const scrollPositions = useRef({});
  const wasAtBottomRef = useRef(true);
  const isScrollingRef = useRef(false);
  const prevMsgCountRef = useRef(0);
  const prevStreamRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastLoadMoreTimeRef = useRef(0);
  const autoLoadTriggeredRef = useRef(false);
  const lastLoadedMessageIdRef = useRef(null);

  // === State ===
  const [showNewBtn, setShowNewBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // === WebSocket Hook ===
  const { on, off } = useWebSocketContext();
  
  // === Оптимизированные хуки ===
  const { measureRender } = usePerformanceMonitor();
  const adaptiveSettings = deviceDetection.getAdaptiveSettings() || {
    animations: { reducedMotion: false },
    updateFrequency: { uiRefresh: 100 }
  };

  // === Получение сообщений для текущего стрима ===
  const streamMessages = useMemo(() => {
    if (!activeStreamId) return [];
    const messages = getStreamMessages(activeStreamId);
    return Array.isArray(messages) ? messages : [];
  }, [getStreamMessages, activeStreamId, messages, searchQuery, moodEnabled]);

  const hasMessages = streamMessages.length > 0;
  const hasStreams = activeStreams.length > 0;

  // === Оптимизированные утилиты ===
  const checkIsAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return false;
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight <= THRESHOLD;
  }, []);

  const saveScroll = useCallback(() => {
    if (activeStreamId && containerRef.current) {
      scrollPositions.current[activeStreamId] = containerRef.current.scrollTop;
    }
  }, [activeStreamId]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = containerRef.current;
    if (!el || !hasMessages) return;

    // Пометить как прочитано только при ручном скролле
    const lastMsg = streamMessages[streamMessages.length - 1];
    if (activeStreamId && lastMsg) {
      markMessagesAsRead(activeStreamId, lastMsg.id);
    }

    // Скролл с учетом адаптивных настроек
    if (behavior === 'instant' || adaptiveSettings.animations.reducedMotion) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }

    setShowNewBtn(false);
    setNewMsgCount(0);
    setIsAtBottom(true);
    wasAtBottomRef.current = true;
  }, [activeStreamId, streamMessages, hasMessages, markMessagesAsRead, adaptiveSettings.animations.reducedMotion]);

  // Скролл к первому непрочитанному сообщению
  const scrollToFirstUnreadMessage = useCallback((streamId, behavior = 'smooth') => {
    if (!streamId) return;
    
    const messageId = getFirstUnreadMessageId(streamId);
    if (!messageId) {
      // Если нет непрочитанных, скроллим в конец
      scrollToBottom(behavior);
      return;
    }

    // Ждем немного чтобы DOM обновился
    setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;

      // Ищем элемент сообщения по data-message-id
      const messageElement = el.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior, block: 'center' });
        
        // Помечаем как прочитанное после скролла
        setTimeout(() => {
          markMessagesAsRead(streamId, messageId);
        }, 500);
      } else {
        // Если элемент не найден, скроллим в конец
        scrollToBottom(behavior);
      }
    }, 100);
  }, [getFirstUnreadMessageId, scrollToBottom, markMessagesAsRead]);

  // Скролл к первому непрочитанному вопросу
  const scrollToFirstUnreadQuestion = useCallback((streamId, behavior = 'smooth') => {
    if (!streamId) return;
    
    const questionId = getFirstUnreadQuestionId(streamId);
    if (!questionId) {
      // Если нет непрочитанных вопросов, скроллим в конец
      scrollToBottom(behavior);
      return;
    }

    // Ждем немного чтобы DOM обновился
    setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;

      // Ищем элемент вопроса по data-message-id
      const questionElement = el.querySelector(`[data-message-id="${questionId}"]`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior, block: 'center' });
        
        // Помечаем как прочитанное после скролла
        setTimeout(() => {
          markMessagesAsRead(streamId, questionId);
        }, 500);
      } else {
        // Если элемент не найден, скроллим в конец
        scrollToBottom(behavior);
      }
    }, 100);
  }, [getFirstUnreadQuestionId, scrollToBottom, markMessagesAsRead]);

  // Отдельная функция для автоскролла (без проверки hasMessages)
  const forceScrollToBottom = useCallback((behavior = 'instant') => {
    const el = containerRef.current;
    if (!el) {
      return; // Ref can be null on first render
    }

    console.log('🚀 Force scrolling to bottom:', {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      behavior,
      messagesCount: streamMessages?.length || 0
    });

    // Проверяем, что есть контент для скролла
    if (el.scrollHeight <= el.clientHeight) {
      console.log('⚠️ No scrollable content, scrollHeight <= clientHeight');
      return;
    }

    // Принудительно скроллим в самый низ
    const targetScrollTop = el.scrollHeight - el.clientHeight;
    
    if (behavior === 'instant') {
      el.scrollTop = targetScrollTop;
    } else {
      el.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }

    // Проверяем результат через небольшую задержку
    setTimeout(() => {
      console.log('✅ Scroll result:', {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
        clientHeight: el.clientHeight,
        targetScrollTop,
        isAtBottom: Math.abs(el.scrollTop - targetScrollTop) <= 5
      });
    }, 100);
  }, [streamMessages?.length]);

  // === Обработка поиска ===
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // Скроллим вниз после поиска
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);
  }, [setSearchQuery, scrollToBottom]);

  // === Обработка загрузки большего количества сообщений ===
  const handleLoadMore = useCallback(async () => {
    if (!activeStreamId || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      console.log('📥 Loading more messages for stream:', activeStreamId);
      
      const oldestMessageId = getOldestMessageId(activeStreamId);
      if (!oldestMessageId) {
        console.log('❌ No oldest message ID found');
        return;
      }
      
      const result = await loadOlderMessages(activeStreamId, oldestMessageId, 20);
      
      if (result.success) {
        console.log(`✅ Loaded ${result.loadedCount} older messages`);
        
        // Если есть еще сообщения за эту дату, оставляем кнопку
        // Если нет - переходим к следующей дате
        if (!result.hasMore) {
          console.log('📅 All messages loaded');
        }
      } else {
        console.error('❌ Failed to load older messages:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
      autoLoadTriggeredRef.current = false; // Сбрасываем флаг после загрузки
    }
  }, [activeStreamId, loadOlderMessages, getOldestMessageId, isLoadingMore]);

  // === Простой обработчик скролла ===
  const handleScroll = useCallback((e) => {
    if (!e || !e.target) return;
    
    const target = e.target;
    if (!target || typeof target.scrollTop !== 'number') {
      console.warn('⚠️ Invalid scroll target:', target);
      return;
    }
    
    // Устанавливаем флаг скролла
    isScrollingRef.current = true;
    
    saveScroll();
    
    const { scrollTop, scrollHeight, clientHeight } = target;
    const nowAtBottom = scrollHeight - scrollTop - clientHeight <= THRESHOLD;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    
    const wasAtBottom = wasAtBottomRef.current;
    
    // Отладочная информация
    if (ENABLE_SCROLL_LOGS) {
      console.log('📜 Scroll event:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        nowAtBottom,
        wasAtBottom,
        scrollPercentage,
        isScrolling: isScrollingRef.current
      });
    }
    
    // ВАЖНО: Обновляем wasAtBottomRef СРАЗУ при скролле
    wasAtBottomRef.current = nowAtBottom;
    
    // Логика для кнопки "Новые сообщения" (внизу)
    if (wasAtBottom && !nowAtBottom) {
      setShowNewBtn(true);
      if (ENABLE_SCROLL_LOGS) {
        console.log('🔝 User scrolled up - showing new messages button');
      }
    } else if (!wasAtBottom && nowAtBottom) {
      // ✅ Помечаем как прочитано при скролле вниз
      if (activeStreamId && streamMessages.length > 0) {
        const lastMsg = streamMessages[streamMessages.length - 1];
        markMessagesAsRead(activeStreamId, lastMsg.id);
        
        // Принудительно сбрасываем счетчик
        setNewMsgCount(0);
        setShowNewBtn(false);
      }
      
      autoLoadTriggeredRef.current = false; // Сбрасываем флаг при скролле вниз
      if (ENABLE_SCROLL_LOGS) {
        console.log('🔽 User scrolled to bottom - hiding new messages button');
      }
    }
    
    // Автоматическая загрузка старых сообщений при скролле вверх
    const oldestMessageId = getOldestMessageId(activeStreamId);
    const now = Date.now();
    const shouldAutoLoad = scrollTop <= 50 && 
                          oldestMessageId && 
                          loadingStrategy?.enablePagination && 
                          !isLoadingMore &&
                          !autoLoadTriggeredRef.current &&
                          oldestMessageId !== lastLoadedMessageIdRef.current && // Не загружаем те же сообщения
                          (now - lastLoadMoreTimeRef.current) > 2000; // Минимум 2 секунды между загрузками
    
    if (shouldAutoLoad) {
      console.log('📥 Auto-loading older messages on scroll up');
      lastLoadMoreTimeRef.current = now;
      lastLoadedMessageIdRef.current = oldestMessageId; // Сохраняем ID для следующей проверки
      autoLoadTriggeredRef.current = true;
      handleLoadMore();
    }
    
    setIsAtBottom(nowAtBottom);
    
    // Сбрасываем флаг скролла через увеличенную задержку
    setTimeout(() => {
      isScrollingRef.current = false;
      if (ENABLE_SCROLL_LOGS) {
        console.log('⏰ Scroll flag reset');
      }
    }, SCROLL_RESET_DELAY);
  }, [activeStreamId, streamMessages, hasMessages, markMessagesAsRead, saveScroll, getOldestMessageId, loadingStrategy]);

  // Регистрируем функции скролла в streamsStore
  useEffect(() => {
    setScrollFunctions(scrollToFirstUnreadMessage, scrollToFirstUnreadQuestion);
    return () => {
      setScrollFunctions(null, null);
    };
  }, [scrollToFirstUnreadMessage, scrollToFirstUnreadQuestion, setScrollFunctions]);

  // === Установка активного стрима для поиска ===
  useEffect(() => {
    if (activeStreamId) {
      setActiveStreamId(activeStreamId);
      
      // Когда открываем стрим - помечаем ВСЕ сообщения как прочитанные
      // Добавляем небольшую задержку чтобы сообщения успели загрузиться
      const timer = setTimeout(() => {
        const msgs = getStreamMessages(activeStreamId);
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          markMessagesAsRead(activeStreamId, lastMsg.id);
          console.log('✅ Marked all messages as read for stream:', activeStreamId);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [activeStreamId, setActiveStreamId, getStreamMessages, markMessagesAsRead]);

  // === Загрузка сообщений из базы данных ===
  useEffect(() => {
    if (!activeStreamId) return;

    // Сбрасываем флаги при смене стрима
    autoLoadTriggeredRef.current = false;
    lastLoadedMessageIdRef.current = null;
    lastLoadMoreTimeRef.current = 0;

    console.log('🔄 Loading messages for stream:', activeStreamId);
    
    // Загружаем сообщения (loadMessagesAdaptive использует кэш если есть)
    // Сообщения уже приходят через WebSocket, эта функция просто обновит список
    loadMessagesAdaptive(activeStreamId).then((result) => {
      if (result.success) {
        console.log(`✅ Loaded messages with ${result.strategy.strategy} strategy (${result.count} new)`);
      } else {
        console.error('❌ Failed to load messages adaptively:', result.error);
        // Fallback к обычной загрузке
        loadMessagesFromDatabase(activeStreamId, 100);
      }
    });
  }, [activeStreamId, loadMessagesAdaptive, loadMessagesFromDatabase]); // Убираем зависимости автоскролла

  // === Автоскролл при смене стрима ===
  useEffect(() => {
    if (!activeStreamId || !shouldAutoScroll) return;
    
    console.log('🚀 Auto-scroll triggered for stream:', activeStreamId);
    
    // Ждем дольше, чтобы сообщения точно успели загрузиться
    const timer = setTimeout(() => {
      console.log('🚀 Executing auto-scroll after delay');
      forceScrollToBottom('instant');
      clearAutoScrollFlag();
    }, 500); // Увеличиваем задержку до 500ms
    
    return () => clearTimeout(timer);
  }, [activeStreamId, shouldAutoScroll, forceScrollToBottom, clearAutoScrollFlag]);

  // === Дополнительный автоскролл после загрузки сообщений ===
  useEffect(() => {
    if (!activeStreamId || !shouldAutoScroll || !streamMessages?.length) return;
    
    console.log('🚀 Additional auto-scroll triggered, messages count:', streamMessages.length);
    
    // Дополнительный автоскролл после того, как сообщения загрузились
    const timer = setTimeout(() => {
      console.log('🚀 Executing additional auto-scroll after messages loaded');
      forceScrollToBottom('instant');
      clearAutoScrollFlag();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [streamMessages?.length, shouldAutoScroll, forceScrollToBottom, clearAutoScrollFlag]);

  // === Принудительный автоскролл при изменении DOM ===
  useEffect(() => {
    if (!activeStreamId || !shouldAutoScroll) return;
    
    // Используем MutationObserver для отслеживания изменений в DOM
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new MutationObserver(() => {
      // Проверяем, что есть сообщения и контент для скролла
      if (streamMessages?.length > 0 && container.scrollHeight > container.clientHeight) {
        console.log('🚀 DOM changed, forcing scroll to bottom');
        forceScrollToBottom('instant');
        clearAutoScrollFlag();
        observer.disconnect(); // Отключаем наблюдатель после первого срабатывания
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Отключаем наблюдатель через 2 секунды на всякий случай
    const timeout = setTimeout(() => {
      observer.disconnect();
    }, 2000);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [activeStreamId, shouldAutoScroll, streamMessages?.length, forceScrollToBottom, clearAutoScrollFlag]);

  // === Восстановление позиции при смене стрима ===
  useEffect(() => {
    if (!activeStreamId) return;
    
    // Если установлен флаг автоскролла, не восстанавливаем позицию
    if (shouldAutoScroll) {
      console.log('🚀 Skipping position restoration due to auto-scroll flag');
      return;
    }

    // Небольшая задержка для обеспечения монтирования компонента
    const timeoutId = setTimeout(() => {
      const el = containerRef.current;
      if (!el) {
        // Ref can be null on first render - это нормально
        return;
      }

    const saved = scrollPositions.current[activeStreamId];
    if (saved !== undefined) {
      el.scrollTop = saved;
    } else {
      el.scrollTop = el.scrollHeight;
    }

    // Сброс состояния
    setShowNewBtn(false);
    setNewMsgCount(0);
    
    // ВАЖНО: Обновляем счетчик сообщений для нового стрима
    prevMsgCountRef.current = streamMessages?.length || 0;
    prevStreamRef.current = activeStreamId;

    // Обновляем состояние "внизу"
    requestAnimationFrame(() => {
      if (el && typeof el.scrollTop === 'number') {
        const { scrollTop, scrollHeight, clientHeight } = el;
        wasAtBottomRef.current = scrollHeight - scrollTop - clientHeight <= THRESHOLD;
      }
    });
    }, 100); // Задержка 100ms

    return () => clearTimeout(timeoutId);
  }, [activeStreamId, shouldAutoScroll]);

  // === Реакция на новые сообщения ===
  useEffect(() => {
    if (!activeStreamId || !streamMessages) return;

    const el = containerRef.current;
    if (!el) return;

    const newCount = streamMessages.length;
    const oldCount = prevMsgCountRef.current;
    
    // Если сообщений не прибавилось, ничего не делаем
    if (newCount <= oldCount) {
      prevMsgCountRef.current = newCount;
      return;
    }

    // Проверяем, был ли пользователь внизу
    const wasAtBottom = wasAtBottomRef.current;
    const isScrolling = isScrollingRef.current;
    
    // Дополнительная проверка: действительно ли пользователь внизу?
    const currentScrollTop = el.scrollTop;
    const currentScrollHeight = el.scrollHeight;
    const currentClientHeight = el.clientHeight;
    const actuallyAtBottom = currentScrollHeight - currentScrollTop - currentClientHeight <= THRESHOLD;
    
    console.log('📨 New message effect:', {
      newCount,
      oldCount,
      wasAtBottom,
      isScrolling,
      actuallyAtBottom,
      shouldAutoScroll: wasAtBottom && !isScrolling && actuallyAtBottom
    });
    
    // ВАЖНО: Обновляем wasAtBottomRef на основе текущего состояния
    wasAtBottomRef.current = actuallyAtBottom;
    
    // ВАЖНО: Проверяем, что пользователь НЕ скроллит в данный момент И действительно внизу
    if (wasAtBottom && !isScrolling && actuallyAtBottom) {
      // Автоскролл вниз только если пользователь был внизу И не скроллит И действительно внизу
      if (ENABLE_SCROLL_LOGS) {
        console.log('🚀 Auto-scrolling to bottom');
      }
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        wasAtBottomRef.current = true;
        
        // ✅ Помечаем сообщения как прочитанные при автоскролле
        // Небольшая задержка чтобы убедиться что скролл произошел
        setTimeout(() => {
          if (activeStreamId && streamMessages.length > 0) {
            const lastMsg = streamMessages[streamMessages.length - 1];
            markMessagesAsRead(activeStreamId, lastMsg.id);
            console.log('✅ Auto-scroll: Marked message as read:', lastMsg.id);
            
            // Принудительно сбрасываем счетчик
            setNewMsgCount(0);
            setShowNewBtn(false);
          }
        }, 100);
      });
    } else if (!wasAtBottom || !actuallyAtBottom) {
      // Показываем кнопку новых сообщений только если пользователь НЕ был внизу
      const stats = getStreamStats(activeStreamId);
      
      // Показываем кнопку если есть непрочитанные
      if (stats.unreadCount > 0) {
        setNewMsgCount(stats.unreadCount);
        setShowNewBtn(true);
      } else {
        setNewMsgCount(0);
        setShowNewBtn(false);
      }
    } else {
      if (ENABLE_SCROLL_LOGS) {
        console.log('⏸️ User is scrolling or not at bottom - not auto-scrolling');
      }
    }

    prevMsgCountRef.current = newCount;
  }, [streamMessages?.length || 0, activeStreamId, getStreamStats, markMessagesAsRead, streamMessages]);


  // === Обновление счетчика непрочитанных при изменении scroll ===
  useEffect(() => {
    if (!activeStreamId) {
      return;
    }
    
    // Получаем статистику
    const stats = getStreamStats(activeStreamId);
    
    // Проверяем реальную позицию скролла
    const el = containerRef.current;
    const actuallyAtBottom = el ? (el.scrollHeight - el.scrollTop - el.clientHeight <= THRESHOLD) : true;
    
    // Если действительно внизу - скрываем кнопку
    if (actuallyAtBottom) {
      setNewMsgCount(0);
      setShowNewBtn(false);
      return;
    }
    
    // Если не внизу И есть непрочитанные - показываем кнопку
    if (stats.unreadCount > 0) {
      setNewMsgCount(stats.unreadCount);
      setShowNewBtn(true);
    } else {
      setNewMsgCount(0);
      setShowNewBtn(false);
    }
  }, [activeStreamId, getStreamStats, messages.length, isAtBottom, checkIsAtBottom]);

  // === WebSocket Mood Updates ===
  useEffect(() => {
    const handleMoodUpdate = (data) => {
      if (data.type === 'mood_update' && data.data) {
        setCurrentMood(data.data); // Сохраняем в store
        console.log('🎭 Mood updated:', data.data);
      }
    };
    
    on('mood_update', handleMoodUpdate);
    
    return () => {
      off('mood_update', handleMoodUpdate);
    };
  }, [on, off, setCurrentMood]); // Add setCurrentMood to dependencies

  // === Очистка ===
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Очищаем таймер поиска при размонтировании
      clearSearchTimeout();
    };
  }, [clearSearchTimeout]);

  return (
    <div className="chat-container">
      {/* Database Status */}
      {/* DatabaseStatus убран для продакшена */}

      {/* Индикатор загрузки старых сообщений (вверху) */}
      {isLoadingMore && (
        <div className="chat-container__loading-indicator chat-container__loading-indicator--top">
          <div className="chat-container__loading-spinner">⏳</div>
          <span className="chat-container__loading-text">Загрузка старых сообщений...</span>
        </div>
      )}

      {/* Виртуализированные сообщения */}
      <div className="chat-container__messages">
        {hasMessages ? (
          <VirtualizedMessageList
            messages={streamMessages}
            onScroll={handleScroll}
            scrollToBottom={scrollToBottom}
            isAtBottom={isAtBottom}
            showNewMessagesButton={false}
            onNewMessagesClick={() => scrollToBottom('smooth')}
            containerRef={containerRef}
          />
        ) : (
          <div className="chat-container__empty">
            <span className="chat-container__empty-icon">💬</span>
            <p>{hasStreams ? t('chat.noMessages') : t('chat.connectStream')}</p>
          </div>
        )}
      </div>


            {/* Кнопка новых сообщений */}
      {showNewBtn && (
        <div className="chat-container__new-messages-wrapper">
          <button
            className="chat-container__new-messages-btn"
            onClick={() => scrollToBottom('smooth')}
          >
            <span className="chat-container__new-messages-text">
              {newMsgCount} {newMsgCount === 1 ? 'новое сообщение' : 'новых сообщений'}
            </span>
          </button>
        </div>
      )}

      {/* Поиск */}
      <SearchBar 
        onSearch={handleSearch}
        placeholder={t('search.messages')}
        onAddStream={onAddStream}
      />
    </div>
  );
};

export default ChatContainer;
