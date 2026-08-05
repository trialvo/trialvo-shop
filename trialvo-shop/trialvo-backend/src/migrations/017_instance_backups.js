module.exports = {
  name: '017_instance_backups',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS instance_backups (
        id CHAR(36) PRIMARY KEY,
        instance_id CHAR(36) NOT NULL,
        storage_key VARCHAR(700) NOT NULL,
        size_bytes BIGINT,
        checksum_sha256 VARCHAR(64),
        \`trigger\` VARCHAR(20) DEFAULT 'manual',
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        completed_at DATETIME(3) DEFAULT NULL,
        CONSTRAINT fk_backups_instance FOREIGN KEY (instance_id) REFERENCES trial_instances(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_backups_instance ON instance_backups(instance_id)');
  },
};
