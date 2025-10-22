const authService = require('../services/authService');
const logger = require('../utils/logger');

// Optional authentication - adds user to req if token present
const optionalAuth = (req, res, next) => {
  try {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      
      if (payload) {
        req.user = payload;
      }
    }
    
    // Check cookie
    if (!req.user && req.cookies?.token) {
      const payload = authService.verifyToken(req.cookies.token);
      if (payload) {
        req.user = payload;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

// Required authentication - returns 401 if no valid token
const requireAuth = (req, res, next) => {
  try {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      
      if (payload) {
        req.user = payload;
        return next();
      }
    }
    
    // Check cookie
    if (req.cookies?.token) {
      const payload = authService.verifyToken(req.cookies.token);
      if (payload) {
        req.user = payload;
        return next();
      }
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication'
    });
  }
};

// Require specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole
};

