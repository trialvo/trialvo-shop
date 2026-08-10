const { Coupon } = require('../../models');
const auditLogger = require('../../utils/auditLogger');

exports.getCoupons = async (req, res, next) => {
 try {
  const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
  res.json({ success: true, coupons });
 } catch (err) { next(err); }
};

exports.createCoupon = async (req, res, next) => {
 try {
  const coupon = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase() });
  await auditLogger(req, 'coupon', coupon.id, 'create', null, coupon.toJSON(), `Created coupon: ${coupon.code}`);
  res.status(201).json({ success: true, coupon });
 } catch (err) { next(err); }
};

exports.updateCoupon = async (req, res, next) => {
 try {
  const old = await Coupon.findByPk(req.params.id);
  if (!old) return res.status(404).json({ success: false, message: 'কুপন পাওয়া যায়নি' });
  await old.update(req.body);
  await auditLogger(req, 'coupon', req.params.id, 'update', old.toJSON(), req.body, `Updated coupon: ${old.code}`);
  res.json({ success: true, coupon: await Coupon.findByPk(req.params.id) });
 } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
 try {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'কুপন পাওয়া যায়নি' });
  await auditLogger(req, 'coupon', req.params.id, 'delete', coupon.toJSON(), null, `Deleted coupon: ${coupon.code}`);
  await coupon.destroy();
  res.json({ success: true, message: 'কুপন মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};
