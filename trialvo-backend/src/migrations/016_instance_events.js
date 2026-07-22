module.exports = {
 name: '016_instance_events',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS instance_events (
        id BIGSERIAL PRIMARY KEY,
        instance_id CHAR(36) NOT NULL,
        event_type VARCHAR(30) NOT NULL,
        detail JSONB DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_inst_events_inst ON instance_events(instance_id, created_at)');
 },
};
