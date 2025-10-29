import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
// import { GlassCard, Button } from '@shared/components'; // Удалены - используем обычные div с glass эффектами
import { PLATFORM_LOGOS } from '@shared/utils/constants';
import AddStreamModal from './AddStreamModal';
import './RecentStreams.css';

const RecentStreams = () => {
  const { t } = useTranslation();
  const recentStreams = useStreamsStore((state) => state.recentStreams);
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const addStream = useStreamsStore((state) => state.addStream);
  const removeFromRecent = useStreamsStore((state) => state.removeFromRecent);
  const removeStream = useStreamsStore((state) => state.removeStream);
  const toggleStreamCard = useStreamsStore((state) => state.toggleStreamCard);
  const collapsedStreamIds = useStreamsStore((state) => state.collapsedStreamIds);
  // Используем строку для отслеживания изменений массива в useMemo
  const collapsedStreamIdsString = useStreamsStore((state) => JSON.stringify(state.collapsedStreamIds));
  const setActiveStream = useStreamsStore((state) => state.setActiveStream);
  
  // Subscribe to messages so component re-renders when messages change
  // ВАЖНО: подписываемся на messages.length чтобы ре-рендер при изменении!
  const messages = useChatStore((state) => state.messages);
  const messagesCount = useChatStore((state) => state.messages.length);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  const loadMessagesAdaptive = useChatStore((state) => state.loadMessagesAdaptive);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // Показываем недавние стримы, которые НЕ в activeStreams
  // ПЛЮС коллапсированные стримы из activeStreams
  // ВАЖНО: Когда activeStreamId === null (переход домой), показываем все стримы из recentStreams
  const streamsToShow = useMemo(() => {
    // Если перешли домой (activeStreamId === null), показываем все стримы из recentStreams
    if (activeStreamId === null) {
      // Показываем все стримы из recentStreams, которые НЕ в activeStreams
      const recentNotActive = recentStreams.filter(stream => 
        !activeStreams.some(s => s.id === stream.id)
      );
      
      // Плюс коллапсированные стримы из activeStreams
      const collapsedActive = activeStreams.filter(stream => 
        collapsedStreamIds.includes(stream.id)
      );
      
      const allStreams = [...recentNotActive, ...collapsedActive];
      const uniqueStreams = allStreams.filter((stream, index, self) =>
        index === self.findIndex(s => s.id === stream.id)
      );
      
      console.log('🔍 streamsToShow (home view):', {
        recentStreamsCount: recentStreams.length,
        activeStreamsCount: activeStreams.length,
        activeStreamId,
        collapsedCount: collapsedStreamIds.length,
        streamsToShowCount: uniqueStreams.length,
        streamsToShow: uniqueStreams.map(s => ({ id: s.id, title: s.title, platform: s.platform }))
      });
      
      return uniqueStreams;
    }
    
    // Иначе показываем только те, которые не в activeStreams ИЛИ коллапсированы
    const recentNotActive = recentStreams.filter(stream => {
      const isInActiveStreams = activeStreams.some(s => s.id === stream.id);
      const isCollapsed = collapsedStreamIds.includes(stream.id);
      return !isInActiveStreams || isCollapsed;
    });
    
    const collapsedActive = activeStreams.filter(stream => 
      collapsedStreamIds.includes(stream.id)
    );
    
    const allStreams = [...recentNotActive, ...collapsedActive];
    const uniqueStreams = allStreams.filter((stream, index, self) =>
      index === self.findIndex(s => s.id === stream.id)
    );
    
    return uniqueStreams;
  }, [recentStreams, activeStreams, collapsedStreamIdsString, activeStreamId]);
  
  // DEBUG: логирование для отладки
  console.log('🔍 RecentStreams RERENDER:', {
    timestamp: new Date().toISOString(),
    totalRecentStreams: recentStreams.length,
    activeStreamsCount: activeStreams.length,
    activeStreamId,
    collapsedStreamIds: collapsedStreamIds,
    collapsedStreamIdsString,
    streamsToShowCount: streamsToShow.length,
    messagesCount,
    activeStreams: activeStreams.map(s => ({ id: s.id, title: s.title, platform: s.platform })),
    streamsToShow: streamsToShow.map(s => ({ id: s.id, title: s.title }))
  });
  
  // Recalculate stats whenever messages change
  // ВАЖНО: используем messagesCount из подписки вместо messages.length!
  const stats = useMemo(() => {
    console.log('🔍 RecentStreams useMemo RUNNING - messagesCount changed:', messagesCount);
    const calculated = getAllStreamsStats();
    console.log('🔍 RecentStreams Stats Debug:', {
      timestamp: new Date().toISOString(),
      totalRecentStreams: recentStreams.length,
      activeStreamId,
      statsObject: calculated,
      messagesCount: messagesCount,
      messagesLength: messages.length,
      twitchStats: calculated['twitch-dyrachyo'] // DEBUG: статистика для конкретного стрима
    });
    return calculated;
  }, [getAllStreamsStats, messagesCount, recentStreams.length, activeStreamId]);
  
  // Загружаем сообщения для всех недавних стримов (кроме активных)
  useEffect(() => {
    const loadMessagesForRecentStreams = async () => {
      for (const stream of streamsToShow) {
        try {
          await loadMessagesAdaptive(stream.id, { forceReload: false });
        } catch (error) {
          console.warn(`Failed to load messages for stream ${stream.id}:`, error);
        }
      }
    };
    
    if (streamsToShow.length > 0) {
      loadMessagesForRecentStreams();
    }
  }, [streamsToShow.length, loadMessagesAdaptive]);

  // Периодически обновляем счетчики для недавних стримов
  useEffect(() => {
    if (streamsToShow.length === 0) return;

    const updateInterval = setInterval(async () => {
      // Принудительно вызываем ре-рендер компонента для обновления счетчиков
      // Сообщения уже приходят через WebSocket, нужно только обновить UI
      const stats = getAllStreamsStats();
      
      console.log('🔄 Periodic stats update:', {
        streamsCount: streamsToShow.length,
        stats: Object.keys(stats).reduce((acc, id) => {
          acc[id] = { unreadCount: stats[id]?.unreadCount || 0 };
          return acc;
        }, {})
      });
    }, 2000); // Обновляем каждые 2 секунды

    return () => clearInterval(updateInterval);
  }, [streamsToShow, getAllStreamsStats]);

  const handleScrollToUnread = (e, streamId, isQuestion = false) => {
    e.stopPropagation(); // Предотвращаем клик на карточку
    
    // Если стрим не активен, сначала делаем его активным
    if (activeStreamId !== streamId) {
      setActiveStream(streamId);
      // Ждем немного чтобы стрим стал активным и сообщения загрузились
      setTimeout(() => {
        if (isQuestion) {
          scrollToUnreadQuestion?.(streamId);
        } else {
          scrollToUnreadMessage?.(streamId);
        }
      }, 500);
    } else {
      // Если стрим уже активен, сразу скроллим
      if (isQuestion) {
        scrollToUnreadQuestion?.(streamId);
      } else {
        scrollToUnreadMessage?.(streamId);
      }
    }
  };

  const handleStreamClick = (stream) => {
    // Если стрим коллапсирован, развернуть его и сделать активным
    if (collapsedStreamIds.includes(stream.id)) {
      toggleStreamCard(stream.id); // Разворачиваем
      setActiveStream(stream.id); // Делаем активным
    } else {
      // Если стрим не в activeStreams, добавляем его
      const isInActiveStreams = activeStreams.some(s => s.id === stream.id);
      if (!isInActiveStreams) {
        addStream(stream);
      } else {
        // Если уже в activeStreams, просто делаем активным
        setActiveStream(stream.id);
      }
    }
  };

  const handleRemove = async (e, streamId) => {
    e.stopPropagation();
    if (confirm(t('streams.removeConfirm'))) {
      // Находим стрим для получения connectionId (сначала в недавних, потом в активных)
      let streamToRemove = recentStreams.find(s => s.id === streamId);
      if (!streamToRemove) {
        streamToRemove = activeStreams.find(s => s.id === streamId);
      }
      
      // 🚨 Отключаем от платформы (это реальный disconnect)
      if (streamToRemove?.connectionId) {
        try {
          console.log('🔌 Full disconnect from stream:', streamToRemove.connectionId);
          const response = await fetch('/api/v1/disconnect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              connectionId: streamToRemove.connectionId
            })
          });
          
          if (response.ok) {
            console.log('✅ Successfully disconnected from stream');
          } else {
            console.warn('⚠️ Failed to disconnect from stream:', response.status);
          }
        } catch (error) {
          console.error('❌ Error disconnecting from stream:', error);
        }
      } else {
        console.warn('⚠️ No connectionId found for stream:', streamId);
      }
      
      // Удаляем из недавних стримов
      removeFromRecent(streamId);
      
      // Удаляем из активных (если он там есть) через removeStream
      if (activeStreams.find(s => s.id === streamId)) {
        await removeStream(streamId);
      }
    }
  };

  return (
    <>
      <div className="recent-streams scrollable" data-scrollable>
        <motion.div
          className="recent-streams__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="recent-streams__header">
            <h2 className="recent-streams__title">
              {t('streams.recent')}
            </h2>
          </div>

          {streamsToShow.length === 0 ? (
            <div className="recent-streams__empty">
              <div className="recent-streams__empty-platforms">
                <img 
                  src={PLATFORM_LOGOS.youtube} 
                  alt="YouTube" 
                  className="recent-streams__empty-platform"
                />
                <img 
                  src={PLATFORM_LOGOS.kick} 
                  alt="Kick" 
                  className="recent-streams__empty-platform"
                />
                <img 
                  src={PLATFORM_LOGOS.twitch} 
                  alt="Twitch" 
                  className="recent-streams__empty-platform"
                />
              </div>
              <h3>{t('streams.noRecent')}</h3>
              <p>{t('streams.noRecentSubtitle')}</p>
            </div>
          ) : (
            <div className="recent-streams__list">
              {streamsToShow.map((stream, index) => {
                const streamStats = stats[stream.id] || { messageCount: 0, questionCount: 0, unreadCount: 0, unreadQuestionCount: 0 };
                
                return (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className="recent-stream-card"
                      onClick={() => handleStreamClick(stream)}
                    >
                      <button
                        className="recent-stream-card__remove"
                        onClick={(e) => handleRemove(e, stream.id)}
                        aria-label={t('streams.remove')}
                      >
                        ✕
                      </button>

                      {/* Platform Logo */}
                      <div className="recent-stream-card__header">
                        <img
                          src={PLATFORM_LOGOS[stream.platform]}
                          alt={stream.platform}
                          className="recent-stream-card__logo"
                        />
                      </div>

                      {/* Stream Info */}
                      <div className="recent-stream-card__info">
                        <div className="recent-stream-card__author">
                          {stream.streamUrl ? (
                            <a 
                              href={stream.streamUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="recent-stream-card__author-link"
                            >
                              {stream.author || stream.streamId}
                            </a>
                          ) : (
                            stream.author || stream.streamId
                          )}
                        </div>
                        <div className="recent-stream-card__title">
                          {stream.title || 'Stream'}
                        </div>
                        
                        {/* Счетчик непрочитанных сообщений */}
                        {streamStats.unreadCount > 0 && (
                          <button
                            className="recent-stream-card__unread-badge recent-stream-card__unread-badge--clickable"
                            onClick={(e) => handleScrollToUnread(e, stream.id, false)}
                            title="Перейти к непрочитанным сообщениям"
                          >
                            {streamStats.unreadCount} {streamStats.unreadCount === 1 ? 'новое сообщение' : 'новых сообщений'}
                          </button>
                        )}
                        
                        {/* Счетчик непрочитанных вопросов */}
                        {streamStats.unreadQuestionCount > 0 && (
                          <button
                            className="recent-stream-card__unread-questions-badge recent-stream-card__unread-questions-badge--clickable"
                            onClick={(e) => handleScrollToUnread(e, stream.id, true)}
                            title="Перейти к непрочитанным вопросам"
                          >
                            {streamStats.unreadQuestionCount} {streamStats.unreadQuestionCount === 1 ? 'новый вопрос' : streamStats.unreadQuestionCount < 5 ? 'новых вопроса' : 'новых вопросов'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <button
            className="recent-streams__add-button"
            onClick={() => setShowAddStream(true)}
          >
            <span className="recent-streams__add-icon">➕</span>
            {t('streams.add')}
          </button>
        </motion.div>
      </div>

      <AddStreamModal
        isOpen={showAddStream}
        onClose={() => setShowAddStream(false)}
      />
    </>
  );
};

export default RecentStreams;

