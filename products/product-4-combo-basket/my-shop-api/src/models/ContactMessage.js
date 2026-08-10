const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 name: { type: DataTypes.STRING(100), allowNull: false },
 email: { type: DataTypes.STRING(150), allowNull: false },
 phone: { type: DataTypes.STRING(20) },
 subject: { type: DataTypes.STRING(200) },
 message: { type: DataTypes.TEXT, allowNull: false },
 is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'contact_messages' });

module.exports = ContactMessage;
