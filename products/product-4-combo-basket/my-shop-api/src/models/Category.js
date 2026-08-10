const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
 name_bn: { type: DataTypes.STRING(100), defaultValue: null },
 slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
 icon: { type: DataTypes.STRING(500) },
 image: { type: DataTypes.STRING(500) },
 svg_icon: { type: DataTypes.TEXT },
 color: { type: DataTypes.STRING(20), defaultValue: '#e91e63' },
 show_on_home: { type: DataTypes.BOOLEAN, defaultValue: false },
 home_sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
 sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'categories' });

module.exports = Category;
