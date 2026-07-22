module.exports = {
 name: '013_trial_requests',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS trial_requests (
        id CHAR(36) PRIMARY KEY,
        public_token VARCHAR(64) NOT NULL UNIQUE,
        product_id CHAR(36) NOT NULL REFERENCES products(id),
        trial_type VARCHAR(20) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        email VARCHAR(200) NOT NULL,
        phone VARCHAR(40) NOT NULL,
        company VARCHAR(200) DEFAULT NULL,
        desired_domain VARCHAR(255) DEFAULT NULL,
        use_case TEXT DEFAULT NULL,
        requested_days INT DEFAULT 14,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        admin_notes TEXT DEFAULT NULL,
        assigned_admin_id INT DEFAULT NULL,
        ip_address VARCHAR(64) DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        approved_at TIMESTAMPTZ DEFAULT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_status ON trial_requests(status)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_product ON trial_requests(product_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_token ON trial_requests(public_token)');
 },
};
