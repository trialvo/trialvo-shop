const { pool } = require('../config/db');

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already applied migrations
    const result = await client.query('SELECT name FROM _migrations');
    const appliedNames = new Set(result.rows.map((r) => r.name));

    // Load migration files in order
    const migrations = [
      require('./001_admin_profiles'),
      require('./002_products'),
      require('./003_orders'),
      require('./004_testimonials'),
      require('./005_contact_messages'),
      require('./006_advanced_features'),
      require('./007_trialvo_pay_columns'),
      require('./008_payment_details'),
      require('./009_system_config'),
      require('./010_categories'),
      require('./011_media_assets'),
      require('./012_product_deploy_config'),
      require('./013_trial_requests'),
      require('./014_trial_instances'),
      require('./015_remote_commands'),
      require('./016_instance_events'),
      require('./017_instance_backups'),
      require('./018_trial_settings'),
      require('./019_smtp_settings'),
      require('./020_order_trial_instance'),
      require('./021_trials_enabled'),
      require('./022_remote_commands_created_by'),
    ];

    let count = 0;
    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) {
        continue;
      }

      console.log(`  ⏳ Running migration: ${migration.name}`);
      await migration.up(client);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [migration.name]);
      console.log(`  ✅ Applied: ${migration.name}`);
      count++;
    }

    if (count === 0) {
      console.log('✅ All migrations already applied');
    } else {
      console.log(`✅ ${count} migration(s) applied successfully`);
    }
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
