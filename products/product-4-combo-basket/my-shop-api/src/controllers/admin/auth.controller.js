const { Admin } = require('../../models');
const { generateAdminToken } = require('../../middleware/adminAuth');
const auditLogger = require('../../utils/auditLogger');

exports.login = async (req, res, next) => {
 try {
  const { email, password } = req.body;
  if (!email || !password)
   return res.status(400).json({ success: false, message: 'ইমেইল ও পাসওয়ার্ড দিন' });
  const admin = await Admin.findOne({ where: { email } });
  if (!admin || !(await admin.comparePassword(password)))
   return res.status(401).json({ success: false, message: 'ইমেইল বা পাসওয়ার্ড ভুল' });
  if (!admin.is_active)
   return res.status(403).json({ success: false, message: 'অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয়' });
  await Admin.update({ last_login_at: new Date() }, { where: { id: admin.id } });
  const token = generateAdminToken(admin.id);
  // Attach admin to req temporarily for audit
  req.admin = admin;
  await auditLogger(req, 'admin', admin.id, 'login', null, null, `Login from ${req.ip}`);
  res.json({
   success: true, token,
   admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions, avatar: admin.avatar },
  });
 } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
 res.json({ success: true, admin: req.admin });
};

exports.updateMe = async (req, res, next) => {
 try {
  const { name, phone, avatar } = req.body;
  const old = { name: req.admin.name, phone: req.admin.phone };
  await Admin.update({ name, phone, avatar }, { where: { id: req.admin.id } });
  const admin = await Admin.findByPk(req.admin.id, { attributes: { exclude: ['password'] } });
  await auditLogger(req, 'admin', req.admin.id, 'update', old, { name, phone });
  res.json({ success: true, admin });
 } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
 try {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findByPk(req.admin.id);
  if (!(await admin.comparePassword(currentPassword)))
   return res.status(400).json({ success: false, message: 'বর্তমান পাসওয়ার্ড ভুল' });
  admin.password = newPassword;
  await admin.save();
  await auditLogger(req, 'admin', req.admin.id, 'password_change', null, null, 'Admin changed own password');
  res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
 } catch (err) { next(err); }
};
