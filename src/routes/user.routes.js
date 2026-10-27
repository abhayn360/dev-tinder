const express = require('express');
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { paginationSchema } = require('../validators/user.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/requests/received', userController.getReceivedRequests);
router.get('/connections', userController.getConnections);
router.get('/feed', validate(paginationSchema), userController.getFeed);

module.exports = router;
