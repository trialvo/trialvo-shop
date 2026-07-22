const express = require('express');
const router = express.Router();
const { getCategories } = require('../controllers/categoryController');

// Public: storefront reads the canonical category list (with live product counts).
router.get('/', getCategories);

module.exports = router;
