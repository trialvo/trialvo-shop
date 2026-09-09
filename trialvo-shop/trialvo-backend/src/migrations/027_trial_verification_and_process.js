/**
 * Email OTP gate + restore the original trial process:
 *   - Instant demo waits for a verified address (and optional admin approval).
 *   - Own-domain trials go back to admin-approve → installer, not staff deploy.
 *
 * The buy-hosting branch is removed. hosting_source stays on the table so
 * historical rows keep their value; nothing new writes 'buy_from_trialvo'.
 */
module.exports = {
  name: '027_trial_verification_and_process',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS trial_email_verifications (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code_hash CHAR(64) NOT NULL,
        purpose VARCHAR(24) NOT NULL DEFAULT 'trial',
        attempts INT NOT NULL DEFAULT 0,
        expires_at DATETIME(3) NOT NULL,
        consumed_at DATETIME(3) NULL,
        ip_address VARCHAR(64) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_tev_email_created ON trial_email_verifications(email, created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tev_ip_created ON trial_email_verifications(ip_address, created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tev_expires ON trial_email_verifications(expires_at)');

    await client.query(
      'INSERT IGNORE INTO system_config (`key`, value, description) VALUES (?, ?, ?)',
      ['trial_email_verification_required', 'true', 'Require email OTP confirmation before accepting a trial request']
    );

    await client.query("DELETE FROM system_config WHERE `key` = 'trial_hosting_purchase_enabled'");

    // hosting_pending only existed for the buy-hosting branch; those rows
    // would otherwise sit in a stage nothing can leave any more.
    await client.query(
      "UPDATE trial_requests SET fulfillment_stage = 'received' WHERE fulfillment_stage = 'hosting_pending'"
    );

    console.log('✅ Migration 027: email verification table, OTP setting, drop buy-hosting flag');
  },
};
