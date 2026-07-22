/**
 * Migration 020: Link orders to trial instances + paid convert extend days
 */
module.exports = {
  name: '020_order_trial_instance',
  async up(client) {
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS trial_instance_id CHAR(36) DEFAULT NULL
        REFERENCES trial_instances(id)
    `);
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_orders_trial_instance ON orders(trial_instance_id)'
    );

    await client.query(
      `INSERT INTO system_config (key, value, description) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
      [
        'trial_paid_extend_days',
        '365',
        'Days to extend a trial instance after successful product payment',
      ]
    );

    console.log('✅ Migration 020: orders.trial_instance_id + trial_paid_extend_days');
  },

  async down(client) {
    await client.query('DROP INDEX IF EXISTS idx_orders_trial_instance');
    await client.query('ALTER TABLE orders DROP COLUMN IF EXISTS trial_instance_id');
    await client.query("DELETE FROM system_config WHERE key = 'trial_paid_extend_days'");
  },
};
