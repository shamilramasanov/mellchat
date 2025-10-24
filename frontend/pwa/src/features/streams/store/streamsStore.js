import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LIMITS } from '@shared/utils/constants';
import { detectPlatform, extractStreamId } from '@shared/utils/helpers';

export const useStreamsStore = create(
  persist(
    (set, get) => ({
      // State
      activeStreams: [], // Currently connected streams
      activeStreamId: null, // Currently viewing stream
      recentStreams: [], // History of streams
      
      // Actions
      addStream: (stream) => {
        const { activeStreams } = get();
        
        // Check if stream already exists
        const exists = activeStreams.find(s => s.id === stream.id);
        if (exists) {
          // Just set it as active
          set({ activeStreamId: stream.id });
          return;
        }
        
        // Add to active streams
        const newActiveStreams = [...activeStreams, stream];
        set({ 
          activeStreams: newActiveStreams,
          activeStreamId: stream.id,
        });
        
        // Add to recent streams
        get().addToRecent(stream);
      },
      
      removeStream: (streamId) => {
        const { activeStreams, activeStreamId } = get();
        const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
        
        // If removing active stream, set first stream as active
        const newActiveStreamId = 
          activeStreamId === streamId 
            ? (newActiveStreams[0]?.id || null)
            : activeStreamId;
        
        set({ 
          activeStreams: newActiveStreams,
          activeStreamId: newActiveStreamId,
        });
      },
      
      setActiveStream: (streamId) => {
        set({ activeStreamId: streamId });
      },
      
      // Navigate to home (show all streams)
      goToHome: () => {
        set({ activeStreamId: null });
      },
      
      clearActiveStreams: () => {
        set({ activeStreams: [], activeStreamId: null });
      },
      
      updateStream: (streamId, updates) => {
        const { activeStreams } = get();
        const updated = activeStreams.map(stream =>
          stream.id === streamId
            ? { ...stream, ...updates }
            : stream
        );
        set({ activeStreams: updated });
      },
      
      // Recent streams
      addToRecent: (stream) => {
        const { recentStreams } = get();
        
        // Remove if already exists
        const filtered = recentStreams.filter(s => s.id !== stream.id);
        
        // Add to beginning
        const newRecent = [
          {
            ...stream,
            lastViewed: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, LIMITS.MAX_RECENT_STREAMS);
        
        set({ recentStreams: newRecent });
      },
      
      removeFromRecent: (streamId) => {
        const { recentStreams } = get();
        const filtered = recentStreams.filter(s => s.id !== streamId);
        set({ recentStreams: filtered });
      },
      
      clearRecent: () => {
        set({ recentStreams: [] });
      },
      
      // Getters
      getActiveStream: () => {
        const { activeStreams, activeStreamId } = get();
        return activeStreams.find(s => s.id === activeStreamId) || null;
      },
      
      getStreamById: (streamId) => {
        const { activeStreams } = get();
        return activeStreams.find(s => s.id === streamId);
      },
      
      hasActiveStreams: () => {
        return get().activeStreams.length > 0;
      },
      
      // Helpers
      createStreamFromURL: (url) => {
        const platform = detectPlatform(url);
        const streamId = extractStreamId(url);
        
        if (!platform || !streamId) {
          return null;
        }
        
        return {
          id: `${platform}-${streamId}`,
          platform,
          streamId,
          url,
          title: streamId, // Will be updated from API
          viewers: 0,
          isLive: true,
          thumbnail: null,
          connectedAt: new Date().toISOString(),
        };
      },
    }),
    {
      name: 'streams-storage',
      partialize: (state) => ({
        activeStreams: state.activeStreams,
        activeStreamId: state.activeStreamId,
        recentStreams: state.recentStreams,
      }),
    }
  )
);

