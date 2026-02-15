module.exports = {
 name: '004_testimonials',
 async up(connection) {
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id CHAR(36) PRIMARY KEY,
        name JSON NOT NULL,
        role JSON NOT NULL,
        content JSON NOT NULL,
        rating INT DEFAULT 5,
        avatar VARCHAR(500) DEFAULT '',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active)
      )
    `);
 },
};
