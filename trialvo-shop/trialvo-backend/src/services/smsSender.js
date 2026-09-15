const axios = require('axios');
const { getSmsConfig } = require('./smsSettings');

const ALPHA_SEND_URL = 'https://api.sms.net.bd/sendsms';
const ALPHA_BALANCE_URL = 'https://api.sms.net.bd/user/balance/';
const BULK_SEND_URL = 'http://bulksmsbd.net/api/smsapi';
const BULK_BALANCE_URL = 'http://bulksmsbd.net/api/getBalanceApi';

/**
 * Normalize Bangladesh mobile numbers to 88XXXXXXXXXXX (digits only).
 * 017XXXXXXXX → 88017XXXXXXXX; already-prefixed 88… is left as-is.
 */
function normalizeBdNumber(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return '';
  if (clean.startsWith('880') && clean.length >= 13) return clean;
  if (clean.startsWith('88') && clean.length >= 13) return clean;
  if (clean.length === 11) return `88${clean}`;
  if (clean.length === 10) return `880${clean}`;
  return clean;
}

async function sendViaAlpha(apiKey, senderId, to, message) {
  const call = async (useSender) => {
    const payload = { api_key: apiKey, msg: message, to };
    if (useSender && senderId) payload.sender_id = senderId;
    return axios.post(ALPHA_SEND_URL, payload, { timeout: 10000 });
  };

  let res = await call(Boolean(senderId));
  if (res.data?.error === 413 && senderId) {
    res = await call(false);
  }
  if (res.data?.error !== 0) {
    return { ok: false, reason: res.data?.msg || `alphasms_error_${res.data?.error}` };
  }
  return { ok: true };
}

async function sendViaBulk(apiKey, senderId, to, message) {
  // BulkSMSBD requires a real sender id — no dummy fallback.
  const res = await axios.get(BULK_SEND_URL, {
    params: {
      api_key: apiKey,
      type: 'text',
      number: to,
      senderid: senderId,
      message,
    },
    timeout: 10000,
  });
  const data = res.data;
  if (String(data?.response_code) !== '202') {
    return { ok: false, reason: `bulksms_error_${data?.response_code || 'unknown'}` };
  }
  return { ok: true };
}

/**
 * Best-effort SMS send. Never throws for missing config — returns { ok, reason? }.
 */
async function sendSms(phone, message) {
  try {
    const cfg = await getSmsConfig();
    // Prefer explicit active provider; if unset, fall back to the only enabled one.
    let provider = cfg.activeProvider;
    if (!provider) {
      if (cfg.alphaEnabled && !cfg.bulkEnabled) provider = 'alphasms';
      else if (cfg.bulkEnabled && !cfg.alphaEnabled) provider = 'bulksms';
    }
    if (!provider) {
      return {
        ok: false,
        reason: 'no_active_provider',
        message: 'No active SMS provider. Choose AlphaSMS or BulkSMS and click Save.',
      };
    }

    const to = normalizeBdNumber(phone);
    if (!to) return { ok: false, reason: 'invalid_phone', message: 'Invalid phone number' };
    if (!message) return { ok: false, reason: 'empty_message', message: 'Message is empty' };

    if (provider === 'alphasms') {
      if (!cfg.alphaApiKey) {
        return { ok: false, reason: 'missing_api_key', message: 'AlphaSMS API key is missing' };
      }
      // Sender ID is optional for AlphaSMS
      return await sendViaAlpha(cfg.alphaApiKey, cfg.alphaSenderId, to, message);
    }

    if (provider === 'bulksms') {
      if (!cfg.bulkApiKey) {
        return { ok: false, reason: 'missing_api_key', message: 'BulkSMS API key is missing' };
      }
      if (!cfg.bulkSenderId) {
        return { ok: false, reason: 'missing_sender_id', message: 'BulkSMS Sender ID is required' };
      }
      return await sendViaBulk(cfg.bulkApiKey, cfg.bulkSenderId, to, message);
    }

    return { ok: false, reason: 'unknown_provider', message: 'Unknown SMS provider' };
  } catch (e) {
    console.error('[smsSender] send failed:', e.message);
    return { ok: false, reason: e.message || 'send_failed', message: e.message || 'SMS send failed' };
  }
}

/**
 * Optional best-effort balance check for the admin SMS picker.
 */
async function getSmsBalance(provider) {
  try {
    const cfg = await getSmsConfig();
    let chosen = provider || cfg.activeProvider;
    if (!chosen) {
      if (cfg.alphaEnabled && !cfg.bulkEnabled) chosen = 'alphasms';
      else if (cfg.bulkEnabled && !cfg.alphaEnabled) chosen = 'bulksms';
    }
    if (!chosen) return { ok: false, reason: 'no_active_provider', provider: null };

    if (chosen === 'alphasms') {
      if (!cfg.alphaApiKey) return { ok: false, reason: 'missing_api_key', provider: chosen };
      const res = await axios.get(ALPHA_BALANCE_URL, {
        params: { api_key: cfg.alphaApiKey },
        timeout: 8000,
      });
      if (res.data?.error !== 0) {
        return { ok: false, reason: res.data?.msg || 'balance_failed', provider: chosen };
      }
      return {
        ok: true,
        provider: chosen,
        balance: parseFloat(res.data?.data?.balance),
        unit: 'BDT',
      };
    }

    if (chosen === 'bulksms') {
      if (!cfg.bulkApiKey) return { ok: false, reason: 'missing_api_key', provider: chosen };
      const res = await axios.get(BULK_BALANCE_URL, {
        params: { api_key: cfg.bulkApiKey },
        timeout: 8000,
      });
      let balance = 0;
      if (typeof res.data === 'object' && res.data !== null) {
        balance = res.data.balance;
      } else {
        balance = parseFloat(String(res.data).trim());
      }
      if (Number.isNaN(Number(balance))) {
        return { ok: false, reason: 'invalid_balance_response', provider: chosen };
      }
      return { ok: true, provider: chosen, balance: Number(balance), unit: 'BDT' };
    }

    return { ok: false, reason: 'unknown_provider', provider: chosen };
  } catch (e) {
    return { ok: false, reason: e.message || 'balance_failed', provider: provider || null };
  }
}

module.exports = { sendSms, getSmsBalance, normalizeBdNumber };
