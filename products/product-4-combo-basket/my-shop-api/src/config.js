'use strict';
const ENV = require('./config/env');

/**
 * Legacy config wrapper — proxies everything from config/env.js
 * No .env file needed. All values are in src/config/env.js
 */
const config = {
  env:  ENV.MODE,
  port: ENV.PORT,

  db: {
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    name: ENV.DB_NAME,
    user: ENV.DB_USER,
    pass: ENV.DB_PASS,
  },

  jwt: {
    secret:      ENV.JWT_SECRET,
    expire:      ENV.JWT_EXPIRE,
    adminSecret: ENV.ADMIN_JWT_SECRET,
    adminExpire: ENV.ADMIN_JWT_EXPIRE,
  },

  cors: {
    origin: ENV.CORS_ORIGIN
      ? ENV.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'],
  },
};

module.exports = config;
