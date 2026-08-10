const { Review, User, Product } = require('../../models');

exports.getAllReviews = async (req, res, next) => {
 try {
  const limit = parseInt(req.query.limit) || 20;
  const reviews = await Review.findAll({
   where: { rating: { [require('sequelize').Op.gte]: 4 } },
   include: [
    { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
    { model: Product, as: 'product', attributes: ['id', 'name', 'slug'] },
   ],
   order: [['created_at', 'DESC']],
   limit,
  });
  res.json({ success: true, reviews, total: reviews.length });
 } catch (err) { next(err); }
};

exports.getProductReviews = async (req, res, next) => {
 try {
  const reviews = await Review.findAll({
   where: { product_id: req.params.productId },
   include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
   order: [['created_at', 'DESC']],
  });
  res.json({ success: true, reviews });
 } catch (err) { next(err); }
};

exports.createReview = async (req, res, next) => {
 try {
  const { rating, title, body } = req.body;
  const exists = await Review.findOne({ where: { product_id: req.params.productId, user_id: req.shopUser.id } });
  if (exists) return res.status(400).json({ success: false, message: 'আপনি ইতিমধ্যে রিভিউ দিয়েছেন' });
  const review = await Review.create({ product_id: req.params.productId, user_id: req.shopUser.id, rating, title, body });
  const all = await Review.findAll({ where: { product_id: req.params.productId } });
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await Product.update({ rating: Math.round(avg * 10) / 10, review_count: all.length }, { where: { id: req.params.productId } });
  res.status(201).json({ success: true, review });
 } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
 try {
  const review = await Review.findByPk(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'রিভিউ পাওয়া যায়নি' });
  if (review.user_id !== req.shopUser.id) return res.status(403).json({ success: false, message: 'আপনি শুধু নিজের রিভিউ মুছতে পারবেন' });
  await review.destroy();
  const all = await Review.findAll({ where: { product_id: review.product_id } });
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
  await Product.update({ rating: Math.round(avg * 10) / 10, review_count: all.length }, { where: { id: review.product_id } });
  res.json({ success: true });
 } catch (err) { next(err); }
};
