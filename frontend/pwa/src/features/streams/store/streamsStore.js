import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LIMITS } from '@shared/utils/constants';
import { detectPlatform, extractStreamId } from '@shared/utils/helpers';
import { useChatStore } from '@features/chat/store/chatStore';
import { streamsAPI, databaseAPI } from '@shared/services/api';

export const useStreamsStore = create(
  persist(
    (set, get) => ({
      // State
      activeStreams: [], // Currently connected streams (max 3)
      activeStreamId: null, // Currently viewing stream
      recentStreams: [], // History of all streams (including closed)
      shouldAutoScroll: false, // Флаг для автоскролла при переходе со страницы последних стримов
      collapsedStreamIds: [], // Streams that are collapsed from cards view (but still connected)
      closedStreamIds: [], // Streams that are closed (disconnected from platform)
      scrollToUnreadMessage: null, // Callback для скролла к непрочитанному сообщению
      scrollToUnreadQuestion: null, // Callback для скролла к непрочитанному вопросу
      
      // Actions
      addStream: (stream) => {
        const { activeStreams, closedStreamIds, collapsedStreamIds } = get();
        
        // Check if stream already exists
        const exists = activeStreams.find(s => s.id === stream.id);
        if (exists) {
          // Just set it as active - НЕ перезаписываем стрим!
          // Но убеждаемся, что он не в closedStreamIds или collapsedStreamIds
          const updates = { activeStreamId: stream.id };
          if (closedStreamIds.includes(stream.id)) {
            updates.closedStreamIds = closedStreamIds.filter(id => id !== stream.id);
          }
          if (collapsedStreamIds.includes(stream.id)) {
            updates.collapsedStreamIds = collapsedStreamIds.filter(id => id !== stream.id);
          }
          set(updates);
          console.log('✅ Stream already in activeStreams, just setting as active');
        } else {
          // Если стрим был закрыт или свернут - убираем его из соответствующих списков
          const newClosedStreamIds = closedStreamIds.filter(id => id !== stream.id);
          const newCollapsedStreamIds = collapsedStreamIds.filter(id => id !== stream.id);
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
            closedStreamIds: newClosedStreamIds, // Убираем из закрытых
            collapsedStreamIds: newCollapsedStreamIds, // Убираем из свернутых
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

      // Collapse/expand stream card (stream remains connected)
      toggleStreamCard: (streamId) => {
        const { collapsedStreamIds, activeStreamId, activeStreams } = get();
        
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

          // Обновляем/добавляем запись в историю с актуальным lastViewed
          const stream = activeStreams.find(s => s.id === streamId);
          if (stream) {
            get().addToRecent({ ...stream, lastViewed: new Date().toISOString() });
          }
          
          // Если скрыли активный стрим - переключаемся на другой доступный
          if (activeStreamId === streamId) {
            const availableStreams = activeStreams.filter(s => 
              !collapsedStreamIds.includes(s.id) && !get().closedStreamIds.includes(s.id)
            );
            const newActiveId = availableStreams.length > 0 ? availableStreams[0].id : null;
            set({ activeStreamId: newActiveId });
          }
        }
      },

      // Close stream (disconnect from platform and move to closed)
      closeStream: async (streamId) => {
        const { activeStreamId, activeStreams, closedStreamIds } = get();
        const streamToClose = activeStreams.find(s => s.id === streamId);
        
        if (!streamToClose) return;
        
        // Disconnect from platform
        if (streamToClose.connectionId) {
          try {
            const response = await fetch('http://localhost:3001/api/v1/connect/disconnect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                connectionId: streamToClose.connectionId
              })
            });
            
            if (response.ok) {
              console.log('✅ Successfully disconnected from platform:', streamToClose.connectionId);
            } else {
              console.warn('⚠️ Failed to disconnect from platform:', streamToClose.connectionId);
            }
          } catch (error) {
            console.error('❌ Error disconnecting from platform:', error);
          }
        }
        
        // Move to closed streams
        const newClosedStreamIds = [...closedStreamIds, streamId];
        const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
        
        // Добавляем/обновляем стрим в историю с актуальным lastViewed
        get().addToRecent({ ...streamToClose, lastViewed: new Date().toISOString() });
        
        // If closing active stream, switch to another available
        let newActiveStreamId = activeStreamId;
        if (activeStreamId === streamId) {
          const availableStreams = newActiveStreams.filter(s => 
            !get().collapsedStreamIds.includes(s.id) && !newClosedStreamIds.includes(s.id)
          );
          newActiveStreamId = availableStreams.length > 0 ? availableStreams[0].id : null;
        }
        
        set({ 
          activeStreams: newActiveStreams,
          activeStreamId: newActiveStreamId,
          closedStreamIds: newClosedStreamIds
        });
        
        console.log(`🔒 Stream ${streamId} closed and disconnected`);
      },

      // Reopen closed stream (reconnect to platform)
      reopenStream: async (streamId) => {
        const { activeStreams, closedStreamIds, recentStreams } = get();
        
        // Check if stream is closed
        if (!closedStreamIds.includes(streamId)) {
          console.warn('⚠️ Stream is not closed:', streamId);
          return { success: false, error: 'Stream is not closed' };
        }
        
        // Check limit
        if (activeStreams.length >= 3) {
          console.warn('⚠️ Maximum 3 streams allowed. Cannot reopen stream.');
          return { success: false, error: 'Maximum 3 streams allowed' };
        }
        
        // Find stream in recentStreams
        const streamToReopen = recentStreams.find(s => s.id === streamId);
        if (!streamToReopen) {
          console.warn('⚠️ Stream not found in recentStreams:', streamId);
          return { success: false, error: 'Stream not found' };
        }
        
        // Reconnect to platform - проверяем онлайн-статус через подключение
        if (streamToReopen.streamUrl) {
          try {
            console.log('🔄 Checking if stream is online:', streamToReopen.streamUrl);
            const data = await streamsAPI.connect(streamToReopen.streamUrl); // expects {streamUrl}
            const connectionId = data?.connection?.id;
            
            if (!connectionId) {
              console.warn('⚠️ No connection id returned - stream might be offline');
              return { success: false, error: 'Stream is offline or not available' };
            }

            // Stream is online - загружаем сохраненные сообщения из базы
            console.log('📥 Loading saved messages from database for stream:', streamId);
            try {
              const savedMessages = await databaseAPI.getMessages(streamId, 100, 0);
              
              if (savedMessages?.messages && Array.isArray(savedMessages.messages)) {
                const chatStore = useChatStore.getState();
                
                // Нормализуем и добавляем сообщения в chatStore
                savedMessages.messages.forEach(msg => {
                  // Обрабатываем timestamp - может быть Date, number (bigint), или строка
                  let timestamp = msg.timestamp || msg.created_at;
                  if (typeof timestamp === 'number') {
                    timestamp = new Date(timestamp);
                  } else if (typeof timestamp === 'string') {
                    timestamp = new Date(timestamp);
                  } else if (timestamp instanceof Date) {
                    // Уже Date
                  } else {
                    timestamp = new Date();
                  }
                  
                  const normalizedMessage = {
                    id: msg.id || `${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
                    streamId: streamId,
                    platform: streamToReopen.platform || msg.platform || 'unknown',
                    username: msg.username || msg.user_name || msg.author || 'unknown',
                    text: msg.text || msg.message || msg.content || '',
                    timestamp: timestamp,
                    isQuestion: msg.is_question || msg.isQuestion || /\?/.test(msg.text || msg.message || msg.content || ''),
                    sentiment: msg.sentiment || null,
                    isSpam: msg.is_spam || msg.isSpam || false,
                  };
                  
                  chatStore.addMessage(normalizedMessage);
                });
                
                console.log(`✅ Loaded ${savedMessages.messages.length} saved messages from database`);
              } else {
                console.log('ℹ️ No saved messages found in database');
              }
            } catch (loadError) {
              console.warn('⚠️ Failed to load saved messages from database:', loadError);
              // Продолжаем даже если не удалось загрузить сообщения
            }
            
                // Add back to active streams
                const newActiveStreams = [...activeStreams, { ...streamToReopen, connectionId }];
                const newClosedStreamIds = closedStreamIds.filter(id => id !== streamId);
            
            // Убираем из collapsedStreamIds при переоткрытии (чтобы чат сразу показывался)
            const newCollapsedStreamIds = get().collapsedStreamIds.filter(id => id !== streamId);
                
                set({ 
                  activeStreams: newActiveStreams,
                  activeStreamId: streamId,
                  closedStreamIds: newClosedStreamIds,
              collapsedStreamIds: newCollapsedStreamIds,
                  shouldAutoScroll: true
                });
                
            console.log('✅ Stream reopened and connected:', streamId, 'connectionId:', connectionId);
                return { success: true };
          } catch (error) {
            console.error('❌ Error reconnecting to platform:', error);
            
            // Проверяем, не связано ли это с тем, что стрим оффлайн
            const errorMessage = error?.response?.data?.error?.message || error.message || 'Failed to reconnect';
            const isOffline = errorMessage.toLowerCase().includes('not live') || 
                             errorMessage.toLowerCase().includes('offline') ||
                             errorMessage.toLowerCase().includes('not available');
            
            return { 
              success: false, 
              error: isOffline ? 'Stream is offline or not available' : errorMessage
            };
          }
        }
        
        return { success: false, error: 'No stream URL available' };
      },

      // Switch stream without disconnect
      switchStream: (streamId) => {
        const { activeStreamId, activeStreams } = get();
        
        // Помечаем сообщения как прочитанные для предыдущего активного стрима
        if (activeStreamId && activeStreamId !== streamId) {
          const chatStore = useChatStore.getState();
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
      
      updateRecentStreamConnectionId: (streamId, connectionId) => {
        const { recentStreams } = get();
        const updated = recentStreams.map(s => 
          s.id === streamId ? { ...s, connectionId, status: 'connected' } : s
        );
        set({ recentStreams: updated });
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
      
      // State checkers
      isStreamCollapsed: (streamId) => {
        const { collapsedStreamIds } = get();
        return collapsedStreamIds.includes(streamId);
      },
      
      isStreamClosed: (streamId) => {
        const { closedStreamIds } = get();
        return closedStreamIds.includes(streamId);
      },
      
      isStreamActive: (streamId) => {
        const { activeStreams } = get();
        return activeStreams.some(s => s.id === streamId);
      },
      
      getAvailableStreams: () => {
        const { activeStreams, collapsedStreamIds, closedStreamIds } = get();
        return activeStreams.filter(s => 
          !collapsedStreamIds.includes(s.id) && !closedStreamIds.includes(s.id)
        );
      },
      
      // Регистрация функций скролла из ChatContainer
      setScrollFunctions: (scrollToUnreadMessage, scrollToUnreadQuestion) => {
        set({ scrollToUnreadMessage, scrollToUnreadQuestion });
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
          streamUrl: url, // Сохраняем оригинальную ссылку
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
          connectionId: s.connectionId, // Сохраняем connectionId
          streamUrl: s.streamUrl // Сохраняем streamUrl
        })),
        activeStreamId: state.activeStreamId,
        recentStreams: state.recentStreams.map(s => ({
          id: s.id,
          streamId: s.streamId,
          author: s.author,
          title: s.title,
          platform: s.platform,
          isLive: s.isLive,
          lastViewed: s.lastViewed,
          connectionId: s.connectionId, // Сохраняем connectionId для WebSocket подписки
          streamUrl: s.streamUrl // Сохраняем streamUrl
        })),
        collapsedStreamIds: state.collapsedStreamIds,
        closedStreamIds: state.closedStreamIds,
      }),
    }
  )
);

