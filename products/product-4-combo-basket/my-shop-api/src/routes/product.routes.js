const router = require("express").Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require("../controllers/product.controller");
const { getProductReviews, createReview } = require("../controllers/review.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getProducts);
router.get("/:slug", getProduct);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

// Reviews nested under products
router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", protect, createReview);

module.exports = router;
