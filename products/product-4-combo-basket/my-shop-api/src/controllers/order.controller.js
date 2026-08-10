const { Order, ShopConfig, Coupon, User } = require('../models');
const { Op } = require('sequelize');
const { runFraudCheckForOrder } = require('../utils/fraudChecker');

exports.placeOrder = async (req, res, next) => {
 try {
  const { items, orderMode, shippingAddress, paymentMethod, couponCode, notes } = req.body;
  if (!items?.length) return res.status(400).json({ success: false, message: 'অর্ডারে কোনো আইটেম নেই' });

  const cfg = await ShopConfig.getConfig();
  const discPct = orderMode === 'combo' ? cfg.combo_discount_percent : cfg.single_discount_percent;
  const minFree = orderMode === 'combo' ? cfg.combo_min_free_delivery : cfg.single_min_free_delivery;
  const dlvCharge = orderMode === 'combo' ? cfg.combo_delivery_charge : cfg.single_delivery_charge;

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmount = Math.round(subtotal * discPct / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const deliveryCharge = discountedSubtotal >= minFree ? 0 : Number(dlvCharge);

  let couponDiscount = 0;
  let appliedCoupon = null;
  if (couponCode) {
   const coupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase() } });
   if (coupon) {
    const validity = coupon.isValid(discountedSubtotal, orderMode);
    if (validity.valid) { couponDiscount = coupon.computeDiscount(discountedSubtotal); appliedCoupon = coupon; }
   }
  }

  const total = discountedSubtotal + deliveryCharge - couponDiscount;

  const order = await Order.create({
   user_id: req.user.id,
   items,
   order_mode: orderMode,
   subtotal,
   discount_amount: discountAmount,
   delivery_charge: deliveryCharge,
   coupon_code: appliedCoupon?.code,
   coupon_discount: couponDiscount,
   total,
   shipping_name: shippingAddress?.name,
   shipping_phone: shippingAddress?.phone,
   shipping_address: shippingAddress?.address,
   shipping_city: shippingAddress?.city,
   payment_method: paymentMethod,
   notes,
  });

  if (appliedCoupon) await Coupon.update({ used_count: appliedCoupon.used_count + 1 }, { where: { id: appliedCoupon.id } });

  // ── Fire-and-forget fraud check (non-blocking) ───────────────────────────
  runFraudCheckForOrder(order).catch(() => { });

  res.status(201).json({ success: true, order });
 } catch (err) { next(err); }
};


exports.getMyOrders = async (req, res, next) => {
 try {
  const orders = await Order.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
  res.json({ success: true, orders });
 } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
 try {
  const order = await Order.findByPk(req.params.id, { include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }] });
  if (!order) return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'অ্যাক্সেস নেই' });
  res.json({ success: true, order });
 } catch (err) { next(err); }
};

exports.getAllOrders = async (req, res, next) => {
 try {
  const { status, page = 1, limit = 20, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) where.order_number = { [Op.like]: `%${search}%` };
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: orders, count: total } = await Order.findAndCountAll({
   where,
   include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
   order: [['created_at', 'DESC']],
   offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), orders });
 } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
 try {
  const [updated] = await Order.update({ status: req.body.status }, { where: { id: req.params.id } });
  if (!updated) return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
  const order = await Order.findByPk(req.params.id);
  res.json({ success: true, order });
 } catch (err) { next(err); }
};
