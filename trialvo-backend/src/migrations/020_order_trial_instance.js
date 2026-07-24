async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '020_order_trial_instance',
  async up(client) {
    await addColumnIfMissing(client, 'orders', 'trial_instance_id', 'CHAR(36) DEFAULT NULL');
    try {
      await client.query(
        'ALTER TABLE orders ADD CONSTRAINT fk_orders_trial_instance FOREIGN KEY (trial_instance_id) REFERENCES trial_instances(id)'
      );
    } catch (e) {
      // Duplicate FK name / already exists
      if (e.errno !== 1826 && e.errno !== 1005 && e.code !== 'ER_FK_DUP_NAME' && e.errno !== 1215) {
        // 1826 = duplicate FK, ignore; other errors may be ok if column already linked
        if (![1061, 1826].includes(e.errno)) {
          console.warn('  (fk_orders_trial_instance)', e.message);
        }
      }
    }
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_orders_trial_instance ON orders(trial_instance_id)'
    );

    await client.query(
      'INSERT IGNORE INTO system_config (`key`, value, description) VALUES ($1, $2, $3)',
      [
        'trial_paid_extend_days',
        '365',
        'Days to extend a trial instance after successful product payment',
      ]
    );

    console.log('✅ Migration 020: orders.trial_instance_id + trial_paid_extend_days');
  },
};
