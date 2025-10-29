import './StreamsView.css';

const StreamsView = ({ streams, onStreamSelect }) => {
  return (
    <div className="streams-view">
      <div className="streams-view__header">
        <h1 className="streams-view__title">Активные стримы</h1>
      </div>
      
      <div className="streams-view__list">
        {streams.length === 0 ? (
          <div className="streams-view__empty">
            <p>Нет активных стримов</p>
          </div>
        ) : (
          streams.map(stream => (
            <div
              key={stream.id}
              className="stream-card"
              onClick={() => onStreamSelect(stream.id)}
            >
              <div className="stream-card__header">
                <div className="stream-card__platform">{stream.platform}</div>
                <div className={`stream-card__status ${stream.isLive ? 'stream-card__status--live' : ''}`}>
                  {stream.isLive ? '● LIVE' : 'OFFLINE'}
                </div>
              </div>
              
              <div className="stream-card__content">
                <div className="stream-card__author">{stream.author}</div>
                <div className="stream-card__title">{stream.title}</div>
                
                <div className="stream-card__meta">
                  <span className="stream-card__viewers">👁 {stream.viewers}</span>
                  {stream.unreadCount > 0 && (
                    <span className="md-chip stream-card__badge">
                      {stream.unreadCount} новых
                    </span>
                  )}
                  {stream.unreadQuestions > 0 && (
                    <span className="md-chip stream-card__badge stream-card__badge--question">
                      ❓ {stream.unreadQuestions}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StreamsView;

