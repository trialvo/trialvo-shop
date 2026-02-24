const express = require('express');
const router = express.Router();
const { authenticateCustomer } = require('../middleware/customerAuth');
const {
 register, login, getProfile, updateProfile, changePassword, getMyOrders, getMyOrder
} = require('../controllers/customerAuthController');
const {
 getWishlist, addToWishlist, removeFromWishlist, checkWishlist
} = require('../controllers/wishlistController');

// Public
router.post('/register', register);
router.post('/login', login);

// Protected
router.get('/me', authenticateCustomer, getProfile);
router.put('/profile', authenticateCustomer, updateProfile);
router.put('/password', authenticateCustomer, changePassword);
router.get('/orders', authenticateCustomer, getMyOrders);
router.get('/orders/:orderId', authenticateCustomer, getMyOrder);

// Wishlist
router.get('/wishlist', authenticateCustomer, getWishlist);
router.get('/wishlist/check/:productId', authenticateCustomer, checkWishlist);
router.post('/wishlist/:productId', authenticateCustomer, addToWishlist);
router.delete('/wishlist/:productId', authenticateCustomer, removeFromWishlist);

module.exports = router;
