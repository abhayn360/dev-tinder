const ConnectionRequest = require('../models/connectionRequest.model');
const { REQUEST_STATUS } = require('../models/connectionRequest.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

async function sendRequest(fromUserId, toUserId, status) {
  if (fromUserId.equals(toUserId)) {
    throw ApiError.badRequest('You cannot send a request to yourself');
  }

  const toUser = await User.exists({ _id: toUserId });
  if (!toUser) throw ApiError.notFound('User not found');

  // A request in EITHER direction means these two users already interacted.
  const existing = await ConnectionRequest.exists({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: toUserId, toUserId: fromUserId },
    ],
  });
  if (existing) throw ApiError.conflict('A connection request already exists');

  return ConnectionRequest.create({ fromUserId, toUserId, status });
}

async function reviewRequest(loggedInUserId, requestId, status) {
  // Authorization: only the RECEIVER can review, and only "interested" requests.
  const request = await ConnectionRequest.findOne({
    _id: requestId,
    toUserId: loggedInUserId,
    status: REQUEST_STATUS.INTERESTED,
  });
  if (!request) throw ApiError.notFound('Connection request not found');

  request.status = status;
  await request.save();
  return request;
}

module.exports = { sendRequest, reviewRequest };
