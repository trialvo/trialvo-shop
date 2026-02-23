const name = '008_coupons_invoices';

async function up(connection) {
 // Coupons table
 await connection.execute(`
  CREATE TABLE IF NOT EXISTS coupons (
   id VARCHAR(36) PRIMARY KEY,
   code VARCHAR(50) NOT NULL UNIQUE,
   type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
   value DECIMAL(12, 2) NOT NULL DEFAULT 0,
   min_order DECIMAL(12, 2) DEFAULT 0,
   max_uses INT DEFAULT NULL,
   used_count INT DEFAULT 0,
   expires_at TIMESTAMP NULL DEFAULT NULL,
   is_active BOOLEAN DEFAULT TRUE,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
 `);
}

module.exports = { name, up };
