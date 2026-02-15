const { pool } = require('../config/db');

async function runMigrations() {
 const connection = await pool.getConnection();

 try {
  // Create migrations tracking table
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

  // Get already applied migrations
  const [applied] = await connection.execute('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.map((r) => r.name));

  // Load migration files in order
  const migrations = [
   require('./001_admin_profiles'),
   require('./002_products'),
   require('./003_orders'),
   require('./004_testimonials'),
   require('./005_contact_messages'),
  ];

  let count = 0;
  for (const migration of migrations) {
   if (appliedNames.has(migration.name)) {
    continue;
   }

   console.log(`  ⏳ Running migration: ${migration.name}`);
   await migration.up(connection);
   await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [migration.name]);
   console.log(`  ✅ Applied: ${migration.name}`);
   count++;
  }

  if (count === 0) {
   console.log('✅ All migrations already applied');
  } else {
   console.log(`✅ ${count} migration(s) applied successfully`);
  }
 } finally {
  connection.release();
 }
}

module.exports = { runMigrations };
