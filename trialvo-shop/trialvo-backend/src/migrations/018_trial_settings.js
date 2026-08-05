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
        'INSERT IGNORE INTO system_config (`key`, value, description) VALUES ($1, $2, $3)',
        [key, val, desc]
      );
    }

    console.log('✅ Migration 018: trial settings seeded');
  },
};
