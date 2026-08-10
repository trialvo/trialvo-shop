const { Sequelize } = require('sequelize');
const ENV = require('./env');

const sequelize = new Sequelize(
 ENV.DB_NAME,
 ENV.DB_USER,
 ENV.DB_PASS,
 {
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  dialect: 'mysql',
  logging: false,
  pool: {
   max: 10,
   min: 0,
   acquire: 30000,
   idle: 10000,
  },
  define: {
   timestamps: true,
   underscored: true,
  },
  // charset ensures the mysql2 connection handshake uses utf8mb4
  // All DB tables have been converted to utf8mb4_unicode_ci
  dialectOptions: {
   charset: 'utf8mb4',
  },
 }
);

module.exports = sequelize;
