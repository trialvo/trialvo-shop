const { Review, User, Product } = require('../models');

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
  const exists = await Review.findOne({ where: { product_id: req.params.productId, user_id: req.user.id } });
  if (exists) return res.status(400).json({ success: false, message: 'আপনি ইতিমধ্যে রিভিউ দিয়েছেন' });
  const review = await Review.create({ product_id: req.params.productId, user_id: req.user.id, rating, title, body });
  // Update product rating
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
  if (review.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'অ্যাক্সেস নেই' });
  await review.destroy();
  // Update rating
  const all = await Review.findAll({ where: { product_id: review.product_id } });
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
  await Product.update({ rating: Math.round(avg * 10) / 10, review_count: all.length }, { where: { id: review.product_id } });
  res.json({ success: true });
 } catch (err) { next(err); }
};
