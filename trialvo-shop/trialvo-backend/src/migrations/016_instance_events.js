module.exports = {
  name: '016_instance_events',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS instance_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        instance_id CHAR(36) NOT NULL,
        event_type VARCHAR(30) NOT NULL,
        detail JSON DEFAULT NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_inst_events_inst ON instance_events(instance_id, created_at)');
  },
};
