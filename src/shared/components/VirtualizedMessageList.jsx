import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash';
import MessageCard from '../../features/chat/components/MessageCard';
import deviceDetection from '../utils/deviceDetection';
import performanceLogger from '../utils/performanceLogger';
import './VirtualizedMessageList.css';

// Флаг для включения/отключения логов оптимизации
const ENABLE_PERFORMANCE_LOGS = false;

const VirtualizedMessageList = ({ 
  messages = [], 
  onScroll, 
  scrollToBottom,
  isAtBottom,
  showNewMessagesButton,
  onNewMessagesClick,
  containerRef // Добавляем ref извне
}) => {
  const parentRef = useRef(null);
  const isScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  
  // Используем внешний ref если передан, иначе внутренний
  const actualContainerRef = containerRef || parentRef;
  
  // Получаем адаптивные настройки
  const adaptiveSettings = deviceDetection.getAdaptiveSettings() || {
    virtualScroll: {
      enabled: false,
      itemHeight: 40,
      overscan: 10
    }
  };
  
  // Настройки виртуализации
  const virtualizerSettings = useMemo(() => ({
    count: messages.length,
    getScrollElement: () => actualContainerRef.current,
    estimateSize: () => adaptiveSettings.virtualScroll.itemHeight,
    overscan: adaptiveSettings.virtualScroll.overscan,
    enabled: adaptiveSettings.virtualScroll.enabled
  }), [messages.length, adaptiveSettings.virtualScroll, actualContainerRef]);

  // Создаем виртуализатор
  const virtualizer = useVirtualizer(virtualizerSettings);

  // Логируем виртуализацию
  useEffect(() => {
    console.log('🔍 Virtualization stats:', {
      totalMessages: messages.length,
      virtualItemsCount: virtualItems.length,
      enabled: adaptiveSettings.virtualScroll.enabled,
      firstVisibleIndex: virtualItems[0]?.index || 'none',
      lastVisibleIndex: virtualItems[virtualItems.length - 1]?.index || 'none',
      containerHeight: actualContainerRef.current?.clientHeight || 'unknown'
    });
    
    const startTime = performance.now();
    
    // Небольшая задержка для измерения времени рендера
    const timeoutId = setTimeout(() => {
      const renderTime = performance.now() - startTime;
      
      if (ENABLE_PERFORMANCE_LOGS) {
        performanceLogger.logVirtualization({
          enabled: adaptiveSettings.virtualScroll.enabled,
          renderedItems: adaptiveSettings.virtualScroll.enabled ? virtualizer.getVirtualItems().length : messages.length,
          totalItems: messages.length,
          renderTime: Math.round(renderTime),
          performance: adaptiveSettings.virtualScroll.enabled ? 'virtualized' : 'standard'
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages.length, adaptiveSettings.virtualScroll.enabled, virtualizer]);

  // Debounced обработчик скролла
  const debouncedScroll = useMemo(() => 
    debounce((e) => {
      if (!e || !e.target) return;
      
      if (ENABLE_PERFORMANCE_LOGS) {
        console.log('📜 Scroll debounced');
      }
      
      // Вызываем onScroll
      if (onScroll) {
        onScroll(e);
      }
      
      // Логуем для метрик
      if (ENABLE_PERFORMANCE_LOGS) {
        performanceLogger.logScroll({ debouncedEvents: 1, totalEvents: 1, debounceRate: 100 });
      }
    }, 150, { 
      leading: true,  // Вызывать сразу
      trailing: true  // И в конце
    })
  , [onScroll]);

  // Очистка debounce при размонтировании
  useEffect(() => {
    return () => debouncedScroll.cancel();
  }, [debouncedScroll]);

  // Функция прокрутки вниз
  const handleScrollToBottom = useCallback(() => {
    if (actualContainerRef.current) {
      actualContainerRef.current.scrollTop = actualContainerRef.current.scrollHeight;
    }
  }, [actualContainerRef]);

  // Эффект для прокрутки вниз при новых сообщениях
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      // Небольшая задержка для плавности
      requestAnimationFrame(() => {
        handleScrollToBottom();
      });
    }
  }, [messages.length, isAtBottom, handleScrollToBottom]);

  // Обработчик клика по кнопке "Новые сообщения"
  const handleNewMessagesClick = useCallback(() => {
    handleScrollToBottom();
    if (onNewMessagesClick) {
      onNewMessagesClick();
    }
  }, [handleScrollToBottom, onNewMessagesClick]);

  // Мемоизированные виртуальные элементы
  const virtualItems = virtualizer.getVirtualItems();

  // Если виртуализация отключена, рендерим обычный список
  if (!adaptiveSettings.virtualScroll.enabled) {
    return (
      <div className="virtualized-message-list">
        <div 
          ref={actualContainerRef}
          className="virtualized-message-list__container"
          onScroll={debouncedScroll}
        >
          <div className="virtualized-message-list__content">
            {messages.map((message, index) => (
              <MessageCard 
                key={message.id || index} 
                message={message} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Виртуализированный список
  return (
    <div className="virtualized-message-list">
      <div 
        ref={actualContainerRef}
        className="virtualized-message-list__container"
        onScroll={debouncedScroll}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const message = messages[virtualItem.index];
            if (!message) return null;
            
            return (
              <div
                key={message.id || virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '0 var(--spacing-xs)', // Добавляем отступы по краям
                  boxSizing: 'border-box', // Включаем отступы в размер
                }}
              >
                <MessageCard message={message} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedMessageList;
