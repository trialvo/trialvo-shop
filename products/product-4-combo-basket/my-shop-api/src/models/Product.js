const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 name: { type: DataTypes.STRING(200), allowNull: false },
 name_bn: { type: DataTypes.STRING(200), defaultValue: null },
 slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
 description: { type: DataTypes.TEXT },
 short_description: { type: DataTypes.STRING(500) },
 price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
 actual_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: null },
 discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, comment: 'flat discount in BDT; sell_price = price - discount_amount' },
 discount_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: null },  // legacy, kept for compat
 original_price: { type: DataTypes.DECIMAL(10, 2) },                        // legacy, kept for compat
 sell_price: {
  type: DataTypes.VIRTUAL,
  get() {
   const p = Number(this.getDataValue('price') || 0);
   const d = Number(this.getDataValue('discount_amount') || 0);
   return d > 0 ? Math.max(0, p - d) : p;
  },
 },
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
 category_id: { type: DataTypes.INTEGER, allowNull: false },
 tags: {
  type: DataTypes.JSON,
  get() {
   const val = this.getDataValue('tags');
   if (Array.isArray(val)) return val;
   if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
   return [];
  }
 },
 in_stock: { type: DataTypes.BOOLEAN, defaultValue: true },
 stock_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
 rating: { type: DataTypes.DECIMAL(3, 1), defaultValue: 0 },
 review_count: { type: DataTypes.INTEGER, defaultValue: 0 },
 is_combo_eligible: { type: DataTypes.BOOLEAN, defaultValue: true },
 is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
 video_url: { type: DataTypes.STRING(500) },
 sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
 features: {
  type: DataTypes.JSON,
  get() {
   const val = this.getDataValue('features');
   if (Array.isArray(val)) return val;
   if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
   return [];
  }
 },
 specifications: {
  type: DataTypes.JSON,
  get() {
   const val = this.getDataValue('specifications');
   if (val && typeof val === 'object' && !Array.isArray(val)) return val;
   if (typeof val === 'string') { try { return JSON.parse(val); } catch { return {}; } }
   return {};
  }
 },
}, { tableName: 'products' });


module.exports = Product;
