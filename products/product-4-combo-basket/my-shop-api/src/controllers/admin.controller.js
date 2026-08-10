const { Order, User, Product } = require('../models');
const sequelize = require('../config/database');

exports.getStats = async (req, res, next) => {
 try {
  const [totalOrders, totalUsers, totalProducts, revenueRows, pendingOrders, deliveredOrders] = await Promise.all([
   Order.count(),
   User.count({ where: { role: 'user' } }),
   Product.count(),
   sequelize.query(
    "SELECT SUM(`total`) as revenue FROM `orders` WHERE `status` != 'cancelled'",
    { type: sequelize.QueryTypes.SELECT }
   ),
   Order.count({ where: { status: 'pending' } }),
   Order.count({ where: { status: 'delivered' } }),
  ]);
  const revenue = revenueRows[0]?.revenue || 0;
  res.json({ success: true, stats: { totalOrders, totalUsers, totalProducts, revenue, pendingOrders, deliveredOrders } });
 } catch (err) { next(err); }
};

exports.getOrdersChart = async (req, res, next) => {
 try {
  const data = await sequelize.query(`
      SELECT DATE(created_at) as \`_id\`, COUNT(*) as orders, SUM(total) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY \`_id\` ASC
    `, { type: sequelize.QueryTypes.SELECT });
  res.json({ success: true, data });
 } catch (err) { next(err); }
};

exports.getTopProducts = async (req, res, next) => {
 try {
  // Items are stored as JSON — aggregate in JS
  const orders = await Order.findAll({ attributes: ['items'], where: { status: { [require('sequelize').Op.ne]: 'cancelled' } } });
  const map = {};
  for (const o of orders) {
   (o.items || []).forEach(item => {
    const k = String(item.productId || item.product);
    if (!map[k]) map[k] = { _id: k, name: item.name, totalSold: 0, revenue: 0 };
    map[k].totalSold += item.qty;
    map[k].revenue += item.price * item.qty;
   });
  }
  const data = Object.values(map).sort((a, b) => b.totalSold - a.totalSold).slice(0, 10);
  res.json({ success: true, data });
 } catch (err) { next(err); }
};

exports.getCustomers = async (req, res, next) => {
 try {
  const { page = 1, limit = 20, search } = req.query;
  const { Op } = require('sequelize');
  const where = { role: 'user' };
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: users, count: total } = await User.findAndCountAll({ where, attributes: { exclude: ['password'] }, order: [['created_at', 'DESC']], offset, limit: Number(limit) });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), users });
 } catch (err) { next(err); }
};
