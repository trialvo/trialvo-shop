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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_contact_is_read ON contact_messages(is_read)');
 },
};
