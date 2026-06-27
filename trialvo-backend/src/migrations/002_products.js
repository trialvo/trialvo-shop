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
        images JSONB DEFAULT NULL,
        video_url VARCHAR(500) DEFAULT NULL,
        demo JSONB DEFAULT NULL,
        name JSONB NOT NULL,
        short_description JSONB DEFAULT NULL,
        features JSONB DEFAULT NULL,
        facilities JSONB DEFAULT NULL,
        faq JSONB DEFAULT NULL,
        seo JSONB DEFAULT NULL,
        is_featured SMALLINT DEFAULT 0,
        is_active SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured)');
 },
};
