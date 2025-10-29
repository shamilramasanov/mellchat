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
  
  // Subscribe to messages so component re-renders when messages change
  // ВАЖНО: подписываемся на messages.length чтобы ре-рендер при изменении!
  const messages = useChatStore((state) => state.messages);
  const messagesCount = useChatStore((state) => state.messages.length);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  const loadMessagesAdaptive = useChatStore((state) => state.loadMessagesAdaptive);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // Показываем недавние стримы, которые НЕ в activeStreams
  const streamsToShow = recentStreams.filter(stream => {
    // Проверяем, есть ли стрим в activeStreams
    const isInActiveStreams = activeStreams.some(s => s.id === stream.id);
    // Показываем только те, которых нет в activeStreams
    return !isInActiveStreams;
  });
  
  // DEBUG: логирование для отладки
  console.log('🔍 RecentStreams RERENDER:', {
    timestamp: new Date().toISOString(),
    totalRecentStreams: recentStreams.length,
    activeStreamsCount: activeStreams.length,
    activeStreamId,
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

  const handleStreamClick = (stream) => {
    // If stream is collapsed, expand it first
    if (collapsedStreamIds.includes(stream.id)) {
      toggleStreamCard(stream.id);
    }
    
    // Always add stream to active (since we only show recent streams now)
    addStream(stream);
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
                          {stream.author || stream.streamId}
                        </div>
                        <div className="recent-stream-card__title">
                          {stream.title || 'Stream'}
                        </div>
                        
                        {/* Счетчик непрочитанных сообщений */}
                        {streamStats.unreadCount > 0 && (
                          <div className="recent-stream-card__unread-badge">
                            {streamStats.unreadCount} {streamStats.unreadCount === 1 ? 'новое сообщение' : 'новых сообщений'}
                          </div>
                        )}
                        
                        {/* Счетчик непрочитанных вопросов */}
                        {streamStats.unreadQuestionCount > 0 && (
                          <div className="recent-stream-card__unread-questions-badge">
                            {streamStats.unreadQuestionCount} {streamStats.unreadQuestionCount === 1 ? 'новый вопрос' : streamStats.unreadQuestionCount < 5 ? 'новых вопроса' : 'новых вопросов'}
                          </div>
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

