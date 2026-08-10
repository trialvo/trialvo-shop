// admin/index.js — mounts all admin routes under /api/admin
const router = require('express').Router();
const { adminProtect } = require('../../middleware/adminAuth');

// PUBLIC: login only — must be before adminProtect
router.post('/auth/login', require('../../controllers/admin/auth.controller').login);

// Apply admin auth to everything below
router.use(adminProtect);

// Protected routes
router.use('/auth', require('./auth.routes'));       // /me, /me/password (no /login — handled above)
router.use('/stats', require('./stats.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/orders', require('./order.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/config', require('./shopConfig.routes'));
router.use('/faqs', require('./faq.routes'));
router.use('/messages', require('./message.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/sliders', require('./slider.routes'));
router.use('/subscribers', require('./subscriber.routes'));
router.use('/site-settings', require('./siteSettings.routes'));
router.use('/upload', require('./upload.routes'));
router.use('/combo-products', require('./comboProducts.routes'));


module.exports = router;

