const ConnectionRequest = require('../models/connectionRequest.model');
const { REQUEST_STATUS } = require('../models/connectionRequest.model');
const User = require('../models/user.model');

// Only public fields are shared with other users (no email, no password).
const PUBLIC_USER_FIELDS = 'firstName lastName photoUrl age gender about skills';

function getReceivedRequests(userId) {
  return ConnectionRequest.find({ toUserId: userId, status: REQUEST_STATUS.INTERESTED })
    .populate('fromUserId', PUBLIC_USER_FIELDS)
    .sort({ createdAt: -1 });
}

async function getConnections(userId) {
  const requests = await ConnectionRequest.find({
    status: REQUEST_STATUS.ACCEPTED,
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .populate('fromUserId', PUBLIC_USER_FIELDS)
    .populate('toUserId', PUBLIC_USER_FIELDS);

  // Return "the other person" in each connection.
  return requests.map((r) => (r.fromUserId._id.equals(userId) ? r.toUserId : r.fromUserId));
}

// Feed = everyone except me and the people I've already interacted with.
async function getFeed(userId, { page, limit }) {
  const requests = await ConnectionRequest.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  }).select('fromUserId toUserId');

  const hiddenIds = new Set([userId.toString()]);
  for (const r of requests) {
    hiddenIds.add(r.fromUserId.toString());
    hiddenIds.add(r.toUserId.toString());
  }

  const filter = { _id: { $nin: [...hiddenIds] } };
  const [users, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

module.exports = { getReceivedRequests, getConnections, getFeed };
