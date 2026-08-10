// Central model registry + Sequelize associations
const sequelize = require('../config/database');

// Import all models
const Admin = require('./Admin');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const ShopConfig = require('./ShopConfig');
const Coupon = require('./Coupon');
const Review = require('./Review');
const Wishlist = require('./Wishlist');
const Address = require('./Address');
const FAQ = require('./FAQ');
const ContactMessage = require('./ContactMessage');
const AuditLog = require('./AuditLog');
const Slider = require('./Slider');
const Subscriber = require('./Subscriber');
const SiteSettings = require('./SiteSettings');
const ComboProduct = require('./ComboProduct');
const ComboProductItem = require('./ComboProductItem');

// ─── Associations ────────────────────────────────────────
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });

Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlist' });

Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });

// Slider → Product (optional link)
Slider.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ComboProduct ↔ ComboProductItem ↔ Product
ComboProduct.hasMany(ComboProductItem, { foreignKey: 'combo_id', as: 'items', onDelete: 'CASCADE' });
ComboProductItem.belongsTo(ComboProduct, { foreignKey: 'combo_id', as: 'combo' });
ComboProductItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ComboProductItem, { foreignKey: 'product_id', as: 'comboItems' });

// AuditLog has no FK associations — self-contained append-only log
// admin_id is stored as a plain number snapshot (admin may be deleted later)

module.exports = {
 sequelize,
 Admin, User, Category, Product, Order,
 ShopConfig, Coupon, Review, Wishlist,
 Address, FAQ, ContactMessage, AuditLog, Slider, Subscriber,
 SiteSettings, ComboProduct, ComboProductItem,
};
