/**
 * Migration 007: Add Trialvo Pay payment fields to orders table
 */
module.exports = {
  name: '007_trialvo_pay_columns',
  async up(client) {
    // Add payment tracking columns (safe — uses IF NOT EXISTS pattern)
    const columns = [
      { name: 'payment_status', definition: "VARCHAR(50) DEFAULT NULL" },
      { name: 'trialvo_pay_bill_token', definition: "VARCHAR(255) DEFAULT NULL" },
      { name: 'trialvo_pay_transaction_id', definition: "VARCHAR(255) DEFAULT NULL" },
      { name: 'pay_url', definition: "VARCHAR(512) DEFAULT NULL" },
    ];

    for (const col of columns) {
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='${col.name}') THEN
            ALTER TABLE orders ADD COLUMN ${col.name} ${col.definition};
          END IF;
        END $$;
      `);
    }

    console.log('✅ Migration 007: Trialvo Pay columns added to orders');
  },

  async down(client) {
    const drops = [
      'ALTER TABLE orders DROP COLUMN IF EXISTS payment_status',
      'ALTER TABLE orders DROP COLUMN IF EXISTS trialvo_pay_bill_token',
      'ALTER TABLE orders DROP COLUMN IF EXISTS trialvo_pay_transaction_id',
      'ALTER TABLE orders DROP COLUMN IF EXISTS pay_url',
    ];
    for (const sql of drops) {
      await client.query(sql).catch(() => {});
    }
  },
};
