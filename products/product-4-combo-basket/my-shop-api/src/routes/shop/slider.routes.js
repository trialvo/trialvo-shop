const router = require('express').Router();
const c = require('../../controllers/shop/slider.controller');

router.get('/', c.getActiveSliders);

module.exports = router;
