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
router.get('/trial', settingsController.getTrialSettings);
router.post('/trial', settingsController.updateTrialSettings);
router.get('/smtp', settingsController.getSmtpSettings);
router.post('/smtp', settingsController.updateSmtpSettings);
router.post('/smtp/test', settingsController.testSmtpSettings);

module.exports = router;
