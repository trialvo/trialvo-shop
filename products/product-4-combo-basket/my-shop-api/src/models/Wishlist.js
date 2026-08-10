const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 user_id: { type: DataTypes.INTEGER, allowNull: false },
 product_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
 tableName: 'wishlists',
 indexes: [{ unique: true, fields: ['user_id', 'product_id'] }],
});

module.exports = Wishlist;
