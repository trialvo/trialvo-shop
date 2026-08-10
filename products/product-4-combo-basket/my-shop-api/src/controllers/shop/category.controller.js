const { Category } = require('../../models');

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


exports.getHomeSections = async (req, res, next) => {
 const { Product } = require('../../models');
 try {
  const sections = await Category.findAll({
   where: { is_active: true, show_on_home: true },
   order: [['home_sort_order', 'ASC']],
  });
  const result = await Promise.all(sections.map(async (cat) => {
   const products = await Product.findAll({
    include: [{ model: Category, as: 'category', where: { id: cat.id }, attributes: ['id', 'name', 'slug', 'icon', 'color', 'svg_icon'] }],
    order: [['is_featured', 'DESC'], ['sort_order', 'ASC']],
    limit: 8,
   });
   return { ...cat.toJSON(), products };
  }));
  res.json({ success: true, sections: result });
 } catch (err) { next(err); }
};
