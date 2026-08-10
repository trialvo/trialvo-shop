const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShopConfig = sequelize.define('ShopConfig', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 // Combo (custom builder) rules
 combo_is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 combo_discount_percent: { type: DataTypes.INTEGER, defaultValue: 15 },
 combo_discount_type: { type: DataTypes.ENUM('percent', 'flat'), defaultValue: 'percent' },
 combo_min_amount_for_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 combo_min_free_delivery: { type: DataTypes.DECIMAL(10, 2), defaultValue: 300 },
 combo_delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 60 },
 // Single rules
 single_is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 single_discount_percent: { type: DataTypes.INTEGER, defaultValue: 0 },
 single_discount_type: { type: DataTypes.ENUM('percent', 'flat'), defaultValue: 'percent' },
 single_min_amount_for_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 single_min_free_delivery: { type: DataTypes.DECIMAL(10, 2), defaultValue: 200 },
 single_delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 60 },
 // Combo-Bundle (pre-defined kit) rules
 combo_bundle_is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
 combo_bundle_discount_percent: { type: DataTypes.INTEGER, defaultValue: 10 },
 combo_bundle_discount_type: { type: DataTypes.ENUM('percent', 'flat'), defaultValue: 'percent' },
 combo_bundle_min_amount_for_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 combo_bundle_min_free_delivery: { type: DataTypes.DECIMAL(10, 2), defaultValue: 500 },
 combo_bundle_delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 60 },
 // Fraud checker
 fraud_checker_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
 fraud_checker_api_key: { type: DataTypes.STRING(255), defaultValue: null },
 // Delivery Zones
 delivery_zones: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('delivery_zones') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('delivery_zones', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 // Dynamic Delivery Configs
 combo_delivery_config: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('combo_delivery_config') || '{}'); } catch { return {}; } },
  set(v) { this.setDataValue('combo_delivery_config', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 single_delivery_config: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('single_delivery_config') || '{}'); } catch { return {}; } },
  set(v) { this.setDataValue('single_delivery_config', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 combo_bundle_delivery_config: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('combo_bundle_delivery_config') || '{}'); } catch { return {}; } },
  set(v) { this.setDataValue('combo_bundle_delivery_config', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
}, { tableName: 'shop_config' });

// Singleton helper
ShopConfig.getConfig = async function () {
 let cfg = await this.findOne();
 if (!cfg) cfg = await this.create({});
 return cfg;
};

module.exports = ShopConfig;

