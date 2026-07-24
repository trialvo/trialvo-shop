module.exports = {
  name: '014_trial_instances',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS trial_instances (
        id CHAR(36) PRIMARY KEY,
        install_id VARCHAR(64) NOT NULL UNIQUE,
        request_id CHAR(36) DEFAULT NULL,
        product_id CHAR(36) NOT NULL,
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
        started_at DATETIME(3) DEFAULT NULL,
        expires_at DATETIME(3) DEFAULT NULL,
        frozen_at DATETIME(3) DEFAULT NULL,
        last_heartbeat_at DATETIME(3) DEFAULT NULL,
        last_lease_issued_at DATETIME(3) DEFAULT NULL,
        agent_version VARCHAR(30) DEFAULT NULL,
        compose_project VARCHAR(100) DEFAULT NULL,
        host_node VARCHAR(100) DEFAULT NULL,
        meta JSON DEFAULT NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_trial_inst_request FOREIGN KEY (request_id) REFERENCES trial_requests(id),
        CONSTRAINT fk_trial_inst_product FOREIGN KEY (product_id) REFERENCES products(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_inst_status ON trial_instances(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_inst_install ON trial_instances(install_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_inst_expires ON trial_instances(expires_at)');
  },
};
