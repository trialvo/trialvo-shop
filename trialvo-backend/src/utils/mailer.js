const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

let cachedTransporter = null;

async function getSmtpConfig() {
 try {
  const [rows] = await pool.execute(
   "SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE 'smtp_%'"
  );
  const config = {};
  rows.forEach(row => { config[row.setting_key] = row.setting_value; });
  return config;
 } catch {
  return {};
 }
}

async function getTransporter() {
 const config = await getSmtpConfig();
 if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
  return null;
 }

 cachedTransporter = nodemailer.createTransport({
  host: config.smtp_host,
  port: parseInt(config.smtp_port || '587'),
  secure: config.smtp_secure === 'true',
  auth: {
   user: config.smtp_user,
   pass: config.smtp_pass,
  },
 });

 return cachedTransporter;
}

function getFromAddress(config) {
 return config.smtp_from || config.smtp_user || 'noreply@example.com';
}

// ─── Email Templates ─────────────────────────────────────

function baseTemplate(content, shopName = 'eShop Market') {
 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: #fff; border-radius: 12px; padding: 32px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { text-align: center; padding: 24px 0 16px; }
  .logo { font-size: 24px; font-weight: 700; color: #6366f1; }
  .footer { text-align: center; padding: 16px 0; color: #9ca3af; font-size: 12px; }
  h1 { color: #111827; font-size: 22px; margin: 0 0 8px; }
  p { color: #4b5563; line-height: 1.6; margin: 8px 0; }
  .btn { display: inline-block; background: #6366f1; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-info { background: #dbeafe; color: #1e40af; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .label { color: #6b7280; font-size: 14px; }
  .value { color: #111827; font-weight: 600; font-size: 14px; }
 </style>
</head>
<body>
 <div class="container">
  <div class="header">
   <div class="logo">${shopName}</div>
  </div>
  <div class="card">
   ${content}
  </div>
  <div class="footer">
   &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
  </div>
 </div>
</body>
</html>`;
}

function welcomeEmail(customerName) {
 return baseTemplate(`
  <h1>Welcome, ${customerName}! 🎉</h1>
  <p>Thank you for creating an account with us. You can now track your orders, save favorites, and enjoy a personalized shopping experience.</p>
  <hr class="divider">
  <p style="text-align:center;"><a href="#" class="btn">Visit Your Account</a></p>
 `);
}

function orderConfirmationEmail(order) {
 const items = order.product_name || 'Your order';
 return baseTemplate(`
  <h1>Order Confirmed! ✅</h1>
  <p>Hi ${order.customer_name}, your order has been placed successfully.</p>
  <hr class="divider">
  <table width="100%" cellpadding="0" cellspacing="0">
   <tr><td class="label">Order ID</td><td class="value" style="text-align:right">${order.order_id}</td></tr>
   <tr><td class="label">Product</td><td class="value" style="text-align:right">${items}</td></tr>
   <tr><td class="label">Amount</td><td class="value" style="text-align:right">৳${Number(order.total_bdt).toLocaleString()}</td></tr>
   <tr><td class="label">Payment</td><td class="value" style="text-align:right; text-transform:capitalize">${order.payment_method}</td></tr>
  </table>
  <hr class="divider">
  <p style="color:#6b7280; font-size:13px;">We'll notify you when your order status changes.</p>
 `);
}

function orderStatusEmail(order, newStatus) {
 const statusLabels = {
  pending: { label: 'Pending', badge: 'badge-warning' },
  confirmed: { label: 'Confirmed', badge: 'badge-info' },
  processing: { label: 'Processing', badge: 'badge-info' },
  completed: { label: 'Completed', badge: 'badge-success' },
  cancelled: { label: 'Cancelled', badge: 'badge-warning' },
 };
 const s = statusLabels[newStatus] || { label: newStatus, badge: 'badge-info' };

 return baseTemplate(`
  <h1>Order Update</h1>
  <p>Hi ${order.customer_name}, your order <strong>${order.order_id}</strong> status has been updated:</p>
  <p style="text-align:center; margin:20px 0;">
   <span class="badge ${s.badge}">${s.label}</span>
  </p>
  ${order.tracking_number ? `<p><strong>Tracking:</strong> ${order.tracking_number}</p>` : ''}
  <hr class="divider">
  <p style="color:#6b7280; font-size:13px;">Thank you for your purchase.</p>
 `);
}

// ─── Send Functions ──────────────────────────────────────

async function sendEmail(to, subject, html) {
 try {
  const transporter = await getTransporter();
  if (!transporter) {
   console.log('[Email] SMTP not configured, skipping email to:', to);
   return false;
  }
  const config = await getSmtpConfig();
  await transporter.sendMail({
   from: `"eShop Market" <${getFromAddress(config)}>`,
   to,
   subject,
   html,
  });
  console.log('[Email] Sent to:', to, '| Subject:', subject);
  return true;
 } catch (err) {
  console.error('[Email] Failed:', err.message);
  return false;
 }
}

async function sendWelcomeEmail(customer) {
 return sendEmail(customer.email, 'Welcome to eShop Market!', welcomeEmail(customer.name));
}

async function sendOrderConfirmation(order) {
 return sendEmail(order.customer_email, `Order Confirmed - ${order.order_id}`, orderConfirmationEmail(order));
}

async function sendOrderStatusUpdate(order, newStatus) {
 return sendEmail(order.customer_email, `Order Update - ${order.order_id}`, orderStatusEmail(order, newStatus));
}

module.exports = {
 sendEmail,
 sendWelcomeEmail,
 sendOrderConfirmation,
 sendOrderStatusUpdate,
 getSmtpConfig,
};
