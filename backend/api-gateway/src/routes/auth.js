const express = require('express');
const passport = require('../config/passport');
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Google OAuth login
router.get('/google',
  passport.authenticate('google', { 
    session: false,
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}?auth=failed`
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = authService.generateToken(req.user);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      logger.info(`User logged in: ${req.user.email}`);
      
      // Redirect to frontend with token in URL (for easier mobile/extension handling)
      res.redirect(`${FRONTEND_URL}?auth=success&token=${token}`);
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.redirect(`${FRONTEND_URL}?auth=error`);
    }
  }
);

// Get current user profile
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = authService.getUserById(req.user.userId);
    
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
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt
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

// Verify token (for frontend/extension)
router.post('/verify', (req, res) => {
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
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    const user = authService.getUserById(payload.userId);
    
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
        name: user.name,
        avatar: user.avatar,
        role: user.role
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

module.exports = router;

