module.exports = {
 name: '017_instance_backups',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS instance_backups (
        id CHAR(36) PRIMARY KEY,
        instance_id CHAR(36) NOT NULL REFERENCES trial_instances(id),
        storage_key VARCHAR(700) NOT NULL,
        size_bytes BIGINT,
        checksum_sha256 VARCHAR(64),
        trigger VARCHAR(20) DEFAULT 'manual',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ DEFAULT NULL
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_backups_instance ON instance_backups(instance_id)');
 },
};
