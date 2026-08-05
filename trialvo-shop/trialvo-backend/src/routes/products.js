const express = require('express');
const router = express.Router();
const {
 getProducts, getFeaturedProducts, getProductBySlug, getRelatedProducts,
} = require('../controllers/productController');

// Public product routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:slug', getProductBySlug);
router.get('/:slug/related', getRelatedProducts);

module.exports = router;
