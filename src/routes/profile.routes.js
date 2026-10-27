const express = require('express');
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators/profile.validator');

const router = express.Router();

router.use(requireAuth); // every route below needs a logged-in user

router.get('/', profileController.getProfile);
router.patch('/', validate(updateProfileSchema), profileController.updateProfile);
router.patch('/password', validate(changePasswordSchema), profileController.changePassword);

module.exports = router;
