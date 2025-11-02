const logger = require('../utils/logger');
const authService = require('../services/authService');

// JWT token verification middleware
const requireAuth = async (req, res, next) => {
  try {
    // Извлечение токена из заголовка Authorization или cookies
    let token = null;
    
    // Проверка заголовка Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Проверка cookies (fallback)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    // Верификация токена
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Установка данных пользователя в req.user
    req.user = {
      userId: payload.userId,
      email: payload.email,
      phone: payload.phone
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
};

// Optional auth middleware (doesn't block if no token)
const optionalAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header if present
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      const payload = authService.verifyToken(token);
      if (payload) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          phone: payload.phone
        };
      }
    }
    
    // Отслеживаем гостевую сессию, если пользователь не авторизован
    if (!req.user) {
      const guestSessionService = require('../services/guestSessionService');
      const sessionId = req.headers['x-session-id'] || req.cookies?.guest_session_id || null;
      
      if (sessionId) {
        try {
          await guestSessionService.createOrUpdateSession(sessionId, {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              referer: req.headers.referer,
              origin: req.headers.origin
            }
          });
          req.guestSessionId = sessionId;
        } catch (error) {
          logger.warn('Failed to track guest session:', error.message);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

module.exports = {
  requireAuth,
  optionalAuth
};
