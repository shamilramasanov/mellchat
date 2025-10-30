// Simple List - Real DOM для большинства кейсов (до 200 messages)
import React, { useCallback, useRef, useEffect } from 'react';
import MessageCard from '../../features/chat/components/MessageCard';
import performanceLogger from '../utils/performanceLogger';
import './VirtualizedMessageList.css';

const ENABLE_PERFORMANCE_LOGS = true;

const SimpleMessageList = ({ 
  messages = [], 
  onScroll, 
  scrollToBottom,
  isAtBottom,
  showNewMessagesButton,
  onNewMessagesClick,
  containerRef 
}) => {
  const parentRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  
  const actualContainerRef = containerRef || parentRef;

  // Ограничиваем до последних 200 messages
  const displayMessages = messages.slice(-200);

  // Обработчик скролла
  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    const scrollHeight = e.target.scrollHeight;
    const clientHeight = e.target.clientHeight;
    const isScrollingUp = scrollTop < lastScrollTopRef.current;
    
    lastScrollTopRef.current = scrollTop;
    
    if (onScroll) {
      onScroll({
        scrollTop,
        scrollHeight,
        clientHeight,
        isScrollingUp
      });
    }
  }, [onScroll]);

  // Логирование производительности
  useEffect(() => {
    if (ENABLE_PERFORMANCE_LOGS) {
      performanceLogger.logVirtualization({
        enabled: false,
        renderedItems: displayMessages.length,
        totalItems: messages.length,
        renderTime: 0,
        performance: 'real-dom'
      });
    }
  }, [displayMessages.length, messages.length]);

  return (
    <div 
      ref={actualContainerRef}
      className="virtualized-list-container"
      style={{
        height: '100%',
        minHeight: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'auto',
        touchAction: 'pan-y'
      }}
      onScroll={handleScroll}
    >
      {/* Показываем предупреждение если много messages */}
      {messages.length > 200 && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(255, 193, 7, 0.1)',
          color: 'rgba(255, 193, 7, 0.9)',
          fontSize: '12px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 193, 7, 0.2)'
        }}>
          Показаны последние 200 из {messages.length} сообщений
        </div>
      )}

      {displayMessages.map((message) => (
        <MessageCard 
          key={message.id} 
          message={message}
          style={{ contain: 'strict' }} // CSS optimization
        />
      ))}

      {/* Кнопка "New Messages" */}
      {showNewMessagesButton && !isAtBottom && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          padding: '10px',
          textAlign: 'center',
          background: 'var(--bg-primary)'
        }}>
          <button
            onClick={onNewMessagesClick}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Новые сообщения ↓
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleMessageList;

