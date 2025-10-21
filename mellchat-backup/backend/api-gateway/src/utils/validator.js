// Validation utility placeholder
const validator = {
  validateMessage(message) {
    return {
      isValid: true,
      errors: []
    };
  },
  
  validateQuestion(question) {
    return {
      isValid: true,
      errors: []
    };
  },
  
  sanitizeInput(input) {
    return input.trim();
  }
};

module.exports = validator;
