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

  const { rows } = await pool.query(
   'SELECT * FROM admin_profiles WHERE email = $1',
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

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign(
   { id: admin.id, email: admin.email, role: admin.role },
   process.env.JWT_SECRET,
   { expiresIn }
  );

  // Decode the token to get the actual expiry timestamp
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : null;

  res.json({
   token,
   expiresAt,
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

  await pool.query(
   'UPDATE admin_profiles SET full_name = $1 WHERE id = $2',
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
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
   return res.status(400).json({ error: 'Current password is required' });
  }

  if (!newPassword || newPassword.length < 6) {
   return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Verify current password before allowing change
  const { rows } = await pool.query(
   'SELECT password_hash FROM admin_profiles WHERE id = $1',
   [req.admin.id]
  );

  if (rows.length === 0) {
   return res.status(404).json({ error: 'Admin not found' });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isCurrentValid) {
   return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.query(
   'UPDATE admin_profiles SET password_hash = $1 WHERE id = $2',
   [passwordHash, req.admin.id]
  );

  res.json({ message: 'Password changed successfully' });
 } catch (error) {
  next(error);
 }
}

module.exports = { login, getMe, updateProfile, changePassword };
