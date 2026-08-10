const router = require("express").Router();
const { getStats, getOrdersChart, getTopProducts, getCustomers } = require("../controllers/admin.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);
router.get("/stats", getStats);
router.get("/stats/orders-chart", getOrdersChart);
router.get("/stats/top-products", getTopProducts);
router.get("/customers", getCustomers);

module.exports = router;
