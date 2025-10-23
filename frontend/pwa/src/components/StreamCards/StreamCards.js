import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../UI';
import './StreamCards.css';

export const StreamCards = ({ streams, activeStreamId, onStreamClick, onStreamClose }) => {
  const { t } = useTranslation();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  if (!streams || streams.length === 0) {
    return null;
  }

  // Swipe threshold (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = streams.findIndex(s => s.id === activeStreamId);
      
      if (isLeftSwipe && currentIndex < streams.length - 1) {
        // Swipe left -> next stream
        onStreamClick(streams[currentIndex + 1].id);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right -> previous stream
        onStreamClick(streams[currentIndex - 1].id);
      }
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube': return '/youtube-logo.svg';
      case 'twitch': return '/twitch-horizontal.svg';
      case 'kick': return '/kick-logo.svg';
      default: return '📡';
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'youtube': return '#FF0000';
      case 'twitch': return '#9146FF';
      case 'kick': return '#53FC18';
      default: return '#4CC9F0';
    }
  };

  return (
    <div className="stream-cards">
      <div className="stream-cards__container">
        {streams.map((stream) => (
          <GlassCard
            key={stream.id}
            hover
            className={`stream-card ${activeStreamId === stream.id ? 'stream-card--active' : ''}`}
            onClick={() => onStreamClick(stream.id)}
          >
            <button 
              className="stream-card__close"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent.stopImmediatePropagation();
                console.log('🔴 Closing stream:', stream.id);
                if (onStreamClose) {
                  onStreamClose(stream.id);
                } else {
                  console.error('onStreamClose function not provided');
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              aria-label="Close stream"
              title="Close stream"
            >
              ✕
            </button>
            
            <div className="stream-card__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src={getPlatformIcon(stream.platform)}
                  alt={stream.platform}
                  className="stream-card__icon"
                  style={{ 
                    width: '24px',
                    height: '24px',
                    objectFit: 'contain',
                    filter: `drop-shadow(0 0 8px ${getPlatformColor(stream.platform)})` 
                  }}
                />
                <span 
                  className="stream-card__platform"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: getPlatformColor(stream.platform),
                    letterSpacing: '0.05em'
                  }}
                >
                  {stream.platform}
                </span>
              </div>
              <span className={`stream-card__status ${stream.isLive ? 'stream-card__status--live' : ''}`}>
                {stream.isLive ? `🔴 ${t('stream.live')}` : `⚫️ ${t('stream.offline')}`}
              </span>
            </div>
            
            <h3 className="stream-card__title">{stream.title || stream.channel}</h3>
            
            <div className="stream-card__stats">
              <span className="stream-card__stat">
                💬 {stream.messageCount || 0} {t('stream.messages')}
              </span>
              {stream.viewers && (
                <span className="stream-card__stat">
                  👁️ {stream.viewers.toLocaleString()} {t('stream.viewers')}
                </span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

