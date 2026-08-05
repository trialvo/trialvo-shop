const { pool } = require('../config/db');

/** MySQL has no CREATE INDEX IF NOT EXISTS — ignore duplicate index errors. */
function wrapMigrationClient(client) {
  return {
    async query(sql, params) {
      const text = typeof sql === 'string' ? sql.trim() : sql;
      if (typeof text === 'string' && /^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+/i.test(text)) {
        const rewritten = text.replace(/^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+/i, 'CREATE INDEX ');
        try {
          return await client.query(rewritten, params);
        } catch (e) {
          if (e.errno === 1061 || e.code === 'ER_DUP_KEYNAME') {
            return { rows: [], rowCount: 0 };
          }
          throw e;
        }
      }
      return client.query(sql, params);
    },
    release() {
      return client.release();
    },
  };
}

async function runMigrations() {
  const raw = await pool.connect();
  const client = wrapMigrationClient(raw);

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const result = await client.query('SELECT name FROM _migrations');
    const appliedNames = new Set(result.rows.map((r) => r.name));

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
      require('./023_trial_extend_pack'),
      require('./024_license_deployments'),
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
    raw.release();
  }
}

module.exports = { runMigrations };
