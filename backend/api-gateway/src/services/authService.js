const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'mellchat-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// In-memory user store (later: move to Redis/Postgres)
const users = new Map();

class AuthService {
  // Find or create user from OAuth profile
  findOrCreateUser(profile, provider = 'google') {
    const userId = `${provider}-${profile.id}`;
    
    if (users.has(userId)) {
      const user = users.get(userId);
      user.lastLoginAt = new Date();
      return user;
    }
    
    // Create new user
    const user = {
      id: userId,
      provider,
      providerId: profile.id,
      email: profile.emails?.[0]?.value || null,
      name: profile.displayName || profile.name?.givenName || 'User',
      avatar: profile.photos?.[0]?.value || null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      role: 'user' // user | streamer | admin
    };
    
    users.set(userId, user);
    logger.info(`New user created: ${user.email}`);
    
    return user;
  }
  
  // Get user by ID
  getUserById(userId) {
    return users.get(userId) || null;
  }
  
  // Generate JWT token
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
  
  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('JWT verify error:', error.message);
      return null;
    }
  }
  
  // Get all users (admin only)
  getAllUsers() {
    return Array.from(users.values());
  }
  
  // Update user role
  updateUserRole(userId, role) {
    const user = users.get(userId);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  }
}

module.exports = new AuthService();

