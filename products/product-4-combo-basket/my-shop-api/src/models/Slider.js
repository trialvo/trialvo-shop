const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Slider = sequelize.define('Slider', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 title: { type: DataTypes.STRING(200), allowNull: false },
 subtitle: { type: DataTypes.STRING(200), defaultValue: '' },
 highlight: { type: DataTypes.STRING(100), defaultValue: '' },
 description: { type: DataTypes.STRING(500), defaultValue: '' },
 badge: { type: DataTypes.STRING(100), defaultValue: '' },
 badge_color: { type: DataTypes.STRING(100), defaultValue: 'from-pink-500 to-rose-600' },
 banner_image: { type: DataTypes.STRING(500), defaultValue: '' },
 accent_from: { type: DataTypes.STRING(20), defaultValue: '#e91e63' },
 accent_to: { type: DataTypes.STRING(20), defaultValue: '#ff4081' },
 bg_from: { type: DataTypes.STRING(20), defaultValue: '#0f172a' },
 bg_via: { type: DataTypes.STRING(20), defaultValue: '#1a1035' },
 bg_to: { type: DataTypes.STRING(20), defaultValue: '#1e0a2e' },
 price: { type: DataTypes.STRING(50), defaultValue: '' },
 original_price: { type: DataTypes.STRING(50), defaultValue: '' },
 discount: { type: DataTypes.STRING(50), defaultValue: '' },
 link: { type: DataTypes.STRING(300), defaultValue: '/products' },
 cta_text: { type: DataTypes.STRING(80), defaultValue: 'এখনই কিনুন' },
 cta_secondary: { type: DataTypes.STRING(80), defaultValue: 'সব পণ্য দেখুন' },
 button_style: { type: DataTypes.ENUM('gradient', 'solid', 'outline'), defaultValue: 'gradient' },
 product_id: { type: DataTypes.INTEGER, allowNull: true },
 sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 category: { type: DataTypes.STRING(100), defaultValue: '' },
 free_delivery: { type: DataTypes.BOOLEAN, defaultValue: false },
 authentic: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'sliders' });

module.exports = Slider;

