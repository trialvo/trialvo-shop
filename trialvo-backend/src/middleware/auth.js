const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function authenticate(req, res, next) {
 try {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
   return res.status(401).json({ error: 'Access denied. No token provided.', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch admin profile
  const { rows } = await pool.query(
   'SELECT id, email, full_name, avatar_url, role FROM admin_profiles WHERE id = $1',
   [decoded.id]
  );

  if (rows.length === 0) {
   return res.status(401).json({ error: 'Invalid token. Admin not found.', code: 'TOKEN_INVALID' });
  }

  req.admin = rows[0];
  next();
 } catch (error) {
  if (error.name === 'JsonWebTokenError') {
   return res.status(401).json({ error: 'Invalid token.', code: 'TOKEN_INVALID' });
  }
  if (error.name === 'TokenExpiredError') {
   return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
  }
  next(error);
 }
}

module.exports = { authenticate };

