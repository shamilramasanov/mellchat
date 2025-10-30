import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { PLATFORM_COLORS } from '@shared/utils/constants';
import { HapticFeedback } from '@shared/utils/hapticFeedback';
// import { GlassCard } from '@shared/components'; // Удален - используем обычные div с glass эффектами
import './StreamCards.css';

const StreamCards = () => {
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const collapsedStreamIds = useStreamsStore((state) => state.collapsedStreamIds);
  const setActiveStream = useStreamsStore((state) => state.setActiveStream);
  const toggleStreamCard = useStreamsStore((state) => state.toggleStreamCard);
  const scrollToUnreadMessage = useStreamsStore((state) => state.scrollToUnreadMessage);
  const scrollToUnreadQuestion = useStreamsStore((state) => state.scrollToUnreadQuestion);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getAllStreamsStats = useChatStore((state) => state.getAllStreamsStats);
  
  // Recalculate stats whenever messages change
  const stats = getAllStreamsStats();
  
  // Filter out collapsed streams
  const visibleStreams = activeStreams.filter(s => !collapsedStreamIds.includes(s.id));

  const handleScrollToUnread = (e, streamId, isQuestion = false) => {
    e.stopPropagation(); // Предотвращаем переключение стрима
    HapticFeedback.light();
    
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
      }, 300);
    } else {
      // Если стрим уже активен, сразу скроллим
      if (isQuestion) {
        scrollToUnreadQuestion?.(streamId);
      } else {
        scrollToUnreadMessage?.(streamId);
      }
    }
  };

  const handleStreamClick = (streamId) => {
    HapticFeedback.selection();
    setActiveStream(streamId);
  };

  if (visibleStreams.length === 0) {
    return null;
  }

  return (
    <div className="stream-cards">
      {visibleStreams.map((stream) => {
        const streamStats = stats[stream.id] || { messageCount: 0, questionCount: 0, unreadCount: 0, unreadQuestionCount: 0 };
        
        return (
          <div
            key={stream.id}
            className={`stream-card ${activeStreamId === stream.id ? 'stream-card--active' : ''}`}
          onClick={() => handleStreamClick(stream.id)}
          >
            {/* Collapse button */}
            <button
              className="stream-card__collapse"
              onClick={(e) => {
                e.stopPropagation();
                HapticFeedback.light();
                toggleStreamCard(stream.id);
              }}
              title="Collapse"
              aria-label="Collapse stream"
            >
              −
            </button>
            
            {/* Platform Logo */}
            <div className="stream-card__header">
        {/* Убираем иконки платформ */}
              {stream.isLive && <span className="stream-card__live">🔴 LIVE</span>}
            </div>
            
            {/* Stream Info */}
            <div className="stream-card__info">
              <div className="stream-card__author">
                {stream.streamUrl ? (
                  <a 
                    href={stream.streamUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="stream-card__author-link"
                  >
                    {stream.author || stream.streamId}
                  </a>
                ) : (
                  stream.author || stream.streamId
                )}
              </div>
              <div className="stream-card__title">{stream.title || 'Stream'}</div>
            </div>
            
            {/* Stats */}
            <div className="stream-card__stats">
              <button
                className={`stream-card__stat ${streamStats.unreadCount > 0 ? 'stream-card__stat--clickable' : ''}`}
                onClick={(e) => streamStats.unreadCount > 0 && handleScrollToUnread(e, stream.id, false)}
                disabled={streamStats.unreadCount === 0}
                title={streamStats.unreadCount > 0 ? 'Перейти к непрочитанным сообщениям' : ''}
              >
                <span className="stream-card__stat-icon">💬</span>
                <span className="stream-card__stat-value">{streamStats.unreadCount || 0}</span>
              </button>
              <button
                className={`stream-card__stat ${streamStats.unreadQuestionCount > 0 ? 'stream-card__stat--clickable' : ''}`}
                onClick={(e) => streamStats.unreadQuestionCount > 0 && handleScrollToUnread(e, stream.id, true)}
                disabled={streamStats.unreadQuestionCount === 0}
                title={streamStats.unreadQuestionCount > 0 ? 'Перейти к непрочитанным вопросам' : ''}
              >
                <span className="stream-card__stat-icon">❓</span>
                <span className="stream-card__stat-value">{streamStats.unreadQuestionCount || 0}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StreamCards;

