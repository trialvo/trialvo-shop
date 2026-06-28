/**
 * Migration 008: Add payment detail columns from Trialvo Pay IPN
 * Stores gateway info, payment reference, and timestamps from IPN notifications
 */
module.exports = {
  name: '008_payment_details',
  async up(client) {
    const columns = [
      { name: 'payment_reference', definition: "VARCHAR(255) DEFAULT NULL" },
      { name: 'paid_at', definition: "TIMESTAMPTZ DEFAULT NULL" },
      { name: 'gateway_transaction_id', definition: "VARCHAR(255) DEFAULT NULL" },
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

    console.log('✅ Migration 008: Payment detail columns added to orders');
  },

  async down(client) {
    const drops = [
      'ALTER TABLE orders DROP COLUMN IF EXISTS payment_reference',
      'ALTER TABLE orders DROP COLUMN IF EXISTS paid_at',
      'ALTER TABLE orders DROP COLUMN IF EXISTS gateway_transaction_id',
    ];
    for (const sql of drops) {
      await client.query(sql).catch(() => {});
    }
  },
};
