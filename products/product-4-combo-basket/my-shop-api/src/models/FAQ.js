const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FAQ = sequelize.define('FAQ', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 question: { type: DataTypes.STRING(500), allowNull: false },
 answer: { type: DataTypes.TEXT, allowNull: false },
 sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'faqs' });

module.exports = FAQ;
