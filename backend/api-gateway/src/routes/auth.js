const express = require('express');
const passport = require('../config/passport');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const { rateLimiters } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Google OAuth login
router.get('/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.error('Google OAuth attempt but credentials not configured');
      return res.status(503).json({
        success: false,
        error: 'Google OAuth не настроен. Проверьте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env'
      });
    }
    
    logger.info('Google OAuth login initiated', {
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
      referer: req.get('referer'),
      userAgent: req.get('user-agent')
    });
    
    next();
  },
  passport.authenticate('google', { 
    session: false,
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
router.get('/google/callback',
  (req, res, next) => {
    logger.info('Google OAuth callback received', {
      query: req.query,
      hasError: !!req.query.error,
      error: req.query.error,
      errorDescription: req.query.error_description
    });
    
    if (req.query.error) {
      logger.error('Google OAuth error from Google:', {
        error: req.query.error,
        errorDescription: req.query.error_description,
        hint: 'Проверьте callback URL в Google Cloud Console и OAuth consent screen'
      });
      return res.redirect(`${FRONTEND_URL}?auth=failed&error=${encodeURIComponent(req.query.error)}&reason=${encodeURIComponent(req.query.error_description || 'Unknown error')}`);
    }
    
    next();
  },
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}?auth=failed`
  }),
  (req, res) => {
    try {
      if (!req.user) {
        logger.error('OAuth callback: req.user is missing');
        return res.redirect(`${FRONTEND_URL}?auth=failed&reason=user_not_found`);
      }
      
      // Generate JWT token
      const token = authService.generateToken(req.user);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      logger.info(`✅ User logged in successfully: ${req.user.email}`);
      
      // Redirect to frontend with token in URL (for easier mobile/extension handling)
      res.redirect(`${FRONTEND_URL}?auth=success&token=${token}`);
    } catch (error) {
      logger.error('❌ OAuth callback error:', {
        error: error.message,
        stack: error.stack,
        user: req.user
      });
      res.redirect(`${FRONTEND_URL}?auth=error&reason=${encodeURIComponent(error.message)}`);
    }
  }
);

// Send email code for email authorization
router.post('/email/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    logger.info('Email send-code request:', { email, body: req.body });
    
    if (!email) {
      logger.warn('Email send-code: email is missing');
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const result = await emailService.sendCode(email);
    
    logger.info('Email send-code result:', { success: result.success, error: result.error });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        retryAfter: result.retryAfter
      });
    }
    
    res.json({
      success: true,
      message: 'Email code sent',
      retryAfter: result.retryAfter
    });
  } catch (error) {
    logger.error('Send email code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email code',
      details: error.message
    });
  }
});

// Verify email code and login/register
router.post('/email/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and code are required'
      });
    }
    
    // Проверка кода
    const verifyResult = await emailService.verifyCode(email, code);
    
    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        error: verifyResult.error,
        attemptsLeft: verifyResult.attemptsLeft
      });
    }
    
    // Поиск или создание пользователя
    const user = await authService.findOrCreateByEmail(email);
    
    // Обновление last_login_at
    await authService.updateUser(user.id, {
      last_login_at: new Date()
    });
    
    // Генерация JWT токена
    const token = authService.generateToken(user);
    
    logger.info(`User authenticated via email: ${email} (${user.id})`);
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        hasPassword: user.hasPassword,
        name: user.name,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        createdAt: user.createdAt
      },
      isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 60000
    });
  } catch (error) {
    logger.error('Verify email code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify code'
    });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await authService.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        hasPassword: user.hasPassword,
        name: user.name,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token (for frontend/extension) - мягкий rate limiter
router.post('/verify', rateLimiters.authVerify, async (req, res) => {
  try {
    const token = req.body.token || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      logger.warn('Token verification failed: invalid token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    logger.info('Token verified, looking for user:', { userId: payload.userId, email: payload.email });
    const user = await authService.findUserById(payload.userId);
    
    if (!user) {
      logger.error('User not found after token verification:', { userId: payload.userId, email: payload.email });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.info('User found for token verification:', { userId: user.id, email: user.email });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        hasPassword: user.hasPassword,
        name: user.name,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Token verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Найти гостевую сессию по fingerprint
router.post('/guest/find-by-fingerprint', rateLimiters.general, async (req, res) => {
  try {
    const { fingerprint } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint is required'
      });
    }
    
    const guestSessionService = require('../services/guestSessionService');
    const session = await guestSessionService.findSessionByFingerprint(fingerprint);
    
    if (session) {
      logger.info('Found existing session by fingerprint:', { sessionId: session.sessionId, fingerprint });
      return res.json({
        success: true,
        sessionId: session.sessionId,
        found: true
      });
    }
    
    res.json({
      success: true,
      found: false
    });
  } catch (error) {
    logger.error('Error finding session by fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find session by fingerprint'
    });
  }
});

// Регистрация гостевой сессии - мягкий rate limiter
router.post('/guest/register', rateLimiters.general, optionalAuth, async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.headers['x-session-id'] || req.guestSessionId;
    const fingerprint = req.body.fingerprint || null;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    const guestSessionService = require('../services/guestSessionService');
    
    // Если есть fingerprint и он не совпадает с текущей сессией, ищем существующую
    if (fingerprint) {
      const existingSession = await guestSessionService.findSessionByFingerprint(fingerprint);
      if (existingSession && existingSession.sessionId !== sessionId) {
        // Объединяем статистику: берем существующую сессию и обновляем её
        logger.info('Merging guest session:', { 
          newSessionId: sessionId, 
          existingSessionId: existingSession.sessionId,
          fingerprint 
        });
        
        // Обновляем существующую сессию вместо создания новой
        await guestSessionService.createOrUpdateSession(existingSession.sessionId, {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          fingerprint,
          metadata: {
            referer: req.headers.referer,
            origin: req.headers.origin,
            action: 'guest_continue',
            merged_from: sessionId
          }
        });
        
        return res.json({
          success: true,
          sessionId: existingSession.sessionId,
          merged: true
        });
      }
    }
    
    await guestSessionService.createOrUpdateSession(sessionId, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      fingerprint,
      metadata: {
        referer: req.headers.referer,
        origin: req.headers.origin,
        action: 'guest_continue'
      }
    });
    
    logger.info('Guest session registered:', { sessionId, hasFingerprint: !!fingerprint });
    
    res.json({
      success: true,
      sessionId: sessionId
    });
  } catch (error) {
    logger.error('Error registering guest session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register guest session'
    });
  }
});

module.exports = router;

