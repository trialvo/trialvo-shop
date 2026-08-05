/**
 * Paid / unauthorized deployments: instance_kind on trial_instances + entitlements.
 * Table name kept as trial_instances so remote_commands / backups FKs stay intact.
 */
module.exports = {
  name: '024_license_deployments',
  async up(client) {
    // instance_kind: trial | paid | unlicensed
    try {
      await client.query(`
        ALTER TABLE trial_instances
          ADD COLUMN instance_kind VARCHAR(20) NOT NULL DEFAULT 'trial'
          AFTER trial_type
      `);
    } catch (e) {
      if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    try {
      await client.query(`
        ALTER TABLE trial_instances
          ADD COLUMN entitlement_id CHAR(36) DEFAULT NULL
          AFTER instance_kind
      `);
    } catch (e) {
      if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_trial_inst_kind ON trial_instances(instance_kind)'
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS license_entitlements (
        id CHAR(36) PRIMARY KEY,
        order_id VARCHAR(64) DEFAULT NULL,
        product_id CHAR(36) NOT NULL,
        customer_email VARCHAR(200) NOT NULL,
        customer_name VARCHAR(200) DEFAULT NULL,
        license_key_hash VARCHAR(64) NOT NULL,
        license_key_hint VARCHAR(16) DEFAULT NULL,
        max_installs INT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        pack_download_token_hash VARCHAR(64) DEFAULT NULL,
        expires_at DATETIME(3) DEFAULT NULL,
        meta JSON DEFAULT NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_entitlement_product FOREIGN KEY (product_id) REFERENCES products(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_entitlement_email ON license_entitlements(customer_email)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_entitlement_order ON license_entitlements(order_id)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_entitlement_key ON license_entitlements(license_key_hash)'
    );

    // Backfill: existing rows are trials
    await client.query(`
      UPDATE trial_instances
      SET instance_kind = 'trial'
      WHERE instance_kind IS NULL OR instance_kind = ''
    `);
  },
};
