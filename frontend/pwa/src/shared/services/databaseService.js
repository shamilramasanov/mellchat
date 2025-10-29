// Database API service for frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class DatabaseService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Database API request failed:', error);
      throw error;
    }
  }

  // Get messages from database for a specific stream
  async getMessages(streamId, limit = 100, offset = 0) {
    return this.request(`/database/messages/${streamId}?limit=${limit}&offset=${offset}`);
  }

  // Get questions from database for a specific stream
  async getQuestions(streamId, limit = 50, offset = 0) {
    return this.request(`/database/questions/${streamId}?limit=${limit}&offset=${offset}`);
  }

  // Search messages in database
  async searchMessages(streamId, searchQuery, limit = 50, offset = 0) {
    return this.request(`/database/search/${streamId}?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`);
  }

  // Get stream statistics
  async getStreamStats(streamId) {
    return this.request(`/database/stats/${streamId}`);
  }

  // Test database connection
  async testConnection() {
    return this.request('/database/health?v=' + Date.now());
  }
}

export const databaseService = new DatabaseService();
