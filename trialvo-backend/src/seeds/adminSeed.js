const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
 table: 'admin_profiles',
 async run(connection) {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash('admin123', 12);

  await connection.execute(
   `INSERT INTO admin_profiles (id, email, password_hash, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)`,
   [id, 'admin@trialvo.com', passwordHash, 'Super Admin', '', 'super_admin']
  );

  console.log('    📧 Default admin: admin@trialvo.com / admin123');
 },
};
