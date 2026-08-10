const { Coupon } = require('../models');

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

exports.getCoupons = async (req, res, next) => {
 try {
  const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
  res.json({ success: true, coupons });
 } catch (err) { next(err); }
};

exports.createCoupon = async (req, res, next) => {
 try {
  const coupon = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase() });
  res.status(201).json({ success: true, coupon });
 } catch (err) { next(err); }
};

exports.updateCoupon = async (req, res, next) => {
 try {
  const [updated] = await Coupon.update(req.body, { where: { id: req.params.id } });
  if (!updated) return res.status(404).json({ success: false, message: 'কুপন পাওয়া যায়নি' });
  const coupon = await Coupon.findByPk(req.params.id);
  res.json({ success: true, coupon });
 } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
 try {
  await Coupon.destroy({ where: { id: req.params.id } });
  res.json({ success: true, message: 'কুপন মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};
