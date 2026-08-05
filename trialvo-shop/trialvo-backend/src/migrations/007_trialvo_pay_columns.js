async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '007_trialvo_pay_columns',
  async up(client) {
    await addColumnIfMissing(client, 'orders', 'payment_status', 'VARCHAR(50) DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'trialvo_pay_bill_token', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'trialvo_pay_transaction_id', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'pay_url', 'VARCHAR(512) DEFAULT NULL');
    console.log('✅ Migration 007: Trialvo Pay columns added to orders');
  },
};
