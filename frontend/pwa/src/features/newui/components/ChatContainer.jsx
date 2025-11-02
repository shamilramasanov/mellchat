import { memo, useEffect, useRef, useState, useMemo } from 'react';
import { ChevronDown, MessageSquare, Filter, X, Sparkles } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { MessageCard } from './MessageCard.jsx';
import MoodBar from '@features/chat/components/MoodBar.jsx';
import MoodButton from '@features/chat/components/MoodButton.jsx';
import '@features/chat/components/MoodButton.css';
import { useChatStore } from '@features/chat/store/chatStore';
import { useWebSocketContext } from '@shared/components/WebSocketProvider.jsx';

function ChatContainerBase({ messages, searchQuery, newMessagesCount = 0, onScrollToBottom, targetMessageId, activeFilter, activeStreamId, activeStreams, onClearFilter, aiFilterQuery }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const messageRefs = useRef(new Map());
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false); // Синхронный доступ к userPaused для автоматической прокрутки
  
  // MoodBar state
  const [showMoodBar, setShowMoodBar] = useState(false);
  const currentMood = useChatStore(state => state.currentMood);
  const moodEnabled = useChatStore(state => state.moodEnabled);
  const setCurrentMood = useChatStore(state => state.setCurrentMood);
  const { on, off } = useWebSocketContext();
  const prevScrollHeightRef = useRef(0);
  const lastReadMessageIdRef = useRef(null); // Отслеживаем последнее прочитанное сообщение
  lastReadMessageIdRef.timeoutId = null; // Для хранения таймера дебаунса
  const prevScrollTopRef = useRef(0); // Сохраняем позицию скролла для sticky anchoring

  // Флаг для отслеживания, был ли это явный вызов (клик по кнопке) или автоматический
  const isManualScrollRef = useRef(false);
  
  const scrollToBottom = async (forceManual = false) => {
    const el = containerRef.current;
    if (!el) return;
    
    // Сохраняем флаг ДО любых операций
    const wasManual = forceManual || isManualScrollRef.current;
    
    // Сбрасываем флаг СРАЗУ после сохранения, чтобы не влиять на будущие вызовы
    if (forceManual) {
      isManualScrollRef.current = false;
    }
    
    // Снимаем паузу СРАЗУ для залипания внизу
    setUserPaused(false);
    userPausedRef.current = false;
    
    // Плавная прокрутка вместо мгновенной (пользователь видит промежуточные сообщения)
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });
    
    // Ждем завершения прокрутки
    await new Promise((resolve) => {
      const checkPosition = () => {
        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 10;
        if (Math.abs(scrollHeight - scrollTop - clientHeight) < threshold) {
          resolve();
        } else {
          requestAnimationFrame(checkPosition);
        }
      };
      checkPosition();
    });
    
    // После завершения прокрутки ПРИНУДИТЕЛЬНО устанавливаем scrollTop в самый низ
    // Это критично, потому что smooth scroll может не доходить до самого низа
    el.scrollTop = el.scrollHeight;
    
    // Ждем еще немного для гарантии, что scrollTop обновился
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Еще раз проверяем и прокручиваем, если нужно
    const { scrollTop: finalScrollTop, scrollHeight: finalScrollHeight, clientHeight: finalClientHeight } = el;
    if (finalScrollHeight > finalScrollTop + finalClientHeight + 10) {
      el.scrollTop = el.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Теперь явно вызываем handleScroll для обновления состояния
    // Это критично для обновления userPaused и isAtBottom
    if (handleScrollRef.current) {
      handleScrollRef.current();
    }
    
    // После завершения прокрутки помечаем только последнее НЕ-ВОПРОС сообщение как прочитанное
    // Вопросы НЕ должны помечаться как прочитанные при нажатии на кнопку "Новые сообщения"
    // ВАЖНО: вызываем onScrollToBottom ТОЛЬКО при явном вызове (клик по кнопке)
    
    if (messages.length > 0 && onScrollToBottom && wasManual) {
      // Находим последнее сообщение, которое НЕ является вопросом
      let lastNonQuestionMessage = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (!messages[i].isQuestion) {
          lastNonQuestionMessage = messages[i];
          break;
        }
      }
      
      // Если есть не-вопрос сообщение - помечаем его
      // Это обновит счетчик непрочитанных СОООБЩЕНИЙ, но НЕ обнулит счетчик вопросов
      if (lastNonQuestionMessage) {
        onScrollToBottom(lastNonQuestionMessage.id);
      }
      // Если все последние сообщения - вопросы, ничего не помечаем
      // Счетчик вопросов останется нетронутым
    }
  };
  
  // Обработчик клика по кнопке "Новые сообщения" - устанавливает флаг ДО вызова
  const handleScrollToBottomClick = () => {
    isManualScrollRef.current = true;
    scrollToBottom(true); // Передаем forceManual = true
  };

  // Отслеживаем количество сообщений для определения, добавилось ли новое
  const messagesCountRef = useRef(messages.length);
  const isScrollingRef = useRef(false); // Флаг для предотвращения конфликтов прокрутки
  const isInitialMountRef = useRef(true); // Флаг для первой загрузки
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const prevCount = messagesCountRef.current;
    const currentCount = messages.length;
    const hasNewMessage = currentCount > prevCount;
    const isInitialLoad = isInitialMountRef.current && currentCount > 0;
    
    // При первой загрузке сообщений автоматически прокручиваем вниз
    if (isInitialLoad) {
      isInitialMountRef.current = false;
      
      // Прокручиваем сразу
      el.scrollTop = el.scrollHeight;
      messagesCountRef.current = currentCount;
      
      // Вызываем handleScroll для обновления состояния
      if (handleScrollRef.current) {
        setTimeout(() => handleScrollRef.current(), 0);
      }
      
      // Дополнительная прокрутка после рендера
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        // Вызываем handleScroll еще раз после рендера
        if (handleScrollRef.current) {
          setTimeout(() => handleScrollRef.current(), 0);
        }
      });
      return;
    }
    
    if (!hasNewMessage) {
      // Нет нового сообщения - просто обновляем счетчик
      messagesCountRef.current = currentCount;
      return;
    }
    
    // КРИТИЧЕСКАЯ ЛОГИКА: Автоматическая прокрутка для "залипания" внизу
    // ВАЖНО: Проверяем позицию ПОСЛЕ обновления DOM, используя requestAnimationFrame
    
    // 1. Нет поискового запроса
    if (searchQuery) {
      messagesCountRef.current = currentCount;
      return;
    }
    
    // 2. Проверяем, что не происходит уже прокрутка
    if (isScrollingRef.current) {
      messagesCountRef.current = currentCount;
      return;
    }
    
    // 3. Проверяем, что пользователь НЕ ставил паузу
    if (userPausedRef.current) {
      messagesCountRef.current = currentCount;
      return;
    }
    
    // 4. КРИТИЧЕСКАЯ ЛОГИКА: Проверяем позицию СИНХРОННО ДО requestAnimationFrame
    // Когда приходит новое сообщение, scrollHeight увеличивается, но scrollTop остается на месте
    // Это означает, что пользователь БЫЛ внизу, но теперь "отстал" из-за нового контента
    // Нужно проверить, был ли пользователь внизу ДО добавления нового сообщения
    
    const { scrollTop: currentScrollTop, scrollHeight: currentScrollHeight, clientHeight: currentClientHeight } = el;
    const threshold = 48;
    const distanceBeforeNewMessage = currentScrollHeight - currentScrollTop - currentClientHeight;
    
    // ВАЖНО: Если distance небольшой (< threshold * 2), значит пользователь был близко к низу
    // или новый контент только что добавился. В этом случае считаем, что пользователь был внизу
    const wasAtBottom = distanceBeforeNewMessage < (threshold * 2);
    
    // Проверяем еще раз паузу СИНХРОННО
    if (!wasAtBottom || userPausedRef.current) {
      messagesCountRef.current = currentCount;
      return;
    }
    
    // Пользователь был внизу - запускаем автоскролл
    isScrollingRef.current = true;
    
    // СИНХРОННАЯ прокрутка СРАЗУ - не ждем requestAnimationFrame
    // Это критично для того, чтобы новые сообщения были видны сразу
    el.scrollTop = el.scrollHeight;
    
    // Дополнительная проверка и прокрутка после обновления DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Проверяем позицию после обновления DOM
        const { scrollTop, scrollHeight, clientHeight } = el;
        const currentlyAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
        
        // Проверяем еще раз паузу (может измениться за время ожидания)
        if (!currentlyAtBottom || userPausedRef.current) {
          isScrollingRef.current = false;
          messagesCountRef.current = currentCount;
          return;
        }
        
        // ВСЕ УСЛОВИЯ ВЫПОЛНЕНЫ: выполняем залипание внизу
        
        // Убеждаемся, что isManualScrollRef.current = false
        if (isManualScrollRef.current) {
          isManualScrollRef.current = false;
        }
        
        // КРИТИЧЕСКИ ВАЖНО: Агрессивная прокрутка с несколькими попытками
        // DOM обновляется после того, как мы устанавливаем scrollTop,
        // поэтому нужно повторять прокрутку несколько раз
        
        let scrollAttempts = 0;
        const maxScrollAttempts = 5; // Увеличиваем количество попыток
        
        const forceScrollToBottom = () => {
          const currentScrollHeight = el.scrollHeight;
          const currentScrollTop = el.scrollTop;
          const currentClientHeight = el.clientHeight;
          const distance = currentScrollHeight - currentScrollTop - currentClientHeight;
          
          // Прокручиваем в любом случае (даже если кажется, что мы уже внизу)
          // потому что DOM может обновляться
          el.scrollTop = el.scrollHeight;
          scrollAttempts++;
          
          if (distance > threshold && scrollAttempts < maxScrollAttempts) {
            // Еще не достигли низа - продолжаем попытки
            requestAnimationFrame(forceScrollToBottom);
            return;
          }
          
          // Достигли низа или превысили попытки
          // Проверяем финальную позицию
          const finalCheck = () => {
            const { scrollTop: finalScrollTop, scrollHeight: finalScrollHeight, clientHeight: finalClientHeight } = el;
            const finalDistance = finalScrollHeight - finalScrollTop - finalClientHeight;
            
            if (finalDistance > threshold) {
              // Все еще не внизу - еще одна попытка через microtask
              Promise.resolve().then(() => {
                el.scrollTop = el.scrollHeight;
                setTimeout(() => {
                  if (handleScrollRef.current) {
                    handleScrollRef.current();
                  }
                  userPausedRef.current = false;
                  setUserPaused(false);
                  isScrollingRef.current = false;
                }, 0);
              });
            } else {
              // Внизу - завершаем
              if (handleScrollRef.current) {
                setTimeout(() => {
                  handleScrollRef.current();
                }, 0);
              }
              
              // Сбрасываем паузу СИНХРОННО
              userPausedRef.current = false;
              setUserPaused(false);
              
              isScrollingRef.current = false;
            }
          };
          
          // Даем DOM время обновиться перед финальной проверкой
          requestAnimationFrame(() => {
            requestAnimationFrame(finalCheck);
          });
        };
        
        // Запускаем агрессивную прокрутку
        forceScrollToBottom();
      });
    });
    
    // Обновляем счетчик сообщений
    messagesCountRef.current = currentCount;
  }, [messages.length, searchQuery, userPaused]);

  // Sticky scroll anchoring when paused: keep viewport stable
  // КРИТИЧЕСКИ ВАЖНО: Если пользователь прокрутил вверх (userPaused === true),
  // НЕ ДОБАВЛЯЕМ delta к scrollTop - это вызывает прокрутку вниз!
  // Вместо этого просто НЕ трогаем scrollTop - пользователь останется на своем месте
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    // Если пользователь в паузе (прокрутил вверх) - НЕ МЕНЯЕМ scrollTop
    // Новые сообщения добавятся внизу, но пользователь останется на своей позиции
    if (userPaused && !isAtBottom) {
      // НИЧЕГО НЕ ДЕЛАЕМ - это предотвратит прокрутку
      // Просто обновляем prevScrollHeight для следующей проверки
      prevScrollHeightRef.current = el.scrollHeight;
      return;
    }
    
    // Если не в паузе - обычная логика (может быть удалена, если не нужна)
    const prevHeight = prevScrollHeightRef.current || el.scrollHeight;
    const newHeight = el.scrollHeight;
    prevScrollHeightRef.current = newHeight;
  }, [messages, userPaused, isAtBottom]);

  // Инициализируем prevScrollHeight при монтировании
  useEffect(() => {
    const el = containerRef.current;
    if (el) prevScrollHeightRef.current = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!targetMessageId) return;
    const el = messageRefs.current.get(targetMessageId);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // После прокрутки к вопросу - помечаем его как прочитанный (но не все последующие)
      // Это делается в chatStore при навигации через getNextUnreadQuestionId
      
      // НЕ устанавливаем паузу здесь - пусть handleScroll определяет, внизу ли пользователь
      // Если после навигации пользователь прокрутит вниз, handleScroll снимет паузу автоматически
    }
    // Временно ставим паузу, но handleScroll определит реальное состояние
    userPausedRef.current = true;
    setUserPaused(true);
    
    // Через небольшую задержку проверяем позицию и снимаем паузу, если пользователь внизу
    setTimeout(() => {
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const threshold = 48;
        const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
        if (atBottom) {
          userPausedRef.current = false;
          setUserPaused(false);
        }
      }
    }, 500); // Задержка для завершения smooth scroll
  }, [targetMessageId]);
  
  // Сбрасываем lastReadMessageIdRef при смене стрима (через messages)
  useEffect(() => {
    if (messages.length === 0) {
      lastReadMessageIdRef.current = null;
      return;
    }
    // Если сообщения есть, но последнее сообщение - новое (не было в предыдущем рендере)
    // Это косвенный признак смены стрима
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastReadMessageIdRef.current) {
      // Не сбрасываем, но обновляем отслеживание
    }
  }, [messages]);

  // Сохраняем ссылку на handleScroll для явного вызова
  const handleScrollRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let scrollTimeout = null;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 48;
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      setIsAtBottom(atBottom);
      setShowNewMessagesButton(!atBottom && newMessagesCount > 0);
      
      // Очищаем предыдущий таймер
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      if (!atBottom) {
        // Пользователь НЕ внизу - СРАЗУ ставим паузу
        // Это ЗАПРЕТИТ автоматическую прокрутку при новых сообщениях
        userPausedRef.current = true; // Обновляем ref СИНХРОННО
        setUserPaused(true);
      } else {
        // Пользователь внизу - снимаем паузу для "залипания" внизу
        // Это позволяет автоматически прокручивать новые сообщения
        userPausedRef.current = false; // Обновляем ref СИНХРОННО
        setUserPaused(false);
      }
    };
    
    // Сохраняем ссылку для явного вызова
    handleScrollRef.current = handleScroll;
    
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Устанавливаем начальное состояние
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScrollRef.current = null;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (lastReadMessageIdRef.timeoutId) {
        clearTimeout(lastReadMessageIdRef.timeoutId);
      }
    };
  }, [newMessagesCount, messages, onScrollToBottom, userPaused]);

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.text.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
  });

  const useVirtual = false; // временно отключена виртуализация

  // Всегда инициализируем виртуализатор, чтобы не нарушать порядок хуков
  const rowVirtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  // WebSocket listener для настроения
  useEffect(() => {
    const handleMoodUpdate = (data) => {
      // Обрабатываем событие mood_update от бэкенда
      // Формат может быть: { type: 'mood_update', mood: {...} } или { type: 'mood_update', data: {...} }
      if (data.type === 'mood_update') {
        const moodData = data.mood || data.data || data;
        if (moodData && typeof moodData === 'object') {
          setCurrentMood(moodData);
        }
      }
    };

    on('mood_update', handleMoodUpdate);

    return () => {
      off('mood_update', handleMoodUpdate);
    };
  }, [on, off, setCurrentMood]);

  // Анализируем последние 50 сообщений для определения цвета рамки
  const recentMessages = useMemo(() => {
    if (!moodEnabled || !activeStreamId) return [];
    return messages
      .filter(m => m.streamId === activeStreamId)
      .slice(-50); // Последние 50 сообщений
  }, [messages, activeStreamId, moodEnabled]);

  // Определяем цвет рамки на основе настроения последних 50 сообщений
  const moodColor = useMemo(() => {
    // Если фильтр выключен → обычная серая рамка
    if (!moodEnabled || recentMessages.length === 0) {
      return 'gray';
    }

    // Анализируем последние 50 сообщений
    const stats = {
      spam: 0,
      sad: 0,
      happy: 0,
      neutral: 0
    };

    recentMessages.forEach(m => {
      if (m.isSpam) stats.spam++;
      else if (m.sentiment === 'sad') stats.sad++;
      else if (m.sentiment === 'happy') stats.happy++;
      else stats.neutral++;
    });

    // Вычисляем долю негатива (спам + негативные сообщения)
    const total = recentMessages.length;
    const negativeScore = (stats.spam + stats.sad) / total;

    // Определяем цвет на основе негатива
    if (negativeScore === 0) return 'green';      // Нет спама и негатива → ЗЕЛЕНЫЙ
    if (negativeScore <= 0.3) return 'yellow';   // 1-30% негатива → ЖЕЛТЫЙ
    if (negativeScore <= 0.6) return 'orange';   // 31-60% негатива → ОРАНЖЕВЫЙ
    return 'red';                                 // 61-100% негатива → КРАСНЫЙ
  }, [moodEnabled, recentMessages]);

  // Получаем информацию о стриме (платформа и название канала)
  const getStreamInfo = (messageStreamId) => {
    if (!messageStreamId) {
      console.warn('⚠️ getStreamInfo: messageStreamId is missing', { messageStreamId, activeStreams });
      return { platform: 'unknown', channelName: null };
    }
    
    const stream = activeStreams?.find(s => s.id === messageStreamId);
    if (!stream) {
      console.warn('⚠️ getStreamInfo: stream not found', { messageStreamId, activeStreamsIds: activeStreams?.map(s => s.id) });
      // Попробуем извлечь из самого messageStreamId (формат "platform-channelname")
      const parts = messageStreamId.split('-');
      if (parts.length > 1) {
        const platform = parts[0];
        const channelName = parts.slice(1).join('-');
        return { platform, channelName };
      }
      return { platform: 'unknown', channelName: null };
    }
    
    const platform = stream.platform || 'unknown';
    
    // Приоритет извлечения названия канала:
    // 1. stream.streamId (чистое название канала, например "deko") - основное поле
    // 2. stream.title (может быть задан через API, например "Deko Gaming")
    // 3. Из stream.id (формат "platform-channelname", например "twitch-deko") - ОБЯЗАТЕЛЬНО извлекаем
    let channelName = stream.streamId || stream.title;
    
    // ВСЕГДА пытаемся извлечь из id, если не нашлось выше
    if (!channelName && stream.id) {
      const parts = stream.id.split('-');
      if (parts.length > 1) {
        channelName = parts.slice(1).join('-'); // Берем все части после платформы
      }
    }
    
    // Если все еще нет названия, используем сам stream.id как fallback
    if (!channelName && stream.id) {
      channelName = stream.id;
    }
    
    // Если название канала слишком длинное, обрезаем
    if (channelName && channelName.length > 20) {
      channelName = channelName.substring(0, 17) + '...';
    }
    
    return {
      platform,
      channelName: channelName || null
    };
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0" style={{ paddingBottom: '4.3125rem' }}>
      {/* MoodBar модальное окно */}
      {showMoodBar && (
        <MoodBar 
          mood={currentMood} 
          onClose={() => setShowMoodBar(false)} 
        />
      )}
      
      {/* Баннер активного фильтра */}
      {activeFilter && (
        <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${
          activeFilter === 'questions'
            ? 'bg-orange-50 border-orange-200'
            : activeFilter === 'allQuestions'
            ? 'bg-green-50 border-green-200'
            : activeFilter === 'ai'
            ? 'bg-purple-50 border-purple-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {activeFilter === 'questions' ? (
              <MessageSquare className="h-4 w-4 text-orange-600 flex-shrink-0" />
            ) : activeFilter === 'allQuestions' ? (
              <Filter className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : activeFilter === 'ai' ? (
              <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
            ) : null}
            <span className={`text-sm font-medium truncate ${
              activeFilter === 'questions'
                ? 'text-orange-800'
                : activeFilter === 'allQuestions'
                ? 'text-green-800'
                : activeFilter === 'ai'
                ? 'text-purple-800'
                : 'text-gray-800'
            }`}>
              {activeFilter === 'questions'
                ? t('newui.showingQuestionsOnly', { count: filteredMessages.length })
                : activeFilter === 'allQuestions'
                ? t('newui.showingAllQuestions', { count: filteredMessages.length })
                : activeFilter === 'ai' && aiFilterQuery
                ? `AI: ${aiFilterQuery} (${filteredMessages.length} сообщений)`
                : `Фильтр активен (${filteredMessages.length})`
              }
            </span>
          </div>
          <button 
            onClick={onClearFilter} 
            className={`p-1 rounded transition-colors flex-shrink-0 ${
              activeFilter === 'questions'
                ? 'hover:bg-orange-100 text-orange-600'
                : activeFilter === 'allQuestions'
                ? 'hover:bg-green-100 text-green-600'
                : activeFilter === 'ai'
                ? 'hover:bg-purple-100 text-purple-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label={t('newui.clearFilter')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto px-4 py-4 bg-gray-50 rounded-lg transition-all duration-300 min-h-0 ${
          !moodEnabled 
            ? 'border border-gray-200' 
            : moodColor === 'green'
            ? 'border-2 border-green-400 shadow-lg shadow-green-200/50 ring-2 ring-green-200'
            : moodColor === 'yellow'
            ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-200/50 ring-2 ring-yellow-200'
            : moodColor === 'orange'
            ? 'border-2 border-orange-400 shadow-lg shadow-orange-200/50 ring-2 ring-orange-200'
            : moodColor === 'red'
            ? 'border-2 border-red-400 shadow-lg shadow-red-200/50 ring-2 ring-red-200'
            : 'border border-gray-200'
        }`}
        style={{
          paddingBottom: '8px',
          ...(moodEnabled && moodColor === 'green' && {
            boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }),
          ...(moodEnabled && moodColor === 'yellow' && {
            boxShadow: 'inset 0 0 20px rgba(234, 179, 8, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }),
          ...(moodEnabled && moodColor === 'orange' && {
            boxShadow: 'inset 0 0 20px rgba(249, 115, 22, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }),
          ...(moodEnabled && moodColor === 'red' && {
            boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          })
        }}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">{searchQuery ? 'No messages found' : 'No messages yet'}</p>
          </div>
        ) : useVirtual ? (
          <div
            style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
          >
            {rowVirtualizer.getVirtualItems().map((vi) => {
              const m = filteredMessages[vi.index];
              return (
                <div
                  key={m.id}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                  ref={(node) => { if (node) { messageRefs.current.set(m.id, node); } else { messageRefs.current.delete(m.id); } }}
                >
                <MessageCard 
                  message={m} 
                  showPlatformBadge={activeFilter === 'allQuestions' || (activeStreams && activeStreams.length > 1)}
                  streamInfo={getStreamInfo(m.streamId || m.connectionId)}
                />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        ) : (
          <>
            {filteredMessages.map((message, index) => (
              <div 
                key={message.id} 
                ref={(node) => { if (node) { messageRefs.current.set(message.id, node); } else { messageRefs.current.delete(message.id); } }}
                style={index === filteredMessages.length - 1 ? { marginBottom: '0' } : {}}
              >
                <MessageCard 
                  message={message} 
                  showPlatformBadge={activeFilter === 'allQuestions' || (activeStreams && activeStreams.length > 1)}
                  streamInfo={getStreamInfo(message.streamId || message.connectionId)}
                />
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      {showNewMessagesButton && newMessagesCount > 0 && (
        <button
          onClick={handleScrollToBottomClick}
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-10 h-10 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all z-50 backdrop-blur-sm touch-manipulation"
          title={`${newMessagesCount} ${newMessagesCount === 1 ? t('chat.newMessage') : t('chat.newMessages')}`}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export const ChatContainer = memo(ChatContainerBase);


