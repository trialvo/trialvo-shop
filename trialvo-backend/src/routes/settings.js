const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, roleAuth } = require('../middleware/auth');

// All settings routes require super_admin or admin role
router.use(authenticate);
router.use(roleAuth(['super_admin', 'admin']));

router.get('/trialvo-pay', settingsController.getTrialvoPaySettings);
router.post('/trialvo-pay', settingsController.updateTrialvoPaySettings);
router.post('/trialvo-pay/test', settingsController.testTrialvoPayConnection);

module.exports = router;
