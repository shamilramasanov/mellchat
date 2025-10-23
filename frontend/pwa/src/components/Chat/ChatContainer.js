import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '../UI';
import './ChatContainer.css';

export const ChatContainer = ({ 
  messages = [], 
  allMessages = [], // All messages from all streams for counting
  filter = 'all',
  onFilterChange,
  onAddStream,
  onReaction,
  onBookmark
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const chatRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sortBy, setSortBy] = useState('time'); // 'time', 'popular', 'active'
  
  // Count all questions from all streams
  const allQuestionsCount = allMessages.filter(msg => msg.text?.includes('?')).length;
  const currentQuestionsCount = messages.filter(msg => msg.text?.includes('?')).length;

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesNick = msg.username?.toLowerCase().includes(query);
      const matchesText = msg.text?.toLowerCase().includes(query);
      if (!matchesNick && !matchesText) return false;
    }

    // Type filter
    if (filter === 'questions') {
      return msg.text?.includes('?');
    } else if (filter === 'bookmarks') {
      return msg.isBookmarked === true;
    } else if (filter === 'spam') {
      // Simple spam detection
      const spamKeywords = ['http://', 'https://', 'www.', '.com', '.ru', 'buy', 'cheap'];
      return spamKeywords.some(keyword => msg.text?.toLowerCase().includes(keyword));
    }

    return true;
  });

  // Sort messages (only for questions filter)
  const sortedMessages = filter === 'questions' ? [...filteredMessages].sort((a, b) => {
    if (sortBy === 'popular') {
      // Sort by likes (descending)
      const likesA = a.reactions?.like || 0;
      const likesB = b.reactions?.like || 0;
      return likesB - likesA;
    } else if (sortBy === 'active') {
      // Sort by total reactions (descending)
      const totalA = (a.reactions?.like || 0) + (a.reactions?.dislike || 0);
      const totalB = (b.reactions?.like || 0) + (b.reactions?.dislike || 0);
      return totalB - totalA;
    } else {
      // Sort by time (newest first) - default
      return b.timestamp - a.timestamp;
    }
  }) : filteredMessages;

  // Check if scrolled to bottom
  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setShowNewMessages(false);
      setNewMessageCount(0);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAtBottom && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    } else {
      setNewMessageCount(prev => prev + 1);
      setShowNewMessages(true);
    }
  }, [messages, isAtBottom]);

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    setShowNewMessages(false);
    setNewMessageCount(0);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="chat-highlight">{part}</mark> : part
    );
  };

  return (
    <div className="chat-container" style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Sort panel - only for Questions filter */}
      {filter === 'questions' && (
        <div className="chat-sort-panel" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'rgba(114, 9, 183, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
          flexShrink: 0
        }}>
          <span style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-secondary)',
            fontWeight: 600
          }}>
            ❓ {t('filter.questions')} ({sortedMessages.length})
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`chat-sort-btn ${sortBy === 'time' ? 'chat-sort-btn--active' : ''}`}
              onClick={() => setSortBy('time')}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                background: sortBy === 'time' ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (sortBy === 'time' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)'),
                borderRadius: '8px',
                color: sortBy === 'time' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: sortBy === 'time' ? 600 : 400
              }}
            >
              🕒 {t('sort.time')}
            </button>
            <button
              className={`chat-sort-btn ${sortBy === 'popular' ? 'chat-sort-btn--active' : ''}`}
              onClick={() => setSortBy('popular')}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                background: sortBy === 'popular' ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (sortBy === 'popular' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)'),
                borderRadius: '8px',
                color: sortBy === 'popular' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: sortBy === 'popular' ? 600 : 400
              }}
            >
              🔥 {t('sort.popular')}
            </button>
            <button
              className={`chat-sort-btn ${sortBy === 'active' ? 'chat-sort-btn--active' : ''}`}
              onClick={() => setSortBy('active')}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                background: sortBy === 'active' ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (sortBy === 'active' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)'),
                borderRadius: '8px',
                color: sortBy === 'active' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: sortBy === 'active' ? 600 : 400
              }}
            >
              💬 {t('sort.active')}
            </button>
          </div>
        </div>
      )}

      {/* Messages Container - Scrollable */}
      <div className="chat-messages-container scrollable">
        <div 
          className="chat-messages" 
          ref={chatRef}
          onScroll={handleScroll}
        >
        {sortedMessages.length === 0 ? (
          <div className="chat-empty">
            <p>{t('chat.noMessages')}</p>
          </div>
        ) : (
          sortedMessages.map((msg) => (
            <div key={msg.id} className="chat-message glass">
              <div className="chat-message__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="chat-message__username">
                    {msg.username}
                  </span>
                  {/* Show stream badge for all-questions filter */}
                  {filter === 'all-questions' && msg.streamName && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(76, 201, 240, 0.15)',
                      border: '1px solid rgba(76, 201, 240, 0.3)',
                      borderRadius: '6px',
                      color: 'var(--accent-blue)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <img 
                        src={msg.streamPlatform === 'youtube' ? '/youtube-logo.svg' :
                             msg.streamPlatform === 'twitch' ? '/twitch-horizontal.svg' :
                             msg.streamPlatform === 'kick' ? '/kick-logo.svg' : '📡'}
                        alt={msg.streamPlatform}
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          objectFit: 'contain' 
                        }}
                      />
                      {msg.streamName}
                    </span>
                  )}
                </div>
                <span className="chat-message__time">
                  {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="chat-message__text">
                {highlightText(msg.text, searchQuery)}
              </div>
              <div className="chat-message__actions">
                <button 
                  className={`chat-message__action ${msg.userReaction === 'like' ? 'active' : ''}`}
                  onClick={() => onReaction(msg.id, 'like')}
                >
                  👍 {msg.reactions?.like || 0}
                </button>
                <button 
                  className={`chat-message__action ${msg.userReaction === 'dislike' ? 'active' : ''}`}
                  onClick={() => onReaction(msg.id, 'dislike')}
                >
                  👎 {msg.reactions?.dislike || 0}
                </button>
                <button 
                  className={`chat-message__action ${msg.bookmarked ? 'active' : ''}`}
                  onClick={() => onBookmark(msg.id)}
                  title={t('chat.bookmark')}
                >
                  🔖
                </button>
              </div>
            </div>
          ))
        )}

        {/* New Messages Notification */}
        {showNewMessages && (
          <button className="chat-new-messages" onClick={scrollToBottom}>
            📩 {t('chat.newMessages')} ({newMessageCount})
          </button>
        )}
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="chat-controls">
        {/* Filters */}
        <div className="chat-filters">
        <button
          className={`chat-filter ${filter === 'all' ? 'chat-filter--active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          {t('filter.all')} ({messages.length})
        </button>
        <button
          className={`chat-filter ${filter === 'questions' ? 'chat-filter--active' : ''}`}
          onClick={() => onFilterChange('questions')}
        >
          ❓ {t('filter.questions')} ({currentQuestionsCount})
        </button>
        <button
          className={`chat-filter ${filter === 'all-questions' ? 'chat-filter--active' : ''}`}
          onClick={() => onFilterChange('all-questions')}
          title={t('filter.allQuestions')}
        >
          🌐 {t('filter.allQuestions')} ({allQuestionsCount})
        </button>
        <button
          className={`chat-filter ${filter === 'bookmarks' ? 'chat-filter--active' : ''}`}
          onClick={() => onFilterChange('bookmarks')}
        >
          🔖 {t('filter.bookmarks')}
        </button>
        <button
          className={`chat-filter ${filter === 'spam' ? 'chat-filter--active' : ''}`}
          onClick={() => onFilterChange('spam')}
        >
          🚫 {t('filter.spam')}
        </button>
        </div>

        {/* Search */}
        <div className="chat-search">
          <Input
            icon="🔍"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
};

