const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

async function updateProfile(user, updates) {
  // set() + save() runs schema validators and hooks (findOneAndUpdate skips hooks).
  user.set(updates);
  await user.save();
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }
  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
}

module.exports = { updateProfile, changePassword };
