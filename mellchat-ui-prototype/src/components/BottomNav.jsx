import './BottomNav.css';

const BottomNav = ({ activeTab, onTabChange, streams, activeStreamId }) => {
  const unreadTotal = streams.reduce((sum, s) => sum + s.unreadCount, 0);

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav__item ${activeTab === 'streams' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onTabChange('streams')}
        aria-label="Стримы"
      >
        <div className="bottom-nav__icon">📺</div>
        <span className="bottom-nav__label">Стримы</span>
        {unreadTotal > 0 && (
          <span className="bottom-nav__badge">{unreadTotal}</span>
        )}
      </button>

      <button
        className={`bottom-nav__item ${activeTab === 'chat' ? 'bottom-nav__item--active' : ''}`}
        onClick={() => onTabChange('chat')}
        disabled={!activeStreamId}
        aria-label="Чат"
      >
        <div className="bottom-nav__icon">💬</div>
        <span className="bottom-nav__label">Чат</span>
      </button>

      <button
        className="bottom-nav__item bottom-nav__item--fab"
        onClick={() => {/* Add stream */}}
        aria-label="Добавить стрим"
      >
        <div className="bottom-nav__icon">+</div>
      </button>
    </nav>
  );
};

export default BottomNav;

