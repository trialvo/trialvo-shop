const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { login, getMe, updateProfile, changePassword } = require('../controllers/authController');

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

module.exports = router;
