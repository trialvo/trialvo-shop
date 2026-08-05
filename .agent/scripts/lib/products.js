/**
 * Shared product ↔ MySQL DB mapping for Trialvo monorepo.
 */
const path = require('path');

// .agent/scripts/lib → monorepo root (d:\our product)
const ROOT = path.resolve(__dirname, '../../..');

const PRODUCTS = {
  lifestyle: {
    key: 'lifestyle',
    folder: path.join(ROOT, 'products', 'product-1-lifestyle'),
    backupDir: path.join(ROOT, 'products', 'product-1-lifestyle', 'Back End', 'db-backup'),
    legacyBackupDir: path.join(ROOT, 'products', 'product-1-lifestyle', 'Back End', 'db backup'),
    defaultDb: 'lifestyle_demo',
    databases: ['lifestyle_demo', 'lifestyle_ecom'],
  },
  fashion: {
    key: 'fashion',
    folder: path.join(ROOT, 'products', 'product-2-fashion'),
    backupDir: path.join(ROOT, 'products', 'product-2-fashion', 'Back End', 'db-backup'),
    legacyBackupDir: path.join(ROOT, 'products', 'product-2-fashion', 'Back End', 'db backup'),
    defaultDb: 'fashion_demo',
    databases: ['fashion_demo', 'fashion_ecom'],
  },
  techshop: {
    key: 'techshop',
    folder: path.join(ROOT, 'products', 'product-3-tech-shop'),
    backupDir: path.join(ROOT, 'products', 'product-3-tech-shop', 'Back End', 'db-backup'),
    legacyBackupDir: path.join(ROOT, 'products', 'product-3-tech-shop', 'Back End', 'db backup'),
    defaultDb: 'techshop_demo',
    databases: ['techshop_demo', 'techshop_ecom'],
  },
};

const MYSQL = {
  container: process.env.MYSQL_CONTAINER || 'trialvo-mysql',
  host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.SHARED_DEMO_DB_PORT || '3430', 10),
  user: process.env.SHARED_DEMO_DB_USER || 'root',
  password: process.env.SHARED_DEMO_DB_PASSWORD || 'localdev2026',
};

const KEEP_BACKUPS = parseInt(process.env.DB_BACKUP_KEEP || '3', 10);

function resolveProduct(name) {
  const key = String(name || '').toLowerCase().trim();
  const aliases = {
    lifestyle: 'lifestyle',
    'product-1-lifestyle': 'lifestyle',
    'product-1': 'lifestyle',
    fashion: 'fashion',
    'product-2-fashion': 'fashion',
    'product-2': 'fashion',
    techshop: 'techshop',
    tech: 'techshop',
    'product-3-tech-shop': 'techshop',
    'product-3': 'techshop',
  };
  const resolved = aliases[key];
  if (!resolved || !PRODUCTS[resolved]) {
    throw new Error(
      `Unknown product "${name}". Use: lifestyle | fashion | techshop | all`
    );
  }
  return PRODUCTS[resolved];
}

function listProducts(arg) {
  if (!arg || arg === 'all') return Object.values(PRODUCTS);
  return [resolveProduct(arg)];
}

module.exports = {
  ROOT,
  PRODUCTS,
  MYSQL,
  KEEP_BACKUPS,
  resolveProduct,
  listProducts,
};
