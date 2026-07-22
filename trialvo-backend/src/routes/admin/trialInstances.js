const express = require('express');
const router = express.Router();
const c = require('../../controllers/adminTrialController');

router.get('/', c.listInstances);
router.get('/analytics', require('../../controllers/trialAnalyticsController').getTrialAnalytics);
router.get('/:id/events', c.getInstanceEvents);
router.get('/:id/credentials', c.getInstanceCredentials);
router.get('/:id', c.getInstance);
router.post('/:id/freeze', c.freezeInstance);
router.post('/:id/unfreeze', c.unfreezeInstance);
router.post('/:id/extend', c.extendInstance);
router.post('/:id/backup', c.backupInstance);
router.post('/:id/restore', c.restoreInstance);
router.get('/:id/backups', c.listInstanceBackups);
router.post('/:id/destroy', c.destroyInstance);
router.get('/:id/installer', c.downloadInstaller);

module.exports = router;
