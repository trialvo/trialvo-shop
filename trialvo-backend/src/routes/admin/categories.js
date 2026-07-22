const express = require('express');
const router = express.Router();

// Auth is already applied by the parent admin router (routes/admin.js).
const {
    adminGetCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
} = require('../../controllers/categoryController');

router.get('/', adminGetCategories);
router.post('/', createCategory);
router.put('/reorder', reorderCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
