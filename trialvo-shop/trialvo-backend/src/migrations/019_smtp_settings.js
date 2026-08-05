module.exports = {
  name: '019_smtp_settings',
  async up(client) {
    const defaults = [
      ['smtp_enabled', 'false', 'Enable outbound email via SMTP'],
      ['smtp_host', '', 'SMTP server hostname'],
      ['smtp_port', '587', 'SMTP port'],
      ['smtp_secure', 'false', 'Use TLS on connect (true for port 465)'],
      ['smtp_user', '', 'SMTP username'],
      ['smtp_password_enc', '', 'Encrypted SMTP password'],
      ['smtp_from_email', 'noreply@trialvo.com', 'From email address'],
      ['smtp_from_name', 'Trialvo Shop', 'From display name'],
    ];

    for (const [key, val, desc] of defaults) {
      await client.query(
        'INSERT IGNORE INTO system_config (`key`, value, description) VALUES ($1, $2, $3)',
        [key, val, desc]
      );
    }

    console.log('✅ Migration 019: SMTP settings seeded');
  },
};
