const router = require("express").Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlist.controller");
const { protect } = require("../middleware/auth");

router.get("/", protect, getWishlist);
router.post("/:productId", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;
