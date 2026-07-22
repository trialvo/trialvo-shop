const express = require('express');
const router = express.Router();
const c = require('../../controllers/adminTrialController');

router.get('/', c.listTrialRequests);
router.get('/:id', c.getTrialRequest);
router.post('/:id/approve', c.approveTrialRequest);
router.post('/:id/reject', c.rejectTrialRequest);
router.patch('/:id', c.patchTrialRequest);

module.exports = router;
