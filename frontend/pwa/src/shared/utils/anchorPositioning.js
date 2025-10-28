// Pattern 1: Anchor-based Virtual Scrolling
// Сохраняем относительную позицию при добавлении новых элементов

class AnchorPositioning {
  constructor() {
    this.anchor = null; // { messageId, offsetFromTop }
    this.prevScrollTop = 0;
    this.prevScrollHeight = 0;
  }

  // Установить anchor перед обновлением списка
  setAnchor(container, visibleMessages) {
    if (!container || visibleMessages.length === 0) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const middleViewport = scrollTop + containerHeight / 2;

    // Находим сообщение ближайшее к центру viewport
    let targetMessage = visibleMessages[0];
    let minDistance = Infinity;

    let currentOffset = 0;
    for (const message of visibleMessages) {
      const element = document.getElementById(`message-${message.id}`);
      if (element) {
        const elementTop = currentOffset;
        const elementBottom = currentOffset + element.offsetHeight;
        const elementCenter = elementTop + element.offsetHeight / 2;

        const distance = Math.abs(middleViewport - elementCenter);
        if (distance < minDistance) {
          minDistance = distance;
          targetMessage = message;
        }

        currentOffset += element.offsetHeight;
      }
    }

    if (targetMessage) {
      const element = document.getElementById(`message-${targetMessage.id}`);
      const anchorOffset = element 
        ? scrollTop - element.offsetTop 
        : 0;

      this.anchor = {
        messageId: targetMessage.id,
        offset: anchorOffset,
        scrollTop: scrollTop,
        scrollHeight: container.scrollHeight
      };

      console.log(`⚓ Anchor set: message ${targetMessage.id}, offset ${anchorOffset}px`);
    }

    this.prevScrollTop = scrollTop;
    this.prevScrollHeight = container.scrollHeight;
  }

  // Восстановить позицию после обновления списка
  restoreAnchor(container) {
    if (!this.anchor || !container) return;

    // Небольшая задержка для завершения рендера
    requestAnimationFrame(() => {
      const element = document.getElementById(`message-${this.anchor.messageId}`);
      
      if (element) {
        const newScrollTop = element.offsetTop + this.anchor.offset;
        
        // Вычисляем изменение высоты контейнера
        const heightChange = container.scrollHeight - this.prevScrollHeight;
        const newScrollTopAdjusted = newScrollTop + heightChange;

        container.scrollTop = newScrollTopAdjusted;

        console.log(`⚓ Anchor restored: scroll to ${newScrollTopAdjusted}px (was ${this.anchor.scrollTop}px)`);
      } else {
        console.warn('⚓ Anchor element not found, scroll position may shift');
      }

      // Очищаем anchor после использования
      this.anchor = null;
    });
  }

  // Сброс anchor
  clear() {
    this.anchor = null;
    this.prevScrollTop = 0;
    this.prevScrollHeight = 0;
  }

  // Check if we should maintain anchor (not at bottom)
  shouldMaintainAnchor(container, isAtBottom) {
    if (isAtBottom) {
      this.clear(); // No need for anchor when at bottom
      return false;
    }
    
    if (!container) return false;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Если далеко от низа - нужен anchor
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom > 100; // 100px threshold
  }
}

// Создаем глобальный экземпляр
const anchorPositioning = new AnchorPositioning();

export default anchorPositioning;

