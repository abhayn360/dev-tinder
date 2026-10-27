// Controllers are thin: read the request, call a service, send the response.
// Express 5 catches errors thrown in async handlers, so no try/catch is needed here.
const env = require('../config/env');
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript in the browser can't read it -> protects against XSS token theft
  secure: env.isProduction, // only sent over HTTPS in production
  sameSite: 'lax', // basic CSRF protection
  maxAge: env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
};

async function signup(req, res) {
  const { user, token } = await authService.signup(req.validated.body);
  res.cookie('token', token, COOKIE_OPTIONS);
  sendSuccess(res, { statusCode: 201, message: 'User registered successfully', data: { user } });
}

async function login(req, res) {
  const { user, token } = await authService.login(req.validated.body);
  res.cookie('token', token, COOKIE_OPTIONS);
  sendSuccess(res, { message: 'Logged in successfully', data: { user, token } });
}

function logout(_req, res) {
  const { maxAge: _maxAge, ...clearOptions } = COOKIE_OPTIONS;
  res.clearCookie('token', clearOptions);
  sendSuccess(res, { message: 'Logged out successfully' });
}

module.exports = { signup, login, logout };
