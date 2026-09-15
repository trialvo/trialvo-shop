/**
 * Control-plane audit trail. Soft-references admin_profiles so a deleted
 * staff row (or a failed login with no actor) still keeps the event.
 */
module.exports = {
  name: '029_admin_activity_logs',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        admin_id CHAR(36) NULL,
        action VARCHAR(80) NOT NULL,
        resource VARCHAR(80) NULL,
        resource_id VARCHAR(64) NULL,
        summary VARCHAR(255) NULL,
        meta JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_aal_created_at (created_at),
        INDEX idx_aal_admin_created (admin_id, created_at),
        INDEX idx_aal_action (action),
        INDEX idx_aal_resource (resource)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Migration 029: admin_activity_logs');
  },
};
