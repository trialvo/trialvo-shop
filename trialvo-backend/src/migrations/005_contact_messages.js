module.exports = {
 name: '005_contact_messages',
 async up(connection) {
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_read (is_read)
      )
    `);
 },
};
