const router = require('express').Router();
const c = require('../../controllers/shop/auth.controller');
const { shopProtect } = require('../../middleware/shopAuth');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', shopProtect, c.getMe);
router.put('/me', shopProtect, c.updateMe);
router.put('/me/password', shopProtect, c.changePassword);

module.exports = router;
