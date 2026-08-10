const router = require("express").Router();
const { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/coupon.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/validate", validateCoupon);           // public
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;
