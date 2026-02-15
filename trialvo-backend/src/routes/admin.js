const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Admin controllers
const { adminGetProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { adminGetOrders, updateOrderStatus, getDashboardStats } = require('../controllers/orderController');
const { adminGetTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const { adminGetMessages, toggleRead, deleteMessage, getUnreadCount } = require('../controllers/contactMessageController');

// All admin routes require auth
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', adminGetProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', adminGetOrders);
router.put('/orders/:id/status', updateOrderStatus);

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

module.exports = router;
