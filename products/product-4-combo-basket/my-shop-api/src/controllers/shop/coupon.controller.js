const { Coupon } = require('../../models');

exports.validateCoupon = async (req, res, next) => {
 try {
  const { code, orderTotal, orderMode } = req.body;
  const coupon = await Coupon.findOne({ where: { code: code?.toUpperCase() } });
  if (!coupon) return res.status(404).json({ success: false, message: 'কুপন পাওয়া যায়নি' });
  const validity = coupon.isValid(orderTotal || 0, orderMode || 'single');
  if (!validity.valid) return res.status(400).json({ success: false, message: validity.message });
  const discount = coupon.computeDiscount(orderTotal || 0);
  res.json({ success: true, discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } });
 } catch (err) { next(err); }
};
