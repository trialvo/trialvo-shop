const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
 order_number: { type: DataTypes.STRING(50), unique: true },
 user_id: { type: DataTypes.INTEGER, allowNull: false },
 items: { type: DataTypes.JSON, allowNull: false }, // [{productId,name,price,qty,image}]
 order_mode: { type: DataTypes.ENUM('single', 'combo', 'combo-bundle'), defaultValue: 'single' },
 subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
 discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 coupon_code: { type: DataTypes.STRING(50) },
 coupon_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
 total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
 // Shipping snapshot
 shipping_name: { type: DataTypes.STRING(100) },
 shipping_phone: { type: DataTypes.STRING(20) },
 shipping_address: { type: DataTypes.STRING(300) },
 shipping_city: { type: DataTypes.STRING(100) },
 // Payment
 payment_method: { type: DataTypes.ENUM('cod', 'bkash', 'nagad', 'card'), defaultValue: 'cod' },
 payment_status: { type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
 // Status
 status: {
  type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
  defaultValue: 'pending',
 },
 // Fraud check
 fraud_status: {
  type: DataTypes.JSON,
  defaultValue: null,
  comment: 'Cached fraud check result: { riskLevel, deliveryRate, total_parcels, total_delivered, total_cancel, apis, checkedAt }'
 },
 fraud_checked_at: { type: DataTypes.DATE, defaultValue: null },
 notes: { type: DataTypes.TEXT },
}, {
 tableName: 'orders',
 hooks: {
  beforeCreate: async (order) => {
   const count = await order.constructor.count();
   order.order_number = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  },
 },
});

module.exports = Order;
