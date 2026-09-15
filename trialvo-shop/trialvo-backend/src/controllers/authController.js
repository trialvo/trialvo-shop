const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { logAdminActivity } = require('../services/adminActivityLog');

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
   await logAdminActivity({
    req,
    adminId: null,
    action: 'auth.login_failed',
    resource: 'auth',
    summary: 'Login failed',
    meta: { email },
   });
   return res.status(401).json({ error: 'Invalid email or password' });
  }

  const admin = rows[0];
  if (Number(admin.is_active) === 0) {
   await logAdminActivity({
    req,
    adminId: admin.id,
    action: 'auth.login_failed',
    resource: 'auth',
    summary: 'Login failed',
    meta: { email },
   });
   return res.status(401).json({ error: 'Account is disabled.', code: 'ACCOUNT_DISABLED' });
  }

  const isValid = await bcrypt.compare(password, admin.password_hash);

  if (!isValid) {
   await logAdminActivity({
    req,
    adminId: admin.id,
    action: 'auth.login_failed',
    resource: 'auth',
    summary: 'Login failed',
    meta: { email },
   });
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

  await logAdminActivity({
   req,
   adminId: admin.id,
   action: 'auth.login',
   resource: 'auth',
   summary: 'Admin signed in',
  });

  res.json({
   token,
   expiresAt,
   admin: {
    id: admin.id,
    email: admin.email,
    full_name: admin.full_name,
    avatar_url: admin.avatar_url,
    role: admin.role,
    phone: admin.phone || null,
    is_active: Number(admin.is_active) !== 0,
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
  const { full_name, email, phone } = req.body;
  const updates = [];
  const values = [];
  let idx = 1;

  if (full_name !== undefined) {
   const name = String(full_name || '').trim();
   if (!name) {
    return res.status(400).json({ error: 'Full name is required' });
   }
   updates.push(`full_name = $${idx++}`);
   values.push(name);
  }

  if (email !== undefined) {
   const nextEmail = String(email || '').trim().toLowerCase();
   if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return res.status(400).json({ error: 'Valid email is required' });
   }
   // Unique email (exclude self)
   const dup = await pool.query(
    'SELECT id FROM admin_profiles WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1',
    [nextEmail, req.admin.id]
   );
   if (dup.rows.length) {
    return res.status(409).json({ error: 'Email is already in use' });
   }
   updates.push(`email = $${idx++}`);
   values.push(nextEmail);
  }

  // Super (and any staff) can update their own phone from Settings
  if (phone !== undefined) {
   const nextPhone = phone == null || String(phone).trim() === '' ? null : String(phone).trim();
   updates.push(`phone = $${idx++}`);
   values.push(nextPhone);
  }

  if (!updates.length) {
   return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.admin.id);
  await pool.query(
   `UPDATE admin_profiles SET ${updates.join(', ')} WHERE id = $${idx}`,
   values
  );

  const { rows } = await pool.query(
   'SELECT id, email, full_name, avatar_url, role, phone, is_active FROM admin_profiles WHERE id = $1',
   [req.admin.id]
  );
  const next = rows[0];
  await logAdminActivity({
   req,
   action: 'auth.profile_update',
   resource: 'auth',
   resourceId: req.admin.id,
   summary: 'Profile updated',
   meta: { fields: updates.map((u) => u.split(' = ')[0]) },
  });
  res.json({
   message: 'Profile updated successfully',
   admin: {
    ...next,
    phone: next.phone || null,
    is_active: Number(next.is_active) !== 0,
   },
  });
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

  await logAdminActivity({
   req,
   action: 'auth.password_change',
   resource: 'auth',
   resourceId: req.admin.id,
   summary: 'Password changed',
  });

  res.json({ message: 'Password changed successfully' });
 } catch (error) {
  next(error);
 }
}

module.exports = { login, getMe, updateProfile, changePassword };
