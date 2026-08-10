const router = require('express').Router();
const c = require('../../controllers/admin/product.controller');

router.get('/', c.getProducts);
router.get('/:id', c.getProduct);
router.post('/', c.createProduct);
router.put('/:id', c.updateProduct);
router.delete('/:id', c.deleteProduct);

// nested review sub-routes
router.get('/:id/reviews', c.getProductReviews);
router.delete('/:id/reviews/:reviewId', c.deleteProductReview);
router.put('/:id/reviews/:reviewId', c.updateProductReview);

module.exports = router;
