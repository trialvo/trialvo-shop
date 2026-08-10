const router = require('express').Router();
const c = require('../../controllers/admin/stats.controller');

router.get('/', c.getStats);
router.get('/chart', c.getOrdersChart);
router.get('/top-products', c.getTopProducts);

module.exports = router;
