module.exports = {
  name: '005_contact_messages',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        is_read SMALLINT DEFAULT 0,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_contact_is_read ON contact_messages(is_read)');
  },
};
