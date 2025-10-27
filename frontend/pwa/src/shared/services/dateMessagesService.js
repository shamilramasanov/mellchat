// frontend/pwa/src/shared/services/dateMessagesService.js
class DateMessagesService {
  constructor() {
    this.API_BASE_URL = '/api/v1';
  }

  async request(endpoint, options = {}) {
    const url = `${this.API_BASE_URL}${endpoint}`;
    console.log('🌐 Making date messages request to:', url);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('📤 Date messages request config:', config);
      const response = await fetch(url, config);
      console.log('📥 Date messages response status:', response.status);
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Date Messages API request failed:', error);
      throw error;
    }
  }

  /**
   * Получить сообщения за конкретную дату
   * @param {string} streamId - ID стрима
   * @param {string} date - Дата в формате YYYY-MM-DD
   * @param {number} offset - Смещение (количество пропущенных сообщений)
   * @param {number} limit - Количество сообщений (по умолчанию 20)
   */
  async getMessagesByDate(streamId, date, offset = 0, limit = 20) {
    // Преобразуем ISO дату в простой формат YYYY-MM-DD
    let formattedDate = date;
    if (date && date.includes('T')) {
      formattedDate = date.split('T')[0];
    }
    
    const params = new URLSearchParams({
      date: formattedDate,
      offset: offset.toString(),
      limit: limit.toString()
    });
    
    return this.request(`/date-messages/${streamId}?${params.toString()}`);
  }

  /**
   * Получить список доступных дат для стрима
   * @param {string} streamId - ID стрима
   */
  async getAvailableDates(streamId) {
    return this.request(`/date-messages/${streamId}/available-dates`);
  }

  /**
   * Форматировать дату для отображения
   * @param {string} dateString - Дата в формате YYYY-MM-DD
   */
  formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Проверяем, сегодня ли это
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }

    // Проверяем, вчера ли это
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }

    // Для остальных дат форматируем как "DD.MM"
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  }

  /**
   * Получить следующую дату для загрузки
   * @param {string[]} availableDates - Массив доступных дат
   * @param {string} currentDate - Текущая дата (последняя загруженная)
   */
  getNextDateToLoad(availableDates, currentDate) {
    if (!availableDates || availableDates.length === 0) {
      return null;
    }

    // Сортируем даты по убыванию (новые сначала)
    const sortedDates = [...availableDates].sort((a, b) => new Date(b) - new Date(a));
    
    if (!currentDate) {
      // Если текущей даты нет, возвращаем самую старую дату
      // Это означает, что пользователь только что открыл стрим и хочет загрузить старые сообщения
      return sortedDates[sortedDates.length - 1];
    }

    // Находим индекс текущей даты
    const currentIndex = sortedDates.findIndex(date => date === currentDate);
    
    if (currentIndex === -1 || currentIndex === sortedDates.length - 1) {
      // Если дата не найдена или это последняя дата, возвращаем null
      return null;
    }

    // Возвращаем следующую (более старую) дату
    return sortedDates[currentIndex + 1];
  }
}

export const dateMessagesService = new DateMessagesService();
export default dateMessagesService;
