const router = require('express').Router();
const c = require('../../controllers/admin/audit.controller');

router.get('/', c.getLogs);
router.get('/:entityType/:entityId', c.getEntityHistory);

module.exports = router;
