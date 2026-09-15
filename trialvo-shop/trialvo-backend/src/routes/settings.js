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

// SMS picker + test: super_admin only (write + test must not be available to admin)
router.get('/sms', roleAuth(['super_admin']), settingsController.getSmsSettings);
router.post('/sms', roleAuth(['super_admin']), settingsController.updateSmsSettings);
router.post('/sms/test', roleAuth(['super_admin']), settingsController.testSmsSettings);

module.exports = router;
