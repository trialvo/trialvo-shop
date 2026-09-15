const express = require('express');
const router = express.Router();
const { authenticate, roleAuth } = require('../middleware/auth');

const contentRoles = roleAuth(['super_admin', 'admin', 'editor']);
const opsRoles = roleAuth(['super_admin', 'admin']);
const superOnly = roleAuth(['super_admin']);

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
const { getSeoStatus, resubmitSeo } = require('../controllers/seoController');
const {
  listActivityLogs,
  listActivityActions,
  listActivityResources,
} = require('../controllers/adminActivityController');

// All admin routes require auth; editors may manage catalog content only.
router.use(authenticate);
router.use(contentRoles);

// Dashboard
router.get('/dashboard', opsRoles, getDashboardStats);

// Categories (modular sub-router; auth inherited from above)
router.use('/categories', require('./admin/categories'));

// Media uploads (modular sub-router; auth inherited from above)
router.use('/media', require('./admin/media'));

// Trial control plane — operators only (editor 403)
router.use('/trial-requests', opsRoles, require('./admin/trialRequests'));
router.use('/trial-instances', opsRoles, require('./admin/trialInstances'));

// Staff + notification matrix — super_admin only
router.use('/staff', superOnly, require('./admin/staff'));
router.use('/notification-permissions', superOnly, require('./admin/notificationPermissions'));

// Audit log — operators only (editor 403)
router.get('/activity-logs/actions', opsRoles, listActivityActions);
router.get('/activity-logs/resources', opsRoles, listActivityResources);
router.get('/activity-logs', opsRoles, listActivityLogs);

// Products
router.get('/products', adminGetProducts);
router.post('/products', createProduct);
router.post('/products/bulk', bulkToggleProducts);
router.put('/products/reorder', reorderProducts);
router.post('/products/:id/duplicate', duplicateProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Instant indexing
router.get('/seo/status', getSeoStatus);
router.post('/seo/resubmit', resubmitSeo);

// Orders — operators only (editor 403)
router.get('/orders', opsRoles, adminGetOrders);
router.get('/orders/export', opsRoles, exportOrders);
router.post('/orders/bulk-status', opsRoles, bulkUpdateStatus);
router.get('/orders/:id/timeline', opsRoles, getOrderTimeline);
router.get('/orders/:id/notes', opsRoles, getOrderNotes);
router.post('/orders/:id/notes', opsRoles, addOrderNote);
router.delete('/orders/notes/:noteId', opsRoles, deleteOrderNote);
router.put('/orders/:id/status', opsRoles, updateOrderStatus);
router.put('/orders/:id', opsRoles, updateOrder);

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
