// Batch Updates - группировка DOM обновлений через RAF для производительности
import React from 'react';

class BatchUpdateScheduler {
  constructor() {
    this.pendingUpdates = new Set();
    this.rafId = null;
    this.batchCallback = null;
  }

  // Запланировать обновление
  scheduleUpdate(updateFn) {
    this.pendingUpdates.add(updateFn);
    this.scheduleBatch();
  }

  // Запланировать batch обновление через RAF
  scheduleBatch() {
    if (this.rafId !== null) return; // Уже запланировано

    this.rafId = requestAnimationFrame(() => {
      this.flushBatch();
    });
  }

  // Выполнить все pending обновления
  flushBatch() {
    if (this.pendingUpdates.size === 0) {
      this.rafId = null;
      return;
    }

    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.rafId = null;

    // Выполняем все обновления
    updates.forEach(updateFn => {
      try {
        updateFn();
      } catch (error) {
        console.error('Batch update error:', error);
      }
    });

    // Если есть callback, вызываем его
    if (this.batchCallback) {
      this.batchCallback();
    }
  }

  // Отменить scheduled batch
  cancel() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdates.clear();
  }

  // Установить callback после batch
  setCallback(callback) {
    this.batchCallback = callback;
  }

  // Очистить все
  clear() {
    this.cancel();
    this.batchCallback = null;
  }
}

// Глобальный экземпляр
const batchUpdateScheduler = new BatchUpdateScheduler();

// React hook для batch updates
export const useBatchUpdate = () => {
  const scheduleUpdate = React.useCallback((updateFn) => {
    batchUpdateScheduler.scheduleUpdate(updateFn);
  }, []);

  React.useEffect(() => {
    return () => {
      // Очистка при размонтировании
      batchUpdateScheduler.cancel();
    };
  }, []);

  return scheduleUpdate;
};

// Утилита для batch state updates
export const batchStateUpdate = (setStateFn, updates) => {
  batchUpdateScheduler.scheduleUpdate(() => {
    setStateFn(updates);
  });
};

export default batchUpdateScheduler;

