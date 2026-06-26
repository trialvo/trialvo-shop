const express = require('express');
const router = express.Router();
const { handleIpn } = require('../controllers/paymentController');

// POST /api/payments/ipn
// Receives IPN (webhook) from PayVault when payment status changes
router.post('/ipn', handleIpn);

module.exports = router;
