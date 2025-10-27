// frontend/pwa/src/shared/services/messagesApi.js
const API_BASE_URL = 'http://localhost:3001/api/v1';

class MessagesApiService {
  // Получить сообщения стрима
  async getStreamMessages(streamId, options = {}) {
    const { limit = 50, offset = 0, isQuestion } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(isQuestion && { isQuestion: 'true' })
    });
    
    const response = await fetch(`${API_BASE_URL}/messages/stream/${streamId}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Получить только вопросы стрима
  async getStreamQuestions(streamId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}/messages/stream/${streamId}/questions?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Получить статистику стрима
  async getStreamStats(streamId) {
    const response = await fetch(`${API_BASE_URL}/messages/stream/${streamId}/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stream stats: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Оценить сообщение
  async rateMessage(messageId, userId, score) {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, score })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to rate message: ${response.status}`);
    }
    
    return await response.json();
  }
}

export const messagesApi = new MessagesApiService();
