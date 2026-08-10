const { Order, User, Product } = require('../../models');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');

exports.getStats = async (req, res, next) => {
  try {
    const [totalOrders, totalCustomers, totalProducts, revenueRows, pendingOrders, deliveredOrders] = await Promise.all([
      Order.count(),
      User.count(),
      Product.count(),
      sequelize.query("SELECT SUM(`total`) as revenue FROM `orders` WHERE `status` != 'cancelled'", { type: sequelize.QueryTypes.SELECT }),
      Order.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: 'delivered' } }),
    ]);
    res.json({
      success: true, stats: {
        totalOrders, totalCustomers, totalProducts,
        revenue: revenueRows[0]?.revenue || 0,
        pendingOrders, deliveredOrders,
      }
    });
  } catch (err) { next(err); }
};

exports.getOrdersChart = async (req, res, next) => {
  try {
    const data = await sequelize.query(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, { type: sequelize.QueryTypes.SELECT });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const orders = await Order.findAll({ attributes: ['items'], where: { status: { [Op.ne]: 'cancelled' } } });
    const map = {};
    for (const o of orders) {
      let items = o.items;
      if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
      (Array.isArray(items) ? items : []).forEach(item => {
        const k = String(item.productId || item.product || item.id);
        if (!map[k]) map[k] = { id: k, name: item.name, totalSold: 0, revenue: 0 };
        map[k].totalSold += item.qty || 1;
        map[k].revenue += item.price * (item.qty || 1);
      });
    }
    const data = Object.values(map).sort((a, b) => b.totalSold - a.totalSold).slice(0, 10);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
