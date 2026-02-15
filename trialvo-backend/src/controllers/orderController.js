const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/orders — public, create order
async function createOrder(req, res, next) {
 try {
  const id = uuidv4();
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const {
   productId, customerName, customerEmail, customerPhone,
   company, needsHosting, notes, paymentMethod, totalBdt,
  } = req.body;

  await pool.execute(
   `INSERT INTO orders (id, order_id, product_id, customer_name, customer_email, customer_phone, company, needs_hosting, notes, payment_method, total_bdt, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
   [
    id, orderId, productId || null, customerName, customerEmail,
    customerPhone, company || '', needsHosting ? 1 : 0,
    notes || '', paymentMethod, totalBdt || 0, 'pending',
   ]
  );

  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
 } catch (error) {
  next(error);
 }
}

// GET /api/orders/:orderId — public
async function getOrder(req, res, next) {
 try {
  const { orderId } = req.params;
  const [rows] = await pool.execute(
   'SELECT * FROM orders WHERE order_id = ?',
   [orderId]
  );

  if (rows.length === 0) {
   return res.status(404).json({ error: 'Order not found' });
  }

  res.json(rows[0]);
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/orders — with product info
async function adminGetOrders(req, res, next) {
 try {
  const [rows] = await pool.execute(`
      SELECT o.*, 
        JSON_OBJECT('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as products
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `);

  // Parse the products JSON string
  const result = rows.map((row) => ({
   ...row,
   products: row.products ? (typeof row.products === 'string' ? JSON.parse(row.products) : row.products) : null,
  }));

  res.json(result);
 } catch (error) {
  next(error);
 }
}

// PUT /api/admin/orders/:id/status
async function updateOrderStatus(req, res, next) {
 try {
  const { id } = req.params;
  const { status } = req.body;

  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  res.json({ message: 'Order status updated' });
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/dashboard — stats
async function getDashboardStats(req, res, next) {
 try {
  const [orders] = await pool.execute('SELECT status, total_bdt, created_at FROM orders');

  const total = orders.length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const completed = orders.filter((o) => o.status === 'completed').length;
  const revenue = orders.reduce((sum, o) => sum + Number(o.total_bdt || 0), 0);

  const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
  const [messages] = await pool.execute('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0');

  res.json({
   total, pending, confirmed, completed, revenue,
   totalProducts: products[0].count,
   unreadMessages: messages[0].count,
  });
 } catch (error) {
  next(error);
 }
}

module.exports = { createOrder, getOrder, adminGetOrders, updateOrderStatus, getDashboardStats };
