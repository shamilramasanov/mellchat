import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash';
import MessageCard from '../../features/chat/components/MessageCard';
import SimpleMessageList from './SimpleMessageList';
import deviceDetection from '../utils/deviceDetection';
import performanceLogger from '../utils/performanceLogger';
import measurementCache from '../utils/measurementCache.js';
import anchorPositioning from '../utils/anchorPositioning.js';
import './VirtualizedMessageList.css';

// Флаг для включения/отключения логов оптимизации
const ENABLE_PERFORMANCE_LOGS = true;

// CONSTANTS для Phase 1 оптимизации
const VIRTUALIZATION_THRESHOLD = 200; // Виртуализация ТОЛЬКО если > 200 messages
const DOM_LIMIT = 200; // Максимум 200 сообщений в DOM

const VirtualizedMessageList = ({ 
  messages = [], 
  onScroll, 
  scrollToBottom,
  isAtBottom,
  showNewMessagesButton,
  onNewMessagesClick,
  containerRef
}) => {
  // PHASE 1: Hybrid подход - Simple List для малого количества сообщений
  if (messages.length <= VIRTUALIZATION_THRESHOLD) {
    return (
      <SimpleMessageList
        messages={messages}
        onScroll={onScroll}
        scrollToBottom={scrollToBottom}
        isAtBottom={isAtBottom}
        showNewMessagesButton={showNewMessagesButton}
        onNewMessagesClick={onNewMessagesClick}
        containerRef={containerRef}
      />
    );
  }

  // PHASE 1: Ограничиваем до последних 200 messages при виртуализации
  const displayMessages = messages.slice(-DOM_LIMIT);

  const parentRef = useRef(null);
  const actualContainerRef = containerRef || parentRef;
  
  // Получаем адаптивные настройки
  const adaptiveSettings = deviceDetection.getAdaptiveSettings() || {
    virtualScroll: {
      enabled: true,
      itemHeight: 60,
      overscan: 10
    }
  };

  // Настройки виртуализации с Measurement Cache + Smart Estimation
  const virtualizerSettings = useMemo(() => ({
    count: displayMessages.length,
    getScrollElement: () => actualContainerRef.current,
    estimateSize: (index) => {
      const message = displayMessages[index];
      if (!message) return 60;
      
      // Pattern 2: Проверяем Measurement Cache
      const cachedHeight = measurementCache.getHeight(message, null);
      if (cachedHeight) {
        return cachedHeight;
      }
      
      // Pattern 5: Smart Estimation как fallback
      const textLength = (message.text || message.content || '').length;
      let estimatedHeight = 60; // Default
      
      if (textLength < 50) estimatedHeight = 60;      // Short: 60px
      else if (textLength < 200) estimatedHeight = 90;        // Medium: 90px
      else estimatedHeight = 150;                      // Long: 150px
      
      // Сохраняем оценку в кэш
      measurementCache.setHeight(message.id, estimatedHeight);
      
      return estimatedHeight;
    },
    overscan: 10,
    enabled: true
  }), [displayMessages.length, actualContainerRef, displayMessages]);

  // Создаем виртуализатор
  const virtualizer = useVirtualizer(virtualizerSettings);

  // Функция для измерения реальной высоты элемента с кэшированием
  const measureElement = useCallback((element, index) => {
    if (!element) return;
    
    const message = displayMessages[index];
    if (!message) return;
    
    // Pattern 2: Измеряем реальную высоту
    // Используем scrollHeight для измерения контента + padding
    // Не используем getBoundingClientRect, так как он включает внешние отступы
    const height = element.scrollHeight || element.offsetHeight || 0;
    
    if (height > 0) {
      // Сохраняем в кэш
      measurementCache.setHeight(message.id, height);
      
      // Обновляем виртуализатор
      virtualizer.measureElement(element);
      
      if (ENABLE_PERFORMANCE_LOGS) {
        console.log(`📏 Measured: ${height}px for "${(message.text || message.content || '').substring(0, 30)}..."`);
      }
    }
  }, [virtualizer, displayMessages]);

  // Логируем виртуализацию
  useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    
    if (ENABLE_PERFORMANCE_LOGS) {
      console.log('🔍 Virtualization stats:', {
        totalMessages: messages.length,
        displayMessages: displayMessages.length,
        virtualItemsCount: virtualItems.length,
        firstVisibleIndex: virtualItems[0]?.index || 'none',
        lastVisibleIndex: virtualItems[virtualItems.length - 1]?.index || 'none'
      });
      
      performanceLogger.logVirtualization({
        enabled: true,
        renderedItems: virtualItems.length,
        totalItems: messages.length,
        renderTime: 0,
        performance: 'virtualized-hybrid'
      });
    }
  }, [messages.length, displayMessages.length, virtualizer]);

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

  // Виртуализированный список (только когда messages > 200)
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
            const message = displayMessages[virtualItem.index];
            if (!message) return null;
            
            return (
              <div
                key={message.id || virtualItem.index}
                id={`message-${message.id}`} // Pattern 1: id для anchor positioning
                data-index={virtualItem.index} // Требуется для TanStack Virtual
                ref={(el) => {
                  if (el) {
                    virtualizer.measureElement(el); // Register element
                    requestAnimationFrame(() => {
                      measureElement(el, virtualItem.index);
                    });
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  contain: 'strict', // Pattern 3: CSS contain для performance
                  boxSizing: 'border-box',
                  paddingBottom: 'var(--spacing-xs)', // Отступ между сообщениями
                }}
              >
                <MessageCard message={message} />
              </div>
            );
          })}
          
          {/* Предупреждение о лимите */}
          {messages.length > DOM_LIMIT && (
            <div style={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              padding: '8px 12px',
              background: 'rgba(255, 193, 7, 0.1)',
              color: 'rgba(255, 193, 7, 0.9)',
              fontSize: '12px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 193, 7, 0.2)',
              zIndex: 10
            }}>
              Показаны последние {displayMessages.length} из {messages.length} сообщений
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedMessageList;
