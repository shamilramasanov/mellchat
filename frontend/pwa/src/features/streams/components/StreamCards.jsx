import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { PLATFORM_COLORS, PLATFORM_LOGOS } from '@shared/utils/constants';
// import { GlassCard } from '@shared/components'; // Удален - используем обычные div с glass эффектами
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
        const streamStats = stats[stream.id] || { messageCount: 0, questionCount: 0, unreadCount: 0, unreadQuestionCount: 0 };
        
        return (
          <div
            key={stream.id}
            className={`stream-card ${activeStreamId === stream.id ? 'stream-card--active' : ''}`}
            onClick={() => setActiveStream(stream.id)}
          >
            <button
              className="stream-card__close"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🔴 Closing stream:', stream.id);
                try {
                  removeStream(stream.id);
                  console.log('✅ Stream removed successfully');
                } catch (error) {
                  console.error('❌ Error removing stream:', error);
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              aria-label="Switch away from stream"
              style={{ zIndex: 1000 }}
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
                <span className="stream-card__stat-value">{streamStats.unreadCount || 0}</span>
              </div>
              <div className="stream-card__stat">
                <span className="stream-card__stat-icon">❓</span>
                <span className="stream-card__stat-value">{streamStats.unreadQuestionCount || 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StreamCards;

