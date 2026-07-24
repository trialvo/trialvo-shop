module.exports = {
  name: '021_trials_enabled',
  async up(client) {
    await client.query(
      'INSERT IGNORE INTO system_config (`key`, value, description) VALUES ($1, $2, $3)',
      ['trials_enabled', 'true', 'Public Request Trial CTA + API when true']
    );
    console.log('✅ Migration 021: trials_enabled config');
  },
};
