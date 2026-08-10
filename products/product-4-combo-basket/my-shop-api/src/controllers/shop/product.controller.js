const { Product, Category } = require('../../models');
const { Op } = require('sequelize');

exports.getProducts = async (req, res, next) => {
 try {
  const {
   category, search,
   sort = 'created_at', order = 'DESC',
   page = 1, limit = 20,
   featured, inStock, is_combo_eligible,
  } = req.query;
  const where = {};
  const catWhere = {};
  if (category) catWhere.slug = category;
  if (featured === 'true') where.is_featured = true;
  if (inStock === 'true') where.in_stock = true;
  if (is_combo_eligible === 'true') where.is_combo_eligible = true;
  if (search) where.name = { [Op.like]: `%${search}%` };
  const offset = (Number(page) - 1) * Number(limit);

  // Whitelist sortable columns to prevent SQL injection
  const ALLOWED_SORT = ['created_at', 'price', 'name', 'sort_order', 'rating'];
  const safeSort = ALLOWED_SORT.includes(sort) ? sort : 'created_at';
  const safeOrder = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows: products, count: total } = await Product.findAndCountAll({
   where,
   include: [{ model: Category, as: 'category', where: Object.keys(catWhere).length ? catWhere : undefined, attributes: ['id', 'name', 'slug', 'icon'] }],
   order: [[safeSort, safeOrder]],
   offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
 } catch (err) { next(err); }
};


exports.getProduct = async (req, res, next) => {
 try {
  const product = await Product.findOne({
   where: { slug: req.params.slug },
   include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] }],
  });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
 } catch (err) { next(err); }
};
