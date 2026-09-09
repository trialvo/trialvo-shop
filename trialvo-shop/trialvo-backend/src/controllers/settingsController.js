const { pool } = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');
const { getTrialSettings, updateTrialSettings } = require('../services/trialSettings');
const { getSmtpSettingsForAdmin, updateSmtpSettings, getSmtpConfig } = require('../services/smtpSettings');
const { sendTestMail } = require('../services/mailer');

/**
 * GET /api/admin/settings/trialvo-pay
 */
async function getTrialvoPaySettings(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT `key`, value FROM system_config WHERE `key` LIKE 'trialvo_pay_%'"
    );
    
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/settings/trialvo-pay
 */
async function updateTrialvoPaySettings(req, res, next) {
  try {
    const { serviceId, apiKey, ipnSecret, baseUrl, mode } = req.body;

    const updates = [
      ['trialvo_pay_service_id', serviceId],
      ['trialvo_pay_api_key', apiKey],
      ['trialvo_pay_ipn_secret', ipnSecret],
      ['trialvo_pay_base_url', baseUrl]
    ];

    for (const [key, value] of updates) {
      if (value !== undefined) {
        await pool.query(
          'UPDATE system_config SET value = $1, updated_at = NOW() WHERE `key` = $2',
          [value, key]
        );
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/settings/trialvo-pay/test
 */
async function testTrialvoPayConnection(req, res, next) {
  try {
    const { serviceId, apiKey, baseUrl } = req.body;

    if (!serviceId || !apiKey || !baseUrl) {
      return res.status(400).json({ error: 'Service ID, API Key, and Base URL are required' });
    }

    // Generate HMAC signature for verification
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyHash = crypto.createHash('sha256').update('{}').digest('hex');
    const message = `${serviceId}:${timestamp}:${nonce}:${bodyHash}`;
    const signature = crypto.createHmac('sha256', apiKey).update(message).digest('hex');

    try {
      const response = await axios.get(`${baseUrl}/api/v1/verify`, {
        headers: {
          'X-Service-Id': serviceId,
          'X-Api-Key': apiKey,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce,
          'X-Body-Hash': bodyHash,
          'X-Signature': signature,
        },
        timeout: 5000
      });

      res.json({
        success: true,
        message: 'Connection successful',
        data: response.data
      });
    } catch (err) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { error: err.message };
      res.status(status).json({
        success: false,
        error: data.error || 'Connection failed',
        details: data
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTrialvoPaySettings,
  updateTrialvoPaySettings,
  testTrialvoPayConnection,
  getTrialSettings: async (req, res, next) => {
    try {
      res.json(await getTrialSettings());
    } catch (error) {
      next(error);
    }
  },
  updateTrialSettings: async (req, res, next) => {
    try {
      const {
        autoApproveHosted, hostedDays, selfHostedDays, paidExtendDays,
        extendDays, extendPriceBdt, extendPriceUsd, trialsEnabled,
        demoEnabled, domainEnabled, domainMonths, defaultMonths,
        hostingPurchaseEnabled, fulfillmentSlaHours, demoResetEnabled,
        demoMaxPerEmailDay, demoMaxPerIpHour,
      } = req.body || {};
      const settings = await updateTrialSettings({
        autoApproveHosted, hostedDays, selfHostedDays, paidExtendDays,
        extendDays, extendPriceBdt, extendPriceUsd, trialsEnabled,
        demoEnabled, domainEnabled, domainMonths, defaultMonths,
        hostingPurchaseEnabled, fulfillmentSlaHours, demoResetEnabled,
        demoMaxPerEmailDay, demoMaxPerIpHour,
      });
      res.json({ message: 'Trial settings updated', ...settings });
    } catch (error) {
      next(error);
    }
  },
  getSmtpSettings: async (req, res, next) => {
    try {
      res.json(await getSmtpSettingsForAdmin());
    } catch (error) {
      next(error);
    }
  },
  updateSmtpSettings: async (req, res, next) => {
    try {
      const settings = await updateSmtpSettings(req.body || {});
      res.json({ message: 'SMTP settings updated', ...settings });
    } catch (error) {
      next(error);
    }
  },
  testSmtpSettings: async (req, res, next) => {
    try {
      const { testEmail, host, port, secure, user, password, fromEmail, fromName } = req.body || {};
      const to = testEmail || req.admin?.email;

      if (!to) {
        return res.status(400).json({ error: 'Test email address is required' });
      }

      let cfg;
      if (host) {
        const stored = await getSmtpConfig();
        cfg = {
          enabled: true,
          host,
          port: parseInt(port, 10) || 587,
          secure: Boolean(secure),
          user: user || '',
          password: password || stored.password,
          fromEmail: fromEmail || stored.fromEmail,
          fromName: fromName || stored.fromName,
          hasPassword: Boolean(password || stored.hasPassword),
        };
      } else {
        cfg = await getSmtpConfig();
      }

      if (!cfg.host) {
        return res.status(400).json({ error: 'SMTP host is required' });
      }

      await sendTestMail({ to, cfg });
      res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'SMTP test failed',
      });
    }
  },
};
