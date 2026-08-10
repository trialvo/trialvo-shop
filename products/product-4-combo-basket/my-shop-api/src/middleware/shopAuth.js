const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ENV = require('../config/env');

/**
 * Protect shop routes — validates JWT from users table.
 * Attaches req.shopUser
 */
exports.shopProtect = async (req, res, next) => {
 try {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'লগইন করুন' });
  const token = auth.split(' ')[1];
  const decoded = jwt.verify(token, ENV.JWT_SECRET);
  const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
  if (!user) return res.status(401).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' });
  if (!user.is_active) return res.status(403).json({ success: false, message: 'অ্যাকাউন্ট নিষ্ক্রিয়' });
  req.shopUser = user;
  next();
 } catch {
  return res.status(401).json({ success: false, message: 'টোকেন অবৈধ বা মেয়াদ শেষ' });
 }
};

/**
 * Optional: attach shopUser if token present, else continue as guest.
 */
exports.shopOptional = async (req, res, next) => {
 try {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
   const token = auth.split(' ')[1];
   const decoded = jwt.verify(token, ENV.JWT_SECRET);
   req.shopUser = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
  }
 } catch { /* guest */ }
 next();
};

exports.generateShopToken = (id) =>
 jwt.sign({ id, scope: 'shop' }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRE });
