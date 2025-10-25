import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FILTERS, SORT_OPTIONS, LIMITS } from '@shared/utils/constants';
import { isQuestion } from '@shared/utils/helpers';

export const useChatStore = create(
  persist(
    (set, get) => ({
      // State
      messages: [],
      activeFilter: FILTERS.ALL,
      sortBy: SORT_OPTIONS.TIME,
      searchQuery: '',
      bookmarks: [],
      lastReadMessageIds: {}, // Track last read message ID for each stream

      // Actions
      addMessage: (message) => {
        const { messages } = get();

        // Check if message already exists (prevent duplicates)
        const exists = messages.some(m => m.id === message.id);
        if (exists) {
          console.log('⚠️ Duplicate message detected, skipping:', message.id);
          return;
        }

        // Add to messages (limit to LIMITS.MAX_MESSAGES_CACHE)
        const newMessages = [...messages, message].slice(-LIMITS.MAX_MESSAGES_CACHE);

        set({ messages: newMessages });
      },
      
      addMessages: (newMessages) => {
        const { messages } = get();
        const combined = [...messages, ...newMessages].slice(-LIMITS.MAX_MESSAGES_CACHE);
        set({ messages: combined });
      },
      
      clearMessages: () => set({ messages: [] }),
      
      setFilter: (filter) => set({ activeFilter: filter }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      toggleBookmark: (messageId) => {
        const { bookmarks } = get();
        const newBookmarks = bookmarks.includes(messageId)
          ? bookmarks.filter(id => id !== messageId)
          : [...bookmarks, messageId];
        set({ bookmarks: newBookmarks });
      },
      
      likeMessage: (messageId) => {
        const { messages } = get();
        const updated = messages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              likes: (msg.likes || 0) + 1,
              userLiked: true,
              userDisliked: false,
            };
          }
          return msg;
        });
        set({ messages: updated });
      },
      
      dislikeMessage: (messageId) => {
        const { messages } = get();
        const updated = messages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              dislikes: (msg.dislikes || 0) + 1,
              userDisliked: true,
              userLiked: false,
            };
          }
          return msg;
        });
        set({ messages: updated });
      },
      
      // Computed
      getFilteredMessages: (streamId = null) => {
        const { messages, activeFilter, searchQuery, bookmarks, sortBy } = get();
        
        // Early return if no messages
        if (!messages.length) return [];
        
        let filtered = messages;
        
        // Filter by stream first (most selective filter)
        if (streamId) {
          filtered = filtered.filter(m => m.streamId === streamId);
        }
        
        // Apply main filter
        switch (activeFilter) {
          case FILTERS.QUESTIONS:
            filtered = filtered.filter(m => isQuestion(m.text));
            break;
          case FILTERS.BOOKMARKS:
            filtered = filtered.filter(m => bookmarks.includes(m.id));
            break;
          case FILTERS.ALL_QUESTIONS:
            // For ALL_QUESTIONS, we need to get ALL messages from ALL streams
            // So we don't filter by streamId at all
            filtered = messages.filter(m => isQuestion(m.text));
            break;
          case FILTERS.SPAM:
            filtered = filtered.filter(m => 
              (m.dislikes || 0) > (m.likes || 0)
            );
            break;
          case FILTERS.ALL:
          default:
            // No filter
            break;
        }
        
        // Apply search
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(m => {
            const username = (m.username || '').toLowerCase();
            const text = (m.text || '').toLowerCase();
            return username.includes(query) || text.includes(query);
          });
        }
        
        // Apply sorting
        switch (sortBy) {
          case SORT_OPTIONS.POPULAR:
            filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
          case SORT_OPTIONS.ACTIVE:
            filtered.sort((a, b) => 
              (b.likes + b.dislikes || 0) - (a.likes + a.dislikes || 0)
            );
            break;
          case SORT_OPTIONS.TIME:
          default:
            // Already sorted by time (newest last)
            break;
        }
        
        return filtered;
      },
      
      getMessageById: (messageId) => {
        const { messages } = get();
        return messages.find(m => m.id === messageId);
      },
      
      isBookmarked: (messageId) => {
        const { bookmarks } = get();
        return bookmarks.includes(messageId);
      },
      
      // Mark messages as read for a stream
      markMessagesAsRead: (streamId, lastMessageId) => {
        const { lastReadMessageIds } = get();
        set({
          lastReadMessageIds: {
            ...lastReadMessageIds,
            [streamId]: lastMessageId
          }
        });
      },

      // Stream statistics
      getStreamStats: (streamId) => {
        const { messages, lastReadMessageIds } = get();
        const streamMessages = messages.filter(m => m.streamId === streamId);
        const questionCount = streamMessages.filter(m => isQuestion(m.text)).length;
        
        // Calculate unread messages
        const lastReadId = lastReadMessageIds[streamId];
        let unreadCount = 0;
        let unreadQuestionCount = 0;
        
        if (lastReadId) {
          // Find the index of the last read message
          const lastReadIndex = streamMessages.findIndex(m => m.id === lastReadId);
          if (lastReadIndex !== -1) {
            // Count messages after the last read message
            const unreadMessages = streamMessages.slice(lastReadIndex + 1);
            unreadCount = unreadMessages.length;
            unreadQuestionCount = unreadMessages.filter(m => isQuestion(m.text)).length;
          } else {
            // If last read message not found, consider all messages as unread
            unreadCount = streamMessages.length;
            unreadQuestionCount = questionCount;
          }
        } else {
          // If no lastReadId (first time viewing), consider all as unread
          unreadCount = streamMessages.length;
          unreadQuestionCount = questionCount;
        }
        
        return {
          messageCount: streamMessages.length,
          questionCount,
          unreadCount,
          unreadQuestionCount,
        };
      },
      
      getAllStreamsStats: () => {
        const { messages, lastReadMessageIds } = get();
        const stats = {};
        
        messages.forEach(msg => {
          if (!msg.streamId) return;
          
          if (!stats[msg.streamId]) {
            stats[msg.streamId] = {
              messageCount: 0,
              questionCount: 0,
              unreadCount: 0,
              unreadQuestionCount: 0,
            };
          }
          
          stats[msg.streamId].messageCount++;
          if (isQuestion(msg.text)) {
            stats[msg.streamId].questionCount++;
          }
        });
        
        // Calculate unread messages for each stream
        Object.keys(stats).forEach(streamId => {
          const streamMessages = messages.filter(m => m.streamId === streamId);
          const lastReadId = lastReadMessageIds[streamId];
          
          if (lastReadId) {
            const lastReadIndex = streamMessages.findIndex(m => m.id === lastReadId);
            if (lastReadIndex !== -1) {
              const unreadMessages = streamMessages.slice(lastReadIndex + 1);
              stats[streamId].unreadCount = unreadMessages.length;
              stats[streamId].unreadQuestionCount = unreadMessages.filter(m => isQuestion(m.text)).length;
            } else {
              // If last read message not found, consider all messages as unread
              stats[streamId].unreadCount = stats[streamId].messageCount;
              stats[streamId].unreadQuestionCount = stats[streamId].questionCount;
            }
          } else {
            // If no lastReadId (first time viewing), consider all as unread
            stats[streamId].unreadCount = stats[streamId].messageCount;
            stats[streamId].unreadQuestionCount = stats[streamId].questionCount;
          }
        });
        
        return stats;
      },
      
      // Check if archive exists for stream
      hasArchive: (streamId) => {
        const { messages } = get();
        return messages.some(m => m.streamId === streamId);
      },
      
      // Clear messages for specific stream
      clearStreamMessages: (streamId) => {
        const { messages } = get();
        const filtered = messages.filter(m => m.streamId !== streamId);
        set({ messages: filtered });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        bookmarks: state.bookmarks,
        lastReadMessageIds: state.lastReadMessageIds,
      }),
    }
  )
);

