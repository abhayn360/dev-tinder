const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

// 404 for any route that didn't match.
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// Converts known library errors into ApiErrors with the right status code.
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid ${err.path}`);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Invalid or expired token');
  }
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }

  // Unknown error = a bug. Status 500.
  return new ApiError(500, 'Internal server error');
}

// Central error handler. It has 4 arguments, which is how Express recognises it.
function errorHandler(err, req, res, _next) {
  const apiError = normalizeError(err);

  if (apiError.statusCode >= 500) {
    logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      message: apiError.message,
      ...(apiError.details && { details: apiError.details }),
      // Stack traces help in development but leak internals in production.
      ...(!env.isProduction && apiError.statusCode >= 500 && { stack: err.stack }),
    },
  });
}

module.exports = { notFound, errorHandler };
