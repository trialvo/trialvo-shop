const router = require('express').Router();
const c = require('../../controllers/admin/shopConfig.controller');

router.get('/', c.getConfig);
router.put('/', c.updateConfig);
router.post('/fraud-test', c.testFraud);

module.exports = router;
