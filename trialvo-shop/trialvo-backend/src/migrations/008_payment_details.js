async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '008_payment_details',
  async up(client) {
    await addColumnIfMissing(client, 'orders', 'payment_reference', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'paid_at', 'DATETIME(3) DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'gateway_transaction_id', 'VARCHAR(255) DEFAULT NULL');
    console.log('✅ Migration 008: Payment detail columns added to orders');
  },
};
