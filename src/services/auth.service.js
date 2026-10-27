// Services hold the business logic. They know nothing about Express
// (no req / res), which makes them easy to test and reuse.
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

function signToken(userId) {
  // "sub" (subject) is the standard JWT claim for "who this token is about".
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRES_IN_DAYS}d`,
  });
}

async function signup({ firstName, lastName, emailId, password }) {
  const exists = await User.exists({ emailId });
  if (exists) throw ApiError.conflict('Email is already registered');

  // The pre-save hook in the model hashes the password.
  const user = await User.create({ firstName, lastName, emailId, password });
  return { user, token: signToken(user._id) };
}

async function login({ emailId, password }) {
  const user = await User.findOne({ emailId }).select('+password');

  // Same message for "no user" and "wrong password", so attackers
  // can't find out which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return { user, token: signToken(user._id) };
}

module.exports = { signup, login, signToken };
