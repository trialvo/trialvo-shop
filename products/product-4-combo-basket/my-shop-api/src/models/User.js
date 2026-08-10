const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// Customers only — admins live in the separate `admins` table
const User = sequelize.define('User', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 name: { type: DataTypes.STRING(100), allowNull: false },
 email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
 phone: { type: DataTypes.STRING(20) },
 password: { type: DataTypes.STRING(255), allowNull: false },
 avatar: { type: DataTypes.STRING(500) },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
 tableName: 'users',
 hooks: {
  beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 12); },
  beforeUpdate: async (u) => {
   if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12);
  },
 },
});

User.prototype.comparePassword = async function (plain) {
 return bcrypt.compare(plain, this.password);
};

module.exports = User;
