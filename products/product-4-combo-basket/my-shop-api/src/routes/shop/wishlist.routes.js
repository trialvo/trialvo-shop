const router = require('express').Router();
const { shopProtect } = require('../../middleware/shopAuth');
const c = require('../../controllers/shop/wishlist.controller');

router.get('/', shopProtect, c.getWishlist);
router.post('/:productId', shopProtect, c.addToWishlist);
router.delete('/:productId', shopProtect, c.removeFromWishlist);

module.exports = router;
