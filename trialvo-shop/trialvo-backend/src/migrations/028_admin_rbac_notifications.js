/**
 * Admin RBAC extras (phone, is_active) + per-admin notification matrix
 * and global notify/SMS config keys. Two-layer gate: system_config flags
 * AND admin_notification_permissions AND admin.is_active.
 */
async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '028_admin_rbac_notifications',
  async up(client) {
    await addColumnIfMissing(client, 'admin_profiles', 'phone', 'VARCHAR(32) NULL');
    await addColumnIfMissing(client, 'admin_profiles', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_notification_permissions (
        admin_id CHAR(36) NOT NULL,
        purchase_email TINYINT(1) NOT NULL DEFAULT 1,
        purchase_sms TINYINT(1) NOT NULL DEFAULT 0,
        extend_email TINYINT(1) NOT NULL DEFAULT 1,
        extend_sms TINYINT(1) NOT NULL DEFAULT 0,
        domain_trial_email TINYINT(1) NOT NULL DEFAULT 1,
        domain_trial_sms TINYINT(1) NOT NULL DEFAULT 1,
        manual_expiry_email TINYINT(1) NOT NULL DEFAULT 1,
        manual_expiry_sms TINYINT(1) NOT NULL DEFAULT 0,
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (admin_id),
        CONSTRAINT fk_anp_admin FOREIGN KEY (admin_id)
          REFERENCES admin_profiles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const defaults = [
      ['notify.purchase.email', 'true', 'Global: email staff on product purchase'],
      ['notify.purchase.sms', 'false', 'Global: SMS staff on product purchase'],
      ['notify.extend.email', 'true', 'Global: email staff on trial extend'],
      ['notify.extend.sms', 'false', 'Global: SMS staff on trial extend'],
      ['notify.domain_trial.email', 'true', 'Global: email staff on own-domain trial request'],
      ['notify.domain_trial.sms', 'true', 'Global: SMS staff on own-domain trial request'],
      ['notify.manual_expiry.email', 'true', 'Global: email staff when a manual trial expires'],
      ['notify.manual_expiry.sms', 'false', 'Global: SMS staff when a manual trial expires'],
      ['sms_active_provider', '', 'Active SMS provider: alphasms | bulksms | empty'],
      ['alpha_sms_api_key_enc', '', 'Encrypted AlphaSMS API key'],
      ['alpha_sms_sender_id', '', 'AlphaSMS sender ID'],
      ['bulk_sms_api_key_enc', '', 'Encrypted BulkSMSBD API key'],
      ['bulk_sms_sender_id', '', 'BulkSMSBD sender ID'],
      ['alpha_sms_enabled', 'false', 'AlphaSMS provider enabled in picker'],
      ['bulk_sms_enabled', 'false', 'BulkSMSBD provider enabled in picker'],
    ];

    for (const [key, val, desc] of defaults) {
      await client.query(
        'INSERT IGNORE INTO system_config (`key`, value, description) VALUES ($1, $2, $3)',
        [key, val, desc]
      );
    }

    await client.query(`
      INSERT IGNORE INTO admin_notification_permissions (admin_id)
      SELECT id FROM admin_profiles
    `);

    console.log('✅ Migration 028: admin phone/is_active, notification matrix, SMS + notify flags');
  },
};
