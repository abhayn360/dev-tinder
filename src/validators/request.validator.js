const { z } = require('zod');
const { objectId } = require('./common');

const sendRequestSchema = z.object({
  params: z.object({
    status: z.enum(['interested', 'ignored']),
    toUserId: objectId,
  }),
});

const reviewRequestSchema = z.object({
  params: z.object({
    status: z.enum(['accepted', 'rejected']),
    requestId: objectId,
  }),
});

module.exports = { sendRequestSchema, reviewRequestSchema };
