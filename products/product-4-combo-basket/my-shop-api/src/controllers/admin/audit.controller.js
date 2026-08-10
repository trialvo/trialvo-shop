const { AuditLog } = require('../../models');
const { Op } = require('sequelize');

exports.getLogs = async (req, res, next) => {
 try {
  const { entityType, entityId, action, adminId, page = 1, limit = 30 } = req.query;
  const where = {};
  if (entityType) where.entity_type = entityType;
  if (entityId) where.entity_id = entityId;
  if (action) where.action = action;
  if (adminId) where.admin_id = adminId;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: logs, count: total } = await AuditLog.findAndCountAll({
   where,
   order: [['created_at', 'DESC']],
   offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), logs });
 } catch (err) { next(err); }
};

exports.getEntityHistory = async (req, res, next) => {
 try {
  const { entityType, entityId } = req.params;
  const logs = await AuditLog.findAll({
   where: { entity_type: entityType, entity_id: entityId },
   order: [['created_at', 'DESC']],
   limit: 50,
  });
  res.json({ success: true, logs });
 } catch (err) { next(err); }
};
