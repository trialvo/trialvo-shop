const express = require('express');
const router = express.Router();
const multer = require('multer');

// Auth is applied by the parent admin router (routes/admin.js).
const { uploadMedia, deleteMedia, cleanupMediaUrls } = require('../../controllers/mediaController');

// Keep the file in memory; sharp processes the buffer before it ever hits disk.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (/^image\//.test(file.mimetype)) return cb(null, true);
        cb(new Error('Only image uploads are allowed'));
    },
});

router.post('/upload', upload.single('file'), uploadMedia);
router.post('/cleanup', cleanupMediaUrls);
router.delete('/:id', deleteMedia);

// Translate multer/file-filter failures into clean 400s instead of 500s.
router.use((err, _req, res, next) => {
    if (err instanceof multer.MulterError || /image uploads are allowed/.test(err?.message || '')) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;
