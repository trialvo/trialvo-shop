module.exports = {
 name: '004_testimonials',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id CHAR(36) PRIMARY KEY,
        name JSONB NOT NULL,
        role JSONB NOT NULL,
        content JSONB NOT NULL,
        rating INT DEFAULT 5,
        avatar VARCHAR(500) DEFAULT '',
        is_active SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active)');
 },
};
