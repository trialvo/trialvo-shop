const router = require('express').Router();
const ctrl = require('../../controllers/admin/siteSettings.controller');

router.get('/', ctrl.getSettings);
router.put('/', ctrl.updateSettings);

module.exports = router;
