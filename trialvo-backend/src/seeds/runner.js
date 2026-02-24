const { pool } = require('../config/db');

async function runSeeds() {
 const connection = await pool.getConnection();

 try {
  const seeds = [
   require('./adminSeed'),
   require('./productSeed'),
   require('./testimonialSeed'),
  ];

  for (const seed of seeds) {
   const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${seed.table}`);
   const count = rows[0].count;

   if (count === 0) {
    console.log(`  🌱 Seeding: ${seed.table}`);
    await seed.run(connection);
    console.log(`  ✅ Seeded: ${seed.table}`);
   } else {
    console.log(`  ⏭️  ${seed.table} already has ${count} rows, skipping seed`);
   }
  }

  console.log('✅ Seed check complete');
 } finally {
  connection.release();
 }
}

module.exports = { runSeeds };
