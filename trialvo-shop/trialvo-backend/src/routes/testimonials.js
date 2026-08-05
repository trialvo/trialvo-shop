const express = require('express');
const router = express.Router();
const { getTestimonials } = require('../controllers/testimonialController');

// Public testimonial routes
router.get('/', getTestimonials);

module.exports = router;
