const {
  downloadAndConsumePackToken,
  packDownloadUrl,
  reissuePackToken,
} = require('../services/licensePackDelivery');
const { sendMail } = require('../services/mailer');
const { paidLicensePackEmail } = require('../services/trialEmails');
const { pool } = require('../config/db');
const { logEvent } = require('../services/trialEvents');

/**
 * GET /api/license/pack/:token?format=docker|cpanel
 * One-time customer download — token invalidated after success.
 */
async function downloadPublicPack(req, res, next) {
  try {
    const packToken = String(req.params.token || '').trim();
    const format = String(req.query.format || 'docker').toLowerCase();
    if (!packToken || packToken.length < 16) {
      return res.status(400).json({ error: 'Invalid pack token', code: 'BAD_TOKEN' });
    }

    const { zip } = await downloadAndConsumePackToken(packToken, format);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zip.filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(zip.buffer);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message, code: err.code || 'PACK_ERROR' });
    }
    return next(err);
  }
}

/**
 * Email license key + one-time pack links after payment.
 */
async function emailPaidPackDelivery({
  to,
  name,
  licenseKey,
  packToken,
  orderId,
}) {
  if (!to || !packToken) return { sent: false, reason: 'missing_to_or_token' };
  const dockerUrl = packDownloadUrl(packToken, 'docker');
  const cpanelUrl = packDownloadUrl(packToken, 'cpanel');
  const mail = paidLicensePackEmail({
    name: name || 'Customer',
    licenseKey: licenseKey || null,
    dockerUrl,
    cpanelUrl,
    orderId: orderId || null,
  });
  await sendMail({ to, ...mail });
  return { sent: true, dockerUrl, cpanelUrl };
}

/**
 * POST /api/admin/trial-instances/:id/reissue-pack
 * super_admin path — new one-time token + optional email.
 */
async function adminReissuePack(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const inst = rows[0];
    if (!inst.entitlement_id) {
      return res.status(400).json({ error: 'Instance has no entitlement' });
    }

    const { packToken, entitlement } = await reissuePackToken(inst.entitlement_id);
    await logEvent(inst.id, 'pack_token_reissued', { by: req.admin?.id });

    let emailed = false;
    if (req.body?.email !== false && entitlement.customer_email) {
      await emailPaidPackDelivery({
        to: entitlement.customer_email,
        name: entitlement.customer_name,
        licenseKey: null,
        packToken,
        orderId: entitlement.order_id,
      });
      emailed = true;
    }

    res.json({
      ok: true,
      packToken,
      dockerUrl: packDownloadUrl(packToken, 'docker'),
      cpanelUrl: packDownloadUrl(packToken, 'cpanel'),
      emailed,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  downloadPublicPack,
  emailPaidPackDelivery,
  adminReissuePack,
};
