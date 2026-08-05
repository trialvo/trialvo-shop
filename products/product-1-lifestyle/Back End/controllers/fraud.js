const axios = require('axios');
const validator = require('validator');
const { api, auth } = require('../helpers/common');
const { FRAUDE_API_KEY, FRAUDE_API_URL } = require('../config/ApplicationSettings');

const errors = require('../helpers/errors');

function normalizeBdPhone(rawPhone) {
  if (rawPhone == null) return '';

  // Keep digits only so formats like +880 1629-615-314 are accepted.
  const digits = String(rawPhone).replace(/\D/g, '');

  if (digits.startsWith('880') && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }

  return digits;
}

exports.testFraudChecker = api(
  {
    body: {
      phone: { type: 'string', required: true }
    }
  },
  auth(async (req, connection) => {
    const { phone } = req.typed.body;
    const normalizedPhone = normalizeBdPhone(phone);

    if (!validator.isMobilePhone(normalizedPhone, 'bn-BD')) {
      throw new errors.INVALID_FIELDS_PROVIDED('Invalid phone number format. Use a valid Bangladesh mobile number.');
    }

    try {
      const params = new URLSearchParams();
      params.append('phone', normalizedPhone);

      const { data } = await axios.post(
        FRAUDE_API_URL,
        params,
        {
          headers: {
            Authorization: `Bearer ${FRAUDE_API_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        normalized_phone: normalizedPhone,
        result: data
      };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        error.message;

      throw new errors.BAD_REQUEST(`QC Test Failed: ${msg}`);
    }
  })
);
