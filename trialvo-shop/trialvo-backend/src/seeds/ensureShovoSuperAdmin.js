const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SUPER_ADMIN_EMAIL = '5arafatshovo@gmail.com';

module.exports = {
  table: 'admin_profiles',
  alwaysRun: true,
  async run(client) {
    const { rows } = await client.query(
      'SELECT id FROM admin_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [SUPER_ADMIN_EMAIL]
    );

    let adminId;
    if (rows.length) {
      adminId = rows[0].id;
      // Promote / reactivate only — never rotate an existing password.
      await client.query(
        `UPDATE admin_profiles
         SET role = 'super_admin', is_active = 1
         WHERE id = $1`,
        [adminId]
      );
      console.log(`    🔐 Ensured super_admin (existing): ${SUPER_ADMIN_EMAIL}`);
    } else {
      adminId = uuidv4();
      const bootstrapPassword = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || 'ChangeMeLocal2026!';
      const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
      await client.query(
        `INSERT INTO admin_profiles
           (id, email, password_hash, full_name, avatar_url, role, phone, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [adminId, SUPER_ADMIN_EMAIL, passwordHash, 'Arafat Shovo', '', 'super_admin', null, 1]
      );
      console.log(`    🔐 Created super_admin: ${SUPER_ADMIN_EMAIL}`);
    }

    await client.query(
      'INSERT IGNORE INTO admin_notification_permissions (admin_id) VALUES ($1)',
      [adminId]
    );
  },
};
