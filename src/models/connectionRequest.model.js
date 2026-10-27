const mongoose = require('mongoose');

const REQUEST_STATUS = Object.freeze({
  IGNORED: 'ignored',
  INTERESTED: 'interested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

const connectionRequestSchema = new mongoose.Schema(
  {
    // "ref" tells Mongoose which model this id points to, so we can .populate() it.
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      required: true,
      enum: { values: Object.values(REQUEST_STATUS), message: '{VALUE} is not a valid status' },
    },
  },
  { timestamps: true },
);

// Compound index: speeds up lookups AND guarantees one request per pair of users.
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
module.exports.REQUEST_STATUS = REQUEST_STATUS;
