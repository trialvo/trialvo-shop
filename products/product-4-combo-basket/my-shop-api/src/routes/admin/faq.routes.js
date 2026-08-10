const router = require('express').Router();
const c = require('../../controllers/admin/faq.controller');

router.get('/', c.getFAQs);
router.post('/', c.createFAQ);
router.put('/:id', c.updateFAQ);
router.delete('/:id', c.deleteFAQ);

module.exports = router;
