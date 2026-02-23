const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function authenticateCustomer(req, res, next) {
 try {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
   return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Must be a customer token (has type: 'customer')
  if (decoded.type !== 'customer') {
   return res.status(401).json({ error: 'Invalid token type.' });
  }

  const [rows] = await pool.execute(
   'SELECT id, name, email, phone, avatar_url, is_verified, created_at FROM customers WHERE id = ?',
   [decoded.id]
  );

  if (rows.length === 0) {
   return res.status(401).json({ error: 'Customer not found.' });
  }

  req.customer = rows[0];
  next();
 } catch (error) {
  if (error.name === 'JsonWebTokenError') {
   return res.status(401).json({ error: 'Invalid token.' });
  }
  if (error.name === 'TokenExpiredError') {
   return res.status(401).json({ error: 'Token expired.' });
  }
  next(error);
 }
}

// Optional auth — sets req.customer if token present, continues either way
async function optionalCustomerAuth(req, res, next) {
 try {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
   return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.type !== 'customer') {
   return next();
  }

  const [rows] = await pool.execute(
   'SELECT id, name, email, phone, avatar_url, is_verified, created_at FROM customers WHERE id = ?',
   [decoded.id]
  );

  if (rows.length > 0) {
   req.customer = rows[0];
  }
 } catch (_) {
  // Token invalid — just continue without auth
 }
 next();
}

module.exports = { authenticateCustomer, optionalCustomerAuth };
