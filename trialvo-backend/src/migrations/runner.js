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
