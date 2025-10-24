import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import MessageCard from './MessageCard';
import Filters from './Filters';
import './ChatContainer.css';

const ChatContainer = ({ onAddStream }) => {
  const { t } = useTranslation();
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getFilteredMessages = useChatStore((state) => state.getFilteredMessages);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollPositions = useRef({}); // Store scroll positions for each stream
  const lastMessageCounts = useRef({}); // Store last seen message count for each stream
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showNewMessagesBtn, setShowNewMessagesBtn] = useState(false);

  // Get messages filtered by active stream (recalculates when messages change)
  const filteredMessages = getFilteredMessages(activeStreamId);
  const hasMessages = filteredMessages.length > 0;
  const hasStreams = activeStreams.length > 0;

  // Check if user is at the bottom
  const isAtBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
  }, []);

  // Save scroll position for current stream
  const saveScrollPosition = useCallback(() => {
    if (messagesContainerRef.current && activeStreamId) {
      scrollPositions.current[activeStreamId] = messagesContainerRef.current.scrollTop;
    }
  }, [activeStreamId]);

  // Restore scroll position for current stream
  const restoreScrollPosition = useCallback(() => {
    if (messagesContainerRef.current && activeStreamId) {
      const savedPosition = scrollPositions.current[activeStreamId];
      if (savedPosition !== undefined) {
        messagesContainerRef.current.scrollTop = savedPosition;
      } else {
        // First time viewing this stream - scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }
    }
  }, [activeStreamId]);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    saveScrollPosition();
    
    if (isAtBottom()) {
      setShowNewMessagesBtn(false);
      setNewMessageCount(0);
      // Update last seen message count
      if (activeStreamId) {
        lastMessageCounts.current[activeStreamId] = filteredMessages.length;
      }
    } else {
      // Calculate new messages
      const lastCount = lastMessageCounts.current[activeStreamId] || 0;
      const newCount = Math.max(0, filteredMessages.length - lastCount);
      if (newCount > 0) {
        setNewMessageCount(newCount);
        setShowNewMessagesBtn(true);
      }
    }
  }, [isAtBottom, saveScrollPosition, activeStreamId, filteredMessages.length]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowNewMessagesBtn(false);
      setNewMessageCount(0);
      if (activeStreamId) {
        lastMessageCounts.current[activeStreamId] = filteredMessages.length;
      }
    }
  }, [activeStreamId, filteredMessages.length]);

  // Handle new messages
  useEffect(() => {
    if (!activeStreamId) return;

    // Initialize last message count if not exists
    if (lastMessageCounts.current[activeStreamId] === undefined) {
      lastMessageCounts.current[activeStreamId] = filteredMessages.length;
    }

    // If user is at bottom, auto-scroll and update count
    if (isAtBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      lastMessageCounts.current[activeStreamId] = filteredMessages.length;
      setShowNewMessagesBtn(false);
      setNewMessageCount(0);
    } else {
      // Show new messages button
      const lastCount = lastMessageCounts.current[activeStreamId] || 0;
      const newCount = Math.max(0, filteredMessages.length - lastCount);
      if (newCount > 0) {
        setNewMessageCount(newCount);
        setShowNewMessagesBtn(true);
      }
    }
  }, [filteredMessages.length, activeStreamId, isAtBottom]);

  // Restore scroll position when switching streams
  useEffect(() => {
    if (activeStreamId) {
      // Wait for DOM to update
      setTimeout(() => {
        restoreScrollPosition();
        // Initialize message count for this stream
        if (lastMessageCounts.current[activeStreamId] === undefined) {
          lastMessageCounts.current[activeStreamId] = filteredMessages.length;
        }
        setShowNewMessagesBtn(false);
        setNewMessageCount(0);
      }, 0);
    }
  }, [activeStreamId, restoreScrollPosition]);

  return (
    <div className="chat-container">
      {/* Messages */}
      <div 
        className="chat-container__messages scrollable"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        data-scrollable
      >
        {hasMessages ? (
          <>
            {filteredMessages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="chat-container__empty">
            <span className="chat-container__empty-icon">💬</span>
            <p>
              {hasStreams
                ? t('chat.noMessages')
                : t('chat.connectStream')}
            </p>
          </div>
        )}
      </div>

      {/* New Messages Button */}
      {showNewMessagesBtn && (
        <button
          className="chat-container__new-messages"
          onClick={scrollToBottom}
          aria-label={`${newMessageCount} ${t('chat.newMessages')}`}
        >
          <span style={{ position: 'relative', zIndex: 10 }}>
            ↓ {newMessageCount} {newMessageCount === 1 ? t('chat.newMessage') : t('chat.newMessages')}
          </span>
        </button>
      )}

      {/* Filters */}
      <Filters />

      {/* FAB - Add Stream */}
      <button
        id="fab-btn"
        className="chat-container__fab"
        onClick={onAddStream}
        aria-label={t('streams.add')}
        title={t('streams.add')}
      >
        <span style={{ position: 'relative', zIndex: 10 }}>➕</span>
      </button>
    </div>
  );
};

export default ChatContainer;
