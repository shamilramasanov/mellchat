import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { PLATFORM_COLORS, PLATFORM_LOGOS } from '@shared/utils/constants';
import { GlassCard } from '@shared/components';
import './StreamCards.css';

const StreamCards = () => {
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const setActiveStream = useStreamsStore((state) => state.setActiveStream);
  const removeStream = useStreamsStore((state) => state.removeStream);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  
  // Recalculate stats whenever messages change
  const stats = getAllStreamsStats();

  if (activeStreams.length === 0) {
    return null;
  }

  return (
    <div className="stream-cards">
      {activeStreams.map((stream) => {
        const streamStats = stats[stream.id] || { messageCount: 0, questionCount: 0 };
        
        return (
          <GlassCard
            key={stream.id}
            interactive
            className={`stream-card ${activeStreamId === stream.id ? 'stream-card--active' : ''}`}
            onClick={() => setActiveStream(stream.id)}
          >
            <button
              className="stream-card__close"
              onClick={(e) => {
                e.stopPropagation();
                removeStream(stream.id);
              }}
              aria-label="Remove stream"
            >
              ✕
            </button>
            
            {/* Platform Logo */}
            <div className="stream-card__header">
              <img 
                src={PLATFORM_LOGOS[stream.platform]} 
                alt={stream.platform}
                className="stream-card__logo"
              />
              {stream.isLive && <span className="stream-card__live">🔴 LIVE</span>}
            </div>
            
            {/* Stream Info */}
            <div className="stream-card__info">
              <div className="stream-card__author">{stream.author || stream.streamId}</div>
              <div className="stream-card__title">{stream.title || 'Stream'}</div>
            </div>
            
            {/* Stats */}
            <div className="stream-card__stats">
              <div className="stream-card__stat">
                <span className="stream-card__stat-icon">💬</span>
                <span className="stream-card__stat-value">{streamStats.messageCount}</span>
              </div>
              <div className="stream-card__stat">
                <span className="stream-card__stat-icon">❓</span>
                <span className="stream-card__stat-value">{streamStats.questionCount}</span>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};

export default StreamCards;

