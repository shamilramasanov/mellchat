// Сервис для ID-based пагинации сообщений
class PaginationMessagesService {
  constructor() {
    this.API_BASE_URL = '/api/v1';
  }

  async getOlderMessages(streamId, beforeId, limit = 20) {
    const params = new URLSearchParams({
      beforeId: beforeId,
      limit: limit.toString()
    });

    return this.request(`/pagination-messages/${streamId}/older?${params.toString()}`);
  }

  async request(endpoint) {
    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Нормализуем сообщения: stream_id -> streamId
      if (data.success && data.messages) {

        data.messages = data.messages.map(message => ({
          ...message,
          streamId: message.stream_id || message.streamId
        }));

      }
      
      return data;
    } catch (error) {
      console.error('Pagination messages service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new PaginationMessagesService();
