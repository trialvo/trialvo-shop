const { User } = require('../../models');
const { generateShopToken } = require('../../middleware/shopAuth');

exports.register = async (req, res, next) => {
 try {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
   return res.status(400).json({ success: false, message: 'নাম, ইমেইল ও পাসওয়ার্ড দিন' });
  if (await User.findOne({ where: { email } }))
   return res.status(400).json({ success: false, message: 'ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে' });
  const user = await User.create({ name, email, password, phone });
  const token = generateShopToken(user.id);
  res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
 } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
 try {
  const { email, password } = req.body;
  if (!email || !password)
   return res.status(400).json({ success: false, message: 'ইমেইল ও পাসওয়ার্ড দিন' });
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password)))
   return res.status(401).json({ success: false, message: 'ইমেইল বা পাসওয়ার্ড ভুল' });
  if (!user.is_active)
   return res.status(403).json({ success: false, message: 'অ্যাকাউন্ট নিষ্ক্রিয়' });
  const token = generateShopToken(user.id);
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
 } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
 res.json({ success: true, user: req.shopUser });
};

exports.updateMe = async (req, res, next) => {
 try {
  const { name, phone, avatar } = req.body;
  await User.update({ name, phone, avatar }, { where: { id: req.shopUser.id } });
  const user = await User.findByPk(req.shopUser.id, { attributes: { exclude: ['password'] } });
  res.json({ success: true, user });
 } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
 try {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.shopUser.id);
  if (!(await user.comparePassword(currentPassword)))
   return res.status(400).json({ success: false, message: 'বর্তমান পাসওয়ার্ড ভুল' });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
 } catch (err) { next(err); }
};
