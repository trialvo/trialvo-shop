const express = require('express');
const router = express.Router();
const c = require('../../controllers/staffController');

router.get('/', c.listStaff);
router.post('/', c.createStaff);
router.patch('/:id', c.updateStaff);
router.post('/:id/reset-password', c.resetStaffPassword);

module.exports = router;
