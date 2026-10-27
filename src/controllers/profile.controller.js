const profileService = require('../services/profile.service');
const { sendSuccess } = require('../utils/response');

function getProfile(req, res) {
  sendSuccess(res, { data: { user: req.user } });
}

async function updateProfile(req, res) {
  const user = await profileService.updateProfile(req.user, req.validated.body);
  sendSuccess(res, { message: 'Profile updated successfully', data: { user } });
}

async function changePassword(req, res) {
  await profileService.changePassword(req.user._id, req.validated.body);
  sendSuccess(res, { message: 'Password changed successfully' });
}

module.exports = { getProfile, updateProfile, changePassword };
