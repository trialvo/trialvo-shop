const express = require('express');
const router = express.Router();
const c = require('../../controllers/adminTrialController');
const { roleAuth } = require('../../middleware/auth');
const { adminReissuePack } = require('../../controllers/licensePackController');

// All trial-instance admin actions require admin or super_admin
router.use(roleAuth(['super_admin', 'admin']));

router.get('/', c.listInstances);
router.get('/analytics', require('../../controllers/trialAnalyticsController').getTrialAnalytics);
router.get('/deployment-analytics', c.getDeploymentAnalytics);
router.get('/:id/events', c.getInstanceEvents);
router.get('/:id/credentials', roleAuth(['super_admin']), c.getInstanceCredentials);
router.get('/:id', c.getInstance);
router.post('/:id/freeze', c.freezeInstance);
router.post('/:id/unfreeze', c.unfreezeInstance);
router.post('/:id/extend', c.extendInstance);
router.post('/:id/backup', c.backupInstance);
router.post('/:id/restore', c.restoreInstance);
router.get('/:id/backups', c.listInstanceBackups);
router.get('/:id/backups/:backupId/export', roleAuth(['super_admin']), c.exportInstanceBackup);
router.get('/:id/export-backup', roleAuth(['super_admin']), c.exportInstanceBackup);
router.post('/:id/destroy', c.destroyInstance);
router.get('/:id/installer', roleAuth(['super_admin']), c.downloadInstaller);
router.get('/:id/pack', roleAuth(['super_admin']), c.downloadPaidPack);
router.post('/:id/reissue-pack', roleAuth(['super_admin']), adminReissuePack);
router.post('/:id/transfer-domain', c.transferInstanceDomain);
router.post('/:id/convert-to-paid', c.convertInstanceToPaid);

module.exports = router;
