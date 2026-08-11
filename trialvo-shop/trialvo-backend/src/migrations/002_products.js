module.exports = {
  name: '002_products',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id CHAR(36) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL DEFAULT 'ecommerce',
        price_bdt DECIMAL(12, 2) NOT NULL DEFAULT 0,
        price_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
        thumbnail VARCHAR(500) DEFAULT '',
        images JSON DEFAULT NULL,
        video_url VARCHAR(500) DEFAULT NULL,
        demo JSON DEFAULT NULL,
        name JSON NOT NULL,
        short_description JSON DEFAULT NULL,
        features JSON DEFAULT NULL,
        facilities JSON DEFAULT NULL,
        faq JSON DEFAULT NULL,
        seo JSON DEFAULT NULL,
        is_featured SMALLINT DEFAULT 0,
        is_active SMALLINT DEFAULT 1,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Older/partial installs may lack columns that CREATE TABLE IF NOT EXISTS will not add.
    const ensureColumn = async (column, ddl) => {
      const result = await client.query(
        `SELECT COUNT(*) AS c FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = ?`,
        [column]
      );
      if (Number(result.rows[0]?.c) === 0) {
        await client.query(`ALTER TABLE products ADD COLUMN ${ddl}`);
      }
    };
    await ensureColumn('category', "category VARCHAR(100) NOT NULL DEFAULT 'ecommerce'");
    await ensureColumn('is_active', 'is_active SMALLINT DEFAULT 1');
    await ensureColumn('is_featured', 'is_featured SMALLINT DEFAULT 0');

    await client.query('CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured)');
  },
};
