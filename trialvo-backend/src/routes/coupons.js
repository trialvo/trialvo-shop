const express = require('express');
const router = express.Router();
const { validateCoupon, applyCoupon } = require('../controllers/couponController');

router.post('/validate', validateCoupon);
router.post('/apply', applyCoupon);

module.exports = router;
