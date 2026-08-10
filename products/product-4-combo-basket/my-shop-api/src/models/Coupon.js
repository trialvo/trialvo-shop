const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
 type: { type: DataTypes.ENUM('percent', 'fixed'), defaultValue: 'percent' },
 value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
 min_order_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 max_discount: { type: DataTypes.DECIMAL(10, 2) },
 usage_limit: { type: DataTypes.INTEGER, defaultValue: 0 },
 used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
 expires_at: { type: DataTypes.DATE },
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 applies_to: { type: DataTypes.ENUM('all', 'combo', 'single'), defaultValue: 'all' },
}, { tableName: 'coupons' });

Coupon.prototype.isValid = function (orderTotal, orderMode) {
 const now = new Date();
 if (!this.is_active) return { valid: false, message: 'কুপন নিষ্ক্রিয়' };
 if (this.expires_at && new Date(this.expires_at) < now) return { valid: false, message: 'কুপনের মেয়াদ শেষ' };
 if (this.usage_limit > 0 && this.used_count >= this.usage_limit) return { valid: false, message: 'কুপন সীমা শেষ' };
 if (orderTotal < this.min_order_amount) return { valid: false, message: `ন্যূনতম BDT ${this.min_order_amount} অর্ডার প্রয়োজন` };
 if (this.applies_to !== 'all' && this.applies_to !== orderMode) return { valid: false, message: 'এই কুপন এই অর্ডার টাইপে প্রযোজ্য নয়' };
 return { valid: true };
};

Coupon.prototype.computeDiscount = function (orderTotal) {
 if (this.type === 'percent') {
  const d = Math.round(orderTotal * this.value / 100);
  return this.max_discount ? Math.min(d, this.max_discount) : d;
 }
 return Math.min(this.value, orderTotal);
};

module.exports = Coupon;
