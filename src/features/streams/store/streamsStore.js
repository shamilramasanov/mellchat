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
      shouldAutoScroll: false, // Флаг для автоскролла при переходе со страницы последних стримов
      
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
          shouldAutoScroll: true, // Устанавливаем флаг автоскролла при добавлении стрима
        });
        
        // Add to recent streams
        get().addToRecent(stream);
      },
      
      // Remove stream with full disconnect (from active streams page)
      removeStream: async (streamId) => {
        const { activeStreams, activeStreamId } = get();
        const streamToRemove = activeStreams.find(s => s.id === streamId);
        
        if (!streamToRemove) return;
        
        // Call API to disconnect from platform
        if (streamToRemove.connectionId) {
          try {
            const response = await fetch('http://localhost:3001/api/v1/connect/disconnect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                connectionId: streamToRemove.connectionId
              })
            });
            
            if (response.ok) {

            } else {
              console.warn('⚠️ Failed to disconnect from platform:', streamToRemove.connectionId);
            }
          } catch (error) {
            console.error('❌ Error disconnecting from platform:', error);
          }
        }
        
        // Remove from active streams
        const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
        
        // If removing active stream, set first stream as active
        const newActiveStreamId = 
          activeStreamId === streamId 
            ? (newActiveStreams[0]?.id || null)
            : activeStreamId;
        
        // Also remove from recent streams
        const { recentStreams } = get();
        const newRecentStreams = recentStreams.filter(s => s.id !== streamId);
        
        set({ 
          activeStreams: newActiveStreams,
          activeStreamId: newActiveStreamId,
          recentStreams: newRecentStreams,
        });
      },

      // Switch stream without disconnect (from chat page)
      // Удалить стрим из активных
      removeStream: async (streamId) => {
        const { activeStreams, activeStreamId } = get();
        
        // Находим стрим для получения connectionId
        const streamToRemove = activeStreams.find(s => s.id === streamId);
        
        // Отправляем запрос на бэкенд для закрытия соединения
        if (streamToRemove?.connectionId) {
          try {

            const response = await fetch('/api/v1/connect/disconnect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                connectionId: streamToRemove.connectionId
              })
            });
            
            if (response.ok) {

            } else {
              console.warn('⚠️ Failed to disconnect from stream:', response.status);
            }
          } catch (error) {
            console.error('❌ Error disconnecting from stream:', error);
          }
        }
        
        // Удаляем стрим из списка активных
        const updatedStreams = activeStreams.filter(s => s.id !== streamId);
        
        // Если удаляемый стрим был активным, переключаемся на другой
        let newActiveStreamId = activeStreamId;
        if (activeStreamId === streamId) {
          newActiveStreamId = updatedStreams[0]?.id || null;
        }
        
        set({ 
          activeStreams: updatedStreams,
          activeStreamId: newActiveStreamId
        });

      },

      // Принудительно закрыть все соединения
      disconnectAllStreams: async () => {
        const { activeStreams } = get();

        // Отправляем запросы на закрытие всех соединений
        const disconnectPromises = activeStreams.map(async (stream) => {
          if (stream.connectionId) {
            try {
              const response = await fetch('/api/v1/connect/disconnect', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  connectionId: stream.connectionId
                })
              });
              
              if (response.ok) {

              } else {
                console.warn(`⚠️ Failed to disconnect from ${stream.id}:`, response.status);
              }
            } catch (error) {
              console.error(`❌ Error disconnecting from ${stream.id}:`, error);
            }
          }
        });
        
        await Promise.all(disconnectPromises);
        
        // Очищаем все активные стримы
        set({ 
          activeStreams: [],
          activeStreamId: null
        });

      },
      
      switchStream: (streamId) => {
        const { activeStreams, activeStreamId } = get();
        
        // If switching away from current stream, remove it and switch to another
        if (activeStreamId === streamId) {
          const otherStreams = activeStreams.filter(s => s.id !== streamId);
          const newActiveStreamId = otherStreams[0]?.id || null;
          set({ 
            activeStreams: otherStreams, // Удаляем стрим из активных
            activeStreamId: newActiveStreamId,
            shouldAutoScroll: true // Устанавливаем флаг автоскролла при переключении
          });
        } else {
          // Switch to the selected stream
          set({ 
            activeStreamId: streamId,
            shouldAutoScroll: true // Устанавливаем флаг автоскролла при переключении
          });
        }
      },
      
      setActiveStream: (streamId) => {
        set({ 
          activeStreamId: streamId,
          shouldAutoScroll: true // Устанавливаем флаг автоскролла при переключении стрима
        });
      },
      
      // Navigate to home (show all streams)
      goToHome: () => {
        set({ activeStreamId: null });
      },
      
      clearActiveStreams: () => {
        set({ activeStreams: [], activeStreamId: null });
      },
      
      // Сбросить флаг автоскролла
      clearAutoScrollFlag: () => {
        set({ shouldAutoScroll: false });
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

