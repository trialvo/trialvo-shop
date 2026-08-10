const { ContactMessage } = require('../../models');
const auditLogger = require('../../utils/auditLogger');

exports.getMessages = async (req, res, next) => {
 try {
  const { isRead, page = 1, limit = 20 } = req.query;
  const where = {};
  if (isRead !== undefined) where.is_read = isRead === 'true';
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: messages, count: total } = await ContactMessage.findAndCountAll({
   where, order: [['created_at', 'DESC']], offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), messages });
 } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
 try {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ success: false, message: 'বার্তা পাওয়া যায়নি' });
  await msg.update({ is_read: true });
  await auditLogger(req, 'message', req.params.id, 'mark_read', { is_read: false }, { is_read: true });
  res.json({ success: true });
 } catch (err) { next(err); }
};

exports.deleteMessage = async (req, res, next) => {
 try {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ success: false });
  await auditLogger(req, 'message', req.params.id, 'delete', msg.toJSON(), null);
  await msg.destroy();
  res.json({ success: true });
 } catch (err) { next(err); }
};
