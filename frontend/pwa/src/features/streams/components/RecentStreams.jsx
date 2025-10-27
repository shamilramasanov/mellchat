import { useState } from 'react';
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
  const addStream = useStreamsStore((state) => state.addStream);
  const removeFromRecent = useStreamsStore((state) => state.removeFromRecent);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // Recalculate stats whenever messages change
  const stats = getAllStreamsStats();
  
  // Always show recent streams (no more active streams page)
  const streamsToShow = recentStreams;

  const handleStreamClick = (stream) => {
    // Always add stream to active (since we only show recent streams now)
    addStream(stream);
  };

  const handleRemove = async (e, streamId) => {
    e.stopPropagation();
    if (confirm(t('streams.removeConfirm'))) {
      // Always remove from recent (since we only show recent streams now)
      removeFromRecent(streamId);
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

