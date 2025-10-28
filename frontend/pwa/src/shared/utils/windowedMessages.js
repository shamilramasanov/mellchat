// Windowed Messages - управление окнами по 50 сообщений
class WindowedMessages {
  constructor(windowSize = 50) {
    this.windowSize = windowSize;
    this.currentWindowStart = 0;
    this.currentWindowEnd = windowSize;
  }

  // Получить текущее окно сообщений
  getCurrentWindow(messages) {
    const end = Math.min(this.currentWindowEnd, messages.length);
    return messages.slice(this.currentWindowStart, end);
  }

  // Получить текущее окно с буфером (окно + предыдущее + следующее)
  getCurrentWindowWithBuffer(messages) {
    const bufferSize = this.windowSize;
    const start = Math.max(0, this.currentWindowStart - bufferSize);
    const end = Math.min(messages.length, this.currentWindowEnd + bufferSize);
    return messages.slice(start, end);
  }

  // Получить видимые индексы (для виртуализации)
  getVisibleIndexes(messages) {
    const start = Math.max(0, this.currentWindowStart - this.windowSize);
    const end = Math.min(messages.length, this.currentWindowEnd + this.windowSize);
    
    const indexes = [];
    for (let i = start; i < end; i++) {
      indexes.push(i);
    }
    
    return indexes;
  }

  // Сместить окно вверх (при скролле вверх)
  scrollUp() {
    if (this.currentWindowStart > 0) {
      this.currentWindowStart = Math.max(0, this.currentWindowStart - this.windowSize);
      this.currentWindowEnd = this.currentWindowStart + this.windowSize;
      return true;
    }
    return false;
  }

  // Сместить окно вниз (при скролле вниз)
  scrollDown(totalMessages) {
    if (this.currentWindowEnd < totalMessages) {
      this.currentWindowEnd = Math.min(totalMessages, this.currentWindowEnd + this.windowSize);
      this.currentWindowStart = this.currentWindowEnd - this.windowSize;
      
      // Если достигли конца, закрепляемся на последнем окне
      if (this.currentWindowEnd >= totalMessages) {
        this.currentWindowEnd = totalMessages;
        this.currentWindowStart = Math.max(0, totalMessages - this.windowSize);
      }
      
      return true;
    }
    return false;
  }

  // Сместить к последнему окну (показать последние N сообщений)
  scrollToBottom(totalMessages) {
    const lastWindowStart = Math.max(0, totalMessages - this.windowSize);
    this.currentWindowStart = lastWindowStart;
    this.currentWindowEnd = totalMessages;
  }

  // Сместить к первому окну
  scrollToTop() {
    this.currentWindowStart = 0;
    this.currentWindowEnd = this.windowSize;
  }

  // Обновить позицию окна на основе scrollTop
  updateFromScroll(scrollTop, totalHeight, containerHeight) {
    // Вычисляем процент прокрутки
    const scrollPercentage = scrollTop / Math.max(1, totalHeight - containerHeight);
    
    // Вычисляем новую позицию окна
    const totalMessages = this.totalMessages || 1000; // fallback
    const newWindowStart = Math.floor(scrollPercentage * (totalMessages - this.windowSize));
    
    if (newWindowStart !== this.currentWindowStart) {
      this.currentWindowStart = Math.max(0, newWindowStart);
      this.currentWindowEnd = Math.min(this.currentWindowStart + this.windowSize, totalMessages);
      return true;
    }
    
    return false;
  }

  // Проверить, нужно ли загрузить предыдущее окно
  shouldLoadPreviousWindow(scrollTop, firstVisibleIndex) {
    // Если скроллим вверх и близки к началу текущего окна
    return firstVisibleIndex < this.currentWindowStart + 10; // 10 messages margin
  }

  // Проверить, нужно ли загрузить следующее окно
  shouldLoadNextWindow(lastVisibleIndex) {
    // Если скроллим вниз и близки к концу текущего окна
    return lastVisibleIndex > this.currentWindowEnd - 10; // 10 messages margin
  }

  // Получить статистику окна
  getStats(totalMessages) {
    return {
      windowSize: this.windowSize,
      currentStart: this.currentWindowStart,
      currentEnd: this.currentWindowEnd,
      currentRange: `${this.currentWindowStart}-${this.currentWindowEnd}`,
      totalMessages: totalMessages,
      percentage: totalMessages > 0 ? ((this.currentWindowEnd / totalMessages) * 100).toFixed(1) + '%' : '0%'
    };
  }

  // Сброс
  reset() {
    this.currentWindowStart = 0;
    this.currentWindowEnd = this.windowSize;
  }
}

// Фабрика для создания экземпляров
export const createWindowedMessages = (windowSize = 50) => {
  return new WindowedMessages(windowSize);
};

export default WindowedMessages;

