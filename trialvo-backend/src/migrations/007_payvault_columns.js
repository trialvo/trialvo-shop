/**
 * Migration 007: Add PayVault payment fields to orders table
 */
async function up(pool) {
  // Add payment tracking columns (safe — uses IF NOT EXISTS pattern via ALTER IGNORE)
  const columns = [
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NULL DEFAULT NULL COMMENT 'PayVault payment status: paid, failed, cancelled, expired, refunded'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payvault_bill_token VARCHAR(255) NULL DEFAULT NULL COMMENT 'PayVault bill token for this order'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payvault_transaction_id VARCHAR(255) NULL DEFAULT NULL COMMENT 'PayVault transaction ID after payment'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_url VARCHAR(512) NULL DEFAULT NULL COMMENT 'PayVault payment redirect URL'",
  ];

  for (const sql of columns) {
    try {
      await pool.execute(sql);
    } catch (err) {
      // Column might already exist on re-run — ignore
      if (!err.message.includes('Duplicate column')) {
        console.warn('[Migration 007] Warning:', err.message);
      }
    }
  }

  console.log('✅ Migration 007: PayVault columns added to orders');
}

async function down(pool) {
  const drops = [
    'ALTER TABLE orders DROP COLUMN IF EXISTS payment_status',
    'ALTER TABLE orders DROP COLUMN IF EXISTS payvault_bill_token',
    'ALTER TABLE orders DROP COLUMN IF EXISTS payvault_transaction_id',
    'ALTER TABLE orders DROP COLUMN IF EXISTS pay_url',
  ];
  for (const sql of drops) {
    await pool.execute(sql).catch(() => {});
  }
}

module.exports = { up, down };
