const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscriber = sequelize.define('Subscriber', {
 id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
 email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
 name: { type: DataTypes.STRING(100), allowNull: true },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 source: { type: DataTypes.STRING(50), defaultValue: 'footer' }, // footer | popup | etc
}, {
 tableName: 'subscribers',
 timestamps: true,
 createdAt: 'created_at',
 updatedAt: 'updated_at',
});

module.exports = Subscriber;
