const { pool } = require('../config/db');

async function runSeeds() {
  const client = await pool.connect();

  try {
    const seeds = [
      require('./adminSeed'),
      require('./productSeed'),
      require('./categorySeed'),
      require('./lifestyleProductSeed'),
    ];

    for (const seed of seeds) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${seed.table}`);
      const count = parseInt(result.rows[0].count, 10);

      if (seed.alwaysRun || count === 0) {
        console.log(`  🌱 Seeding: ${seed.table}${seed.alwaysRun ? ' (upsert)' : ''}`);
        await seed.run(client);
        console.log(`  ✅ Seeded: ${seed.table}`);
      } else {
        console.log(`  ⏭️  ${seed.table} already has ${count} rows, skipping seed`);
      }
    }

    console.log('✅ Seed check complete');
  } finally {
    client.release();
  }
}

module.exports = { runSeeds };
