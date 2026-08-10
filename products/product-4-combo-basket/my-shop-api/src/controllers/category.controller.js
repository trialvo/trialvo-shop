const { Category } = require('../models');
const { Op } = require('sequelize');

exports.getCategories = async (req, res, next) => {
 try {
  const where = { is_active: true };
  if (req.query.show_on_home === 'true') where.show_on_home = true;
  const cats = await Category.findAll({
   where,
   order: [
    where.show_on_home ? ['home_sort_order', 'ASC'] : ['sort_order', 'ASC'],
    ['name', 'ASC'],
   ],
  });
  res.json({ success: true, categories: cats });
 } catch (err) { next(err); }
};


exports.createCategory = async (req, res, next) => {
 try {
  if (!req.body.slug) req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
 } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
 try {
  const [updated] = await Category.update(req.body, { where: { id: req.params.id } });
  if (!updated) return res.status(404).json({ success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' });
  const category = await Category.findByPk(req.params.id);
  res.json({ success: true, category });
 } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
 try {
  await Category.destroy({ where: { id: req.params.id } });
  res.json({ success: true, message: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};
