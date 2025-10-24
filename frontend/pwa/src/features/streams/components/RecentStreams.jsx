import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { GlassCard, Button } from '@shared/components';
import { PLATFORM_LOGOS } from '@shared/utils/constants';
import AddStreamModal from './AddStreamModal';
import './RecentStreams.css';

const RecentStreams = () => {
  const { t } = useTranslation();
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const recentStreams = useStreamsStore((state) => state.recentStreams);
  const setActiveStream = useStreamsStore((state) => state.setActiveStream);
  const addStream = useStreamsStore((state) => state.addStream);
  const removeStream = useStreamsStore((state) => state.removeStream);
  const removeFromRecent = useStreamsStore((state) => state.removeFromRecent);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // Recalculate stats whenever messages change
  const stats = getAllStreamsStats();
  
  // Show active streams if any, otherwise show recent streams
  const streamsToShow = activeStreams.length > 0 ? activeStreams : recentStreams;
  const isShowingActive = activeStreams.length > 0;

  const handleStreamClick = (stream) => {
    if (isShowingActive) {
      // If it's an active stream, just switch to it
      setActiveStream(stream.id);
    } else {
      // If it's from recent, add it to active
      addStream(stream);
    }
  };

  const handleRemove = (e, streamId) => {
    e.stopPropagation();
    if (confirm(t('streams.removeConfirm'))) {
      if (isShowingActive) {
        removeStream(streamId);
      } else {
        removeFromRecent(streamId);
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
              {isShowingActive ? t('streams.active') : t('streams.recent')}
            </h2>
            <p className="recent-streams__subtitle">
              {isShowingActive ? '' : t('streams.recentSubtitle')}
            </p>
          </div>

          {streamsToShow.length === 0 ? (
            <div className="recent-streams__empty">
              <span className="recent-streams__empty-icon">📺</span>
              <h3>{t('streams.noRecent')}</h3>
              <p>{t('streams.noRecentSubtitle')}</p>
            </div>
          ) : (
            <div className="recent-streams__list">
              {streamsToShow.map((stream, index) => {
                const streamStats = stats[stream.id] || { messageCount: 0, questionCount: 0 };
                
                return (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard
                      interactive
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
                          <span className="recent-stream-card__stat-value">{streamStats.messageCount}</span>
                        </div>
                        <div className="recent-stream-card__stat">
                          <span className="recent-stream-card__stat-icon">❓</span>
                          <span className="recent-stream-card__stat-value">{streamStats.questionCount}</span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            fullWidth
            leftIcon="➕"
            onClick={() => setShowAddStream(true)}
          >
            {t('streams.add')}
          </Button>
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

