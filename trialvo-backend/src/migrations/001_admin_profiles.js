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
        role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
 },
};
