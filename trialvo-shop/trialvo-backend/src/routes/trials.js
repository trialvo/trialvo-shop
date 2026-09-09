const express = require('express');
const router = express.Router();
const {
  createTrialRequest,
  getTrialStatus,
  getPublicTrialConfig,
  downloadPublicInstaller,
  startEmailVerification,
  confirmEmailVerification,
} = require('../controllers/trialRequestController');
const { trialRateLimit } = require('../middleware/trialRateLimit');

router.get('/config', getPublicTrialConfig);
router.post('/verify/start', trialRateLimit(), startEmailVerification);
router.post('/verify/confirm', trialRateLimit(), confirmEmailVerification);
router.post('/requests', trialRateLimit(), createTrialRequest);
router.get('/status/:token', getTrialStatus);
router.get('/installer/:token', downloadPublicInstaller);

module.exports = router;
