import './StreamList.css';

const StreamList = ({ streams, activeStreamId, onStreamSelect }) => {
  return (
    <aside className="stream-list">
      <div className="stream-list__header">
        <h2 className="stream-list__title">Активные стримы</h2>
        <button className="md-button md-button--contained" style={{ fontSize: '14px', padding: '6px 12px' }}>
          + Добавить
        </button>
      </div>
      <div className="stream-list__content">
        {streams.length === 0 ? (
          <div className="stream-list__empty">
            <p>Нет активных стримов</p>
            <button className="md-button md-button--contained" style={{ marginTop: '8px' }}>
              Добавить стрим
            </button>
          </div>
        ) : (
          streams.map(stream => (
            <div
              key={stream.id}
              className={`stream-card ${activeStreamId === stream.id ? 'stream-card--active' : ''}`}
              onClick={() => onStreamSelect(stream.id)}
            >
              <div className="stream-card__header">
                <div className="stream-card__platform">{stream.platform}</div>
                <div className="stream-card__status" data-live={stream.isLive}>
                  {stream.isLive ? '● LIVE' : 'OFFLINE'}
                </div>
              </div>
              <div className="stream-card__author">
                {stream.streamUrl ? (
                  <a 
                    href={stream.streamUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="stream-card__author-link"
                  >
                    {stream.author}
                  </a>
                ) : (
                  stream.author
                )}
              </div>
              <div className="stream-card__title">{stream.title}</div>
              <div className="stream-card__meta">
                <span className="stream-card__viewers">👁 {stream.viewers}</span>
                {stream.unreadCount > 0 && (
                  <button
                    className="stream-card__badge stream-card__badge--clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Scroll to unread messages
                    }}
                  >
                    {stream.unreadCount}
                  </button>
                )}
                {stream.unreadQuestions > 0 && (
                  <button
                    className="stream-card__badge stream-card__badge--question stream-card__badge--clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Scroll to questions
                    }}
                  >
                    ❓ {stream.unreadQuestions}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default StreamList;

