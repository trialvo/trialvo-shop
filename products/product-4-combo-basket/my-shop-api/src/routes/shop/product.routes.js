const router = require('express').Router();
const c = require('../../controllers/shop/product.controller');
const r = require('../../controllers/shop/review.controller');
const { shopProtect } = require('../../middleware/shopAuth');

router.get('/', c.getProducts);
router.get('/:slug', c.getProduct);
router.get('/:productId/reviews', r.getProductReviews);
router.post('/:productId/reviews', shopProtect, r.createReview);
router.delete('/:productId/reviews/:id', shopProtect, r.deleteReview);

module.exports = router;
