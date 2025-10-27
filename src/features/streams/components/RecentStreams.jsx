import { useState, useEffect } from 'react';
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
  const addStream = useStreamsStore((state) => state.addStream);
  const removeFromRecent = useStreamsStore((state) => state.removeFromRecent);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  const loadMessagesAdaptive = useChatStore((state) => state.loadMessagesAdaptive);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // Показываем только недавние стримы, исключая активные
  const streamsToShow = recentStreams.filter(stream => 
    !activeStreams.some(activeStream => activeStream.id === stream.id)
  );
  
  // Recalculate stats whenever messages change
  const stats = getAllStreamsStats();
  
  // Загружаем сообщения для всех недавних стримов (кроме активных)
  useEffect(() => {
    // НЕ загружаем если нет активных стримов (пользователь вышел из всех)
    if (activeStreams.length === 0) {
      console.log('🛑 Skipping recent streams loading - no active streams');
      return;
    }
    
    const loadMessagesForRecentStreams = async () => {
      console.log('🔄 Loading messages for recent streams:', streamsToShow.length);
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
  }, [streamsToShow.length, activeStreams.length]); // Добавляем activeStreams.length в зависимости

  // Периодически обновляем сообщения для недавних стримов
  useEffect(() => {
    if (streamsToShow.length === 0) return;
    
    // НЕ обновляем если нет активных стримов (пользователь вышел из всех)
    if (activeStreams.length === 0) {
      console.log('🛑 Stopping recent streams updates - no active streams');
      return;
    }

    console.log('🔄 Starting periodic updates for recent streams:', streamsToShow.length);

    const updateInterval = setInterval(async () => {
      // Дополнительная проверка - если активных стримов нет, останавливаем обновления
      if (activeStreams.length === 0) {
        console.log('🛑 Stopping periodic updates - no active streams');
        clearInterval(updateInterval);
        return;
      }
      
      for (const stream of streamsToShow) {
        try {
          // Принудительно перезагружаем сообщения для обновления счетчиков
          await loadMessagesAdaptive(stream.id, { forceReload: true });
        } catch (error) {
          console.warn(`Failed to update messages for stream ${stream.id}:`, error);
        }
      }
    }, 5000); // Обновляем каждые 5 секунд

    return () => {
      console.log('🧹 Clearing recent streams update interval');
      clearInterval(updateInterval);
    };
  }, [streamsToShow, activeStreams.length]); // Добавляем activeStreams.length в зависимости

  const handleStreamClick = (stream) => {
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
      
      // Отправляем запрос на бэкенд для закрытия соединения
      if (streamToRemove?.connectionId) {
        try {
          console.log('🔌 Disconnecting from stream:', streamToRemove.connectionId);
          const response = await fetch('/api/v1/connect/disconnect', {
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
      
      // Также удаляем из активных, если он там есть
      const removeStream = useStreamsStore.getState().removeStream;
      await removeStream(streamId);
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
            <p className="recent-streams__subtitle">
              {t('streams.recentSubtitle')}
            </p>
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
                      </div>

                      {/* Stats */}
                      <div className="recent-stream-card__stats">
                        <div className="recent-stream-card__stat">
                          <span className="recent-stream-card__stat-icon">💬</span>
                          <span className="recent-stream-card__stat-value">{streamStats.unreadCount || 0}</span>
                        </div>
                        <div className="recent-stream-card__stat">
                          <span className="recent-stream-card__stat-icon">❓</span>
                          <span className="recent-stream-card__stat-value">{streamStats.unreadQuestionCount || 0}</span>
                        </div>
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

