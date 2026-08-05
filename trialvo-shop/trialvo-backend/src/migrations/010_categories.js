module.exports = {
  name: '010_categories',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id CHAR(36) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name JSON NOT NULL,
        description JSON DEFAULT NULL,
        icon VARCHAR(255) DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active SMALLINT DEFAULT 1,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active)');
  },
};
