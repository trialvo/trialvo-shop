const { Order, ShopConfig, Coupon } = require('../../models');
const { Op } = require('sequelize');
const { runFraudCheckForOrder } = require('../../utils/fraudChecker');

exports.placeOrder = async (req, res, next) => {
 try {
  const {
   items, order_mode: orderMode,
   shipping_address: shippingAddress,
   payment_method: paymentMethod,
   delivery_type: deliveryType,
   coupon_code: couponCode,
   note: notes,
  } = req.body;

  if (!items?.length) return res.status(400).json({ success: false, message: 'অর্ডারে কোনো আইটেম নেই' });

  const cfg = await ShopConfig.getConfig();
  const isCombo = orderMode === 'combo';
  const isComboBund = orderMode === 'combo-bundle';
  const discPct = isCombo ? cfg.combo_discount_percent
   : isComboBund ? cfg.combo_bundle_discount_percent
    : cfg.single_discount_percent;
  const minFree = isCombo ? cfg.combo_min_free_delivery
   : isComboBund ? cfg.combo_bundle_min_free_delivery
    : cfg.single_min_free_delivery;
  const dlvCharge = isCombo ? cfg.combo_delivery_charge
   : isComboBund ? cfg.combo_bundle_delivery_charge
    : cfg.single_delivery_charge;

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmount = Math.round(subtotal * discPct / 100);
  const afterDiscount = subtotal - discountAmount;

  // Base delivery: free if above threshold, otherwise config charge
  let deliveryCharge = afterDiscount >= minFree ? 0 : Number(dlvCharge);

  // Surcharge for express / same-day delivery types
  if (deliveryType === 'express') deliveryCharge = Math.max(deliveryCharge, 120);
  if (deliveryType === 'same_day') deliveryCharge = Math.max(deliveryCharge, 250);

  let couponDiscount = 0, appliedCoupon = null;
  if (couponCode) {
   const coupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase() } });
   if (coupon) {
    const v = coupon.isValid(afterDiscount, orderMode);
    if (v.valid) { couponDiscount = coupon.computeDiscount(afterDiscount); appliedCoupon = coupon; }
   }
  }

  const total = afterDiscount + deliveryCharge - couponDiscount;
  const order = await Order.create({
   user_id: req.shopUser.id,
   items, order_mode: orderMode,
   subtotal, discount_amount: discountAmount, delivery_charge: deliveryCharge,
   coupon_code: appliedCoupon?.code, coupon_discount: couponDiscount, total,
   shipping_name: shippingAddress?.name, shipping_phone: shippingAddress?.phone,
   shipping_address: shippingAddress?.address, shipping_city: shippingAddress?.city,
   payment_method: paymentMethod, notes,
  });
  if (appliedCoupon) await Coupon.update({ used_count: appliedCoupon.used_count + 1 }, { where: { id: appliedCoupon.id } });

  // ── Fire-and-forget fraud check (non-blocking) ───────────────────────────
  runFraudCheckForOrder(order).catch(() => { });

  res.status(201).json({ success: true, order });
 } catch (err) { next(err); }
};


exports.getMyOrders = async (req, res, next) => {
 try {
  const orders = await Order.findAll({ where: { user_id: req.shopUser.id }, order: [['created_at', 'DESC']] });
  res.json({ success: true, orders });
 } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
 try {
  const order = await Order.findOne({ where: { id: req.params.id, user_id: req.shopUser.id } });
  if (!order) return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
  res.json({ success: true, order });
 } catch (err) { next(err); }
};
