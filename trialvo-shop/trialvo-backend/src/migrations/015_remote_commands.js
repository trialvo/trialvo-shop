module.exports = {
  name: '015_remote_commands',
  async up(client) {
    // created_by is VARCHAR (admin UUID) — historically INT then migrated in 022
    await client.query(`
      CREATE TABLE IF NOT EXISTS remote_commands (
        id CHAR(36) PRIMARY KEY,
        instance_id CHAR(36) NOT NULL,
        command VARCHAR(30) NOT NULL,
        payload JSON DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        result JSON DEFAULT NULL,
        created_by VARCHAR(64) DEFAULT NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        sent_at DATETIME(3) DEFAULT NULL,
        acknowledged_at DATETIME(3) DEFAULT NULL,
        completed_at DATETIME(3) DEFAULT NULL,
        CONSTRAINT fk_rcmd_instance FOREIGN KEY (instance_id) REFERENCES trial_instances(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_rcmd_instance ON remote_commands(instance_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_rcmd_status ON remote_commands(status)');
  },
};
