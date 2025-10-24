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
        let filtered = messages;
        
        // Filter by stream
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
            filtered = filtered.filter(m => isQuestion(m.text));
            // Don't filter by stream for ALL_QUESTIONS
            streamId = null;
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
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(m =>
            m.username.toLowerCase().includes(query) ||
            m.text.toLowerCase().includes(query)
          );
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
      
      // Stream statistics
      getStreamStats: (streamId) => {
        const { messages } = get();
        const streamMessages = messages.filter(m => m.streamId === streamId);
        const questionCount = streamMessages.filter(m => isQuestion(m.text)).length;
        
        return {
          messageCount: streamMessages.length,
          questionCount,
        };
      },
      
      getAllStreamsStats: () => {
        const { messages } = get();
        const stats = {};
        
        messages.forEach(msg => {
          if (!msg.streamId) return;
          
          if (!stats[msg.streamId]) {
            stats[msg.streamId] = {
              messageCount: 0,
              questionCount: 0,
            };
          }
          
          stats[msg.streamId].messageCount++;
          if (isQuestion(msg.text)) {
            stats[msg.streamId].questionCount++;
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
      }),
    }
  )
);

