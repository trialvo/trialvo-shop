const router = require("express").Router();
const { placeOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus } = require("../controllers/order.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, placeOrder);
router.get("/my", protect, getMyOrders);
router.get("/", protect, adminOnly, getAllOrders);
router.get("/:id", protect, getOrder);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
