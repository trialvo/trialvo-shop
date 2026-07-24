module.exports = {
  name: '001_admin_profiles',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL DEFAULT '',
        avatar_url VARCHAR(500) DEFAULT '',
        role VARCHAR(20) DEFAULT 'admin',
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT chk_admin_role CHECK (role IN ('super_admin', 'admin', 'editor'))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },
};
