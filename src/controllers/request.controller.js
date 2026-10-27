const requestService = require('../services/request.service');
const { sendSuccess } = require('../utils/response');

async function sendRequest(req, res) {
  const { status, toUserId } = req.validated.params;
  const request = await requestService.sendRequest(req.user._id, toUserId, status);
  sendSuccess(res, { statusCode: 201, message: `Request marked as ${status}`, data: { request } });
}

async function reviewRequest(req, res) {
  const { status, requestId } = req.validated.params;
  const request = await requestService.reviewRequest(req.user._id, requestId, status);
  sendSuccess(res, { message: `Request ${status}`, data: { request } });
}

module.exports = { sendRequest, reviewRequest };
