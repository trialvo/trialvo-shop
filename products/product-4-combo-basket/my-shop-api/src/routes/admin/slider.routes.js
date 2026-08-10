const router = require('express').Router();
const c = require('../../controllers/admin/slider.controller');
const { uploadSingle } = require('../../middleware/upload');

router.get('/', c.getSliders);
router.post('/', c.createSlider);
router.put('/reorder', c.reorderSliders);
router.post('/upload-banner', uploadSingle, c.uploadBanner);   // ← image upload
router.post('/:id/duplicate', c.duplicateSlider);
router.put('/:id', c.updateSlider);
router.delete('/:id', c.deleteSlider);

module.exports = router;
