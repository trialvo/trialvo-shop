/**
 * Migration 009: Create system_config table for global settings
 */
module.exports = {
  name: '009_system_config',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Insert default values for Trialvo Pay (can be empty or environment defaults)
    const defaults = [
      ['trialvo_pay_service_id', process.env.TRIALVO_PAY_SERVICE_ID || '', 'Trialvo Pay Service ID'],
      ['trialvo_pay_api_key', process.env.TRIALVO_PAY_API_KEY || '', 'Trialvo Pay API Key'],
      ['trialvo_pay_ipn_secret', process.env.TRIALVO_PAY_IPN_SECRET || '', 'Trialvo Pay Webhook Secret'],
      ['trialvo_pay_base_url', process.env.TRIALVO_PAY_BASE_URL || 'http://trialvo-pay:8080', 'Trialvo Pay Base URL'],
      ['trialvo_pay_mode', 'sandbox', 'Payment Mode (sandbox/live)']
    ];

    for (const [key, val, desc] of defaults) {
      await client.query(
        'INSERT INTO system_config (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [key, val, desc]
      );
    }

    console.log('✅ Migration 009: system_config table created');
  },

  async down(client) {
    await client.query('DROP TABLE IF EXISTS system_config');
  }
};
