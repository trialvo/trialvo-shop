const { User, Order } = require('../../models');
const { Op } = require('sequelize');
const auditLogger = require('../../utils/auditLogger');

exports.getCustomers = async (req, res, next) => {
 try {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const where = {};
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
  if (isActive !== undefined) where.is_active = isActive === 'true';
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: users, count: total } = await User.findAndCountAll({
   where, attributes: { exclude: ['password'] },
   order: [['created_at', 'DESC']],
   offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), users });
 } catch (err) { next(err); }
};

exports.getCustomer = async (req, res, next) => {
 try {
  const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
  if (!user) return res.status(404).json({ success: false, message: 'কাস্টমার পাওয়া যায়নি' });
  const orders = await Order.findAll({ where: { user_id: req.params.id }, order: [['created_at', 'DESC']], limit: 10 });
  res.json({ success: true, user, orders });
 } catch (err) { next(err); }
};

exports.toggleStatus = async (req, res, next) => {
 try {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'কাস্টমার পাওয়া যায়নি' });
  const oldStatus = user.is_active;
  await user.update({ is_active: !user.is_active });
  await auditLogger(req, 'customer', user.id, 'status_change',
   { is_active: oldStatus }, { is_active: !oldStatus },
   `Customer ${user.email}: ${oldStatus ? 'deactivated' : 'activated'}`
  );
  res.json({ success: true, is_active: user.is_active });
 } catch (err) { next(err); }
};
