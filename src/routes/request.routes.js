const express = require('express');
const requestController = require('../controllers/request.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { sendRequestSchema, reviewRequestSchema } = require('../validators/request.validator');

const router = express.Router();

router.use(requireAuth);

router.post('/send/:status/:toUserId', validate(sendRequestSchema), requestController.sendRequest);
router.post(
  '/review/:status/:requestId',
  validate(reviewRequestSchema),
  requestController.reviewRequest,
);

module.exports = router;
