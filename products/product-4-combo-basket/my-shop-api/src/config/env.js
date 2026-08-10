// Combo Basket — API environment (process.env overrides for Docker / Trialvo demos)
const MODE = process.env.NODE_ENV === 'production' ? 'production' : 'development';

function envOr(key, fallback) {
  const v = process.env[key];
  return v !== undefined && v !== '' ? v : fallback;
}

const DEV = {
  PORT: 5001,
  DB_HOST: '127.0.0.1',
  DB_PORT: 3306,
  DB_NAME: 'combobasket_demo',
  DB_USER: 'root',
  DB_PASS: 'localdev2026',
  JWT_SECRET: 'combo-demo-jwt-secret',
  JWT_EXPIRE: '7d',
  ADMIN_JWT_SECRET: 'combo-demo-admin-jwt-secret',
  ADMIN_JWT_EXPIRE: '8h',
  CORS_ORIGIN: 'http://localhost:3000,http://localhost:5173,http://localhost:5103,http://localhost:5177',
};

const PROD = {
  PORT: 5000,
  DB_HOST: '127.0.0.1',
  DB_PORT: 3430,
  DB_NAME: 'combobasket_demo',
  DB_USER: 'root',
  DB_PASS: 'localdev2026',
  JWT_SECRET: 'combo-demo-jwt-secret',
  JWT_EXPIRE: '7d',
  ADMIN_JWT_SECRET: 'combo-demo-admin-jwt-secret',
  ADMIN_JWT_EXPIRE: '8h',
  CORS_ORIGIN: '*',
};

const defaults = MODE === 'production' ? PROD : DEV;

const ENV = {
  MODE,
  isProduction: MODE === 'production',
  PORT: parseInt(envOr('PORT', String(defaults.PORT)), 10),
  DB_HOST: envOr('DB_HOST', defaults.DB_HOST),
  DB_PORT: parseInt(envOr('DB_PORT', String(defaults.DB_PORT)), 10),
  DB_NAME: envOr('DB_NAME', defaults.DB_NAME),
  DB_USER: envOr('DB_USER', defaults.DB_USER),
  DB_PASS: envOr('DB_PASS', defaults.DB_PASS),
  JWT_SECRET: envOr('JWT_SECRET', defaults.JWT_SECRET),
  JWT_EXPIRE: envOr('JWT_EXPIRE', defaults.JWT_EXPIRE),
  ADMIN_JWT_SECRET: envOr('ADMIN_JWT_SECRET', defaults.ADMIN_JWT_SECRET),
  ADMIN_JWT_EXPIRE: envOr('ADMIN_JWT_EXPIRE', defaults.ADMIN_JWT_EXPIRE),
  CORS_ORIGIN: envOr('CORS_ORIGIN', defaults.CORS_ORIGIN),
};

module.exports = ENV;
