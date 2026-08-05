function errorHandler(err, req, res, next) {
 console.error('❌ Error:', err.message);
 console.error(err.stack);

 const statusCode = err.statusCode || 500;
 const message = process.env.NODE_ENV === 'production'
  ? 'Internal server error'
  : err.message;

 res.status(statusCode).json({
  error: message,
  ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
 });
}

module.exports = { errorHandler };
