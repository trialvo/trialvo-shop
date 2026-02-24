const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Admin controllers
const {
 adminGetProducts, createProduct, updateProduct, deleteProduct,
 duplicateProduct, bulkToggleProducts, reorderProducts,
} = require('../controllers/productController');
const {
 adminGetOrders, updateOrderStatus, updateOrder, bulkUpdateStatus,
 getOrderTimeline, getOrderNotes, addOrderNote, deleteOrderNote,
 exportOrders, getDashboardStats,
} = require('../controllers/orderController');
const { adminGetTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const { adminGetMessages, toggleRead, deleteMessage, getUnreadCount } = require('../controllers/contactMessageController');
const { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } = require('../controllers/couponController');
const { getSmtpSettings, updateSmtpSettings, testSmtpConnection, getGeneralSettings, updateGeneralSettings } = require('../controllers/settingsController');
const { adminGetCustomers, adminGetCustomer, getAnalytics } = require('../controllers/adminController');

// All admin routes require auth
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', adminGetProducts);
router.post('/products', createProduct);
router.post('/products/bulk', bulkToggleProducts);
router.put('/products/reorder', reorderProducts);
router.post('/products/:id/duplicate', duplicateProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', adminGetOrders);
router.get('/orders/export', exportOrders);
router.post('/orders/bulk-status', bulkUpdateStatus);
router.get('/orders/:id/timeline', getOrderTimeline);
router.get('/orders/:id/notes', getOrderNotes);
router.post('/orders/:id/notes', addOrderNote);
router.delete('/orders/notes/:noteId', deleteOrderNote);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id', updateOrder);

// Testimonials
router.get('/testimonials', adminGetTestimonials);
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Messages
router.get('/messages', adminGetMessages);
router.get('/messages/unread-count', getUnreadCount);
router.put('/messages/:id/read', toggleRead);
router.delete('/messages/:id', deleteMessage);

// Coupons
router.get('/coupons', adminGetCoupons);
router.post('/coupons', adminCreateCoupon);
router.put('/coupons/:id', adminUpdateCoupon);
router.delete('/coupons/:id', adminDeleteCoupon);

// Settings (SMTP)
router.get('/settings/smtp', getSmtpSettings);
router.put('/settings/smtp', updateSmtpSettings);
router.post('/settings/smtp/test', testSmtpConnection);

// Settings (General)
router.get('/settings/general', getGeneralSettings);
router.put('/settings/general', updateGeneralSettings);

// Customers
router.get('/customers', adminGetCustomers);
router.get('/customers/:id', adminGetCustomer);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
