/**
 * Authentication middleware
 * For demo purposes, this allows all requests
 * In production, this would validate JWT tokens
 */
const auth = (req, res, next) => {
  // For demo purposes, add a mock user
  req.user = {
    id: 'demo_user',
    username: 'demo',
    role: 'admin',
  };
  
  next();
};

module.exports = auth;
