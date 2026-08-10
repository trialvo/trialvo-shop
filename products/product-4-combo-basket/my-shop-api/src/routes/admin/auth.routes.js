const router = require('express').Router();
const c = require('../../controllers/admin/auth.controller');

router.post('/login', c.login);
router.get('/me', c.getMe);   // adminProtect applied by admin/index.js
router.put('/me', c.updateMe);
router.put('/me/password', c.changePassword);

module.exports = router;
