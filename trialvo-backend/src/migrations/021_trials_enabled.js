/**
 * Migration 021: Feature flag trials_enabled (plan §16 rollout).
 */
module.exports = {
  name: '021_trials_enabled',
  async up(client) {
    await client.query(
      `INSERT INTO system_config (key, value, description) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
      ['trials_enabled', 'true', 'Public Request Trial CTA + API when true']
    );
    console.log('✅ Migration 021: trials_enabled config');
  },
  async down(client) {
    await client.query("DELETE FROM system_config WHERE key = 'trials_enabled'");
  },
};
