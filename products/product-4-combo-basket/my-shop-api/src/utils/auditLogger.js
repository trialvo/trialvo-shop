const { AuditLog } = require('../models');

/**
 * Log an admin action to the audit_logs table.
 *
 * @param {object} req         - Express request (for admin identity + IP)
 * @param {string} entityType  - 'product' | 'category' | 'order' | etc.
 * @param {string|number} entityId
 * @param {string} action      - 'create' | 'update' | 'delete' | 'login' | etc.
 * @param {object|null} oldValues - Snapshot before change
 * @param {object|null} newValues - Snapshot after change
 * @param {string} [notes]     - Optional human-readable description
 */
const auditLogger = async (req, entityType, entityId, action, oldValues = null, newValues = null, notes = null) => {
 try {
  const admin = req.admin;   // set by adminAuth middleware
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
   || req.socket?.remoteAddress
   || req.ip;
  const ua = req.headers['user-agent']?.slice(0, 300);

  await AuditLog.create({
   entity_type: entityType,
   entity_id: String(entityId || ''),
   action,
   admin_id: admin?.id || null,
   admin_name: admin?.name || 'system',
   admin_email: admin?.email || null,
   old_values: oldValues ? sanitize(oldValues) : null,
   new_values: newValues ? sanitize(newValues) : null,
   ip_address: ip,
   user_agent: ua,
   notes,
  });
 } catch (err) {
  // Audit logging must never break the main flow
  console.error('[AuditLog] Failed to write log:', err.message);
 }
};

/** Strip sensitive fields before storing */
function sanitize(obj) {
 if (!obj || typeof obj !== 'object') return obj;
 const { password, ...safe } = obj instanceof Object ? obj.toJSON?.() || obj : obj;
 return safe;
}

module.exports = auditLogger;
