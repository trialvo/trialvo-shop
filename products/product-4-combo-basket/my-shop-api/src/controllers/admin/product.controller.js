const { Product, Category, Review, User } = require('../../models');
const { Op } = require('sequelize');
const auditLogger = require('../../utils/auditLogger');

exports.getProducts = async (req, res, next) => {
 try {
  const { search, category, page = 1, limit = 20, inStock } = req.query;
  const where = {};
  if (search) where.name = { [Op.like]: `%${search}%` };
  if (inStock !== undefined) where.in_stock = inStock === 'true';
  const catWhere = category ? { slug: category } : {};
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: products, count: total } = await Product.findAndCountAll({
   where,
   include: [{ model: Category, as: 'category', where: Object.keys(catWhere).length ? catWhere : undefined, attributes: ['id', 'name', 'slug'] }],
   order: [['created_at', 'DESC']],
   offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
 } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
 try {
  const product = await Product.findByPk(req.params.id, {
   include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });
  if (!product) return res.status(404).json({ success: false, message: 'পণ্য পাওয়া যায়নি' });
  res.json({ success: true, product });
 } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
 try {
  if (!req.body.slug) req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  // HTML select returns strings; ensure category_id is a proper integer for FK
  if (req.body.category_id !== undefined && req.body.category_id !== '') {
   req.body.category_id = parseInt(req.body.category_id, 10);
  }
  if (!req.body.category_id) {
   return res.status(400).json({ success: false, message: 'category_id is required' });
  }
  const product = await Product.create(req.body);
  await auditLogger(req, 'product', product.id, 'create', null, product.toJSON(), `Created: ${product.name}`);
  res.status(201).json({ success: true, product });
 } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
 try {
  const old = await Product.findByPk(req.params.id);
  if (!old) return res.status(404).json({ success: false, message: 'প্রোডাক্ট পাওয়া যায়নি' });
  // Coerce category_id to integer if provided
  if (req.body.category_id !== undefined && req.body.category_id !== '') {
   req.body.category_id = parseInt(req.body.category_id, 10);
  }
  await old.update(req.body);
  await auditLogger(req, 'product', req.params.id, 'update', old.toJSON(), req.body, `Updated: ${old.name}`);
  res.json({ success: true, product: await Product.findByPk(req.params.id) });
 } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
 try {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'প্রোডাক্ট পাওয়া যায়নি' });
  await auditLogger(req, 'product', req.params.id, 'delete', product.toJSON(), null, `Deleted: ${product.name}`);
  await product.destroy();
  res.json({ success: true, message: 'প্রোডাক্ট মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};

// ── Reviews Management ────────────────────────────────────────────────────────

exports.getProductReviews = async (req, res, next) => {
 try {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'পণ্য পাওয়া যায়নি' });

  const reviews = await Review.findAll({
   where: { product_id: req.params.id },
   include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'], required: false }],
   order: [['created_at', 'DESC']],
  });
  res.json({ success: true, reviews, total: reviews.length });
 } catch (err) { next(err); }
};

exports.deleteProductReview = async (req, res, next) => {
 try {
  const review = await Review.findOne({
   where: { id: req.params.reviewId, product_id: req.params.id },
  });
  if (!review) return res.status(404).json({ success: false, message: 'রিভিউ পাওয়া যায়নি' });
  await review.destroy();

  // Recalculate product rating
  await _recalcRating(req.params.id);

  await auditLogger(req, 'review', review.id, 'delete', review.toJSON(), null, `Admin deleted review #${review.id}`);
  res.json({ success: true, message: 'রিভিউ মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};

exports.updateProductReview = async (req, res, next) => {
 try {
  const review = await Review.findOne({
   where: { id: req.params.reviewId, product_id: req.params.id },
  });
  if (!review) return res.status(404).json({ success: false, message: 'রিভিউ পাওয়া যায়নি' });
  const old = review.toJSON();
  const { rating, title, body } = req.body;
  await review.update({ rating, title, body });
  if (rating !== undefined) await _recalcRating(req.params.id);
  await auditLogger(req, 'review', review.id, 'update', old, req.body, `Admin updated review #${review.id}`);
  res.json({ success: true, review });
 } catch (err) { next(err); }
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function _recalcRating(productId) {
 const reviews = await Review.findAll({ where: { product_id: productId } });
 const count = reviews.length;
 const avg = count > 0 ? reviews.reduce((s, r) => s + Number(r.rating), 0) / count : 0;
 await Product.update(
  { rating: Math.round(avg * 10) / 10, review_count: count },
  { where: { id: productId } }
 );
}
