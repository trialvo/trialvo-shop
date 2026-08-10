const router = require('express').Router();
const c = require('../../controllers/shop/order.controller');
const { shopProtect } = require('../../middleware/shopAuth');

router.post('/', shopProtect, c.placeOrder);
router.get('/my', shopProtect, c.getMyOrders);
router.get('/my/:id', shopProtect, c.getOrder);

module.exports = router;
