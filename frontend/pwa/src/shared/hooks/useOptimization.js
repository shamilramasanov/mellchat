import { useCallback, useRef, useEffect } from 'react';
import { messageCache } from '../utils/smartCache';
import deviceDetection from '../utils/deviceDetection';

// Хук для prefetching сообщений
export const useMessagePrefetching = (streamId, currentPage = 0) => {
  const prefetchingRef = useRef(false);
  const lastPrefetchPageRef = useRef(currentPage);
  
  // Получаем адаптивные настройки
  const adaptiveSettings = deviceDetection.getAdaptiveSettings();
  
  // Функция для загрузки сообщений
  const fetchMessages = useCallback(async (page, limit = 50) => {
    try {
      const cacheKey = `messages-${streamId}-${page}`;
      
      // Проверяем кэш
      const cachedMessages = messageCache.get(cacheKey);
      if (cachedMessages) {
        return cachedMessages;
      }
      
      // Загружаем с сервера
      const response = await fetch(`/api/v1/database/messages/${streamId}?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const messages = await response.json();
      
      // Сохраняем в кэш
      messageCache.set(cacheKey, messages);
      
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, [streamId]);
  
  // Prefetch следующей страницы
  const prefetchNext = useCallback(async () => {
    if (prefetchingRef.current) return;
    
    prefetchingRef.current = true;
    
    try {
      const nextPage = currentPage + 1;
      const cacheKey = `messages-${streamId}-${nextPage}`;
      
      // Проверяем, есть ли уже в кэше
      if (messageCache.has(cacheKey)) {
        return;
      }
      
      // Prefetch только если соединение быстрое
      if (adaptiveSettings.connection.speed === 'fast' || 
          adaptiveSettings.connection.speed === 'medium') {
        await fetchMessages(nextPage);
      }
    } catch (error) {
      console.error('Error prefetching messages:', error);
    } finally {
      prefetchingRef.current = false;
    }
  }, [streamId, currentPage, fetchMessages, adaptiveSettings.connection.speed]);
  
  // Prefetch предыдущей страницы
  const prefetchPrevious = useCallback(async () => {
    if (prefetchingRef.current) return;
    
    prefetchingRef.current = true;
    
    try {
      const prevPage = Math.max(0, currentPage - 1);
      const cacheKey = `messages-${streamId}-${prevPage}`;
      
      // Проверяем, есть ли уже в кэше
      if (messageCache.has(cacheKey)) {
        return;
      }
      
      await fetchMessages(prevPage);
    } catch (error) {
      console.error('Error prefetching previous messages:', error);
    } finally {
      prefetchingRef.current = false;
    }
  }, [streamId, currentPage, fetchMessages]);
  
  // Автоматический prefetch при изменении страницы
  useEffect(() => {
    if (currentPage !== lastPrefetchPageRef.current) {
      lastPrefetchPageRef.current = currentPage;
      
      // Prefetch следующей страницы с задержкой
      const timeoutId = setTimeout(() => {
        prefetchNext();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, prefetchNext]);
  
  return {
    fetchMessages,
    prefetchNext,
    prefetchPrevious,
    isPrefetching: prefetchingRef.current
  };
};

// Хук для оптимизированного скролла
export const useOptimizedScroll = (onScroll, debounceMs = 100) => {
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  
  const handleScroll = useCallback((e) => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
    }
    
    // Очищаем предыдущий таймаут
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Debounce scroll событие
    scrollTimeoutRef.current = setTimeout(() => {
      if (onScroll && e && e.target) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        onScroll({
          scrollTop,
          scrollHeight,
          clientHeight,
          isAtBottom: scrollTop + clientHeight >= scrollHeight - 10
        });
      }
      
      isScrollingRef.current = false;
    }, debounceMs);
  }, [onScroll, debounceMs]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  return handleScroll;
};

// Хук для адаптивных обновлений
export const useAdaptiveUpdates = (updateFunction, dependencies = []) => {
  const lastUpdateRef = useRef(0);
  const updateTimeoutRef = useRef(null);
  
  // Получаем адаптивные настройки
  const adaptiveSettings = deviceDetection.getAdaptiveSettings();
  
  const scheduleUpdate = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Определяем интервал обновления
    let updateInterval = adaptiveSettings.updateFrequency.active;
    
    // Если устройство в фоне, увеличиваем интервал
    if (document.hidden) {
      updateInterval = adaptiveSettings.updateFrequency.background;
    }
    
    // Если прошло достаточно времени, обновляем сразу
    if (timeSinceLastUpdate >= updateInterval) {
      updateFunction();
      lastUpdateRef.current = now;
      return;
    }
    
    // Иначе планируем обновление
    const delay = updateInterval - timeSinceLastUpdate;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateFunction();
      lastUpdateRef.current = Date.now();
    }, delay);
  }, [updateFunction, adaptiveSettings.updateFrequency]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  return scheduleUpdate;
};

// Хук для мониторинга производительности
export const usePerformanceMonitor = () => {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });
  
  const measureRender = useCallback((componentName) => {
    const now = performance.now();
    const perf = performanceRef.current;
    
    perf.renderCount++;
    
    if (perf.lastRenderTime > 0) {
      const renderTime = now - perf.lastRenderTime;
      perf.averageRenderTime = (perf.averageRenderTime + renderTime) / 2;
      
      // Логируем медленные рендеры
      if (renderTime > 16) { // Больше 16ms (60fps)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
    
    perf.lastRenderTime = now;
  }, []);
  
  const getStats = useCallback(() => {
    return {
      ...performanceRef.current,
      deviceInfo: deviceDetection.getDeviceInfo(),
      cacheStats: {
        messages: messageCache.getStats(),
        questions: messageCache.getStats()
      }
    };
  }, []);
  
  return {
    measureRender,
    getStats
  };
};
