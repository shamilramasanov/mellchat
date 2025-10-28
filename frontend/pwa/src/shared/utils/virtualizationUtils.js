// Утилита для настройки виртуализации под разные экраны
export const getVirtualizationSettings = (screenWidth, screenHeight) => {
  // Определяем тип экрана
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  
  // Базовые настройки
  const baseSettings = {
    enabled: true,
    dynamicSizing: true,
    overscan: 10
  };
  
  if (isMobile) {
    return {
      ...baseSettings,
      itemHeight: 60,
      minHeight: 50,
      maxHeight: 200,
      overscan: 5,
      // Мобильные настройки
      padding: '8px',
      fontSize: '14px',
      lineHeight: 1.4
    };
  }
  
  if (isTablet) {
    return {
      ...baseSettings,
      itemHeight: 70,
      minHeight: 60,
      maxHeight: 250,
      overscan: 8,
      // Планшетные настройки
      padding: '12px',
      fontSize: '15px',
      lineHeight: 1.5
    };
  }
  
  // Desktop
  return {
    ...baseSettings,
    itemHeight: 80,
    minHeight: 70,
    maxHeight: 300,
    overscan: 10,
    // Десктопные настройки
    padding: '16px',
    fontSize: '16px',
    lineHeight: 1.6
  };
};

// Функция для расчета высоты сообщения
export const calculateMessageHeight = (message, settings) => {
  const text = message.text || message.content || '';
  const textLength = text.length;
  
  // Базовые размеры
  const baseHeight = settings.itemHeight;
  const lineHeight = settings.lineHeight;
  const fontSize = parseInt(settings.fontSize);
  
  // Примерное количество символов на строку (зависит от ширины экрана)
  const charsPerLine = Math.floor(window.innerWidth / (fontSize * 0.6));
  
  // Количество строк
  const lines = Math.ceil(textLength / charsPerLine);
  
  // Вычисляем высоту
  const calculatedHeight = baseHeight + (lines - 1) * (fontSize * lineHeight);
  
  // Ограничиваем минимальной и максимальной высотой
  return Math.max(
    settings.minHeight,
    Math.min(settings.maxHeight, calculatedHeight)
  );
};

// Функция для обновления настроек при изменении размера экрана
export const updateVirtualizationOnResize = (callback) => {
  let timeout;
  
  const handleResize = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const newSettings = getVirtualizationSettings(
        window.innerWidth,
        window.innerHeight
      );
      callback(newSettings);
    }, 300); // Debounce на 300ms
  };
  
  window.addEventListener('resize', handleResize);
  
  // Возвращаем функцию для очистки
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(timeout);
  };
};
