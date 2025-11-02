const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('../services/authService');
const logger = require('../utils/logger');

logger.info('✅ Passport loading');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback';

// Validate Google OAuth configuration
const isValidClientId = GOOGLE_CLIENT_ID && 
  !GOOGLE_CLIENT_ID.includes('your_') && 
  !GOOGLE_CLIENT_ID.includes('placeholder') &&
  GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com');
  
const isValidClientSecret = GOOGLE_CLIENT_SECRET && 
  !GOOGLE_CLIENT_SECRET.includes('your_') && 
  !GOOGLE_CLIENT_SECRET.includes('placeholder') &&
  GOOGLE_CLIENT_SECRET.length > 20;

// Configure Google OAuth strategy
if (isValidClientId && isValidClientSecret) {
  logger.info('✅ Google OAuth configured', {
    clientId: `${GOOGLE_CLIENT_ID.substring(0, 20)}...`,
    callbackURL: GOOGLE_CALLBACK_URL
  });
  
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      logger.info('Google OAuth callback received', {
        profileId: profile.id,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName
      });
      
      const user = await authService.findOrCreateUser(profile, 'google');
      logger.info(`✅ User authenticated: ${user.email}`);
      return done(null, user);
    } catch (error) {
      logger.error('❌ Google OAuth error:', error);
      return done(error, null);
    }
  }));
} else {
  const issues = [];
  if (!GOOGLE_CLIENT_ID) issues.push('GOOGLE_CLIENT_ID не установлен');
  else if (!isValidClientId) issues.push('GOOGLE_CLIENT_ID невалидный (используется плейсхолдер?)');
  if (!GOOGLE_CLIENT_SECRET) issues.push('GOOGLE_CLIENT_SECRET не установлен');
  else if (!isValidClientSecret) issues.push('GOOGLE_CLIENT_SECRET невалидный (используется плейсхолдер?)');
  
  logger.warn('⚠️  Google OAuth не настроен:', {
    issues,
    callbackURL: GOOGLE_CALLBACK_URL,
    hint: 'Установите реальные значения GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET из Google Cloud Console'
  });
}

// Serialize user (not used in stateless JWT approach, but required by passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = authService.getUserById(id);
  done(null, user);
});

module.exports = passport;

