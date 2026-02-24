const name = '009_site_settings';

async function up(connection) {
 await connection.execute(`
  CREATE TABLE IF NOT EXISTS site_settings (
   id INT AUTO_INCREMENT PRIMARY KEY,
   setting_key VARCHAR(100) NOT NULL UNIQUE,
   setting_value TEXT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
 `);

 // Insert default SMTP placeholders (empty = not configured)
 const defaults = [
  ['smtp_host', ''],
  ['smtp_port', '587'],
  ['smtp_secure', 'false'],
  ['smtp_user', ''],
  ['smtp_pass', ''],
  ['smtp_from', ''],
  ['email_notifications_enabled', 'false'],
 ];
 for (const [key, value] of defaults) {
  await connection.execute(
   `INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)`,
   [key, value]
  );
 }
}

module.exports = { name, up };
