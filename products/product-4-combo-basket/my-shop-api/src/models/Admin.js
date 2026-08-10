const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 name: { type: DataTypes.STRING(100), allowNull: false },
 email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
 phone: { type: DataTypes.STRING(20) },
 password: { type: DataTypes.STRING(255), allowNull: false },
 role: { type: DataTypes.ENUM('superadmin', 'admin', 'moderator'), defaultValue: 'admin' },
 permissions: { type: DataTypes.JSON }, // e.g. ["products","orders","customers"]
 avatar: { type: DataTypes.STRING(500) },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 last_login_at: { type: DataTypes.DATE },
}, {
 tableName: 'admins',
 hooks: {
  beforeCreate: async (admin) => { admin.password = await bcrypt.hash(admin.password, 12); },
  beforeUpdate: async (admin) => {
   if (admin.changed('password')) admin.password = await bcrypt.hash(admin.password, 12);
  },
 },
});

Admin.prototype.comparePassword = async function (plain) {
 return bcrypt.compare(plain, this.password);
};

// Convenience: does this admin have a given permission?
Admin.prototype.can = function (perm) {
 if (this.role === 'superadmin') return true;
 return Array.isArray(this.permissions) && this.permissions.includes(perm);
};

module.exports = Admin;
