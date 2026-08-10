const { Order, User } = require('../../models');
const { Op } = require('sequelize');
const auditLogger = require('../../utils/auditLogger');

exports.getAllOrders = async (req, res, next) => {
 try {
  const { status, page = 1, limit = 20, search, orderMode } = req.query;
  const where = {};
  if (status) where.status = status;
  if (orderMode) where.order_mode = orderMode;
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

exports.getOrder = async (req, res, next) => {
 try {
  const order = await Order.findByPk(req.params.id, {
   include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
  });
  if (!order) return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
  res.json({ success: true, order });
 } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
 try {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
  const oldStatus = order.status;
  await order.update({ status: req.body.status, notes: req.body.notes });
  await auditLogger(req, 'order', req.params.id, 'status_change',
   { status: oldStatus },
   { status: req.body.status },
   `Order #${order.order_number}: ${oldStatus} → ${req.body.status}`
  );
  res.json({ success: true, order });
 } catch (err) { next(err); }
};

exports.saveFraudStatus = async (req, res, next) => {
 try {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
  const fraudData = req.body.fraud_status;
  await order.update({
   fraud_status: fraudData,
   fraud_checked_at: new Date(),
  });
  await auditLogger(req, 'order', req.params.id, 'update',
   { fraud_status: order.fraud_status },
   { fraud_status: fraudData },
   `Fraud check saved for Order #${order.order_number}: risk=${fraudData?.riskLevel}`
  );
  res.json({ success: true, order });
 } catch (err) { next(err); }
};

