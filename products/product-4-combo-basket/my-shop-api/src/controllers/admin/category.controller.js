const { Category } = require('../../models');
const auditLogger = require('../../utils/auditLogger');

exports.reorderCategories = async (req, res, next) => {
 try {
  const { order } = req.body; // [{ id, sort_order }, ...]
  if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'order must be an array' });
  await Promise.all(order.map(({ id, sort_order }) => Category.update({ sort_order }, { where: { id } })));
  res.json({ success: true, message: 'ক্রম আপডেট হয়েছে' });
 } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
 try {
  const cats = await Category.findAll({ order: [['sort_order', 'ASC']] });
  res.json({ success: true, categories: cats });
 } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
 try {
  if (!req.body.slug) req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const category = await Category.create(req.body);
  await auditLogger(req, 'category', category.id, 'create', null, category.toJSON(), `Created: ${category.name}`);
  res.status(201).json({ success: true, category });
 } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
 try {
  const old = await Category.findByPk(req.params.id);
  if (!old) return res.status(404).json({ success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' });
  await old.update(req.body);
  await auditLogger(req, 'category', req.params.id, 'update', old.toJSON(), req.body, `Updated: ${old.name}`);
  res.json({ success: true, category: await Category.findByPk(req.params.id) });
 } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
 try {
  const cat = await Category.findByPk(req.params.id);
  if (!cat) return res.status(404).json({ success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' });
  await auditLogger(req, 'category', req.params.id, 'delete', cat.toJSON(), null, `Deleted: ${cat.name}`);
  await cat.destroy();
  res.json({ success: true, message: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};
