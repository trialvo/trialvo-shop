module.exports = {
 name: '015_remote_commands',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS remote_commands (
        id CHAR(36) PRIMARY KEY,
        instance_id CHAR(36) NOT NULL REFERENCES trial_instances(id),
        command VARCHAR(30) NOT NULL,
        payload JSONB DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        result JSONB DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ DEFAULT NULL,
        acknowledged_at TIMESTAMPTZ DEFAULT NULL,
        completed_at TIMESTAMPTZ DEFAULT NULL
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_rcmd_instance ON remote_commands(instance_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_rcmd_status ON remote_commands(status)');
 },
};
