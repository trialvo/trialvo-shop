const { Subscriber } = require('../models');
const { Op } = require('sequelize');

// POST /api/shop/subscribe
exports.subscribe = async (req, res, next) => {
 try {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) {
   return res.status(400).json({ success: false, message: 'Valid email is required.' });
  }

  const [sub, created] = await Subscriber.findOrCreate({
   where: { email: email.toLowerCase().trim() },
   defaults: { name: name?.trim() || null, is_active: true, source: 'footer' },
  });

  if (!created) {
   if (!sub.is_active) {
    await sub.update({ is_active: true });
    return res.json({ success: true, message: 'আপনার সাবস্ক্রিপশন পুনরায় সক্রিয় হয়েছে!' });
   }
   return res.json({ success: true, message: 'আপনি ইতিমধ্যে সাবস্ক্রাইব করেছেন।' });
  }

  return res.status(201).json({ success: true, message: 'সাবস্ক্রাইব সফল হয়েছে! 🎉' });
 } catch (err) { next(err); }
};

// GET /api/admin/subscribers
exports.getSubscribers = async (req, res, next) => {
 try {
  const { page = 1, limit = 20, search, is_active } = req.query;
  const where = {};
  if (search) where.email = { [Op.like]: `%${search}%` };
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: subscribers, count: total } = await Subscriber.findAndCountAll({
   where, order: [['created_at', 'DESC']], offset, limit: Number(limit),
  });

  res.json({ success: true, subscribers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
 } catch (err) { next(err); }
};

// PATCH /api/admin/subscribers/:id/toggle
exports.toggleSubscriber = async (req, res, next) => {
 try {
  const sub = await Subscriber.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: 'Not found' });
  await sub.update({ is_active: !sub.is_active });
  res.json({ success: true, subscriber: sub });
 } catch (err) { next(err); }
};

// DELETE /api/admin/subscribers/:id
exports.deleteSubscriber = async (req, res, next) => {
 try {
  const sub = await Subscriber.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: 'Not found' });
  await sub.destroy();
  res.json({ success: true, message: 'Deleted' });
 } catch (err) { next(err); }
};
