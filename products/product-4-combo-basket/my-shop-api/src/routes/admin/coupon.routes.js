const router = require('express').Router();
const c = require('../../controllers/admin/coupon.controller');

router.get('/', c.getCoupons);
router.post('/', c.createCoupon);
router.put('/:id', c.updateCoupon);
router.delete('/:id', c.deleteCoupon);

module.exports = router;
