// Sentiment Analysis Service - анализ настроения сообщений
const logger = require('../utils/logger');

class SentimentService {
  constructor() {
    // Словари для sentiment analysis
    this.positiveWords = [
      'nice', 'good', 'great', 'amazing', 'awesome', 'love', 'wow', 'epic', 
      'best', 'perfect', 'beautiful', 'fantastic', 'excellent', 'wonderful',
      'gg', 'wp', 'gj', 'gr8', 'lit', 'fire', 'goat', 'legend', 'king', 'queen',
      'clutch', 'insane', 'cracked', 'godlike', 'pog', 'poggers', 'pogchamp'
    ];
    
    this.negativeWords = [
      'bad', 'trash', 'terrible', 'awful', 'hate', 'disgusting', 'horrible',
      'fuck', 'shit', 'damn', 'wtf', 'omg', 'crap', 'stupid', 'idiot', 'moron',
      'worst', 'fail', 'fucking', 'kys', 'afk', 'noob', 'toxic', 'garbage',
      'noooo', 'nooo', 'nooooo', 'nope', 'ew', 'yuck', 'ugh', 'bleh'
    ];
    
    // Emoji sentiment
    this.positiveEmojis = [
      '😊', '😁', '😂', '😍', '❤️', '💕', '👍', '🔥', '🎉', '🥳', '✨', '⭐',
      '💯', '🎮', '🎯', '🏆', '👑', '💪', '🤘', '🎊', '🎈', '🌈'
    ];
    
    this.negativeEmojis = [
      '😢', '😡', '😔', '💔', '👎', '💩', '😤', '🤬', '😞', '😰', '😭', '🤮'
    ];
    
    // Текущее настроение (накапливается)
    this.currentMood = {
      happy: 0,
      neutral: 0,
      sad: 0
    };
    
    // История настроения для timeline (последние N минут)
    this.moodHistory = [];
    this.historyMaxSize = 100; // Keep last 100 updates
    
    // Таймер для broadcasting
    this.lastBroadcast = Date.now();
    this.broadcastInterval = 2000; // 2 seconds
  }
  
  /**
   * Analyze sentiment of a message
   * @param {Object} message - Message object with text
   * @returns {string} - 'happy', 'neutral', or 'sad'
   */
  analyzeSentiment(message) {
    const text = (message.text || message.content || '').toLowerCase();
    
    if (!text.trim()) {
      return 'neutral';
    }
    
    let score = 0;
    
    // Analyze words
    const wordScore = this.analyzeWords(text);
    score += wordScore;
    
    // Analyze emojis
    const emojiScore = this.analyzeEmojis(text);
    score += emojiScore;
    
    // Analyze special patterns
    const patternScore = this.analyzePatterns(text);
    score += patternScore;
    
    const sentiment = this.scoreToSentiment(score);
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && score !== 0) {
      logger.debug('🔍 Sentiment breakdown:', {
        text: text.substring(0, 50),
        wordScore,
        emojiScore,
        patternScore,
        totalScore: score,
        sentiment
      });
    }
    
    // Convert score to sentiment
    return sentiment;
  }
  
  /**
   * Analyze positive/negative words
   */
  analyzeWords(text) {
    let score = 0;
    
    this.positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex) || [];
      score += matches.length * 1; // +1 for each positive word
    });
    
    this.negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex) || [];
      score -= matches.length * 1; // -1 for each negative word
    });
    
    return score;
  }
  
  /**
   * Analyze emoji sentiment
   */
  analyzeEmojis(text) {
    let score = 0;
    
    this.positiveEmojis.forEach(emoji => {
      const matches = text.match(new RegExp(emoji, 'g')) || [];
      score += matches.length * 2; // +2 for each positive emoji
    });
    
    this.negativeEmojis.forEach(emoji => {
      const matches = text.match(new RegExp(emoji, 'g')) || [];
      score -= matches.length * 2; // -2 for each negative emoji
    });
    
    // General emoji pattern (emoji spam = positive usually)
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const allEmojis = text.match(emojiPattern) || [];
    
    // Lots of emojis = usually positive
    if (allEmojis.length > 5) {
      score += Math.min(allEmojis.length - 5, 5); // Max +5 for emoji spam
    }
    
    return score;
  }
  
  /**
   * Analyze special patterns (all caps, exclamation marks, etc.)
   */
  analyzePatterns(text) {
    let score = 0;
    
    // All caps = enthusiasm (usually positive)
    if (text === text.toUpperCase() && text.length > 3 && text.match(/[A-Z]/)) {
      score += 2;
    }
    
    // Many exclamation marks = enthusiasm
    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations >= 3) {
      score += 2;
    }
    
    // Questions might be neutral
    if ((text.match(/\?/g) || []).length >= 2) {
      score -= 1;
    }
    
    // Character repetition pattern (e.g., "noooo", "wwwww")
    const repeatedChars = text.match(/(.)\1{3,}/gi);
    if (repeatedChars) {
      repeatedChars.forEach(repeat => {
        const char = repeat[0].toLowerCase();
        if (char === 'n' || char === 'o') {
          score -= 2; // "nooo", "ooooo" = negative
        } else if ('aeiou'.includes(char)) {
          score += 1; // "aaah", "ooooh" = usually positive
        }
      });
    }
    
    return score;
  }
  
  /**
   * Convert score to sentiment category
   */
  scoreToSentiment(score) {
    if (score >= 2) return 'happy';  // Понизили порог с 3 до 2
    if (score <= -2) return 'sad';   // Понизили порог с -3 до -2
    return 'neutral';
  }
  
  /**
   * Update mood statistics
   */
  updateMood(sentiment) {
    if (this.currentMood[sentiment] !== undefined) {
      this.currentMood[sentiment]++;
    }
    
    // Add to history
    this.moodHistory.push({
      sentiment,
      timestamp: Date.now()
    });
    
    // Trim history
    if (this.moodHistory.length > this.historyMaxSize) {
      this.moodHistory.shift();
    }
  }
  
  /**
   * Analyze message and update mood
   */
  processMessage(message) {
    const sentiment = this.analyzeSentiment(message);
    this.updateMood(sentiment);
    
    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Sentiment analysis:', {
        text: (message.text || message.content || '').substring(0, 50),
        sentiment
      });
    }
    
    return {
      ...message,
      sentiment
    };
  }
  
  /**
   * Get current mood statistics
   */
  getMoodStats() {
    return {
      ...this.currentMood,
      total: this.currentMood.happy + this.currentMood.neutral + this.currentMood.sad
    };
  }
  
  /**
   * Get mood history for timeline
   */
  getMoodHistory(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.moodHistory.filter(entry => entry.timestamp > cutoff);
  }
  
  /**
   * Reset mood statistics
   */
  resetMood() {
    this.currentMood = {
      happy: 0,
      neutral: 0,
      sad: 0
    };
    this.moodHistory = [];
  }
  
  /**
   * Check if we should broadcast mood update
   */
  shouldBroadcast() {
    const now = Date.now();
    if (now - this.lastBroadcast >= this.broadcastInterval) {
      this.lastBroadcast = now;
      return true;
    }
    return false;
  }
}

// Create singleton instance
const sentimentService = new SentimentService();

module.exports = sentimentService;

