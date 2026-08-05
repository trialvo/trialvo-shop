const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Convert Postgres-style $1,$2 placeholders to MySQL `?`.
 * Reused indices (e.g. $1 twice) expand into duplicate params in order.
 */
function convertPgPlaceholders(sql, params = []) {
  const normalize = (v) => {
    if (v !== null && typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v)) {
      return JSON.stringify(v);
    }
    return v;
  };

  // Already MySQL-style `?` placeholders — pass params through (stringify objects).
  if (!/\$\d+/.test(sql)) {
    return { sql, params: (params || []).map(normalize) };
  }

  const indices = [];
  const converted = sql.replace(/\$(\d+)/g, (_, n) => {
    indices.push(Number(n) - 1);
    return '?';
  });
  const mysqlParams = indices.map((i) => normalize(params[i]));
  return { sql: converted, params: mysqlParams };
}

function wrapResult(raw) {
  // SELECT → array of rows; INSERT/UPDATE/DELETE → ResultSetHeader
  if (Array.isArray(raw)) {
    return { rows: raw, rowCount: raw.length };
  }
  return {
    rows: [],
    rowCount: raw?.affectedRows ?? 0,
    insertId: raw?.insertId,
    affectedRows: raw?.affectedRows,
  };
}

function wrapConnection(conn) {
  return {
    async query(sql, params) {
      const q = convertPgPlaceholders(sql, params);
      const [raw] = await conn.query(q.sql, q.params);
      return wrapResult(raw);
    },
    async execute(sql, params) {
      const q = convertPgPlaceholders(sql, params);
      const [raw] = await conn.execute(q.sql, q.params);
      return wrapResult(raw);
    },
    release() {
      conn.release();
    },
    // Escape hatch for transaction helpers
    _raw: conn,
  };
}

const rawPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'trialvo',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trialvo_shop',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
  decimalNumbers: true,
  dateStrings: false,
});

const pool = {
  async query(sql, params) {
    const q = convertPgPlaceholders(sql, params);
    const [raw] = await rawPool.query(q.sql, q.params);
    return wrapResult(raw);
  },
  async execute(sql, params) {
    const q = convertPgPlaceholders(sql, params);
    const [raw] = await rawPool.execute(q.sql, q.params);
    return wrapResult(raw);
  },
  async connect() {
    const conn = await rawPool.getConnection();
    return wrapConnection(conn);
  },
  async end() {
    return rawPool.end();
  },
  // For scripts that need the underlying pool
  _raw: rawPool,
};

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ MySQL connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection, convertPgPlaceholders };
