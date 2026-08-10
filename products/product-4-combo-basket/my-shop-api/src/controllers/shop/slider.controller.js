const { Slider, Product } = require('../../models');

exports.getActiveSliders = async (req, res, next) => {
 try {
  const sliders = await Slider.findAll({
   where: { is_active: true },
   include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'slug', 'image', 'price', 'discount_amount', 'sell_price', 'original_price', 'rating', 'review_count'] }],
   order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });
  res.json({ success: true, sliders });
 } catch (err) { next(err); }
};
