import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { databaseService } from '@shared/services/databaseService';
import { adaptiveMessagesService } from '@shared/services/adaptiveMessagesService';
import paginationMessagesService from '@shared/services/paginationMessagesService';

export const useChatStore = create(
  persist(
    (set, get) => ({
      // State
      messages: [], // Кэш сообщений в памяти
      lastReadMessageIds: {}, // Track last read message ID for each stream
      loading: false,
      error: null,
      searchQuery: '', // Поисковый запрос
      searchResults: false, // Флаг что показываем результаты поиска
      searchTimeout: null, // Таймер для debounce поиска
      activeStreamId: null, // Текущий активный стрим для поиска
      databaseConnected: false, // Статус подключения к БД
      loadingStrategy: null, // Текущая стратегия загрузки
      sessionInfo: null, // Информация о сессии пользователя
      hasMoreMessages: false, // Есть ли еще сообщения для загрузки
      currentMood: { happy: 0, neutral: 0, sad: 0 }, // Текущее настроение чата
      moodEnabled: false, // Включён ли анализ настроения (по умолчанию отключён)
      
      // Новые поля для работы с датами
      availableDates: {}, // Доступные даты для каждого стрима
      currentLoadingDate: {}, // Текущая загружаемая дата для каждого стрима
      dateOffsets: {}, // Смещения для каждой даты
      dateHasMore: {}, // Есть ли еще сообщения для конкретной даты

      // Actions
      setActiveStreamId: (streamId) => set({ activeStreamId: streamId }),
      setCurrentMood: (mood) => set({ currentMood: mood }),
      toggleMoodEnabled: () => set((state) => ({ moodEnabled: !state.moodEnabled })),
      
      addMessage: (message) => {
        const { messages } = get();

        // Check if message already exists (prevent duplicates)
        const exists = messages.some(m => m.id === message.id);
        if (exists) {
          return;
        }
        
        // Debug: проверяем sentiment и spam
        if (!message.sentiment) {
          console.warn('⚠️ Message without sentiment:', {
            id: message.id,
            text: message.text,
            hasSpam: !!message.isSpam
          });
        } else {
          console.log('✅ Message:', {
            text: message.text,
            sentiment: message.sentiment,
            isSpam: !!message.isSpam
          });
        }

        // Add to messages (limit to 200 for memory management, matching DB limit)
        const newMessages = [...messages, message].slice(-200);

        set({ messages: newMessages });
      },
      
      // Простая функция для получения сообщений стрима
      getStreamMessages: (streamId) => {
        const { messages, searchQuery, moodEnabled } = get();
        let streamMessages = messages.filter(m => m.streamId === streamId);

        // Если настроение выключено - показываем все сообщения
        if (!moodEnabled) {
          return streamMessages;
        }

        // 🎯 Фильтруем спам (только если бэкенд помечает как спам)
        streamMessages = streamMessages.filter(m => {
          // Скрываем если бэкенд пометил как спам
          if (m.isSpam) {
            return false;
          }
          
          // Скрываем sentiment='sad'
          if (m.sentiment === 'sad') {
            return false;
          }
          
          return true;
        });

        console.log('🔍 getStreamMessages:', {
          streamId,
          totalMessages: messages.length,
          streamMessagesCount: streamMessages.length,
          searchQuery: searchQuery.trim(),
          firstFewStreamMessages: streamMessages.slice(0, 3).map(m => ({ id: m.id, timestamp: m.timestamp })),
          allStreamIds: [...new Set(messages.map(m => m.streamId))],
          streamIdCounts: messages.reduce((acc, m) => {
            acc[m.streamId] = (acc[m.streamId] || 0) + 1;
            return acc;
          }, {})
        });

        // Применяем поиск если есть запрос
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          streamMessages = streamMessages.filter(m =>
            m.username.toLowerCase().includes(query) ||
            (m.text || m.content || '').toLowerCase().includes(query)
          );
        }

        return streamMessages;
      },

      // Функции поиска
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        
        // Очищаем предыдущий таймер
        if (get().searchTimeout) {
          clearTimeout(get().searchTimeout);
        }
        
        // Если запрос не пустой, устанавливаем debounce таймер
        if (query.trim()) {
          const timeout = setTimeout(() => {
            const activeStreamId = get().activeStreamId;
            if (activeStreamId) {
              get().searchMessagesInDatabase(activeStreamId, query);
            }
          }, 500); // 500ms задержка
          
          set({ searchTimeout: timeout });
        } else {
          // Если запрос пустой, сразу очищаем поиск
          get().clearSearch();
        }
      },
      
      clearSearch: () => {
        const { activeStreamId, searchTimeout } = get();
        
        // Очищаем таймер если есть
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        
        set({ searchQuery: '', searchResults: false, searchTimeout: null });
        
        // Восстанавливаем все сообщения если был активный стрим
        if (activeStreamId) {
          get().loadMessagesFromDatabase(activeStreamId, 100);
        }
      },

      // Поиск сообщений в базе данных
      searchMessagesInDatabase: async (streamId, searchQuery, limit = 100) => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 Searching messages in database:', { streamId, searchQuery });
          
          const response = await databaseService.searchMessages(streamId, searchQuery, limit);
          
          if (response.success) {
            // Convert database messages to frontend format
            const dbMessages = response.messages.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content,
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: msg.is_question || false,
              created_at: msg.created_at
            }));

            // Заменяем сообщения результатами поиска
            set({ 
              messages: dbMessages,
              loading: false,
              searchResults: true // Флаг что это результаты поиска
            });
            
            console.log(`✅ Found ${dbMessages.length} messages matching "${searchQuery}"`);
            return { success: true, count: dbMessages.length };
          } else {
            throw new Error(response.message || 'Search failed');
          }
        } catch (error) {
          console.error('❌ Search failed:', error);
          set({ 
            error: error.message, 
            loading: false,
            searchResults: false
          });
          return { success: false, error: error.message };
        }
      },

      // Восстановление всех сообщений после поиска
      restoreAllMessages: async (streamId) => {
        set({ searchQuery: '', searchResults: false });
        return get().loadMessagesFromDatabase(streamId, 100);
      },

      // Очистка таймера поиска
      clearSearchTimeout: () => {
        const { searchTimeout } = get();
        if (searchTimeout) {
          clearTimeout(searchTimeout);
          set({ searchTimeout: null });
        }
      },

      // Database functions
      loadMessagesFromDatabase: async (streamId, limit = 100) => {
        set({ loading: true, error: null });
        
        try {
          const response = await databaseService.getMessages(streamId, limit);
          
          if (response.success) {
            // Convert database messages to frontend format
            const dbMessages = response.messages.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content, // For compatibility
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: msg.is_question || false,
              created_at: msg.created_at
            }));

            // Merge with existing messages, avoiding duplicates
            const { messages } = get();
            const existingIds = new Set(messages.map(m => m.id));
            const newMessages = dbMessages.filter(msg => !existingIds.has(msg.id));
            
            set({ 
              messages: [...messages, ...newMessages].slice(-200),
              databaseConnected: true,
              loading: false 
            });
            
            return { success: true, count: newMessages.length };
          } else {
            throw new Error(response.message || 'Failed to load messages');
          }
        } catch (error) {
          console.error('Failed to load messages from database:', error);
          set({ 
            error: error.message, 
            loading: false,
            databaseConnected: false 
          });
          return { success: false, error: error.message };
        }
      },

      loadQuestionsFromDatabase: async (streamId, limit = 50) => {
        set({ loading: true, error: null });
        
        try {
          const response = await databaseService.getQuestions(streamId, limit);
          
          if (response.success) {
            // Convert database questions to frontend format
            const dbQuestions = response.questions.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content,
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: true,
              created_at: msg.created_at
            }));

            // Merge with existing messages, avoiding duplicates
            const { messages } = get();
            const existingIds = new Set(messages.map(m => m.id));
            const newQuestions = dbQuestions.filter(msg => !existingIds.has(msg.id));
            
            set({ 
              messages: [...messages, ...newQuestions].slice(-200),
              databaseConnected: true,
              loading: false 
            });
            
            return { success: true, count: newQuestions.length };
          } else {
            throw new Error(response.message || 'Failed to load questions');
          }
        } catch (error) {
          console.error('Failed to load questions from database:', error);
          set({ 
            error: error.message, 
            loading: false,
            databaseConnected: false 
          });
          return { success: false, error: error.message };
        }
      },

      searchMessagesInDatabase: async (streamId, searchQuery, limit = 50) => {
        set({ loading: true, error: null });
        
        try {
          const response = await databaseService.searchMessages(streamId, searchQuery, limit);
          
          if (response.success) {
            // Convert database messages to frontend format
            const dbMessages = response.messages.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content,
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: msg.is_question || false,
              created_at: msg.created_at
            }));

            set({ 
              messages: dbMessages,
              databaseConnected: true,
              loading: false 
            });
            
            return { success: true, count: dbMessages.length };
          } else {
            throw new Error(response.message || 'Failed to search messages');
          }
        } catch (error) {
          console.error('Failed to search messages in database:', error);
          set({ 
            error: error.message, 
            loading: false,
            databaseConnected: false 
          });
          return { success: false, error: error.message };
        }
      },

      testDatabaseConnection: async () => {
        try {
          const response = await databaseService.testConnection();
          set({ databaseConnected: response.success && response.database?.connected });
          return response;
        } catch (error) {
          console.error('Database connection test failed:', error);
          set({ databaseConnected: false });
          return { success: false, error: error.message };
        }
      },

      clearStreamMessages: (streamId) => {
        set(state => ({
          messages: state.messages.filter(m => m.streamId !== streamId)
        }));
      },

      // Принудительная перезагрузка сообщений
      reloadMessages: async (streamId) => {
        return get().loadMessagesAdaptive(streamId, { forceReload: true });
      },
      
      // Очистка кэша сообщений для стрима
      clearStreamCache: (streamId) => {
        set(state => ({
          messages: state.messages.filter(m => m.streamId !== streamId)
        }));
        console.log(`🗑️ Cleared cache for stream: ${streamId}`);
      },
      
      // Очистка всего кэша сообщений
      clearAllCache: () => {
        set({ messages: [] });
        console.log('🗑️ Cleared all message cache');
      },
      
      // Adaptive loading functions
      loadMessagesAdaptive: async (streamId, options = {}) => {
        // Проверяем, есть ли уже сообщения для этого стрима
        const { messages } = get();
        const existingMessages = messages.filter(m => m.streamId === streamId);
        
        // Если сообщения уже есть и не требуется принудительная перезагрузка, возвращаем существующие
        // БЕЗ вызова API
        if (existingMessages.length > 0 && !options.forceReload) {
          // Обновляем lastReadMessageIds для кэшированных сообщений
          const { lastReadMessageIds } = get();
          if (!lastReadMessageIds[streamId] && existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            lastReadMessageIds[streamId] = lastMessage.id;
            set({ lastReadMessageIds });
            console.log(`📌 Auto-marking cached last message as read for stream ${streamId}:`, lastMessage.id);
          }
          
          console.log(`✅ Adaptive loading: Using cached ${existingMessages.length} messages for stream ${streamId}`);
          return { success: true, count: existingMessages.length, strategy: { strategy: 'cached' } };
        }
        
        set({ loading: true, error: null });
        
        try {
          const deviceType = adaptiveMessagesService.detectDeviceType();
          const response = await adaptiveMessagesService.getMessages(streamId, {
            deviceType,
            ...options
          });
          
          if (response.success) {
            // Convert database messages to frontend format
            const dbMessages = response.messages.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content,
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: msg.is_question || false,
              created_at: msg.created_at
            }));

            // Получаем текущие сообщения
            const currentMessages = get().messages;
            
            // Фильтруем сообщения для текущего стрима
            const otherStreamMessages = currentMessages.filter(m => m.streamId !== streamId);
            
            // Фильтруем дубликаты из новых сообщений
            const existingIds = new Set(currentMessages.map(m => m.id));
            const uniqueDbMessages = dbMessages.filter(msg => !existingIds.has(msg.id));
            
            // Объединяем сообщения других стримов с новыми уникальными сообщениями текущего стрима
            const allMessages = [...otherStreamMessages, ...uniqueDbMessages];
            
            // ВАЖНО: не перезаписываем сообщения если новых нет и в кэше уже есть
            if (uniqueDbMessages.length === 0 && existingMessages.length > 0) {
              console.log(`✅ Adaptive loading: No new messages from DB, keeping ${existingMessages.length} cached messages`);
              set({ 
                databaseConnected: true,
                loading: false,
                loadingStrategy: response.strategy,
                sessionInfo: response.session,
                hasMoreMessages: response.hasMore
              });
              return { success: true, count: 0, strategy: response.strategy };
            }
            
            // Обновляем lastReadMessageIds для текущего стрима
            const streamMessages = allMessages.filter(m => m.streamId === streamId);
            const { lastReadMessageIds } = get();
            
            // Если нет lastReadId для этого стрима, устанавливаем последнее сообщение как прочитанное
            if (!lastReadMessageIds[streamId] && streamMessages.length > 0) {
              const lastMessage = streamMessages[streamMessages.length - 1];
              lastReadMessageIds[streamId] = lastMessage.id;
              console.log(`📌 Auto-marking last message as read for stream ${streamId}:`, lastMessage.id);
            }
            
            set({ 
              messages: allMessages,
              lastReadMessageIds,
              databaseConnected: true,
              loading: false,
              loadingStrategy: response.strategy,
              sessionInfo: response.session,
              hasMoreMessages: response.hasMore
            });
            
            console.log(`✅ Adaptive loading: ${uniqueDbMessages.length} new messages loaded with ${response.strategy.strategy} strategy (${allMessages.length} total messages)`);
            return { success: true, count: uniqueDbMessages.length, strategy: response.strategy };
          } else {
            throw new Error(response.message || 'Failed to load messages');
          }
        } catch (error) {
          console.error('Failed to load messages adaptively:', error);
          set({ 
            error: error.message, 
            loading: false,
            databaseConnected: false 
          });
          return { success: false, error: error.message };
        }
      },

      // Load more messages (pagination)
      loadMoreMessages: async (streamId, options = {}) => {
        set({ loading: true, error: null });
        
        try {
          const deviceType = adaptiveMessagesService.detectDeviceType();
          const { messages } = get();
          const offset = messages.length;
          
          const response = await adaptiveMessagesService.loadMoreMessages(streamId, {
            deviceType,
            offset,
            ...options
          });
          
          if (response.success) {
            const dbMessages = response.messages.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content,
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: msg.is_question || false,
              created_at: msg.created_at
            }));

            // Фильтруем дубликаты из новых сообщений
            const existingIds = new Set(messages.map(m => m.id));
            const uniqueDbMessages = dbMessages.filter(msg => !existingIds.has(msg.id));
            
            set({ 
              messages: [...messages, ...uniqueDbMessages],
              loading: false,
              hasMoreMessages: response.hasMore
            });
            
            console.log(`✅ Loaded ${dbMessages.length} more messages`);
            return { success: true, count: dbMessages.length };
          } else {
            throw new Error(response.message || 'Failed to load more messages');
          }
        } catch (error) {
          console.error('Failed to load more messages:', error);
          set({ 
            error: error.message, 
            loading: false
          });
          return { success: false, error: error.message };
        }
      },

      // Create clean session (for "clean start")
      createCleanSession: async (streamId) => {
        set({ loading: true, error: null });
        
        try {
          const deviceType = adaptiveMessagesService.detectDeviceType();
          const response = await adaptiveMessagesService.createCleanSession(streamId, {
            deviceType
          });
          
          if (response.success) {
            const dbMessages = response.messages.map(msg => ({
              id: msg.id,
              streamId: msg.stream_id,
              username: msg.username,
              text: msg.content,
              content: msg.content,
              platform: msg.platform,
              timestamp: new Date(msg.created_at),
              isQuestion: msg.is_question || false,
              created_at: msg.created_at
            }));

            set({ 
              messages: dbMessages,
              databaseConnected: true,
              loading: false,
              loadingStrategy: response.strategy,
              sessionInfo: response.session,
              hasMoreMessages: false
            });
            
            console.log(`✅ Clean session created: ${dbMessages.length} messages loaded`);
            return { success: true, count: dbMessages.length };
          } else {
            throw new Error(response.message || 'Failed to create clean session');
          }
        } catch (error) {
          console.error('Failed to create clean session:', error);
          set({ 
            error: error.message, 
            loading: false,
            databaseConnected: false 
          });
          return { success: false, error: error.message };
        }
      },

      // Получить статистику стрима
      getStreamStats: (streamId) => {
        const { messages, lastReadMessageIds } = get();
        
        const streamMessages = messages.filter(m => m.streamId === streamId);
        const lastReadId = lastReadMessageIds[streamId];
        let unreadCount = 0;
        let unreadQuestionCount = 0;
        let foundLastRead = false;
        
        console.log('🔍 getStreamStats debug:', {
          streamId,
          totalMessages: streamMessages.length,
          lastReadId,
          lastReadMessageIds
        });
        
        // Если нет lastReadId - считаем все прочитанными (кроме новых после последнего)
        if (!lastReadId && streamMessages.length > 0) {
          // Устанавливаем последнее сообщение как прочитанное
          const lastMessage = streamMessages[streamMessages.length - 1];
          set({ 
            lastReadMessageIds: { 
              ...lastReadMessageIds, 
              [streamId]: lastMessage.id 
            } 
          });
          console.log('✅ Auto-marking as read:', { streamId, lastMessageId: lastMessage.id });
          return {
            messageCount: streamMessages.length,
            questionCount: streamMessages.filter(m => m.isQuestion).length,
            unreadCount: 0,
            unreadQuestionCount: 0,
            lastReadId: lastMessage.id,
          };
        }
        
        // Iterate from the end to find unread messages
        for (let i = streamMessages.length - 1; i >= 0; i--) {
          const msg = streamMessages[i];
          if (msg.id === lastReadId) {
            foundLastRead = true;
            break;
          }
          unreadCount++;
          if (msg.isQuestion) {
            unreadQuestionCount++;
          }
        }
        
        // Если lastReadId не найден - значит сообщения удалились, считаем от первого существующего
        if (!foundLastRead && streamMessages.length > 0 && lastReadId) {
          // Все сообщения непрочитанные до тех пор, пока не обновим lastReadId
          unreadCount = streamMessages.length;
          unreadQuestionCount = streamMessages.filter(m => m.isQuestion).length;
        }
        
        return {
          messageCount: streamMessages.length,
          questionCount: streamMessages.filter(m => m.isQuestion).length,
          unreadCount,
          unreadQuestionCount,
          lastReadId,
        };
      },
      
      markMessagesAsRead: (streamId, lastMessageId) => {
        set(state => {
          const updatedIds = {
            ...state.lastReadMessageIds,
            [streamId]: lastMessageId,
          };
          console.log('📌 markMessagesAsRead:', {
            streamId,
            lastMessageId,
            updated: updatedIds
          });
          return {
            lastReadMessageIds: updatedIds
          };
        });
      },

      // Получить статистику всех стримов (для совместимости)
      getAllStreamsStats: () => {
        const { messages, lastReadMessageIds } = get();
        const stats = {};
        
        // Группируем сообщения по стримам
        const streamGroups = messages.reduce((acc, message) => {
          if (!acc[message.streamId]) {
            acc[message.streamId] = [];
          }
          acc[message.streamId].push(message);
          return acc;
        }, {});
        
        // Вычисляем статистику для каждого стрима
        Object.keys(streamGroups).forEach(streamId => {
          const streamMessages = streamGroups[streamId];
          const questions = streamMessages.filter(m => m.isQuestion);
          
          // Вычисляем непрочитанные сообщения
          const lastReadId = lastReadMessageIds[streamId];
          let unreadCount = 0;
          let unreadQuestionCount = 0;
          
          if (lastReadId) {
            const lastReadIndex = streamMessages.findIndex(m => m.id === lastReadId);
            if (lastReadIndex !== -1) {
              const unreadMessages = streamMessages.slice(lastReadIndex + 1);
              unreadCount = unreadMessages.length;
              unreadQuestionCount = unreadMessages.filter(m => m.isQuestion).length;
            } else {
              unreadCount = streamMessages.length;
              unreadQuestionCount = questions.length;
            }
          } else {
            unreadCount = streamMessages.length;
            unreadQuestionCount = questions.length;
          }
          
          stats[streamId] = {
            messageCount: streamMessages.length,
            questionCount: questions.length,
            unreadCount,
            unreadQuestionCount
          };
          
          // Логирование для отладки
          if (unreadCount > 0 || unreadQuestionCount > 0) {
            console.log('📊 Stream stats:', {
              streamId,
              totalMessages: streamMessages.length,
              totalQuestions: questions.length,
              lastReadId,
              unreadCount,
              unreadQuestionCount
            });
          }
        });
        
        return stats;
      },
      
      hasArchive: (streamId) => {
        const { messages } = get();
        return messages.some(m => m.streamId === streamId);
      },
      
      clearStreamMessages: (streamId) => {
        set(state => ({
          messages: state.messages.filter(m => m.streamId !== streamId)
        }));
      },

      // Новые методы для работы с датами
      loadAvailableDates: async (streamId) => {
        try {
          console.log('📅 Loading available dates for stream:', streamId);
          const result = await dateMessagesService.getAvailableDates(streamId);
          
          if (result.success) {
            set(state => ({
              availableDates: {
                ...state.availableDates,
                [streamId]: result.dates
              }
            }));
            
            console.log('✅ Available dates loaded:', result.dates);
            return result.dates;
          }
          
          throw new Error(result.error || 'Failed to load available dates');
        } catch (error) {
          console.error('❌ Failed to load available dates:', error);
          throw error;
        }
      },

      loadMessagesByDate: async (streamId, date, offset = 0, limit = 20) => {
        try {
          console.log('📅 Loading messages for date:', { streamId, date, offset, limit });
          
          const result = await dateMessagesService.getMessagesByDate(streamId, date, offset, limit);
          
          if (result.success) {
            // Добавляем старые сообщения к существующим (не заменяем!)
            set(state => {
              const existingMessages = state.messages;
              const newMessages = [...result.messages, ...existingMessages];
              
              return {
                messages: newMessages,
                dateOffsets: {
                  ...state.dateOffsets,
                  [`${streamId}-${date}`]: offset + result.loadedCount
                },
                dateHasMore: {
                  ...state.dateHasMore,
                  [`${streamId}-${date}`]: result.hasMore
                }
              };
            });
            
            console.log(`✅ Loaded ${result.loadedCount} messages for date ${date}`);
            return {
              success: true,
              loadedCount: result.loadedCount,
              hasMore: result.hasMore,
              totalCount: result.totalCount
            };
          }
          
          throw new Error(result.error || 'Failed to load messages by date');
        } catch (error) {
          console.error('❌ Failed to load messages by date:', error);
          throw error;
        }
      },

      getNextDateToLoad: (streamId) => {
        const { availableDates, currentLoadingDate } = get();
        const dates = availableDates[streamId] || [];
        const currentDate = currentLoadingDate[streamId];
        
        return dateMessagesService.getNextDateToLoad(dates, currentDate);
      },

      setCurrentLoadingDate: (streamId, date) => {
        set(state => ({
          currentLoadingDate: {
            ...state.currentLoadingDate,
            [streamId]: date
          }
        }));
      },

      getDateDisplayText: (streamId) => {
        const { currentLoadingDate } = get();
        const date = currentLoadingDate[streamId];
        
        if (!date) {
          return 'Загрузить предыдущие сообщения';
        }
        
        const formattedDate = dateMessagesService.formatDateForDisplay(date);
        return `Загрузить предыдущие сообщения за ${formattedDate}`;
      },

      hasMoreMessagesForDate: (streamId, date) => {
        const { dateHasMore } = get();
        return dateHasMore[`${streamId}-${date}`] || false;
      },

      // ID-based пагинация
      loadOlderMessages: async (streamId, beforeId, limit = 20) => {
        try {
          console.log('📥 Loading older messages:', { streamId, beforeId, limit });
          
          const result = await paginationMessagesService.getOlderMessages(streamId, beforeId, limit);
          
          if (result.success) {
            // Добавляем старые сообщения к существующим (в начало)
            set(state => {
              const existingMessages = state.messages;
              const newMessages = [...result.messages, ...existingMessages];
              
              console.log('📥 Adding older messages:', {
                streamId,
                beforeId,
                loadedCount: result.loadedCount,
                existingCount: existingMessages.length,
                newTotalCount: newMessages.length,
                firstNewMessage: result.messages[0] ? { id: result.messages[0].id, timestamp: result.messages[0].timestamp, streamId: result.messages[0].streamId, stream_id: result.messages[0].stream_id } : null,
                lastNewMessage: result.messages[result.messages.length - 1] ? { id: result.messages[result.messages.length - 1].id, timestamp: result.messages[result.messages.length - 1].timestamp, streamId: result.messages[result.messages.length - 1].streamId, stream_id: result.messages[result.messages.length - 1].stream_id } : null,
                allStreamIds: [...new Set(result.messages.map(m => m.streamId || m.stream_id))],
                streamIdMapping: result.messages.slice(0, 3).map(m => ({ id: m.id, streamId: m.streamId, stream_id: m.stream_id }))
              });
              
              return {
                messages: newMessages
              };
            });
            
            // Принудительно обновляем состояние для немедленного отображения
            setTimeout(() => {
              console.log('🔄 Forcing state update after adding older messages');
            }, 0);
            
            console.log(`✅ Loaded ${result.loadedCount} older messages`);
            return {
              success: true,
              loadedCount: result.loadedCount,
              hasMore: result.hasMore
            };
          } else {
            console.error('❌ Failed to load older messages:', result.error);
            return { success: false, error: result.error };
          }
        } catch (error) {
          console.error('❌ Error loading older messages:', error);
          return { success: false, error: error.message };
        }
      },

      getOldestMessageId: (streamId) => {
        const state = get();
        const streamMessages = state.messages.filter(m => m.streamId === streamId);
        
        if (streamMessages.length === 0) return null;
        
        // Сортируем сообщения по timestamp (от старых к новым)
        const sortedMessages = [...streamMessages].sort((a, b) => a.timestamp - b.timestamp);
        
        // Возвращаем ID самого старого сообщения (первого в отсортированном списке)
        const oldestMessage = sortedMessages[0];
        
        console.log('🔍 getOldestMessageId:', {
          streamId,
          totalMessages: streamMessages.length,
          oldestMessageId: oldestMessage?.id,
          oldestTimestamp: oldestMessage?.timestamp,
          firstFewMessages: sortedMessages.slice(0, 3).map(m => ({ id: m.id, timestamp: m.timestamp }))
        });
        
        return oldestMessage ? oldestMessage.id : null;
      }
    }),
    {
      name: 'chat-storage', // localStorage key
      partialize: (state) => ({
        // Сохраняем только важные данные
        messages: state.messages.slice(-200), // Последние 200 сообщений (по лимиту БД)
        lastReadMessageIds: state.lastReadMessageIds, // Сохраняем lastReadMessageIds для счетчиков
        moodEnabled: state.moodEnabled
      }),
      onRehydrateStorage: () => (state) => {
        console.log('💾 Chat store rehydrated:', {
          messagesCount: state?.messages?.length || 0,
          lastReadMessageIds: state?.lastReadMessageIds
        });
      }
    }
  )
  );