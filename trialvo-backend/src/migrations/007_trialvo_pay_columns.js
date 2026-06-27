/**
 * Migration 007: Add Trialvo Pay payment fields to orders table
 */
module.exports = {
  name: '007_trialvo_pay_columns',
  async up(connection) {
    // Add payment tracking columns (safe — uses IF NOT EXISTS pattern)
    const columns = [
      "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) NULL DEFAULT NULL COMMENT 'Trialvo Pay payment status: paid, failed, cancelled, expired, refunded'",
      "ALTER TABLE orders ADD COLUMN trialvo_pay_bill_token VARCHAR(255) NULL DEFAULT NULL COMMENT 'Trialvo Pay bill token for this order'",
      "ALTER TABLE orders ADD COLUMN trialvo_pay_transaction_id VARCHAR(255) NULL DEFAULT NULL COMMENT 'Trialvo Pay transaction ID after payment'",
      "ALTER TABLE orders ADD COLUMN pay_url VARCHAR(512) NULL DEFAULT NULL COMMENT 'Trialvo Pay payment redirect URL'",
    ];

    for (const sql of columns) {
      try {
        await connection.execute(sql);
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          console.warn('[Migration 007] Warning:', err.message);
        }
      }
    }

    // Extend order status ENUM to include 'payment_failed'
    try {
      await connection.execute(
        "ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'payment_failed') DEFAULT 'pending'"
      );
    } catch (err) {
      console.warn('[Migration 007] ENUM update warning:', err.message);
    }

    console.log('✅ Migration 007: Trialvo Pay columns added to orders');
  },

  async down(connection) {
    const drops = [
      'ALTER TABLE orders DROP COLUMN IF EXISTS payment_status',
      'ALTER TABLE orders DROP COLUMN IF EXISTS trialvo_pay_bill_token',
      'ALTER TABLE orders DROP COLUMN IF EXISTS trialvo_pay_transaction_id',
      'ALTER TABLE orders DROP COLUMN IF EXISTS pay_url',
    ];
    for (const sql of drops) {
      await connection.execute(sql).catch(() => {});
    }
  },
};

