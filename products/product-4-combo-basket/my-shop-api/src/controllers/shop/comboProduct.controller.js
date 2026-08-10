const { ComboProduct, ComboProductItem, Product } = require('../../models');

const PRODUCT_ATTRS = ['id', 'name', 'slug', 'image', 'price', 'original_price', 'in_stock', 'category_id'];

const fullInclude = [
 {
  model: ComboProductItem, as: 'items',
  include: [{ model: Product, as: 'product', attributes: PRODUCT_ATTRS }],
  order: [['id', 'ASC']],
 },
];

// GET /api/shop/combo-products — active combos
exports.list = async (req, res, next) => {
 try {
  const { page = 1, limit = 20, featured } = req.query;
  const where = { is_active: true };
  if (featured === 'true') where.is_featured = true;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: combos, count: total } = await ComboProduct.findAndCountAll({
   where,
   include: fullInclude,
   order: [['sort_order', 'ASC'], ['id', 'DESC']],
   offset,
   limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), combos });
 } catch (err) { next(err); }
};

// GET /api/shop/combo-products/:slug — combo detail
exports.getOne = async (req, res, next) => {
 try {
  const combo = await ComboProduct.findOne({
   where: { slug: req.params.slug, is_active: true },
   include: fullInclude,
  });
  if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
  res.json({ success: true, combo });
 } catch (err) { next(err); }
};
