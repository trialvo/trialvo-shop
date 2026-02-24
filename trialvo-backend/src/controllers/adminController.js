const { pool } = require('../config/db');

// GET /api/admin/customers
async function adminGetCustomers(req, res, next) {
 try {
  const [rows] = await pool.execute(
   `SELECT c.id, c.name, c.email, c.phone, c.avatar_url, c.is_verified, c.created_at,
       (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as total_orders,
       (SELECT COALESCE(SUM(total_bdt), 0) FROM orders WHERE customer_id = c.id AND status != 'cancelled') as total_spent
       FROM customers c
       ORDER BY c.created_at DESC`
  );
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/customers/:id
async function adminGetCustomer(req, res, next) {
 try {
  const [rows] = await pool.execute(
   `SELECT c.id, c.name, c.email, c.phone, c.avatar_url, c.is_verified, c.created_at
       FROM customers c WHERE c.id = ?`,
   [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

  const [orders] = await pool.execute(
   `SELECT o.*, JSON_OBJECT('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as product
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
   [req.params.id]
  );

  const parsedOrders = orders.map(o => ({
   ...o,
   product: o.product ? (typeof o.product === 'string' ? JSON.parse(o.product) : o.product) : null,
  }));

  res.json({ customer: rows[0], orders: parsedOrders });
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/analytics
async function getAnalytics(req, res, next) {
 try {
  // Orders by status
  const [orderStats] = await pool.execute(
   `SELECT status, COUNT(*) as count, COALESCE(SUM(total_bdt), 0) as revenue
       FROM orders GROUP BY status`
  );

  // Orders by day (last 30 days)
  const [dailyOrders] = await pool.execute(
   `SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_bdt), 0) as revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
  );

  // Top products
  const [topProducts] = await pool.execute(
   `SELECT p.name, p.thumbnail, COUNT(o.id) as order_count, COALESCE(SUM(o.total_bdt), 0) as revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       GROUP BY o.product_id, p.name, p.thumbnail
       ORDER BY order_count DESC
       LIMIT 5`
  );

  // Customer stats
  const [customerStats] = await pool.execute(
   `SELECT COUNT(*) as total_customers,
       (SELECT COUNT(*) FROM customers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_this_week
       FROM customers`
  );

  // Coupon usage
  const [couponStats] = await pool.execute(
   `SELECT code, type, value, used_count, max_uses FROM coupons WHERE used_count > 0 ORDER BY used_count DESC LIMIT 5`
  );

  res.json({
   ordersByStatus: orderStats,
   dailyOrders,
   topProducts,
   customers: customerStats[0],
   topCoupons: couponStats,
  });
 } catch (error) {
  next(error);
 }
}

module.exports = { adminGetCustomers, adminGetCustomer, getAnalytics };
