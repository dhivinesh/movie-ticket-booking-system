/**
 * Central async error handler.
 * Wrap all route handlers with asyncHandler() or use Express 5 auto-catch.
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Utility: wrap async route functions to forward errors to errorHandler
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
