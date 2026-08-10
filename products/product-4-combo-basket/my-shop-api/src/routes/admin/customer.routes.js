const router = require('express').Router();
const c = require('../../controllers/admin/customer.controller');

router.get('/', c.getCustomers);
router.get('/:id', c.getCustomer);
router.put('/:id/toggle', c.toggleStatus);

module.exports = router;
