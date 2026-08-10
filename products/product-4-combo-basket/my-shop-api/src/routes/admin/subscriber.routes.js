const router = require('express').Router();
const { getSubscribers, toggleSubscriber, deleteSubscriber } = require('../../controllers/subscriber.controller');

router.get('/', getSubscribers);
router.patch('/:id/toggle', toggleSubscriber);
router.delete('/:id', deleteSubscriber);

module.exports = router;
