const { pool } = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');

/**
 * GET /api/admin/settings/trialvo-pay
 */
async function getTrialvoPaySettings(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM system_config WHERE key LIKE 'trialvo_pay_%'"
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
          'UPDATE system_config SET value = $1, updated_at = NOW() WHERE key = $2',
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
  testTrialvoPayConnection
};
