const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 entity_type: {
  type: DataTypes.ENUM('product', 'category', 'order', 'coupon', 'faq', 'config',
   'message', 'customer', 'admin', 'system'),
  allowNull: false,
 },
 entity_id: { type: DataTypes.STRING(50) },       // flexible — int or slug
 action: {
  type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout',
   'status_change', 'mark_read', 'password_change'),
  allowNull: false,
 },
 // Who did it
 admin_id: { type: DataTypes.INTEGER },           // nullable for system actions
 admin_name: { type: DataTypes.STRING(100) },       // snapshot — admin might be deleted later
 admin_email: { type: DataTypes.STRING(150) },
 // What changed
 old_values: { type: DataTypes.JSON },              // before state
 new_values: { type: DataTypes.JSON },              // after state
 // Request metadata
 ip_address: { type: DataTypes.STRING(45) },
 user_agent: { type: DataTypes.STRING(300) },
 notes: { type: DataTypes.STRING(500) },       // optional human-readable note
}, {
 tableName: 'audit_logs',
 updatedAt: false,                                  // logs are immutable
 indexes: [
  { fields: ['entity_type', 'entity_id'] },
  { fields: ['admin_id'] },
  { fields: ['action'] },
  { fields: ['created_at'] },
 ],
});

module.exports = AuditLog;
