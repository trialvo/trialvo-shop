const router = require('express').Router();
const c = require('../../controllers/admin/upload.controller');

// POST /api/admin/upload        — single file (image or video)
router.post('/', c.uploadOne);

// POST /api/admin/upload/multiple — multiple files (max 10)
router.post('/multiple', c.uploadMany);

module.exports = router;
