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
      collapsedStreamIds: [], // Streams that are collapsed from cards view
      
      // Actions
      addStream: (stream) => {
        const { activeStreams } = get();
        
        // Check if stream already exists
        const exists = activeStreams.find(s => s.id === stream.id);
        if (exists) {
          // Just set it as active - НЕ перезаписываем стрим!
          set({ activeStreamId: stream.id });
          console.log('✅ Stream already in activeStreams, just setting as active');
        } else {
          // Проверяем лимит на 3 стрима
          if (activeStreams.length >= 3) {
            console.warn('⚠️ Maximum 3 streams allowed. Cannot add more streams.');
            // Можно показать уведомление пользователю
            return { success: false, error: 'Maximum 3 streams allowed' };
          }
          
          // Add to active streams
          const newActiveStreams = [...activeStreams, stream];
          set({ 
            activeStreams: newActiveStreams,
            activeStreamId: stream.id,
            shouldAutoScroll: true, // Устанавливаем флаг автоскролла при добавлении стрима
          });
          console.log(`✅ Stream added to activeStreams (${newActiveStreams.length}/3)`);
        }
        
        // Add to recent streams (всегда, даже если уже в activeStreams)
        get().addToRecent(stream);
        return { success: true };
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
              console.log('✅ Successfully disconnected from platform:', streamToRemove.connectionId);
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

      // Collapse/expand stream card
      toggleStreamCard: (streamId) => {
        const { collapsedStreamIds, activeStreamId } = get();
        
        if (collapsedStreamIds.includes(streamId)) {
          // Expand - разворачиваем карточку
          set({ 
            collapsedStreamIds: collapsedStreamIds.filter(id => id !== streamId) 
          });
        } else {
          // Collapse - сворачиваем карточку
          set({ 
            collapsedStreamIds: [...collapsedStreamIds, streamId] 
          });
          
          // Если скрыли активный стрим - открываем модалку RecentStreams
          if (activeStreamId === streamId) {
            set({ activeStreamId: null });
          }
        }
      },

      // Close stream card - просто открываем модалку RecentStreams
      closeStream: (streamId) => {
        const { activeStreamId } = get();
        
        // Сохраняем последнее прочитанное сообщение
        const chatStore = require('@features/chat/store/chatStore').useChatStore.getState();
        const streamMessages = chatStore.getStreamMessages(streamId);
        
        if (streamMessages.length > 0) {
          const lastMessage = streamMessages[streamMessages.length - 1];
          chatStore.markMessagesAsRead(streamId, lastMessage.id);
        }
        
        // Если закрываем активный стрим - открываем модалку
        if (activeStreamId === streamId) {
          set({ activeStreamId: null });
        }
      },

      // Switch stream without disconnect
      switchStream: (streamId) => {
        const { activeStreamId, activeStreams } = get();
        
        // Помечаем сообщения как прочитанные для предыдущего активного стрима
        if (activeStreamId && activeStreamId !== streamId) {
          const chatStore = require('@features/chat/store/chatStore').useChatStore.getState();
          const previousStreamMessages = chatStore.getStreamMessages(activeStreamId);
          
          if (previousStreamMessages.length > 0) {
            const lastMessage = previousStreamMessages[previousStreamMessages.length - 1];
            chatStore.markMessagesAsRead(activeStreamId, lastMessage.id);
          }
        }
        
        // Проверяем, есть ли стрим в activeStreams
        const streamExists = activeStreams.find(s => s.id === streamId);
        if (!streamExists) {
          // Если стрима нет в activeStreams, находим его в recentStreams и добавляем
          const { recentStreams } = get();
          const streamToAdd = recentStreams.find(s => s.id === streamId);
          
          if (streamToAdd) {
            // Проверяем лимит на 3 стрима
            if (activeStreams.length >= 3) {
              console.warn('⚠️ Maximum 3 streams allowed. Cannot switch to new stream.');
              return { success: false, error: 'Maximum 3 streams allowed' };
            }
            
            // Добавляем стрим в activeStreams
            const newActiveStreams = [...activeStreams, streamToAdd];
            set({ 
              activeStreams: newActiveStreams,
              activeStreamId: streamId,
              shouldAutoScroll: true
            });
            console.log(`✅ Stream switched and added to activeStreams (${newActiveStreams.length}/3)`);
          } else {
            console.warn('⚠️ Stream not found in recentStreams:', streamId);
            return { success: false, error: 'Stream not found' };
          }
        } else {
          // Стрим уже в activeStreams, просто делаем его активным
          set({ 
            activeStreamId: streamId,
            shouldAutoScroll: true
          });
          console.log('✅ Stream switched to existing active stream');
        }
        
        return { success: true };
      },
      
      // Удалить стрим из активных
      removeStream: async (streamId) => {
        const { activeStreams, activeStreamId } = get();
        
        // Находим стрим для получения connectionId
        const streamToRemove = activeStreams.find(s => s.id === streamId);
        
        // Отправляем запрос на бэкенд для закрытия соединения
        if (streamToRemove?.connectionId) {
          try {
            console.log('🔌 Disconnecting from stream:', streamToRemove.connectionId);
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
              console.log('✅ Successfully disconnected from stream');
            } else {
              console.warn('⚠️ Failed to disconnect from stream:', response.status);
            }
          } catch (error) {
            console.error('❌ Error disconnecting from stream:', error);
          }
        }
        
        // Удаляем из activeStreams СРАЗУ, чтобы сообщения перестали обрабатываться
        const updatedStreams = activeStreams.filter(s => s.id !== streamId);
        
        // Если удаляемый стрим был активным, переключаемся на другой
        let newActiveStreamId = activeStreamId;
        if (activeStreamId === streamId) {
          newActiveStreamId = updatedStreams[0]?.id || null;
        }
        
        console.log(`🗑️ Removed stream ${streamId}, active stream: ${newActiveStreamId}`);
        
        set({ 
          activeStreams: updatedStreams,
          activeStreamId: newActiveStreamId
        });
      },

      // Принудительно закрыть все соединения
      disconnectAllStreams: async () => {
        const { activeStreams } = get();
        
        console.log('🔌 Disconnecting from all streams...');
        
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
                console.log(`✅ Disconnected from ${stream.id}`);
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
        
        console.log('✅ All streams disconnected');
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
      
      // DEBUG: Получить connectionId для стрима
      getConnectionId: (streamId) => {
        const { activeStreams } = get();
        const stream = activeStreams.find(s => s.id === streamId);
        console.log('🔍 getConnectionId:', { streamId, stream, connectionId: stream?.connectionId });
        return stream?.connectionId;
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
        activeStreams: state.activeStreams.map(s => ({ 
          id: s.id, 
          streamId: s.streamId,
          author: s.author,
          title: s.title,
          platform: s.platform,
          isLive: s.isLive,
          connectionId: s.connectionId // Сохраняем connectionId
        })),
        activeStreamId: state.activeStreamId,
        recentStreams: state.recentStreams.map(s => ({
          id: s.id,
          streamId: s.streamId,
          author: s.author,
          title: s.title,
          platform: s.platform,
          isLive: s.isLive,
          lastViewed: s.lastViewed
        })),
      }),
    }
  )
);

