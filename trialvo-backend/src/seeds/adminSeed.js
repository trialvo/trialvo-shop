const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
 table: 'admin_profiles',
 async run(client) {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash('Antor@123', 12);

  await client.query(
   `INSERT INTO admin_profiles (id, email, password_hash, full_name, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6)`,
   [id, 'admin@trialvo.com', passwordHash, 'Super Admin', '', 'super_admin']
  );

  console.log('    📧 Default admin: admin@trialvo.com / Antor@123');
 },
};
