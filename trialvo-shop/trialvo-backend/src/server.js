require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const storage = require('./services/storage');

const { testConnection } = require('./config/db');
const { runMigrations } = require('./migrations/runner');
const { runSeeds } = require('./seeds/runner');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const testimonialRoutes = require('./routes/testimonials');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');
const trialRoutes = require('./routes/trials');
const agentRoutes = require('./routes/agent');
const licensePackRoutes = require('./routes/licensePack');
const { ensureKeyPair } = require('./services/leaseIssuer');
const { startTrialLifecycleCron } = require('./cron/trialLifecycle');
const { startEventsRetentionCron } = require('./cron/eventsRetention');
const { startTrialMaintenanceCron } = require('./cron/trialMaintenance');


const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
// crossOriginResourcePolicy: cross-origin so shop UI (:8000) can load images from API (:5000).
app.use(helmet({
 crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
 origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
 credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads (local storage driver only) ──────────
// Files live in trialvo-shop/uploads (see storage.LOCAL_ROOT) and are served at /uploads/*.
if (storage.DRIVER === 'local') {
 app.use('/uploads', express.static(storage.LOCAL_ROOT, {
  setHeaders(res) {
   // Allow <img> from the shop origin to cache/display uploaded product media.
   res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
   res.setHeader('Cache-Control', 'public, max-age=86400');
  },
 }));
}

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
 res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/trial', trialRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/license', licensePackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/settings', settingsRoutes);


// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
 res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
let server;

async function startServer() {
 console.log('');
 console.log('╔═══════════════════════════════════════════╗');
 console.log('║     TRIALVO SHOP BACKEND API              ║');
 console.log('╚═══════════════════════════════════════════╝');
 console.log('');

 // 1. Test database connection
 const connected = await testConnection();
 if (!connected) {
  console.error('💀 Cannot start server without database connection');
  process.exit(1);
 }

 // 2. Run auto-migrations
 console.log('📦 Running migrations...');
 await runMigrations();

 // 3. Run auto-seeds (if tables empty)
 console.log('🌱 Checking seeds...');
 await runSeeds();

 ensureKeyPair();
 startTrialLifecycleCron();
 startEventsRetentionCron();
 startTrialMaintenanceCron();

 // 4. Start listening
 server = app.listen(PORT, () => {
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Admin API at http://localhost:${PORT}/api/admin`);
  console.log('');
 });

 server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
   console.error(`❌ Port ${PORT} is already in use. Kill the process and try again.`);
  } else {
   console.error('❌ Server error:', err);
  }
  process.exit(1);
 });
}

// ─── Graceful Shutdown (fixes node --watch restarts) ─────
function shutdown() {
 if (server) {
  server.close(() => process.exit(0));
 } else {
  process.exit(0);
 }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer().catch((err) => {
 console.error('💀 Fatal error starting server:', err);
 process.exit(1);
});
