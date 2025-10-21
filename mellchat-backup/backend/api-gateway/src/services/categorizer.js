// Message categorizer service placeholder
const categorizer = {
  categorizeMessage(message) {
    // Simple categorization logic
    const text = message.message.toLowerCase();
    
    if (text.includes('?')) {
      return 'question';
    } else if (text.includes('!') || text.includes('круто') || text.includes('супер')) {
      return 'reaction';
    } else {
      return 'comment';
    }
  },
  
  extractQuestions(messages) {
    return messages.filter(msg => msg.type === 'question');
  }
};

module.exports = categorizer;
