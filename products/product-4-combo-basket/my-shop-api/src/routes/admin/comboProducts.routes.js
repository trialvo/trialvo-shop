const router = require('express').Router();
const ctrl = require('../../controllers/admin/comboProduct.controller');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/toggle', ctrl.toggle);
router.delete('/:id', ctrl.destroy);

module.exports = router;
