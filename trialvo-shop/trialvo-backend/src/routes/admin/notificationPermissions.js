const express = require('express');
const router = express.Router();
const c = require('../../controllers/staffController');

router.get('/', c.getNotificationPermissions);
router.put('/global', c.updateGlobalPermissions);
router.put('/:adminId', c.updateAdminPermissions);

module.exports = router;
