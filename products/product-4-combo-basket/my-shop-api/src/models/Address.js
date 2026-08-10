const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 user_id: { type: DataTypes.INTEGER, allowNull: false },
 label: { type: DataTypes.STRING(50), defaultValue: 'Home' },
 name: { type: DataTypes.STRING(100) },
 phone: { type: DataTypes.STRING(20) },
 address: { type: DataTypes.STRING(300) },
 city: { type: DataTypes.STRING(100) },
 is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'addresses' });

module.exports = Address;
