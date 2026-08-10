const router = require("express").Router();
const { deleteReview } = require("../controllers/review.controller");
const { protect } = require("../middleware/auth");

// Review delete (by id) — create/get are nested under /products/:productId/reviews
router.delete("/:id", protect, deleteReview);

module.exports = router;
