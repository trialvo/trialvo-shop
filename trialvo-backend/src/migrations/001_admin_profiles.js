module.exports = {
 name: '001_admin_profiles',
 async up(connection) {
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL DEFAULT '',
        avatar_url VARCHAR(500) DEFAULT '',
        role ENUM('super_admin', 'admin', 'editor') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
 },
};
