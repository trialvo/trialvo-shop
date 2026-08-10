const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const ENV = require('../config/env');

/**
 * Protect admin routes — validates JWT from admins table.
 * Uses a SEPARATE secret (ADMIN_JWT_SECRET) from shop tokens.
 * Attaches req.admin
 */
exports.adminProtect = async (req, res, next) => {
 try {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'অ্যাডমিন লগইন করুন' });
  const token = auth.split(' ')[1];
  const decoded = jwt.verify(token, ENV.ADMIN_JWT_SECRET);
  if (decoded.scope !== 'admin') return res.status(401).json({ success: false, message: 'অবৈধ টোকেন স্কোপ' });
  const admin = await Admin.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
  if (!admin) return res.status(401).json({ success: false, message: 'অ্যাডমিন পাওয়া যায়নি' });
  if (!admin.is_active) return res.status(403).json({ success: false, message: 'অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয়' });
  // Update last login
  await Admin.update({ last_login_at: new Date() }, { where: { id: admin.id } });
  req.admin = admin;
  next();
 } catch {
  return res.status(401).json({ success: false, message: 'অ্যাডমিন টোকেন অবৈধ বা মেয়াদ শেষ' });
 }
};

/**
 * Permission guard — require specific permission or superadmin role.
 * Usage: router.get('/products', adminProtect, requirePermission('products'), handler)
 */
exports.requirePermission = (perm) => (req, res, next) => {
 if (!req.admin?.can(perm)) {
  return res.status(403).json({ success: false, message: `এই কাজের জন্য '${perm}' পারমিশন প্রয়োজন` });
 }
 next();
};

/**
 * Superadmin-only guard.
 */
exports.superadminOnly = (req, res, next) => {
 if (req.admin?.role !== 'superadmin') {
  return res.status(403).json({ success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন অ্যাক্সেস করতে পারবেন' });
 }
 next();
};

exports.generateAdminToken = (id) =>
 jwt.sign({ id, scope: 'admin' }, ENV.ADMIN_JWT_SECRET, { expiresIn: ENV.ADMIN_JWT_EXPIRE });
