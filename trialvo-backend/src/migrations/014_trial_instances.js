module.exports = {
 name: '014_trial_instances',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS trial_instances (
        id CHAR(36) PRIMARY KEY,
        install_id VARCHAR(64) NOT NULL UNIQUE,
        request_id CHAR(36) REFERENCES trial_requests(id),
        product_id CHAR(36) NOT NULL REFERENCES products(id),
        trial_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'provisioning',
        domain VARCHAR(255) DEFAULT NULL,
        subdomain VARCHAR(100) DEFAULT NULL,
        shop_url VARCHAR(300) DEFAULT NULL,
        admin_url VARCHAR(300) DEFAULT NULL,
        api_url VARCHAR(300) DEFAULT NULL,
        admin_email VARCHAR(200) DEFAULT NULL,
        admin_password_enc TEXT DEFAULT NULL,
        agent_secret_enc TEXT DEFAULT NULL,
        bootstrap_token_enc TEXT DEFAULT NULL,
        backup_key_enc TEXT DEFAULT NULL,
        started_at TIMESTAMPTZ DEFAULT NULL,
        expires_at TIMESTAMPTZ DEFAULT NULL,
        frozen_at TIMESTAMPTZ DEFAULT NULL,
        last_heartbeat_at TIMESTAMPTZ DEFAULT NULL,
        last_lease_issued_at TIMESTAMPTZ DEFAULT NULL,
        agent_version VARCHAR(30) DEFAULT NULL,
        compose_project VARCHAR(100) DEFAULT NULL,
        host_node VARCHAR(100) DEFAULT NULL,
        meta JSONB DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_trial_inst_status ON trial_instances(status)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_trial_inst_install ON trial_instances(install_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_trial_inst_expires ON trial_instances(expires_at)');
 },
};
