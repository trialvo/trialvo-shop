const express = require('express');
const router = express.Router();
const { createMessage } = require('../controllers/contactMessageController');

// Public contact route
router.post('/', createMessage);

module.exports = router;
