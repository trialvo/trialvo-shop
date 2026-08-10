const router = require('express').Router();
const c = require('../../controllers/admin/message.controller');

router.get('/', c.getMessages);
router.put('/:id/read', c.markRead);
router.delete('/:id', c.deleteMessage);

module.exports = router;
