const router = require('express').Router();
const { shopProtect } = require('../../middleware/shopAuth');
const c = require('../../controllers/shop/address.controller');

router.get('/', shopProtect, c.getAddresses);
router.post('/', shopProtect, c.addAddress);
router.put('/:id', shopProtect, c.updateAddress);
router.delete('/:id', shopProtect, c.deleteAddress);

module.exports = router;
