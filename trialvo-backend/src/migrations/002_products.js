module.exports = {
 name: '002_products',
 async up(connection) {
  await connection.execute(`
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
        is_featured TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_category (category),
        INDEX idx_is_active (is_active),
        INDEX idx_is_featured (is_featured)
      )
    `);
 },
};
