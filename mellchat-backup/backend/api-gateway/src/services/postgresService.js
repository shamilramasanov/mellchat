// PostgreSQL service placeholder
const postgresService = {
  async getMessages() {
    return [];
  },
  
  async createMessage(message) {
    return { id: Date.now(), ...message };
  },
  
  async getQuestions() {
    return [];
  },
  
  async createQuestion(question) {
    return { id: Date.now(), ...question };
  }
};

module.exports = postgresService;
