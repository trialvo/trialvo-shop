const { ContactMessage } = require('../models');
const { Op } = require('sequelize');

exports.submitContact = async (req, res, next) => {
 try {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'নাম, ইমেইল ও মেসেজ দিন' });
  await ContactMessage.create({ name, email, phone, subject, message });
  res.status(201).json({ success: true, message: 'আপনার বার্তা পাঠানো হয়েছে।' });
 } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
 try {
  const { isRead, page = 1, limit = 20 } = req.query;
  const where = {};
  if (isRead !== undefined) where.is_read = isRead === 'true';
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: messages, count: total } = await ContactMessage.findAndCountAll({ where, order: [['created_at', 'DESC']], offset, limit: Number(limit) });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), messages });
 } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
 try {
  await ContactMessage.update({ is_read: true }, { where: { id: req.params.id } });
  res.json({ success: true });
 } catch (err) { next(err); }
};
