const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

// POST /api/customer/register
async function register(req, res, next) {
 try {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
   return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
   return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if email already exists
  const [existing] = await pool.execute('SELECT id FROM customers WHERE email = ?', [email]);
  if (existing.length > 0) {
   return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 12);

  await pool.execute(
   'INSERT INTO customers (id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
   [id, name, email, phone || null, passwordHash]
  );

  const token = jwt.sign(
   { id, email, type: 'customer' },
   process.env.JWT_SECRET,
   { expiresIn: '30d' }
  );

  res.status(201).json({
   token,
   customer: { id, name, email, phone: phone || null, avatar_url: null, is_verified: false },
  });
 } catch (error) {
  next(error);
 }
}

// POST /api/customer/login
async function login(req, res, next) {
 try {
  const { email, password } = req.body;

  if (!email || !password) {
   return res.status(400).json({ error: 'Email and password are required' });
  }

  const [rows] = await pool.execute('SELECT * FROM customers WHERE email = ?', [email]);
  if (rows.length === 0) {
   return res.status(401).json({ error: 'Invalid email or password' });
  }

  const customer = rows[0];
  const isValid = await bcrypt.compare(password, customer.password_hash);
  if (!isValid) {
   return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
   { id: customer.id, email: customer.email, type: 'customer' },
   process.env.JWT_SECRET,
   { expiresIn: '30d' }
  );

  res.json({
   token,
   customer: {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    avatar_url: customer.avatar_url,
    is_verified: Boolean(customer.is_verified),
   },
  });
 } catch (error) {
  next(error);
 }
}

// GET /api/customer/me
async function getProfile(req, res) {
 res.json({ customer: req.customer });
}

// PUT /api/customer/profile
async function updateProfile(req, res, next) {
 try {
  const { name, phone, avatar_url } = req.body;
  await pool.execute(
   'UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
   [name || null, phone || null, avatar_url || null, req.customer.id]
  );

  const [rows] = await pool.execute(
   'SELECT id, name, email, phone, avatar_url, is_verified, created_at FROM customers WHERE id = ?',
   [req.customer.id]
  );

  res.json({ customer: rows[0] });
 } catch (error) {
  next(error);
 }
}

// PUT /api/customer/password
async function changePassword(req, res, next) {
 try {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
   return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
   return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const [rows] = await pool.execute('SELECT password_hash FROM customers WHERE id = ?', [req.customer.id]);
  const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isValid) {
   return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.execute('UPDATE customers SET password_hash = ? WHERE id = ?', [hash, req.customer.id]);

  res.json({ message: 'Password changed successfully' });
 } catch (error) {
  next(error);
 }
}

// GET /api/customer/orders
async function getMyOrders(req, res, next) {
 try {
  const [rows] = await pool.execute(
   `SELECT o.*, JSON_OBJECT('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as product
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC`,
   [req.customer.id]
  );

  const result = rows.map(row => ({
   ...row,
   product: row.product ? (typeof row.product === 'string' ? JSON.parse(row.product) : row.product) : null,
  }));

  res.json(result);
 } catch (error) {
  next(error);
 }
}

// GET /api/customer/orders/:orderId
async function getMyOrder(req, res, next) {
 try {
  const [rows] = await pool.execute(
   `SELECT o.*, JSON_OBJECT('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as product
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.id = ? AND o.customer_id = ?`,
   [req.params.orderId, req.customer.id]
  );

  if (rows.length === 0) {
   return res.status(404).json({ error: 'Order not found' });
  }

  const order = {
   ...rows[0],
   product: rows[0].product ? (typeof rows[0].product === 'string' ? JSON.parse(rows[0].product) : rows[0].product) : null,
  };

  // Get timeline
  const [timeline] = await pool.execute(
   'SELECT * FROM order_timeline WHERE order_id = ? ORDER BY created_at ASC',
   [req.params.orderId]
  );

  res.json({ order, timeline });
 } catch (error) {
  next(error);
 }
}

module.exports = { register, login, getProfile, updateProfile, changePassword, getMyOrders, getMyOrder };
