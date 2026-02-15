const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// POST /api/auth/login
async function login(req, res, next) {
 try {
  const { email, password } = req.body;

  if (!email || !password) {
   return res.status(400).json({ error: 'Email and password are required' });
  }

  const [rows] = await pool.execute(
   'SELECT * FROM admin_profiles WHERE email = ?',
   [email]
  );

  if (rows.length === 0) {
   return res.status(401).json({ error: 'Invalid email or password' });
  }

  const admin = rows[0];
  const isValid = await bcrypt.compare(password, admin.password_hash);

  if (!isValid) {
   return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
   { id: admin.id, email: admin.email, role: admin.role },
   process.env.JWT_SECRET,
   { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
   token,
   admin: {
    id: admin.id,
    email: admin.email,
    full_name: admin.full_name,
    avatar_url: admin.avatar_url,
    role: admin.role,
   },
  });
 } catch (error) {
  next(error);
 }
}

// GET /api/auth/me
async function getMe(req, res) {
 res.json({ admin: req.admin });
}

// PUT /api/auth/profile
async function updateProfile(req, res, next) {
 try {
  const { full_name } = req.body;

  await pool.execute(
   'UPDATE admin_profiles SET full_name = ? WHERE id = ?',
   [full_name, req.admin.id]
  );

  res.json({ message: 'Profile updated successfully' });
 } catch (error) {
  next(error);
 }
}

// PUT /api/auth/password
async function changePassword(req, res, next) {
 try {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
   return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.execute(
   'UPDATE admin_profiles SET password_hash = ? WHERE id = ?',
   [passwordHash, req.admin.id]
  );

  res.json({ message: 'Password changed successfully' });
 } catch (error) {
  next(error);
 }
}

module.exports = { login, getMe, updateProfile, changePassword };
