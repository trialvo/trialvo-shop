const axios = require('axios');
const { getConfig } = require('../config/ApplicationSettingsDB');
const errors = require('./errors');

exports.sendSMS = async (connection, number, message) => {
  try {
    const rows = await getConfig(connection, false, 'sms');
    const cfg = rows.reduce((acc, row) => {
      if (row.is_active) acc[row.key_name] = row.value;
      return acc;
    }, {});

    const provider = cfg.SMS_ACTIVE_PROVIDER;
    if (!provider) throw errors.SERVICE_UNAVAILABLE("SMS Service Disabled");

    // Ensure number starts with 88
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length === 11) cleanNumber = '88' + cleanNumber;

    if (provider === 'bulksms') {
      const callBulkApi = async (useSender) => {
        return await axios.get("http://bulksmsbd.net/api/smsapi", {
          params: {
            api_key: cfg.BULK_SMS_API_KEY,
            type: 'text', // FIXED: Explicitly required for BulkSMSBD
            number: cleanNumber,
            senderid: useSender ? cfg.BULK_SMS_SENDER_ID : '8801111111111', // Some BulkSMSBD accounts require a dummy or specific non-masking ID
            message: message
          }
        });
      };

      let res = await callBulkApi(!!cfg.BULK_SMS_SENDER_ID);
      let resData = res.data;

      // Handle the 1003/1002/1013 errors by retrying without senderid
      if ((resData.response_code == "1003" || resData.response_code == "1002") && cfg.BULK_SMS_SENDER_ID) {
        console.warn("[BulkSMS] Retrying without Sender ID due to code:", resData.response_code);
        res = await callBulkApi(false);
        resData = res.data;
      }

      // return resData.response_code == "202" ? { success: true } : { success: false, msg: `Error ${resData.response_code}` };

  if (resData.response_code != "202") {
        throw new errors.SERVICE_UNAVAILABLE("Bulk sms Service err: " + resData.response_code);
      }
      return { success: true };

    }

    // ... Alpha SMS logic remains the same ...

    if (provider === 'alphasms') {
      const callAlphaApi = async (useSender) => {
        const payload = { api_key: cfg.ALPHA_SMS_API_KEY, msg: message, to: cleanNumber };
        if (useSender) payload.sender_id = cfg.ALPHA_SMS_SENDER_ID;
        return await axios.post("https://api.sms.net.bd/sendsms", payload);
      };

      let res = await callAlphaApi(!!cfg.ALPHA_SMS_SENDER_ID);
      if (res.data.error === 413 && cfg.ALPHA_SMS_SENDER_ID) {
        res = await callAlphaApi(false); // Fallback
      }
      // return res.data.error === 0 ? { success: true } : { success: false, msg: res.data.msg };
      if (res.data.error !== 0) {
        throw new errors.SERVICE_UNAVAILABLE("Alpha sms Service err: " + res.data.msg);
      }
      return { success: true };

    }
  } catch (error) {

    // return { success: false, msg: error.message };
    throw new errors.SERVICE_UNAVAILABLE("SMS Service err: " + error.message);
  }
}