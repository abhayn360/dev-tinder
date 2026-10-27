const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');

async function getReceivedRequests(req, res) {
  const requests = await userService.getReceivedRequests(req.user._id);
  sendSuccess(res, { data: { requests } });
}

async function getConnections(req, res) {
  const connections = await userService.getConnections(req.user._id);
  sendSuccess(res, { data: { connections } });
}

async function getFeed(req, res) {
  const feed = await userService.getFeed(req.user._id, req.validated.query);
  sendSuccess(res, { data: feed });
}

module.exports = { getReceivedRequests, getConnections, getFeed };
