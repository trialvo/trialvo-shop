// shop/index.js  — mounts all shop routes under /api/shop
const router = require('express').Router();
const { getCategories, getHomeSections } = require('../../controllers/shop/category.controller');
const { getConfig } = require('../../controllers/shop/shopConfig.controller');
const { getFAQs } = require('../../controllers/shop/faq.controller');
const { submitContact } = require('../../controllers/shop/contact.controller');
const { validateCoupon } = require('../../controllers/shop/coupon.controller');
const { getAllReviews } = require('../../controllers/shop/review.controller');
const { subscribe } = require('../../controllers/subscriber.controller');

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/orders', require('./order.routes'));
router.use('/wishlist', require('./wishlist.routes'));
router.use('/addresses', require('./address.routes'));

router.get('/categories/home-sections', getHomeSections);
router.get('/categories', getCategories);
router.get('/config', getConfig);
router.get('/faqs', getFAQs);
router.post('/contact', submitContact);
router.post('/coupons/validate', validateCoupon);
router.use('/sliders', require('./slider.routes'));
router.post('/subscribe', subscribe);
router.get('/reviews', getAllReviews);
router.use('/site-settings', require('./siteSettings.routes'));
router.use('/combo-products', require('./comboProducts.routes'));

module.exports = router;

