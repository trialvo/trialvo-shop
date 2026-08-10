const router = require('express').Router();
const ctrl = require('../../controllers/shop/comboProduct.controller');

router.get('/', ctrl.list);
router.get('/:slug', ctrl.getOne);

module.exports = router;
