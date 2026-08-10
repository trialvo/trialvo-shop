const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 product_id: { type: DataTypes.INTEGER, allowNull: false },
 user_id: { type: DataTypes.INTEGER, allowNull: false },
 rating: { type: DataTypes.TINYINT, allowNull: false },
 title: { type: DataTypes.STRING(200) },
 body: { type: DataTypes.TEXT },
}, {
 tableName: 'reviews',
 indexes: [{ unique: true, fields: ['product_id', 'user_id'] }],
});

module.exports = Review;
