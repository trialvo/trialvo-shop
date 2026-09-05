const express = require('express');
const router = express.Router();
const c = require('../../controllers/adminTrialController');

router.get('/', c.listTrialRequests);
// Must be declared before '/:id' so "counts" is not treated as an id.
router.get('/counts', c.getTrialRequestCounts);
router.get('/:id', c.getTrialRequest);
router.patch('/:id', c.patchTrialRequest);

// Legacy agent-based approval (installer flow) — still available for staff who want it.
router.post('/:id/approve', c.approveTrialRequest);
router.post('/:id/reject', c.rejectTrialRequest);

// Own-domain fulfillment pipeline: received → (hosting confirmed) → deploying → live
router.post('/:id/pickup', c.pickupTrialRequest);
router.post('/:id/hosting-confirmed', c.confirmTrialHosting);
router.post('/:id/reopen', c.reopenTrialRequest);
router.post('/:id/fulfill', c.fulfillTrialRequest);

module.exports = router;
