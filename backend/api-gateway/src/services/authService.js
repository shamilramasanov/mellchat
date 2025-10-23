const logger = require('../utils/logger');

// Simple in-memory user storage (for development)
const users = new Map();

const authService = {
  findOrCreateUser: (profile, provider) => {
    const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.com`;
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    
    if (existingUser) {
      logger.info(`User found: ${email}`);
      return existingUser;
    }
    
    const newUser = {
      id: profile.id,
      email: email,
      name: profile.displayName || profile.username || 'User',
      provider: provider,
      createdAt: new Date()
    };
    
    users.set(profile.id, newUser);
    logger.info(`User created: ${email}`);
    return newUser;
  },
  
  getUserById: (id) => {
    return users.get(id) || null;
  },
  
  getUserByEmail: (email) => {
    return Array.from(users.values()).find(u => u.email === email) || null;
  }
};

module.exports = authService;
