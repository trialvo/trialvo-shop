const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ENV = require('../config/env');

exports.protect = async (req, res, next) => {
 try {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'লগইন করুন' });
  const token = auth.split(' ')[1];
  const decoded = jwt.verify(token, ENV.JWT_SECRET);
  const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
  if (!user) return res.status(401).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' });
  req.user = user;
  next();
 } catch (err) {
  return res.status(401).json({ success: false, message: 'টোকেন অবৈধ বা মেয়াদ শেষ' });
 }
};

exports.adminOnly = (req, res, next) => {
 if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'শুধুমাত্র অ্যাডমিন অ্যাক্সেস করতে পারবেন' });
 next();
};

exports.generateToken = (id) => jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRE });
