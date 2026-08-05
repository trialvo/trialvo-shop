const express = require('express');
const router = express.Router();
const { downloadPublicPack } = require('../controllers/licensePackController');

// Public one-time paid deployment pack download
router.get('/pack/:token', downloadPublicPack);

module.exports = router;
