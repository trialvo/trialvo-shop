module.exports = {
 name: '010_categories',
 async up(client) {
  // Categories become a first-class, DB-managed entity so the admin panel can
  // add/edit them dynamically instead of relying on a hardcoded frontend list.
  await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id CHAR(36) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name JSONB NOT NULL,
        description JSONB DEFAULT NULL,
        icon VARCHAR(255) DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active)');
 },
};
