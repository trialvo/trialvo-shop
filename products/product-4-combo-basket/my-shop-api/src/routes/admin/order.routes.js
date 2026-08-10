const router = require('express').Router();
const c = require('../../controllers/admin/order.controller');

router.get('/', c.getAllOrders);
router.get('/:id', c.getOrder);
router.put('/:id/status', c.updateOrderStatus);
router.put('/:id/fraud-status', c.saveFraudStatus);

module.exports = router;

