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
  const markMessagesAsRead = useChatStore((state) => state.markMessagesAsRead);
  const lastReadMessageIds = useChatStore((state) => state.lastReadMessageIds);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollPositions = useRef({}); // Store scroll positions for each stream
  const lastMessageCounts = useRef({}); // Store last seen message count for each stream
  const isManuallyScrolling = useRef(false); // Prevent auto-scroll when user manually interacts
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
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
    
    
    return isAtBottom;
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
    
    // Only update button state if not manually scrolling
    if (isManuallyScrolling.current) {
      return;
    }
    
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
    if (!messagesContainerRef.current) {
      return;
    }

    isManuallyScrolling.current = true;
    
    // Update UI state immediately
    setShowNewMessagesBtn(false);
    setNewMessageCount(0);
    
    if (activeStreamId) {
      lastMessageCounts.current[activeStreamId] = filteredMessages.length;
      // Mark messages as read when scrolling to bottom
      if (filteredMessages.length > 0) {
        const lastMessage = filteredMessages[filteredMessages.length - 1];
        markMessagesAsRead(activeStreamId, lastMessage.id);
      }
    }
    
    // Force scroll to bottom with multiple methods for reliability
    const container = messagesContainerRef.current;
    const scrollHeight = container.scrollHeight;
    
    // Method 1: Instant scroll to bottom (no animation)
    container.scrollTop = scrollHeight;
    
    // Method 2: Smooth scroll as backup
    setTimeout(() => {
      container.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
    
    // Method 3: Use scrollIntoView on messagesEndRef as final backup
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 100);
    
    // Method 4: Force scroll again after a delay to ensure it worked
    setTimeout(() => {
      container.scrollTop = scrollHeight;
    }, 300);
    
    // Reset flag after animation
    setTimeout(() => {
      isManuallyScrolling.current = false;
    }, 1000);
  }, [activeStreamId, filteredMessages.length, markMessagesAsRead]);

  // Handle new messages
  useEffect(() => {
    if (!activeStreamId) return;

    // Initialize last message count if not exists
    if (lastMessageCounts.current[activeStreamId] === undefined) {
      lastMessageCounts.current[activeStreamId] = filteredMessages.length;
      return; // Don't show button on first load
    }

    const atBottom = isAtBottom();
    const lastCount = lastMessageCounts.current[activeStreamId] || 0;
    const newCount = Math.max(0, filteredMessages.length - lastCount);


    // If user is at bottom, update count but don't auto-scroll if manually scrolling
    if (atBottom && !isManuallyScrolling.current) {
      lastMessageCounts.current[activeStreamId] = filteredMessages.length;
      setShowNewMessagesBtn(false);
      setNewMessageCount(0);
      
      // Mark messages as read when user is at bottom
      if (filteredMessages.length > 0) {
        const lastMessage = filteredMessages[filteredMessages.length - 1];
        markMessagesAsRead(activeStreamId, lastMessage.id);
      }
    } else {
      // Show new messages button when there are new messages
      if (newCount > 0) {
        setNewMessageCount(newCount);
        setShowNewMessagesBtn(true);
      } else {
        // Hide button if no new messages
        setShowNewMessagesBtn(false);
        setNewMessageCount(0);
      }
    }
  }, [filteredMessages.length, activeStreamId, isAtBottom, markMessagesAsRead]);

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
        
        // If no lastReadId for this stream, mark all current messages as read
        if (!lastReadMessageIds[activeStreamId] && filteredMessages.length > 0) {
          const lastMessage = filteredMessages[filteredMessages.length - 1];
          markMessagesAsRead(activeStreamId, lastMessage.id);
        }
        
        // Always hide button when switching streams
        setShowNewMessagesBtn(false);
        setNewMessageCount(0);
      }, 0);
    }
  }, [activeStreamId, restoreScrollPosition, filteredMessages.length, lastReadMessageIds, markMessagesAsRead]);

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

      {/* Add Stream Button */}
      <button
        className="chat-container__add-stream"
        onClick={onAddStream}
        aria-label="Добавить стрим"
      >
        ➕
      </button>
    </div>
  );
};

export default ChatContainer;
