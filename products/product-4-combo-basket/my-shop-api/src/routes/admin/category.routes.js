const router = require('express').Router();
const c = require('../../controllers/admin/category.controller');

router.get('/', c.getCategories);
router.post('/', c.createCategory);
router.put('/reorder', c.reorderCategories);
router.put('/:id', c.updateCategory);
router.delete('/:id', c.deleteCategory);

module.exports = router;
