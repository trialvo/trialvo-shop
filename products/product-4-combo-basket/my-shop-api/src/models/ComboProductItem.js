const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComboProductItem = sequelize.define('ComboProductItem', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 combo_id: { type: DataTypes.INTEGER, allowNull: false },
 product_id: { type: DataTypes.INTEGER, allowNull: false },
 qty: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
 custom_label: { type: DataTypes.STRING(200), comment: 'Optional display label e.g. "ত্বকের যত্নের কিট"' },
}, { tableName: 'combo_product_items' });

module.exports = ComboProductItem;
