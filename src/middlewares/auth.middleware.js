const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

// Authentication = "WHO are you?"
// Reads the JWT from the httpOnly cookie (browsers) or the Authorization
// header (mobile apps / Postman), verifies it, and attaches the user to req.
async function requireAuth(req, _res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.token || bearer;

  if (!token) throw ApiError.unauthorized('Please log in');

  // Throws JsonWebTokenError / TokenExpiredError -> handled by error middleware.
  // Express 5 forwards errors thrown in async middleware to the error handler automatically.
  const payload = jwt.verify(token, env.JWT_SECRET);

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = user;
  next();
}

module.exports = { requireAuth };
