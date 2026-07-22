/**
 * Migration 018: Trial system settings (auto-approve, trial periods)
 */
module.exports = {
  name: '018_trial_settings',
  async up(client) {
    const defaults = [
      ['trial_auto_approve_hosted', 'false', 'Auto-approve Option 1 (Trialvo-hosted) trial requests'],
      ['trial_period_hosted_days', '14', 'Default trial period in days for Option 1 (hosted)'],
      ['trial_period_self_hosted_days', '14', 'Default trial period in days for Option 2 (self-hosted)'],
    ];

    for (const [key, val, desc] of defaults) {
      await client.query(
        'INSERT INTO system_config (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [key, val, desc]
      );
    }

    console.log('✅ Migration 018: trial settings seeded');
  },

  async down(client) {
    await client.query(`
      DELETE FROM system_config WHERE key IN (
        'trial_auto_approve_hosted',
        'trial_period_hosted_days',
        'trial_period_self_hosted_days'
      )
    `);
  },
};
