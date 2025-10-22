/**
 * Error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  console.error('API Error:', error);
  
  // Default error response
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = 'Not found';
    code = 'NOT_FOUND';
  }
  
  res.status(status).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

module.exports = errorHandler;
