const { pool } = require('../config/db');
const { getSmtpConfig } = require('../utils/mailer');
const nodemailer = require('nodemailer');

// Helper: get a single setting
async function getSetting(key, fallback = null) {
 const [rows] = await pool.execute(
  'SELECT setting_value FROM site_settings WHERE setting_key = ?', [key]
 );
 return rows[0]?.setting_value ?? fallback;
}

// Helper: upsert a setting
async function upsertSetting(key, value) {
 await pool.execute(
  `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
  [key, value]
 );
}

// GET /api/settings/features  — PUBLIC (no auth), returns feature flags for storefront
async function getFeatureFlags(req, res, next) {
 try {
  const socialProof = await getSetting('social_proof_enabled', 'true');

  const sendMoneyActive = await getSetting('payment_method_send_money_active', 'true');
  const sendMoneyInstructions = await getSetting('payment_method_send_money_instructions', '');
  const onlineActive = await getSetting('payment_method_online_active', 'true');
  const manualInboxActive = await getSetting('payment_method_manual_inbox_active', 'true');

  const providersJson = await getSetting('payment_method_send_money_providers', null);
  let providers = [];
  if (providersJson) {
   try { providers = JSON.parse(providersJson); } catch (e) { }
  }

  res.json({
   social_proof_enabled: socialProof === 'true',
   payment_method_send_money_active: sendMoneyActive === 'true',
   payment_method_send_money_instructions: sendMoneyInstructions,
   payment_method_online_active: onlineActive === 'true',
   payment_method_manual_inbox_active: manualInboxActive === 'true',
   payment_method_send_money_providers: providers,
  });
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/settings/general — admin only
async function getGeneralSettings(req, res, next) {
 try {
  const socialProof = await getSetting('social_proof_enabled', 'true');
  res.json({
   social_proof_enabled: socialProof,
  });
 } catch (error) {
  next(error);
 }
}

// PUT /api/admin/settings/general — admin only
async function updateGeneralSettings(req, res, next) {
 try {
  const fields = ['social_proof_enabled'];
  for (const key of fields) {
   if (req.body[key] !== undefined) {
    await upsertSetting(key, req.body[key]);
   }
  }
  res.json({ message: 'General settings updated' });
 } catch (error) {
  next(error);
 }
}

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
    await upsertSetting(key, req.body[key]);
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

// GET /api/admin/settings/payments
async function getPaymentSettings(req, res, next) {
 try {
  const sendMoneyActive = await getSetting('payment_method_send_money_active', 'true');
  const sendMoneyInstructions = await getSetting('payment_method_send_money_instructions', '');
  const onlineActive = await getSetting('payment_method_online_active', 'true');
  const manualInboxActive = await getSetting('payment_method_manual_inbox_active', 'true');

  const defaultProviders = [
   { id: 'bkash', name: 'bKash', isActive: false, number: '', type: 'Personal', feePerThousand: 18.5, instructions: '' },
   { id: 'nagad', name: 'Nagad', isActive: false, number: '', type: 'Personal', feePerThousand: 15, instructions: '' },
   { id: 'rocket', name: 'Rocket', isActive: false, number: '', type: 'Personal', feePerThousand: 18, instructions: '' }
  ];
  const providersJson = await getSetting('payment_method_send_money_providers', null);
  let providers = defaultProviders;
  if (providersJson) {
   try { providers = JSON.parse(providersJson); } catch (e) { }
  }

  res.json({
   payment_method_send_money_active: sendMoneyActive,
   payment_method_send_money_instructions: sendMoneyInstructions,
   payment_method_online_active: onlineActive,
   payment_method_manual_inbox_active: manualInboxActive,
   payment_method_send_money_providers: JSON.stringify(providers), // return as string to match standard upsert behavior
  });
 } catch (error) {
  next(error);
 }
}

// PUT /api/admin/settings/payments
async function updatePaymentSettings(req, res, next) {
 try {
  const fields = [
   'payment_method_send_money_active',
   'payment_method_send_money_instructions',
   'payment_method_online_active',
   'payment_method_manual_inbox_active',
   'payment_method_send_money_providers'
  ];
  for (const key of fields) {
   if (req.body[key] !== undefined) {
    let valueToSave = req.body[key];
    // If it's the JSON array, ensure it is safely stringified if passed as object
    if (key === 'payment_method_send_money_providers' && typeof valueToSave !== 'string') {
     valueToSave = JSON.stringify(valueToSave);
    }
    await upsertSetting(key, valueToSave);
   }
  }
  res.json({ message: 'Payment settings updated' });
 } catch (error) {
  next(error);
 }
}

module.exports = {
 getFeatureFlags, getGeneralSettings, updateGeneralSettings,
 getSmtpSettings, updateSmtpSettings, testSmtpConnection,
 getPaymentSettings, updatePaymentSettings,
};
