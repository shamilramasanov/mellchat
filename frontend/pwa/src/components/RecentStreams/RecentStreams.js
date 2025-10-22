import React, { useState, useEffect } from 'react';
import './RecentStreams.css';

export const RecentStreams = ({ onSelectStream }) => {
  const [recentStreams, setRecentStreams] = useState([]);

  useEffect(() => {
    // Load recent streams from localStorage
    const saved = localStorage.getItem('mellchat-recent-streams');
    if (saved) {
      try {
        const streams = JSON.parse(saved);
        setRecentStreams(streams.slice(0, 10)); // Last 10 streams
      } catch (error) {
        console.error('Failed to load recent streams:', error);
      }
    }
  }, []);

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'twitch': return '🎮';
      case 'kick': return '⚡';
      default: return '🎥';
    }
  };

  const handleStreamClick = (stream) => {
    onSelectStream(stream.url);
  };

  const handleRemove = (e, streamUrl) => {
    e.stopPropagation();
    const updated = recentStreams.filter(s => s.url !== streamUrl);
    setRecentStreams(updated);
    localStorage.setItem('mellchat-recent-streams', JSON.stringify(updated));
  };

  return (
    <div className="recent-streams">
      <div className="recent-streams__header">
        <h2 className="recent-streams__title">📌 Recent Streams</h2>
        <p className="recent-streams__subtitle">
          Click on a stream to reconnect, or add a new one using the + button
        </p>
      </div>

      {recentStreams.length === 0 ? (
        <div className="recent-streams__empty glass">
          <div className="recent-streams__empty-icon">📺</div>
          <h3>No recent streams</h3>
          <p>Add your first stream using the + button above</p>
        </div>
      ) : (
        <div className="recent-streams__grid">
          {recentStreams.map((stream, index) => (
            <div 
              key={`${stream.url}-${index}`} 
              className="recent-stream-card glass"
              onClick={() => handleStreamClick(stream)}
            >
              <button
                className="recent-stream-card__remove"
                onClick={(e) => handleRemove(e, stream.url)}
                title="Remove from history"
              >
                ✕
              </button>
              
              <div className="recent-stream-card__icon">
                {getPlatformIcon(stream.platform)}
              </div>
              
              <div className="recent-stream-card__info">
                <div className="recent-stream-card__title" title={stream.title}>
                  {stream.title || stream.channel || 'Unknown Stream'}
                </div>
                <div className="recent-stream-card__meta">
                  <span className="recent-stream-card__platform">
                    {stream.platform}
                  </span>
                  {stream.lastViewed && (
                    <span className="recent-stream-card__time">
                      {new Date(stream.lastViewed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

