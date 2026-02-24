const { pool } = require('../config/db');
const { getSmtpConfig } = require('../utils/mailer');
const nodemailer = require('nodemailer');

// GET /api/admin/settings/smtp
async function getSmtpSettings(req, res, next) {
 try {
  const config = await getSmtpConfig();
  res.json({
   smtp_host: config.smtp_host || '',
   smtp_port: config.smtp_port || '587',
   smtp_secure: config.smtp_secure || 'false',
   smtp_user: config.smtp_user || '',
   smtp_pass: config.smtp_pass ? '••••••' : '',
   smtp_from: config.smtp_from || '',
   email_notifications_enabled: config.email_notifications_enabled || 'false',
  });
 } catch (error) {
  next(error);
 }
}

// PUT /api/admin/settings/smtp
async function updateSmtpSettings(req, res, next) {
 try {
  const fields = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from', 'email_notifications_enabled'];
  for (const key of fields) {
   if (req.body[key] !== undefined && req.body[key] !== '••••••') {
    await pool.execute(
     `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
     [key, req.body[key]]
    );
   }
  }
  res.json({ message: 'SMTP settings updated' });
 } catch (error) {
  next(error);
 }
}

// POST /api/admin/settings/smtp/test
async function testSmtpConnection(req, res, next) {
 try {
  const { host, port, secure, user, pass } = req.body;
  if (!host || !user || !pass) {
   return res.status(400).json({ error: 'Host, user and password are required' });
  }

  const transporter = nodemailer.createTransport({
   host,
   port: parseInt(port || '587'),
   secure: secure === 'true' || secure === true,
   auth: { user, pass },
  });

  await transporter.verify();
  res.json({ success: true, message: 'SMTP connection successful!' });
 } catch (err) {
  res.status(400).json({ success: false, error: err.message });
 }
}

module.exports = { getSmtpSettings, updateSmtpSettings, testSmtpConnection };
