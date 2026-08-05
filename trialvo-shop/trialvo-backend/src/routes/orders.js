const express = require('express');
const router = express.Router();
const { createOrder, getOrder } = require('../controllers/orderController');

// Public order routes
router.post('/', createOrder);
router.get('/:orderId', getOrder);

module.exports = router;
