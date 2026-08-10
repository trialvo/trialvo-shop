const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComboProduct = sequelize.define('ComboProduct', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 name: { type: DataTypes.STRING(200), allowNull: false },
 name_bn: { type: DataTypes.STRING(200), defaultValue: null },
 slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
 description: { type: DataTypes.TEXT },
 short_description: { type: DataTypes.STRING(500) },
 image: { type: DataTypes.STRING(500) },
 images: {
  type: DataTypes.JSON,
  get() {
   const val = this.getDataValue('images');
   if (Array.isArray(val)) return val;
   if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
   return [];
  }
 },
 // Pricing
 bundle_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Final selling price set by admin' },
 original_price: { type: DataTypes.DECIMAL(10, 2), comment: 'Sum of all item MRPs (auto or manual)' },
 discount_percent: {
  type: DataTypes.VIRTUAL,
  get() {
   const bp = Number(this.bundle_price);
   const op = Number(this.original_price);
   if (!op || op <= bp) return 0;
   return Math.round(((op - bp) / op) * 100);
  }
 },
 // Stock
 in_stock: { type: DataTypes.BOOLEAN, defaultValue: true },
 stock_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
 // Flags
 is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
 sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
 tags: {
  type: DataTypes.JSON,
  get() {
   const val = this.getDataValue('tags');
   if (Array.isArray(val)) return val;
   if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
   return [];
  }
 },
}, { tableName: 'combo_products' });

module.exports = ComboProduct;
