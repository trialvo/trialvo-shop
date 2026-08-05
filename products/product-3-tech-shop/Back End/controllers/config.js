const { api, auth } = require('../helpers/common');
const errors = require("../helpers/errors");
const jwt = require("jsonwebtoken");
const { getConfig, clearCache } = require('../config/ApplicationSettingsDB');
const {
  getPermissionConfig,
  clearPermissionCache,
  ensurePermissionDefaults,
  PERMISSION_DEFINITION_MAP,
  DEFAULT_SCOPE
} = require("../config/PermissionSettingsDB");
const { BRAND_NAME } = require('../config/ApplicationSettings');
const { sendSMS } = require('../helpers/sms');
const nodemailer = require('nodemailer');
const validator = require('validator');
const axios = require('axios');
const pLimit = require('p-limit'); // Recommended to handle rate limits

const { optionalUploadApi, saveImage, deleteFileIfExists } = require('../helpers/img'); // Adjust paths as needed

const { verifySteadfast,
   verifyRedx,
    verifyPathao,
     verifyPaperfly,
     fetchSteadfastLocations,
    fetchRedxAreas,
  fetchPathaoCities,
  fetchPathaoAreas,
  fetchPathaoZones,
  fetchPaperflyLocations,
  getPathaoToken
  } = require("../helpers/courier");
const { verifyBkash ,verifySSLCommerz , verifyShurjoPay, verifyNagad} = require("../helpers/payment");

const toPermissionDefKey = (section, scope, keyName) => `${section}.${scope}.${keyName}`;

const parsePermissionValue = (row) => {
  if (row.value_type === "bool") {
    return String(row.value) === "true";
  }
  if (row.value_type === "number") {
    return parseFloat(row.value) || 0;
  }
  return row.value;
};

const serializePermissionValue = (valueType, value) => {
  if (valueType === "bool") return value ? "true" : "false";
  if (valueType === "number") return String(Number(value));
  return String(value);
};

// Backward-compatibility alias: legacy overall_cart_discount.enabled -> is_enabled
const normalizePermissionKeyName = (section, scope, keyName) => {
  if (section === "overall_cart_discount" && scope === DEFAULT_SCOPE && keyName === "enabled") {
    return "is_enabled";
  }
  return keyName;
};

const formatPermissionConfigRows = (rows) => {
  const out = {};

  for (const row of rows) {
    if (!out[row.section]) out[row.section] = {};

    const parsed = parsePermissionValue(row);
    const normalizedKeyName = normalizePermissionKeyName(row.section, row.scope, row.key_name);
    if (row.scope === DEFAULT_SCOPE) {
      out[row.section][normalizedKeyName] = parsed;
      continue;
    }

    if (!out[row.section][row.scope]) out[row.section][row.scope] = {};
    out[row.section][row.scope][normalizedKeyName] = parsed;
  }

  return out;
};

const flattenPermissionPayload = (payload) => {
  const updates = [];

  for (const [section, sectionValue] of Object.entries(payload || {})) {
    if (sectionValue == null || typeof sectionValue !== "object" || Array.isArray(sectionValue)) {
      throw new errors.INVALID_FIELDS_PROVIDED(`Invalid section payload for "${section}"`);
    }

    const hasScopedDefinitions = Object.values(PERMISSION_DEFINITION_MAP).some(
      (d) => d.section === section && d.scope !== DEFAULT_SCOPE
    );

    for (const [firstKey, firstVal] of Object.entries(sectionValue)) {
      if (
        firstVal != null &&
        typeof firstVal === "object" &&
        !Array.isArray(firstVal) &&
        hasScopedDefinitions
      ) {
        // scoped section
        const scope = firstKey;
        for (const [keyName, val] of Object.entries(firstVal)) {
          updates.push({
            section,
            scope,
            keyName: normalizePermissionKeyName(section, scope, keyName),
            value: val
          });
        }
      } else {
        // default scope section
        updates.push({
          section,
          scope: DEFAULT_SCOPE,
          keyName: normalizePermissionKeyName(section, DEFAULT_SCOPE, firstKey),
          value: firstVal
        });
      }
    }
  }

  return updates;
};

const validatePermissionUpdates = (updates) => {
  for (const item of updates) {
    const def = PERMISSION_DEFINITION_MAP[toPermissionDefKey(item.section, item.scope, item.keyName)];
    if (!def) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `Unknown permission key: ${item.section}.${item.scope}.${item.keyName}`
      );
    }

    if (def.value_type === "bool" && typeof item.value !== "boolean") {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `${item.section}.${item.scope}.${item.keyName} must be boolean`
      );
    }

    if (def.value_type === "number") {
      const num = Number(item.value);
      if (isNaN(num)) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `${item.section}.${item.scope}.${item.keyName} must be a valid number`
        );
      }
      if (num < 0) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `${item.section}.${item.scope}.${item.keyName} cannot be negative`
        );
      }
      item.value = num;
    }

    if (def.value_type === "enum") {
      const allowed = String(def.enum_values || "").split(",").filter(Boolean);
      if (!allowed.includes(String(item.value))) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `${item.section}.${item.scope}.${item.keyName} must be one of: ${allowed.join(", ")}`
        );
      }
    }
  }
};

exports.getPermissionConfig = api(
  {
    query: {
      section: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    await ensurePermissionDefaults(connection);

    const rows = await getPermissionConfig(connection, false, req.typed.query.section || null);
    return {
      success: true,
      data: formatPermissionConfigRows(rows)
    };
  })
);

exports.getStorefrontVisibilityUser = api(
  {},
  async (_req, connection) => {
    await ensurePermissionDefaults(connection);

    const rows = await getPermissionConfig(connection, false, "storefront_visibility");
    const formatted = formatPermissionConfigRows(rows);
    const section = formatted?.storefront_visibility || {};
    const parseDateTime = (value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };
    const parseProductIds = (value) => {
      if (typeof value !== "string") return [];
      const ids = value
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => Number.isFinite(id) && id > 0);
      return [...new Set(ids)];
    };
    const parseProductTimers = (value) => {
      const normalized = {};
      if (typeof value !== "string") return normalized;

      const entries = value
        .split(/[\n,;]+/)
        .map((part) => part.trim())
        .filter(Boolean);

      for (const entry of entries) {
        let pair = entry.split("=");
        if (pair.length < 2) pair = entry.split("|");
        if (pair.length < 2) continue;

        const productId = parseInt((pair[0] || "").trim(), 10);
        if (!Number.isFinite(productId) || productId <= 0) continue;

        const dateRaw = pair.slice(1).join("=").trim();
        const dateTime = parseDateTime(dateRaw);
        if (!dateTime) continue;

        normalized[String(productId)] = dateTime;
      }

      return normalized;
    };
    const toPositiveInt = (value, fallback, min = 1, max = 24) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      const safe = Math.trunc(n);
      if (safe < min) return min;
      if (safe > max) return max;
      return safe;
    };

    return {
      success: true,
      data: {
        show_megasale: section.show_megasale === true,
        megasale_campaign_end_at: parseDateTime(section.megasale_campaign_end_at),
        megasale_product_end_at: parseDateTime(section.megasale_product_end_at),
        megasale_product_ids: parseProductIds(section.megasale_product_ids),
        megasale_product_limit: toPositiveInt(section.megasale_product_limit, 8),
        megasale_product_timers: parseProductTimers(section.megasale_product_timers)
      }
    };
  }
);

exports.patchPermissionConfig = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const payload = req.body || {};
    if (!Object.keys(payload).length) {
      throw new errors.NO_FIELDS_PROVIDED();
    }

    await ensurePermissionDefaults(connection);

    const updates = flattenPermissionPayload(payload);
    if (!updates.length) throw new errors.NO_FIELDS_PROVIDED();

    validatePermissionUpdates(updates);

    const currentRows = await getPermissionConfig(connection, true, null);
    const currentMap = new Map(
      currentRows.map((row) => [toPermissionDefKey(row.section, row.scope, row.key_name), parsePermissionValue(row)])
    );

    // dependency validation: guest email verification requires email required
    const nextGuestEmailRequired = updates.some(
      (u) =>
        u.section === "order_place_permission" &&
        u.scope === "guest" &&
        u.keyName === "is_email_required"
    )
      ? updates.find(
          (u) =>
            u.section === "order_place_permission" &&
            u.scope === "guest" &&
            u.keyName === "is_email_required"
        ).value
      : currentMap.get("order_place_permission.guest.is_email_required");

    const nextGuestEmailVerificationRequired = updates.some(
      (u) =>
        u.section === "order_place_permission" &&
        u.scope === "guest" &&
        u.keyName === "is_email_verification_required"
    )
      ? updates.find(
          (u) =>
            u.section === "order_place_permission" &&
            u.scope === "guest" &&
            u.keyName === "is_email_verification_required"
        ).value
      : currentMap.get("order_place_permission.guest.is_email_verification_required");

    if (nextGuestEmailVerificationRequired && !nextGuestEmailRequired) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "guest.is_email_verification_required depends on guest.is_email_required = true"
      );
    }

    const changed = [];
    for (const item of updates) {
      const defKey = toPermissionDefKey(item.section, item.scope, item.keyName);
      const def = PERMISSION_DEFINITION_MAP[defKey];
      const nextSerialized = serializePermissionValue(def.value_type, item.value);
      const currentSerialized = serializePermissionValue(
        def.value_type,
        currentMap.get(defKey)
      );

      if (nextSerialized === currentSerialized) continue;

      const result = await connection.query(
        `
        UPDATE permission_config
        SET value = ?, updated_at = NOW()
        WHERE section = ? AND scope = ? AND key_name = ?
        `,
        [nextSerialized, item.section, item.scope, item.keyName]
      );

      if (result.affectedRows === 0) {
        await connection.query(
          `
          INSERT INTO permission_config
          (section, scope, key_name, value, value_type, enum_values, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
          `,
          [
            item.section,
            item.scope,
            item.keyName,
            nextSerialized,
            def.value_type,
            def.enum_values || null
          ]
        );
      }

      changed.push({
        section: item.section,
        scope: item.scope,
        key_name: item.keyName,
        value: item.value
      });
    }

    if (!changed.length) {
      return { success: true, message: "No changes detected" };
    }

    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'UPDATE_PERMISSION_CONFIG', 'permission_config', 'permission_config', ?)
      `,
      [adminInfo.id, JSON.stringify({ changed })]
    );

    clearPermissionCache();

    const latestRows = await getPermissionConfig(connection, true, null);
    return {
      success: true,
      message: "Permission config updated successfully",
      data: formatPermissionConfigRows(latestRows)
    };
  })
);


exports.getSystemConfig = api(
  {
    query: {
      service: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const rows = await getConfig(connection, false, req.typed.query.service);

    const formatted = {};

    for (const row of rows) {
      const service = row.service;
      const provider = row.provider || "default";

      if (!formatted[service]) {
        formatted[service] = {};
      }

      if (!formatted[service][provider]) {
        formatted[service][provider] = {
          is_active: Boolean(row.is_active),
          config: {}
        };
      }

      formatted[service][provider].config[row.key_name] = row.value;
    }

    return formatted;
  })
);


exports.testSmsConfig = api(
  {
    body: {
      number: { type: "string", required: true },
      message: { type: "string", required: false, default: `Testing sms for ${BRAND_NAME}` }
    }

  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();
    const { number, message } = req.typed.body;
    if (!validator.isMobilePhone(number, 'any')) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format.");
    }

    // We reuse the updated sendSMS function logic
    const result = await sendSMS(connection, number, message);

    if (!result.success) {
      throw new errors.BAD_REQUEST(`Test Failed: ${result.msg}`);
    }

    return {
      success: true,
      msg: "Test SMS sent successfully. Please check your phone."
    };
  })
);


exports.updateSystemConfig = api(
  {
    body: {
      key_name: { type: "string", required: true },
      value: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();

    const { key_name, value } = req.typed.body;

    const result = await connection.query(
      "UPDATE system_config SET value = ? WHERE key_name = ?",
      [value, key_name]
    );

    if (result.affectedRows === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED(`Config key ${key_name} not found`);
    }

    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'UPDATE_SYSTEM_CONFIG', 'system_config', ?, ?)`,
      [
        adminInfo.id,
        key_name,
        JSON.stringify({ new_value: value })
      ]
    );

    clearCache(); // refresh cache
    return { success: true };
  })
);


 




exports.updateAlphaSmsConfig = api(
  {
    body: {
      status: { type: "bool", required: false },
      api_key: { type: "string", required: false },
      sender_id: { type: "string", required: false },
      base_url: { type: "string", required: false },
      setNull: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();

    const { status, api_key, sender_id, base_url, setNull } = req.typed.body;
    const PROVIDER = 'alphasms';
    const SERVICE = 'sms';

    // Ensure at least one field is provided
    if (status === undefined && api_key === undefined && sender_id === undefined && base_url === undefined && setNull === undefined) {
      throw new errors.INVALID_FIELDS_PROVIDED("No fields provided for update.");
    }

    /** 2️⃣ Strict Pair Validation */
    // If one is provided, both api_key and base_url must be provided together
    const hasKeyOrUrl = (api_key || base_url);
    const hasBothKeyAndUrl = (api_key && base_url);

    if (hasKeyOrUrl && !hasBothKeyAndUrl) {
      throw new errors.INVALID_FIELDS_PROVIDED("Both API_KEY and BASE_URL must be provided together for Alpha SMS.");
    }

    /** 3️⃣ Fetch Current Config State */
    const currentConfigs = await getConfig(connection, false, SERVICE);
    
    const activeProviderRow = currentConfigs.find(r => r.key_name === 'SMS_ACTIVE_PROVIDER');
    const statusRow = currentConfigs.find(r => r.provider === PROVIDER);

    const isCurrentlyPrimary = activeProviderRow?.value === PROVIDER;
    const currentStatus = Boolean(statusRow?.is_active);

    /** 4️⃣ Safety Validation (Primary Provider Protection) */
    if (isCurrentlyPrimary) {
      if (setNull === true) throw new errors.INVALID_FIELDS_PROVIDED("Cannot clear config while Alpha SMS is the Active Provider.");
      if (status === false) throw new errors.INVALID_FIELDS_PROVIDED("Cannot deactivate Alpha SMS while it is the Active Provider.");
    }

    /** 5️⃣ Handle Wipe Logic */
    if (setNull) {
      await connection.query(`UPDATE system_config SET value = '', is_active = 0 WHERE service = ? AND provider = ?`, [SERVICE, PROVIDER]);
      clearCache();
      return { success: true, message: "Alpha SMS configuration cleared successfully." };
    }

    /** 6️⃣ Credential & Status Activation Validation */
    const isActivating = (status === true && currentStatus === false);
    
    // Trigger validation if:
    // A) New credentials (Key + URL) are provided
    // B) Turning status ON (requires existing or new credentials)
    if (hasBothKeyAndUrl || isActivating) {
      const keyToVerify = api_key || currentConfigs.find(r => r.key_name === 'ALPHA_SMS_API_KEY')?.value;
      const urlToVerify = base_url || currentConfigs.find(r => r.key_name === 'ALPHA_SMS_URL')?.value;
      
      if (!keyToVerify) throw new errors.INVALID_FIELDS_PROVIDED("API Key is missing for verification.");
      if (!urlToVerify) throw new errors.INVALID_FIELDS_PROVIDED("Base URL is missing for verification.");

      // Validate URL format if a new one is provided
      if (base_url && !validator.isURL(base_url, { protocols: ['http', 'https'], require_protocol: true })) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid Base URL format.");
      }

      try {
        const sanitizedUrl = urlToVerify.replace(/\/+$/, "");
        const res = await axios.get(`${sanitizedUrl}/user/balance/?api_key=${keyToVerify}`);
        
        if (res.data.error !== 0) {
          throw new Error(res.data.msg || "Authorization failed via the provided URL.");
        }
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(`Alpha SMS Verification Failed: ${err.message}`);
      }

      // If validation passed and credentials were in request, update both
      if (hasBothKeyAndUrl) {
        await connection.query(`UPDATE system_config SET value = ? WHERE key_name = 'ALPHA_SMS_API_KEY' AND service = ?`, [api_key, SERVICE]);
        await connection.query(`UPDATE system_config SET value = ? WHERE key_name = 'ALPHA_SMS_URL' AND service = ?`, [base_url, SERVICE]);
      }
    }

    /** 7️⃣ Update Remaining Fields */
    if (sender_id !== undefined) {
      await connection.query(`UPDATE system_config SET value = ? WHERE key_name = 'ALPHA_SMS_SENDER_ID' AND service = ?`, [sender_id, SERVICE]);
    }

    if (status !== undefined) {
      await connection.query(`UPDATE system_config SET is_active = ? WHERE provider = ? AND service = ?`, [status ? 1 : 0, PROVIDER, SERVICE]);
    }

    clearCache();
    return { 
      success: true, 
      message: "Alpha SMS configuration verified and updated successfully." 
    };
  })
);

exports.updateBulkSmsConfig = api(
  {
    body: {
      status: { type: "bool", required: false },
      api_key: { type: "string", required: false },
      sender_id: { type: "string", required: false },
      base_url: { type: "string", required: false },
      setNull: { type: "bool", required: false, default: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();

    const { status, api_key, sender_id, base_url, setNull } = req.typed.body;
    const PROVIDER = 'bulksms';
    const SERVICE = 'sms';

    // Ensure at least one field is provided
    if (status === undefined && api_key === undefined && sender_id === undefined && base_url === undefined && req.body.setNull === undefined) {
      throw new errors.INVALID_FIELDS_PROVIDED("No fields provided for update.");
    }

    /** 2️⃣ Strict Triple Validation */
    // If any credential field is provided, all three must be present
    const hasCredentials = (api_key || sender_id || base_url);
    const hasAllCredentials = (api_key && sender_id && base_url);

    if (hasCredentials && !hasAllCredentials) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "To update credentials, you must provide API_KEY, SENDER_ID, and BASE_URL together."
      );
    }

    /** 3️⃣ Fetch Current Config State */
    const currentConfigs = await getConfig(connection, false, SERVICE);
    
    const activeProviderRow = currentConfigs.find(r => r.key_name === 'SMS_ACTIVE_PROVIDER');
    const statusRow = currentConfigs.find(r => r.provider === PROVIDER);

    const isCurrentlyPrimary = activeProviderRow?.value === PROVIDER;
    const currentStatus = Boolean(statusRow?.is_active);

    /** 4️⃣ Safety Validation (Primary Protection) */
    if (isCurrentlyPrimary) {
      if (setNull === true) throw new errors.INVALID_FIELDS_PROVIDED("Cannot clear config while BulkSMS is the Active Provider.");
      if (status === false) throw new errors.INVALID_FIELDS_PROVIDED("Cannot deactivate BulkSMS while it is the Active Provider.");
    }

    /** 5️⃣ Handle Wipe Logic */
    if (setNull) {
      await connection.query(`UPDATE system_config SET value = '', is_active = 0 WHERE service = ? AND provider = ?`, [SERVICE, PROVIDER]);
      clearCache();
      return { success: true, message: "BulkSMS configuration cleared successfully." };
    }

    /** 6️⃣ Validation and Update Logic */
    const isActivating = (status === true && currentStatus === false);

    // If we are providing new credentials OR turning the service ON
    if (hasAllCredentials || isActivating) {
      
      // Use request values if provided, otherwise fallback to DB for activation hit
      const keyToVerify = api_key || currentConfigs.find(r => r.key_name === 'BULK_SMS_API_KEY')?.value;
      const senderToVerify = sender_id || currentConfigs.find(r => r.key_name === 'BULK_SMS_SENDER_ID')?.value;
      const urlToVerify = base_url || currentConfigs.find(r => r.key_name === 'BULK_SMS_URL')?.value;

      if (!keyToVerify || !senderToVerify || !urlToVerify) {
        throw new errors.INVALID_FIELDS_PROVIDED("API Key, Sender ID, and Base URL are required to verify/activate BulkSMS.");
      }

      // Validate URL format if a new one is provided
      if (base_url && !validator.isURL(base_url, { protocols: ['http', 'https'], require_protocol: true })) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid Base URL format.");
      }

      try {
        const sanitizedUrl = urlToVerify.replace(/\/+$/, "");
        const res = await axios.get(`${sanitizedUrl}/api/getBalanceApi?api_key=${keyToVerify}`);
        const resData = res.data;

        let responseCode = String(resData.response_code || "");
        if (["1011", "1031", "1032"].includes(responseCode)) {
          const errorsMap = { "1011": "Invalid Key", "1031": "Unverified Account", "1032": "IP Blocked" };
          throw new Error(errorsMap[responseCode]);
        }

        if (responseCode !== "202" && isNaN(parseFloat(resData.balance))) {
           throw new Error("Invalid response from provider. Check your URL and Key.");
        }
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(`BulkSMS Verification Failed: ${err.message}`);
      }

      // If validation passed and credentials were in request, update all three
      if (hasAllCredentials) {
        await connection.query(`UPDATE system_config SET value = ? WHERE key_name = 'BULK_SMS_API_KEY' AND service = ?`, [api_key, SERVICE]);
        await connection.query(`UPDATE system_config SET value = ? WHERE key_name = 'BULK_SMS_SENDER_ID' AND service = ?`, [sender_id, SERVICE]);
        await connection.query(`UPDATE system_config SET value = ? WHERE key_name = 'BULK_SMS_URL' AND service = ?`, [base_url, SERVICE]);
      }
    }

    /** 7️⃣ Update Status */
    if (status !== undefined) {
      await connection.query(`UPDATE system_config SET is_active = ? WHERE provider = ? AND service = ?`, [status ? 1 : 0, PROVIDER, SERVICE]);
    }
clearCache();
    return { 
      success: true, 
      message: "BulkSMS configuration verified and updated." 
    };
  })
);

exports.setActiveSmsProvider = api(
  {
    body: {
      provider: { type: "string", required: true } // 'alphasms' or 'bulksms'
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization check */
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { provider } = req.typed.body;
    const SERVICE = 'sms';

    // Validate provider name
    if (!['alphasms', 'bulksms'].includes(provider)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Provider must be either 'alphasms' or 'bulksms'.");
    }

    /** 2️⃣ Check Provider Status */
    // Fetch configuration for the requested provider to ensure it's active and has credentials
    const configs = await getConfig(connection, false, SERVICE);
    
    // Check if the target provider group is marked as is_active
    const providerRows = configs.filter(r => r.provider === provider);
    const isActive = providerRows.length > 0 && providerRows.every(r => r.is_active === 1);
    
    if (!isActive) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `Cannot set ${provider} as active because it is currently deactivated. Please enable it in the provider settings first.`
      );
    }

    // Secondary check: Ensure API Key is not empty
    const apiKeyKey = provider === 'alphasms' ? 'ALPHA_SMS_API_KEY' : 'BULK_SMS_API_KEY';
    const apiKey = configs.find(r => r.key_name === apiKeyKey)?.value;

    if (!apiKey || apiKey.trim() === "") {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `Cannot set ${provider} as active because its API Key is missing.`
      );
    }

    /** 3️⃣ Update the Active Provider Switch */
    await connection.query(
      `UPDATE system_config 
       SET value = ?, updated_at = NOW() 
       WHERE service = ? AND key_name = 'SMS_ACTIVE_PROVIDER'`,
      [provider, SERVICE]
    );

    /** 4️⃣ Audit Logging */
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'SWITCH_SMS_PROVIDER', 'system_config', 'SMS_GATEWAY', ?)`,
      [
        adminInfo.id,
        JSON.stringify({ 
          switched_to: provider,
          timestamp: new Date().toISOString() 
        })
      ]
    );

    // Clear system cache to ensure the change takes effect immediately across the app
    clearCache();

    return {
      success: true,
      message: `SMS Gateway successfully switched to ${provider}.`
    };
  })
);





exports.updateEmailConfig = api(
  {
    body: {
      MAIL_HOST: { type: "string", required: false },
      MAIL_PORT: { type: "int", required: false },
      MAIL_USER: { type: "string", required: false },
      MAIL_PASS: { type: "string", required: false },
      setNull: { type: "boolean", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    // 1. Authorization
    if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();

    const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, setNull } = req.typed.body;
    const configKeys = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS', 'MESSANGER_MAIL'];
    let updates = {};
    const isActiveStatus = setNull == true ? 0 : 1; // 0 if clearing, 1 if updating

    if (setNull == true) {
      // Logic for clearing: set all values to empty
      configKeys.forEach(key => updates[key] = "");
    } else {
      // Logic for updating: Validate that all required fields are present
      if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS) {
        throw new errors.INVALID_FIELDS_PROVIDED("All SMTP fields are required when setNull is false");
      }

      // Normalize — copy/paste often adds spaces; port may arrive as string
      const host = String(MAIL_HOST).trim();
      const user = String(MAIL_USER).trim();
      const pass = String(MAIL_PASS).trim();
      const port = parseInt(MAIL_PORT, 10);
      if (!Number.isFinite(port) || port < 1) {
        throw new errors.INVALID_FIELDS_PROVIDED("MAIL_PORT must be a valid port number (e.g. 587 or 465)");
      }

      // Port 465 = implicit TLS; 587/25 = STARTTLS (Brevo documents 587)
      const secure = port === 465;

      // 2. SMTP Verification (Dry Run)
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: !secure,
        auth: { user, pass },
        authMethod: "LOGIN",
        tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 12000,
      });

      try {
        await transporter.verify();
      } catch (error) {
        const raw = error?.message || String(error);
        // Brevo: Login = SMTP login email, Password = SMTP key (not account password / not xsmtpsib API key)
        const hint = /535|Invalid login|Authentication failed/i.test(raw)
          ? " For Brevo: use SMTP Login (…@smtp-brevo.com) and the SMTP key from Transactional → Settings → SMTP (not your Brevo account password, and not an API key starting with xsmtpsib-)."
          : "";
        throw new errors.INVALID_FIELDS_PROVIDED(`SMTP Verification Failed: ${raw}${hint}`);
      }

      updates = { MAIL_HOST: host, MAIL_PORT: String(port), MAIL_USER: user, MAIL_PASS: pass };
    }

    // 3. Database Execution
    // await connection.transaction(async (trx) => {
    // Update values and is_active status for each key
    for (const [key, value] of Object.entries(updates)) {
      await connection.query(
        "UPDATE system_config SET value = ?, is_active = ? WHERE key_name = ? AND service = 'email'",
        [String(value), isActiveStatus, key]
      );
    }

    // 4. Audit Log
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, 'UPDATE_EMAIL_CONFIG', 'system_config', 'SMTP', ?)`,
      [
        adminInfo.id,
        JSON.stringify({
          action: setNull ? 'DISABLE_AND_CLEAR' : 'VERIFY_AND_ENABLE',
          fields_updated: Object.keys(updates),
          is_active: isActiveStatus
        })
      ]
    );
    // });

    clearCache(); // Ensure internal system state is updated
    return {
      success: true,
      message: setNull == true ? "Email configuration cleared and disabled" : "Email configuration verified and enabled"
    };
  })
);






// exports.updateSmsConfig = api(
//   {
//     body: {
//       provider: { type: "string", required: true }, // 'bulksms' or 'alphasms'
//       API_KEY: { type: "string", required: false },
//       SENDER_ID: { type: "string", required: false }, // Now optional
//       setNull: { type: "boolean", required: false, default: false }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();



//     const { provider, API_KEY, SENDER_ID, setNull } = req.typed.body;
//     if (!['bulksms', 'alphasms'].includes(provider)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Provider must be either 'bulksms' or 'alphasms'");
//     }

//     if (provider === 'bulksms' && !SENDER_ID) throw new errors.INVALID_FIELDS_PROVIDED("SENDER_ID is required for bulksms provider.");

//     const prefix = provider === 'bulksms' ? 'BULK_SMS' : 'ALPHA_SMS';
//     const isActiveStatus = setNull ? 0 : 1;

//     let updates = {};

//     if (setNull) {
//       // 1. Wipe logic
//       updates[`${prefix}_API_KEY`] = "";
//       updates[`${prefix}_SENDER_ID`] = "";
//       // If we are clearing the currently active provider, we might want to unset the switch
//       const [current] = await connection.query(
//         "SELECT value FROM system_config WHERE key_name = 'SMS_ACTIVE_PROVIDER'"
//       );
//       if (current && current.value === provider) {
//         updates['SMS_ACTIVE_PROVIDER'] = "";
//       }
//     } else {
//       // 2. Forecast Requirement Check
//       if (!API_KEY) {
//         throw new errors.INVALID_FIELDS_PROVIDED(`API_KEY is required to activate ${provider}.`);
//       }

//       // 3. Verification via Balance Check
//       // ... inside updateSmsConfig auth logic ...

//       try {
//         if (provider === 'bulksms') {
//           const res = await axios.get(`http://bulksmsbd.net/api/getBalanceApi?api_key=${API_KEY}`);

//           let resData = res.data;
//           let responseCode = null;
//           let balance = null;

//           // 1. Handle JSON Response (New Version)
//           if (typeof resData === 'object' && resData !== null) {
//             responseCode = String(resData.response_code);
//             balance = resData.balance;
//           }
//           // 2. Handle Plain Text Response (Legacy Version)
//           else {
//             const cleanText = String(resData).trim();
//             // If it's a 4-digit error code
//             if (cleanText.length === 4 && cleanText.startsWith('10')) {
//               responseCode = cleanText;
//             } else {
//               balance = parseFloat(cleanText);
//               if (!isNaN(balance)) responseCode = "202"; // Assume success if it's a number
//             }
//           }

//           // 3. Map error codes
//           const errorCodes = {
//             "1011": "Invalid API Key (User not found)",
//             "1005": "Internal Server Error",
//             "1031": "Account Not Verified",
//             "1032": "IP Not Whitelisted"
//           };

//           if (errorCodes[responseCode]) {
//             throw new Error(errorCodes[responseCode]);
//           }

//           // 4. Final verification: We need either a 202 code or a valid balance number
//           if (responseCode !== "202" && isNaN(parseFloat(balance))) {
//             throw new Error(`Unexpected provider response: ${JSON.stringify(resData)}`);
//           }

//         } else {
//           // Alpha SMS Logic (remains the same)
//           const res = await axios.get(`https://api.sms.net.bd/user/balance/?api_key=${API_KEY}`);
//           if (res.data.error !== 0) {
//             throw new Error(res.data.msg || "Authorization required");
//           }
//         }
//       } catch (err) {
//         throw new errors.INVALID_FIELDS_PROVIDED(`Verification Failed for ${provider}: ${err.message}`);
//       }

//       // 4. Prepare updates
//       updates[`${prefix}_API_KEY`] = API_KEY;
//       updates[`${prefix}_SENDER_ID`] = SENDER_ID || ""; // Store empty string if not provided
//       updates['SMS_ACTIVE_PROVIDER'] = provider;
//     }

//     // 5. Database Transaction
//     // await connection.transaction(async (trx) => {
//     for (const [key, value] of Object.entries(updates)) {
//       await connection.query(
//         "UPDATE system_config SET value = ?, is_active = ? WHERE key_name = ? AND service = 'sms'",
//         [String(value), isActiveStatus, key]
//       );
//     }

//     // Log the configuration change
//     await connection.query(
//       `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
//          VALUES (?, 'UPDATE_SMS_CONFIG', 'system_config', ?, ?)`,
//       [
//         adminInfo.id,
//         provider.toUpperCase(),
//         JSON.stringify({
//           action: setNull ? 'CLEARED' : 'ACTIVATED',
//           has_sender_id: !!SENDER_ID
//         })
//       ]
//     );
//     // });

//     clearCache();
//     return {
//       success: true,
//       message: setNull ? `${provider} configuration cleared.` : `${provider} verified and set as active.`
//     };
//   })
// );



// exports.getSmsBalance = api(
//   {}, // No body required for a GET request
//   auth(async (req, connection, adminInfo) => {
//     // 1. Fetch the active provider and its key
//     const configs = await connection.query(
//       "SELECT key_name, value FROM system_config WHERE service = 'sms' AND is_active = 1"
//     );

//     const cfg = configs.reduce((acc, row) => ({ ...acc, [row.key_name]: row.value }), {});
//     const provider = cfg.SMS_ACTIVE_PROVIDER;

//     if (!provider) {
//       throw new errors.NOT_FOUND("No active SMS provider configured.");
//     }

//     try {
//       // --- CASE: BulkSMSBD ---
//       if (provider === 'bulksms') {
//         const res = await axios.get(`http://bulksmsbd.net/api/getBalanceApi?api_key=${cfg.BULK_SMS_API_KEY}`);

//         // Handle both JSON and Legacy text responses from BulkSMSBD
//         let balance = 0;
//         if (typeof res.data === 'object' && res.data !== null) {
//           balance = res.data.balance;
//         } else {
//           balance = parseFloat(String(res.data).trim());
//         }

//         if (isNaN(balance)) throw new Error("Invalid response from BulkSMSBD");

//         return {
//           success: true,
//           provider: "BulkSMSBD",
//           balance: balance,
//           unit: "BDT"
//         };
//       }

//       // --- CASE: Alpha SMS ---
//       if (provider === 'alphasms') {
//         const res = await axios.get(`https://api.sms.net.bd/user/balance/?api_key=${cfg.ALPHA_SMS_API_KEY}`);

//         if (res.data.error !== 0) {
//           throw new Error(res.data.msg || "AlphaSMS API Error");
//         }

//         return {
//           success: true,
//           provider: "Alpha SMS",
//           balance: parseFloat(res.data.data.balance),
//           unit: "BDT"
//         };
//       }

//     } catch (err) {
//       console.error(`Balance Check Failed for ${provider}:`, err.message);
//       throw new errors.SERVICE_UNAVAILABLE(`Could not fetch balance from ${provider}.`);
//     }
//   })
// );



exports.getSmsBalance = api(
  {
    query: {
      provider: { type: "string", required: true } // 'alphasms' or 'bulksms'
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { provider } = req.typed.query;
    const SERVICE = 'sms';

    // 1. Fetch all configurations for the SMS service
    const configs = await getConfig(connection, false, SERVICE);

    // 2. Filter rows for the requested provider
    const providerRows = configs.filter(r => r.provider === provider);

    if (providerRows.length === 0) {
      throw new errors.NOT_FOUND(`Provider '${provider}' not found in system configuration.`);
    }

    // 3. Check if the provider is currently active
    // (Every row for a provider usually shares the same is_active status)
    const isActive = providerRows.every(r => r.is_active === 1);
    if (!isActive) {
      throw new errors.INVALID_FIELDS_PROVIDED(`The provider '${provider}' is currently deactivated.`);
    }

    // 4. Extract necessary credentials from the config rows
    const cfg = providerRows.reduce((acc, row) => ({ ...acc, [row.key_name]: row.value }), {});

    try {
      // --- CASE: BulkSMS ---
      if (provider === 'bulksms') {
        const apiKey = cfg.BULK_SMS_API_KEY;
        const baseUrl = cfg.BULK_SMS_URL?.replace(/\/+$/, "");

        if (!apiKey || !baseUrl) throw new Error("Missing API Key or Base URL for BulkSMS.");

        const res = await axios.get(`${baseUrl}/api/getBalanceApi?api_key=${apiKey}`);
        
        let balance = 0;
        if (typeof res.data === 'object' && res.data !== null) {
          balance = res.data.balance;
        } else {
          balance = parseFloat(String(res.data).trim());
        }

        if (isNaN(balance)) throw new Error("Invalid response from BulkSMS provider.");

        return {
          success: true,
          provider: "BulkSMS",
          balance: Number(balance),
          unit: "BDT"
        };
      }

      // --- CASE: Alpha SMS ---
      if (provider === 'alphasms') {
        const apiKey = cfg.ALPHA_SMS_API_KEY;
        const baseUrl = cfg.ALPHA_SMS_URL?.replace(/\/+$/, "");

        if (!apiKey || !baseUrl) throw new Error("Missing API Key or Base URL for Alpha SMS.");

        const res = await axios.get(`${baseUrl}/user/balance/?api_key=${apiKey}`);

        if (res.data.error !== 0) {
          throw new Error(res.data.msg || "AlphaSMS API Error");
        }

        return {
          success: true,
          provider: "Alpha SMS",
          balance: parseFloat(res.data.data.balance),
          unit: "BDT"
        };
      }

    } catch (err) {
      console.error(`Balance Check Failed for ${provider}:`, err.message);
      throw new errors.SERVICE_UNAVAILABLE(`Could not fetch balance from ${provider}: ${err.message}`);
    }
  })
);

/**
 * Set the global default courier provider
 * Request Body: { "provider": "redx" }
 */


exports.getDeliveryAreas = api(
  {
    query: {
      search: { type: "string", required: false }
    }
  },
  async (req, connection) => {
    const search = req.typed?.query?.search?.trim() || null;

    let rows;
    if (search) {
      rows = await connection.query(
        `SELECT id, city_name, area_name
         FROM location_mappings
         WHERE pathao_city_id IS NOT NULL
           AND (city_name LIKE ? OR area_name LIKE ?)
         ORDER BY city_name, area_name`,
        [`%${search}%`, `%${search}%`]
      );
    } else {
      rows = await connection.query(
        `SELECT id, city_name, area_name
         FROM location_mappings
         WHERE pathao_city_id IS NOT NULL
         ORDER BY city_name, area_name`
      );
    }

    // Group by city_name
    const cityMap = {};
    for (const row of rows) {
      const city = row.city_name || "Other";
      if (!cityMap[city]) cityMap[city] = [];
      cityMap[city].push({ id: row.id, area_name: row.area_name });
    }

    const cities = Object.entries(cityMap).map(([city_name, areas]) => ({
      city_name,
      areas
    }));

    return { success: true, data: cities };
  }
);

exports.syncAllCourierLocations = api(
  {},
  auth(async (req, connection, adminInfo) => {

    const rows = await getConfig(connection, true, "courier");
    const configs = {};
    rows.forEach(r => {
      if (!configs[r.provider]) configs[r.provider] = {};
      configs[r.provider][r.key_name] = r.value;
    });

    const report = { steadfast: 0, redx: 0, pathao: 0, paperfly: 0, errors: [] };

/* -------------------- STEADFAST SYNC -------------------- */
if (configs.steadfast?.STEADFAST_API_KEY) {
  try {
    const baseUrl = configs.steadfast.STEADFAST_BASE_URL.replace(/\/$/, "");
    const res = await axios.get(`${baseUrl}/police_stations`, {
      headers: { 
        "Api-Key": configs.steadfast.STEADFAST_API_KEY, 
        "Secret-Key": configs.steadfast.STEADFAST_SECRET_KEY,
        "Content-Type": "application/json"
      }
    });
 
    // Steadfast returns: { stations: [ { id, name, policestations: [] } ] }
    const districts = res.data?.data;
 
    if (!Array.isArray(districts)) {
      throw new Error("Invalid Steadfast stations response");
    }

    for (const district of districts) {
      const cityName = district.name; // ✅ district name

      if (!Array.isArray(district.policestations)) continue;

      for (const ps of district.policestations) {
        const safeAreaName = ps.name ? ps.name.replace(/[\uFFFD]/g, '?') : '';
        let insertCityName = cityName;
        let insertAreaName = safeAreaName;
        try {
          await connection.query(
            `INSERT INTO location_mappings 
             (city_name, area_name, steadfast_id)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               steadfast_id = VALUES(steadfast_id)`,
            [
              insertCityName,
              insertAreaName,
              ps.id
            ]
          );
          report.steadfast++;
        } catch (rowErr) {
          // Skip rows with encoding issues (e.g. Bengali characters on latin1 DB)
          report.errors.push(`Steadfast row skip (${ps.name}): ${rowErr.message}`);
        }
      }
    }
  } catch (e) {
    report.errors.push(`Steadfast Error: ${e.message}`);
  }
}

    /* -------------------- REDX -------------------- */
    if (configs.redx?.REDX_TOKEN) {
      try {
        const areas = await fetchRedxAreas(configs.redx);

        for (const area of areas) {
          if (!area.city_name || !area.name) continue;

          await connection.query(
            `INSERT INTO location_mappings
             (location_type, city_name, area_name, redx_area_id)
             VALUES ('city', ?, ?, ?)
             ON DUPLICATE KEY UPDATE redx_area_id = VALUES(redx_area_id)`,
            [area.city_name, area.name, area.id]
          );

          report.redx++;
        }
      } catch (e) {
        report.errors.push(`RedX: ${e.message}`);
      }
    }

    /* -------------------- PATHAO (CITY ONLY) -------------------- */
    if (configs.pathao?.PATHAO_CLIENT_ID) {
      try {
        const token = await getPathaoToken(configs.pathao);

        const cities = await fetchPathaoCities(configs.pathao, token);

        if (!cities.length) {
          report.errors.push(`Pathao: token OK but 0 cities returned — check if the Pathao account has city-listing permission (sandbox vs production base URL)`);
        }

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        for (const city of cities) {
          const zones = await fetchPathaoZones(configs.pathao, token, city.city_id);
            await sleep(1000);

          for (const zone of zones) {
            const areas = await fetchPathaoAreas(configs.pathao, token, zone.zone_id);
              await sleep(1000);

            for (const area of areas) {
              await connection.query(
                `INSERT INTO location_mappings
                 (location_type, city_name, district_name, area_name,
                  pathao_city_id, pathao_zone_id, pathao_area_id)
                 VALUES ('city', ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   city_name = VALUES(city_name),
                   district_name = VALUES(district_name),
                   area_name = VALUES(area_name),
                   pathao_city_id = VALUES(pathao_city_id),
                   pathao_zone_id = VALUES(pathao_zone_id),
                   pathao_area_id = VALUES(pathao_area_id)`,
                [
                  zone.zone_name,      // city_name = Pathao zone name (Ashulia, Dhaka-city…)
                  city.city_name,      // district_name = Pathao city name (Dhaka, Chittagong…) ← level-1
                  area.area_name,
                  city.city_id,
                  zone.zone_id,
                  area.area_id
                ]
              );

              report.pathao++;
            }
          }
        }
      } catch (e) {
        report.errors.push(`Pathao: ${e.message}`);
      }
    }

    /* -------------------- PAPERFLY -------------------- */
    if (configs.paperfly?.PAPERFLY_API_KEY) {
      try {
        const thanas = await fetchPaperflyLocations(configs.paperfly);

        for (const thana of thanas) {
          if (!thana.districtName || !thana.thanaName) continue;

          await connection.query(
            `INSERT INTO location_mappings
             (location_type, district_name, upazila_name, area_name, paperfly_id)
             VALUES ('city', ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE paperfly_id = VALUES(paperfly_id)`,
            [
              thana.districtName,
              thana.thanaName,
              thana.thanaName,
              thana.thanaId
            ]
          );

          report.paperfly++;
        }
      } catch (e) {
        report.errors.push(`Paperfly: ${e.message}`);
      }
    }

    return {
      success: report.errors.length === 0,
      message: "Courier city-location sync completed",
      stats: report
    };
  })
);


exports.setDefaultCourier = api(
  {
    body: {
      provider: { type: "string", required: true }
    }
  }, // No body required for a GET request
  auth(async (req, connection, adminInfo) => {
    const { provider } = req.typed.body;
    if (!adminInfo.roles.includes("SUPER_ADMIN")) throw new errors.UNAUTHORIZED();

    if (!['steadfast', 'redx', 'pathao', 'paperfly'].includes(provider)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid courier provider specified.");


    // 1. Verify if this provider actually exists in our config
    const [exists] = await connection.query(
      "SELECT id,is_active FROM system_config WHERE service = 'courier' AND provider = ?   LIMIT 1",
      [provider]
    );

    if (!exists) throw new errors.NOT_FOUND(`Courier provider ${provider} not found in system configuration.`);
    if (exists.is_active == 0) throw new errors.BAD_REQUEST(`Courier provider ${provider} is currently inactive. Please activate it before setting as default.`);
    // 2. Update the default provider setting
    await connection.query(
      "UPDATE system_config SET value = ? WHERE key_name = 'COURIER_DEFAULT_PROVIDER'",
      [provider]
    );
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'SET_DEFAULT_COURIER', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(req.typed.body)]
    );
    // 3. Clear your cache so the new default takes effect immediately
    // (Using your existing clearCache function)
    clearCache();

    return {
      success: true,
      message: `Default courier updated to ${provider}`
    }


  })
);




exports.editSteadfastConfig = optionalUploadApi(
  "image",
  {
    body: {
      base_url: { type: "string", required: false },
      api_key: { type: "string", required: false },
      secret_key: { type: "string", required: false },
      webhook_secret: { type: "string", required: false },
      description: { type: "string", required: false },
      note: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      base_url,
      api_key,
      secret_key,
      webhook_secret,
      description,
      note,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "steadfast";

    /* ---------------- SET NULL ---------------- */
    if (setnull === true) {

      const isDefault = await connection.queryOne(
        `SELECT value FROM system_config WHERE key_name='COURIER_DEFAULT_PROVIDER'`
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST("Cannot clear default courier provider");
      }

      const oldImg = await connection.queryOne(
        `
        SELECT value FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name='STEADFAST_IMG'
        `,
        [provider]
      );

      if (oldImg?.value) deleteFileIfExists(oldImg.value);

      await connection.query(
        `
        UPDATE system_config
        SET value=NULL, is_active=0
        WHERE service='courier' AND provider=?
        `,
        [provider]
      );

    } else {

      /* ---------------- LOAD EXISTING CORE CREDS ---------------- */
      const existingRows = await connection.query(
        `
        SELECT key_name, value
        FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name IN (
            'STEADFAST_BASE_URL',
            'STEADFAST_API_KEY',
            'STEADFAST_SECRET_KEY'
          )
        `,
        [provider]
      );

      const existing = {};
      for (const r of existingRows) {
        existing[r.key_name] = r.value;
      }

      const nextBaseUrl = base_url ?? existing.STEADFAST_BASE_URL;
      const nextApiKey = api_key ?? existing.STEADFAST_API_KEY;
      const nextSecretKey = secret_key ?? existing.STEADFAST_SECRET_KEY;

      const credsChanged =
        nextBaseUrl !== existing.STEADFAST_BASE_URL ||
        nextApiKey !== existing.STEADFAST_API_KEY ||
        nextSecretKey !== existing.STEADFAST_SECRET_KEY;

      /* ---------------- REQUIRED FIELD CHECK (ONLY IF CHANGING CREDS) ---------------- */
      if (credsChanged) {
        if (!nextBaseUrl || !nextApiKey || !nextSecretKey) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            "Base URL, API Key and Secret Key are required"
          );
        }

        /* ✅ VERIFY ONLY WHEN CORE CREDS CHANGED */
        await verifySteadfast({
          base_url: nextBaseUrl,
          api_key: nextApiKey,
          secret_key: nextSecretKey
        });
      }

      /* ---------------- IMAGE ---------------- */
      let imgPath;
      if (req.files?.image) {

        const oldImg = await connection.queryOne(
          `
          SELECT value FROM system_config
          WHERE service='courier'
            AND provider=?
            AND key_name='STEADFAST_IMG'
          `,
          [provider]
        );

        if (oldImg?.value) deleteFileIfExists(oldImg.value);

        imgPath = await saveImage(
          req.files.image[0].path,
          "courier/steadfast"
        );
      }

      /* ---------------- UPSERT CONFIG ---------------- */
      const updates = [];
      const push = (k, v) => {
        if (v !== undefined) {
          updates.push([
            "courier",
            k,
            v,
            provider,
            status !== undefined ? status : 1
          ]);
        }
      };

      push("STEADFAST_BASE_URL", nextBaseUrl);
      push("STEADFAST_API_KEY", nextApiKey);
      push("STEADFAST_SECRET_KEY", nextSecretKey);
      push("STEADFAST_WEBHOOK_SECRET", webhook_secret);
      push("STEADFAST_DESC", description);
      push("STEADFAST_NOTE", note);
      if (imgPath) push("STEADFAST_IMG", imgPath);

      if (updates.length) {
        await connection.query(
          `
          INSERT INTO system_config
            (service, key_name, value, provider, is_active)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            value=VALUES(value),
            is_active=VALUES(is_active)
          `,
          [updates]
        );
      }
    }

    /* ---------------- SET DEFAULT ---------------- */
    if (setdefault === true) {

      const exists = await connection.queryOne(
        `
        SELECT is_active FROM system_config
        WHERE service='courier' AND provider=? LIMIT 1
        `,
        [provider]
      );

      if (!exists || exists.is_active == 0) {
        throw new errors.BAD_REQUEST(
          "Steadfast must be active before setting default"
        );
      }

      await connection.query(
        `
        INSERT INTO system_config
          (service, key_name, value, provider, is_active)
        VALUES ('courier','COURIER_DEFAULT_PROVIDER',?,NULL,1)
        ON DUPLICATE KEY UPDATE value=VALUES(value)
        `,
        [provider]
      );
    }

    clearCache();
    return { success: true };
  })
);


// ─── Generate Steadfast Webhook Bearer Token ──────────────────────────────────
// Steadfast webhook settings require a Bearer token we configure.
// This endpoint generates a long-lived JWT signed with our jwtSecret so
// the admin can paste it directly into Steadfast → Webhook → Auth Token (Bearer).
// The token is saved as STEADFAST_WEBHOOK_SECRET via the normal editSteadfastConfig endpoint.
exports.generateSteadfastWebhookToken = api(
  {},
  auth(async (_req, _connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const ApplicationSettings = require("../config/ApplicationSettings");
    const secret = ApplicationSettings.jwtSecret;

    if (!secret || secret === "fish") {
      console.warn("[generateSteadfastWebhookToken] Using default jwtSecret — set a strong JWTSECRET in .env");
    }

    // Sign a static token: no expiry claim — permanent until regenerated.
    const token = jwt.sign(
      { purpose: "steadfast_webhook" },
      secret
      // no expiresIn → no exp claim → never expires
    );

    return { success: true, token };
  })
);


exports.editRedxConfig = optionalUploadApi(
  "image",
  {
    body: {
      base_url: { type: "string", required: false },
      store_id: { type: "string", required: false },
      token: { type: "string", required: false },
      description: { type: "string", required: false },
      note: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      base_url,
      store_id,
      token,
      description,
      note,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "redx";

    /* ---------------- SET NULL ---------------- */
    if (setnull === true) {

      const isDefault = await connection.queryOne(
        `SELECT value FROM system_config WHERE key_name='COURIER_DEFAULT_PROVIDER'`
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST(
          "Cannot clear default courier provider"
        );
      }

      const oldImg = await connection.queryOne(
        `
        SELECT value FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name='REDX_IMG'
        `,
        [provider]
      );

      if (oldImg?.value) deleteFileIfExists(oldImg.value);

      await connection.query(
        `
        UPDATE system_config
        SET value=NULL, is_active=0
        WHERE service='courier' AND provider=?
        `,
        [provider]
      );

    } else {

      /* ---------------- LOAD EXISTING CORE CREDS ---------------- */
      const existingRows = await connection.query(
        `
        SELECT key_name, value
        FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name IN (
            'REDX_BASE_URL',
            'REDX_STORE_ID',
            'REDX_TOKEN'
          )
        `,
        [provider]
      );

      const existing = {};
      for (const r of existingRows) {
        existing[r.key_name] = r.value;
      }

      const nextBaseUrl = base_url ?? existing.REDX_BASE_URL;
      const nextStoreId = store_id ?? existing.REDX_STORE_ID;
      const nextToken = token ?? existing.REDX_TOKEN;

      const credsChanged =
        nextBaseUrl !== existing.REDX_BASE_URL ||
        nextStoreId !== existing.REDX_STORE_ID ||
        nextToken !== existing.REDX_TOKEN;

      /* ---------------- REQUIRED FIELD CHECK (ONLY IF CHANGING CREDS) ---------------- */
      if (credsChanged) {
        if (!nextBaseUrl || !nextStoreId || !nextToken) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            "Base URL, Store ID and Token are required"
          );
        }

        /* ✅ VERIFY ONLY WHEN CORE CREDS CHANGED */
        await verifyRedx({
          base_url: nextBaseUrl,
          store_id: nextStoreId,
          token: nextToken
        });
      }

      /* ---------------- IMAGE ---------------- */
      let imgPath;
      if (req.files?.image) {

        const oldImg = await connection.queryOne(
          `
          SELECT value FROM system_config
          WHERE service='courier'
            AND provider=?
            AND key_name='REDX_IMG'
          `,
          [provider]
        );

        if (oldImg?.value) deleteFileIfExists(oldImg.value);

        imgPath = await saveImage(
          req.files.image[0].path,
          "courier/redx"
        );
      }

      /* ---------------- UPSERT CONFIG ---------------- */
      const updates = [];
      const push = (k, v) => {
        if (v !== undefined) {
          updates.push([
            "courier",
            k,
            v,
            provider,
            status !== undefined ? status : 1
          ]);
        }
      };

      push("REDX_BASE_URL", nextBaseUrl);
      push("REDX_STORE_ID", nextStoreId);
      push("REDX_TOKEN", nextToken);
      push("REDX_DESC", description);
      push("REDX_NOTE", note);
      if (imgPath) push("REDX_IMG", imgPath);

      if (updates.length) {
        await connection.query(
          `
          INSERT INTO system_config
            (service, key_name, value, provider, is_active)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            value=VALUES(value),
            is_active=VALUES(is_active)
          `,
          [updates]
        );
      }
    }

    /* ---------------- SET DEFAULT ---------------- */
    if (setdefault === true) {

      const exists = await connection.queryOne(
        `
        SELECT is_active FROM system_config
        WHERE service='courier' AND provider=? LIMIT 1
        `,
        [provider]
      );

      if (!exists || exists.is_active == 0) {
        throw new errors.BAD_REQUEST(
          "RedX must be active before setting default"
        );
      }

      await connection.query(
        `
        INSERT INTO system_config
          (service, key_name, value, provider, is_active)
        VALUES ('courier','COURIER_DEFAULT_PROVIDER',?,NULL,1)
        ON DUPLICATE KEY UPDATE value=VALUES(value)
        `,
        [provider]
      );
    }

    clearCache();
    return { success: true };
  })
);



exports.editPathaoConfig = optionalUploadApi(
  "image",
  {
    body: {
      base_url: { type: "string", required: false },
      store_id: { type: "string", required: false },
      client_id: { type: "string", required: false },
      client_secret: { type: "string", required: false },
      email: { type: "string", required: false },
      password: { type: "string", required: false },
      webhook_secret: { type: "string", required: false },
      description: { type: "string", required: false },
      note: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      base_url,
      store_id,
      client_id,
      client_secret,
      email,
      password,
      webhook_secret,
      description,
      note,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "pathao";

    /* ---------------- SET NULL ---------------- */
    if (setnull === true) {

      const isDefault = await connection.queryOne(
        `SELECT value FROM system_config WHERE key_name='COURIER_DEFAULT_PROVIDER'`
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST(
          "Cannot clear default courier provider"
        );
      }

      const oldImg = await connection.queryOne(
        `
        SELECT value FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name='PATHAO_IMG'
        `,
        [provider]
      );

      if (oldImg?.value) deleteFileIfExists(oldImg.value);

      await connection.query(
        `
        UPDATE system_config
        SET value=NULL, is_active=0
        WHERE service='courier' AND provider=?
        `,
        [provider]
      );

    } else {

      /* ---------------- LOAD EXISTING CORE CREDS ---------------- */
      const existingRows = await connection.query(
        `
        SELECT key_name, value
        FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name IN (
            'PATHAO_BASE_URL',
            'PATHAO_STORE_ID',
            'PATHAO_CLIENT_ID',
            'PATHAO_CLIENT_SECRET',
            'PATHAO_EMAIL',
            'PATHAO_PASS'
          )
        `,
        [provider]
      );

      const existing = {};
      for (const r of existingRows) {
        existing[r.key_name] = r.value;
      }

      const nextBaseUrl = base_url ?? existing.PATHAO_BASE_URL;
      const nextStoreId = store_id ?? existing.PATHAO_STORE_ID;
      const nextClientId = client_id ?? existing.PATHAO_CLIENT_ID;
      const nextClientSecret = client_secret ?? existing.PATHAO_CLIENT_SECRET;
      const nextEmail = email ?? existing.PATHAO_EMAIL;
      const nextPassword = password ?? existing.PATHAO_PASS;

      const credsChanged =
        nextBaseUrl !== existing.PATHAO_BASE_URL ||
        nextStoreId !== existing.PATHAO_STORE_ID ||
        nextClientId !== existing.PATHAO_CLIENT_ID ||
        nextClientSecret !== existing.PATHAO_CLIENT_SECRET ||
        nextEmail !== existing.PATHAO_EMAIL ||
        nextPassword !== existing.PATHAO_PASS;

      /* ---------------- REQUIRED FIELD CHECK (ONLY IF CHANGING CREDS) ---------------- */
      if (credsChanged) {
        if (
          !nextBaseUrl ||
          !nextStoreId ||
          !nextClientId ||
          !nextClientSecret ||
          !nextEmail ||
          !nextPassword
        ) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            "Base URL, Store ID, Client ID, Client Secret, Email and Password are required"
          );
        }

        /* ✅ VERIFY ONLY WHEN CORE CREDS CHANGED */
        await verifyPathao({
          base_url: nextBaseUrl,
          client_id: nextClientId,
          client_secret: nextClientSecret,
          email: nextEmail,
          password: nextPassword
        });
      }

      /* ---------------- IMAGE ---------------- */
      let imgPath;
      if (req.files?.image) {

        const oldImg = await connection.queryOne(
          `
          SELECT value FROM system_config
          WHERE service='courier'
            AND provider=?
            AND key_name='PATHAO_IMG'
          `,
          [provider]
        );

        if (oldImg?.value) deleteFileIfExists(oldImg.value);

        imgPath = await saveImage(
          req.files.image[0].path,
          "courier/pathao"
        );
      }

      /* ---------------- UPSERT CONFIG ---------------- */
      const updates = [];
      const push = (k, v) => {
        if (v !== undefined) {
          updates.push([
            "courier",
            k,
            v,
            provider,
            status !== undefined ? status : 1
          ]);
        }
      };

      push("PATHAO_BASE_URL", nextBaseUrl);
      push("PATHAO_STORE_ID", nextStoreId);
      push("PATHAO_CLIENT_ID", nextClientId);
      push("PATHAO_CLIENT_SECRET", nextClientSecret);
      push("PATHAO_EMAIL", nextEmail);
      push("PATHAO_PASS", nextPassword);
      push("PATHAO_WEBHOOK_SECRET", webhook_secret);
      push("PATHAO_DESC", description);
      push("PATHAO_NOTE", note);
      if (imgPath) push("PATHAO_IMG", imgPath);

      if (updates.length) {
        await connection.query(
          `
          INSERT INTO system_config
            (service, key_name, value, provider, is_active)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            value=VALUES(value),
            is_active=VALUES(is_active)
          `,
          [updates]
        );
      }
    }

    /* ---------------- SET DEFAULT ---------------- */
    if (setdefault === true) {

      const exists = await connection.queryOne(
        `
        SELECT is_active FROM system_config
        WHERE service='courier' AND provider=? LIMIT 1
        `,
        [provider]
      );

      if (!exists || exists.is_active == 0) {
        throw new errors.BAD_REQUEST(
          "Pathao must be active before setting default"
        );
      }

      await connection.query(
        `
        INSERT INTO system_config
          (service, key_name, value, provider, is_active)
        VALUES ('courier','COURIER_DEFAULT_PROVIDER',?,NULL,1)
        ON DUPLICATE KEY UPDATE value=VALUES(value)
        `,
        [provider]
      );
    }

    clearCache();
    return { success: true };
  })
);


exports.editPaperflyConfig = optionalUploadApi(
  "image",
  {
    body: {
      base_url: { type: "string", required: false },
      api_key: { type: "string", required: false },
      user: { type: "string", required: false },
      password: { type: "string", required: false },
      description: { type: "string", required: false },
      note: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      base_url,
      api_key,
      user,
      password,
      description,
      note,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "paperfly";

    /* ---------------- SET NULL ---------------- */
    if (setnull === true) {
      const isDefault = await connection.queryOne(
        `SELECT value FROM system_config WHERE key_name='COURIER_DEFAULT_PROVIDER'`
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST(
          "Cannot clear default courier provider"
        );
      }

      const oldImg = await connection.queryOne(
        `
        SELECT value FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name='PAPERFLY_IMG'
        `,
        [provider]
      );

      if (oldImg?.value) deleteFileIfExists(oldImg.value);

      await connection.query(
        `
        UPDATE system_config
        SET value=NULL, is_active=0
        WHERE service='courier' AND provider=?
        `,
        [provider]
      );

    } else {

      /* ---------- REQUIRED FIELDS CHECK ---------- */
      const touched =
        base_url !== undefined ||
        api_key !== undefined ||
        user !== undefined ||
        password !== undefined;

      if (touched) {
        if (!base_url || !api_key || !user || !password) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            "Base URL, API Key, User and Password are required"
          );
        }

        /* ---------- VERIFY ---------- */
        await verifyPaperfly({ base_url, api_key, user, password });
      }

      /* ---------- IMAGE UPLOAD ---------- */
      let imgPath;
      if (req.files?.image) {
        const oldImg = await connection.queryOne(
          `
          SELECT value FROM system_config
          WHERE service='courier'
            AND provider=?
            AND key_name='PAPERFLY_IMG'
          `,
          [provider]
        );

        if (oldImg?.value) deleteFileIfExists(oldImg.value);

        imgPath = await saveImage(req.files.image[0].path, "courier/paperfly");
      }

      /* ---------- LOAD EXISTING VALUES FOR STATUS CHECK ---------- */
      // Load existing values to check if we have existing creds
      const existingRows = await connection.query(
        `
        SELECT key_name, value
        FROM system_config
        WHERE service='courier'
          AND provider=?
          AND key_name IN (
            'PAPERFLY_BASE_URL',
            'PAPERFLY_API_KEY',
            'PAPERFLY_USER',
            'PAPERFLY_PASS'
          )
        `,
        [provider]
      );

      const existing = {};
      for (const r of existingRows) {
        existing[r.key_name] = r.value;
      }

      // Use provided values or existing values
      const nextBaseUrl = base_url ?? existing.PAPERFLY_BASE_URL;
      const nextApiKey = api_key ?? existing.PAPERFLY_API_KEY;
      const nextUser = user ?? existing.PAPERFLY_USER;
      const nextPassword = password ?? existing.PAPERFLY_PASS;

      const credsChanged =
        nextBaseUrl !== existing.PAPERFLY_BASE_URL ||
        nextApiKey !== existing.PAPERFLY_API_KEY ||
        nextUser !== existing.PAPERFLY_USER ||
        nextPassword !== existing.PAPERFLY_PASS;

      // If status is not provided and we have existing creds, use existing status
      // Otherwise default to 1 (active)
      let finalStatus = 1; // Default active
      if (status !== undefined) {
        finalStatus = status ? 1 : 0;
      } else {
        // Check if we have any existing active config
        const activeCheck = await connection.queryOne(
          `SELECT is_active FROM system_config 
           WHERE service='courier' AND provider=? LIMIT 1`,
          [provider]
        );
        if (activeCheck) {
          finalStatus = activeCheck.is_active;
        }
      }

      /* ---------- UPSERT CONFIG ---------- */
      const updates = [];
      const push = (k, v) => {
        if (v !== undefined) {
          updates.push([
            "courier",
            k,
            v,
            provider,
            finalStatus
          ]);
        }
      };

      push("PAPERFLY_BASE_URL", nextBaseUrl);
      push("PAPERFLY_API_KEY", nextApiKey);
      push("PAPERFLY_USER", nextUser);
      push("PAPERFLY_PASS", nextPassword);
      push("PAPERFLY_DESC", description);
      push("PAPERFLY_NOTE", note);
      if (imgPath) push("PAPERFLY_IMG", imgPath);

      // Also update status for existing rows if status was explicitly provided
      if (status !== undefined && updates.length === 0) {
        // If only status is being updated, update all existing rows
        await connection.query(
          `
          UPDATE system_config
          SET is_active=?
          WHERE service='courier' AND provider=?
          `,
          [finalStatus, provider]
        );
      } else if (updates.length) {
        await connection.query(
          `
          INSERT INTO system_config
            (service, key_name, value, provider, is_active)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            value=VALUES(value),
            is_active=VALUES(is_active)
          `,
          [updates]
        );
      }
    }

    /* ---------------- SET DEFAULT ---------------- */
    if (setdefault === true) {
      const exists = await connection.queryOne(
        `
        SELECT is_active FROM system_config
        WHERE service='courier' AND provider=? LIMIT 1
        `,
        [provider]
      );

      if (!exists || exists.is_active == 0) {
        throw new errors.BAD_REQUEST(
          "Paperfly must be active before setting default"
        );
      }

      await connection.query(
        `
        INSERT INTO system_config
          (service, key_name, value, provider, is_active)
        VALUES ('courier','COURIER_DEFAULT_PROVIDER',?,NULL,1)
        ON DUPLICATE KEY UPDATE value=VALUES(value)
        `,
        [provider]
      );
    }

    clearCache();
    return { success: true };
  })
);




exports.setDefaultPayment = api(
  {
    body: {
      provider: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { provider } = req.typed.body;

    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    // List of allowed payment providers based on your configuration
    const allowedProviders = ['bkash', 'sslcommerz', 'nagad', 'shurjopay', 'rocket'];

    if (!allowedProviders.includes(provider)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment provider specified.");
    }

    // 1. Verify if this provider actually exists and is active in our config
    // Note: We check service = 'payment'
    const exists = await connection.queryOne(
      "SELECT is_active FROM system_config WHERE service = 'payment' AND provider = ? LIMIT 1",
      [provider]
    );

    if (!exists) {
      throw new errors.NOT_FOUND(`Payment provider ${provider} not found in system configuration.`);
    }

    if (exists.is_active == 0) {
      throw new errors.BAD_REQUEST(
        `Payment provider ${provider} is currently inactive. Please activate it before setting as default.`
      );
    }

    // 2. Update the default payment provider setting
    // We use INSERT ... ON DUPLICATE KEY UPDATE to ensure the key exists
    await connection.query(
      `INSERT INTO system_config (service, key_name, value, provider, is_active)
       VALUES ('payment', 'PAYMENT_DEFAULT_PROVIDER', ?, NULL, 1)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [provider]
    );

    // 3. Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'SET_DEFAULT_PAYMENT', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(req.typed.body)]
    );

    // 4. Clear cache
    clearCache();

    return {
      success: true,
      message: `Default payment provider updated to ${provider}`
    };
  })
);




exports.editBkashConfig = api(
  {
    body: {
      gateway_name: { type: "string", required: false },
      base_url: { type: "string", required: false },
      username: { type: "string", required: false },
      password: { type: "string", required: false },
      app_key: { type: "string", required: false },
      app_secret: { type: "string", required: false },
      type: { type: "string", required: false },
      note: { type: "string", required: false },
      env: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      gateway_name,
      base_url,
      username,
      password,
      app_key,
      app_secret,
      type,
      note,
      env,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "bkash";

    /* ---------------- RESET CONFIG ---------------- */
    if (setnull === true) {
      const isDefault = await connection.queryOne(
        "SELECT value FROM system_config WHERE key_name='PAYMENT_DEFAULT_PROVIDER'"
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST("Cannot clear default payment provider");
      }

      await connection.query(
        "UPDATE system_config SET value=NULL, is_active=0 WHERE service='payment' AND provider=?",
        [provider]
      );

      clearCache();
      return { success: true };
    }

    /* ---------------- VALIDATIONS ---------------- */
    if (env && !["sandbox", "production"].includes(env)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid env");
    }

    if (type && !["mobile_banking", "payment_gateway"].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid type");
    }

    /* ---------------- VERIFY CREDS (ONLY IF ANY PROVIDED) ---------------- */
    const creds = [base_url, username, password, app_key, app_secret];
    if (creds.some(Boolean)) {
      if (!creds.every(Boolean)) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "base_url, username, password, app_key, app_secret are required"
        );
      }

      await verifyBkash({ base_url, username, password, app_key, app_secret });
    }

    /* ---------------- UPDATE PROVIDED KEYS ONLY ---------------- */
    const updates = [];
    const push = (key, value) => {
      if (value !== undefined) {
        updates.push([
          "payment",
          key,
          value,
          provider,
          1
        ]);
      }
    };

    push("BKASH_GATEWAY_NAME", gateway_name);
    push("BKASH_BASE_URL", base_url);
    push("BKASH_USERNAME", username);
    push("BKASH_PASSWORD", password);
    push("BKASH_APP_KEY", app_key);
    push("BKASH_APP_SECRET", app_secret);
    push("BKASH_TYPE", type);
    push("BKASH_ENV", env);
    push("BKASH_NOTE", note);

    if (updates.length) {
      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ?
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [updates]
      );
    }

    /* ---------------- APPLY STATUS GLOBALLY ---------------- */
    if (status !== undefined) {
      await connection.query(
        "UPDATE system_config SET is_active=? WHERE service='payment' AND provider=?",
        [status ? 1 : 0, provider]
      );
    }

    /* ---------------- SET DEFAULT PROVIDER ---------------- */
    if (setdefault === true) {
      const active = await connection.queryOne(
        "SELECT 1 FROM system_config WHERE service='payment' AND provider=? AND is_active=1 LIMIT 1",
        [provider]
      );

      if (!active) {
        throw new errors.BAD_REQUEST("bKash must be active before setting default");
      }

      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ('payment','PAYMENT_DEFAULT_PROVIDER',?,NULL,1)
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [provider]
      );
    }

       // 3. Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'EDIT_PAYMEN_METHODT', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(req.typed.body)]
    );

    clearCache();
    return { success: true };
  })
);




// exports.editSslConfig = api(
//   {
//     body: {
//       gateway_name: { type: "string", required: false },
//       store_id: { type: "string", required: false },
//       store_password: { type: "string", required: false },
//       base_url: { type: "string", required: false },
//       success_url: { type: "string", required: false },
//       fail_url: { type: "string", required: false },
//       cancel_url: { type: "string", required: false },
//       type: { type: "string", required: false },
//       note: { type: "string", required: false },
//       env: { type: "string", required: false },
//       status: { type: "bool", required: false },
//       setnull: { type: "bool", required: false },
//       setdefault: { type: "bool", required: false }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     if (!adminInfo.roles.includes("SUPER_ADMIN")) {
//       throw new errors.UNAUTHORIZED();
//     }

//     const {
//       gateway_name,
//       store_id,
//       store_password,
//       base_url,
//       success_url,
//       fail_url,
//       cancel_url,
//       type,
//       note,
//       env,
//       status,
//       setnull,
//       setdefault
//     } = req.typed.body;

//     const provider = "sslcommerz";

//     /* ---------------- RESET CONFIG ---------------- */
//     if (setnull === true) {
//       const isDefault = await connection.queryOne(
//         "SELECT value FROM system_config WHERE key_name='PAYMENT_DEFAULT_PROVIDER'"
//       );

//       if (isDefault?.value === provider) {
//         throw new errors.BAD_REQUEST("Cannot clear default payment provider");
//       }

//       await connection.query(
//         "UPDATE system_config SET value=NULL, is_active=0 WHERE service='payment' AND provider=?",
//         [provider]
//       );

//       clearCache();
//       return { success: true };
//     }

//     /* ---------------- VALIDATIONS ---------------- */
//     if (env && !["sandbox", "production"].includes(env)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid env");
//     }

//     if (type && !["mobile_banking", "payment_gateway"].includes(type)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid type");
//     }

//     /* ---------------- VERIFY CREDS (ONLY IF ANY PROVIDED) ---------------- */
//     const creds = [store_id, store_password, base_url];
//     if (creds.some(Boolean)) {
//       if (!creds.every(Boolean)) {
//         throw new errors.INVALID_FIELDS_PROVIDED(
//           "store_id, store_password, and base_url are required"
//         );
//       }

//       await verifySSLCommerz({ store_id, store_password, base_url });
//     }

//     /* ---------------- UPDATE PROVIDED KEYS ONLY ---------------- */
//     const updates = [];
//     const push = (key, value) => {
//       if (value !== undefined) {
//         updates.push([
//           "payment",
//           key,
//           value,
//           provider,
//           1 // is_active default for individual keys
//         ]);
//       }
//     };

//     push("SSL_GATEWAY_NAME", gateway_name);
//     push("SSL_STORE_ID", store_id);
//     push("SSL_STORE_PASS", store_password);
//     push("SSL_BASE_URL", base_url);
//     push("SSL_SUCCESS_URL", success_url);
//     push("SSL_FAIL_URL", fail_url);
//     push("SSL_CANCEL_URL", cancel_url);
//     push("SSL_TYPE", type);
//     push("SSL_ENV", env);
//     push("SSL_NOTE", note);

//     if (updates.length) {
//       await connection.query(
//         `INSERT INTO system_config (service, key_name, value, provider, is_active)
//          VALUES ?
//          ON DUPLICATE KEY UPDATE value=VALUES(value)`,
//         [updates]
//       );
//     }

//     /* ---------------- APPLY STATUS GLOBALLY ---------------- */
//     if (status !== undefined) {
//       await connection.query(
//         "UPDATE system_config SET is_active=? WHERE service='payment' AND provider=?",
//         [status ? 1 : 0, provider]
//       );
//     }

//     /* ---------------- SET DEFAULT PROVIDER ---------------- */
//     if (setdefault === true) {
//       const active = await connection.queryOne(
//         "SELECT 1 FROM system_config WHERE service='payment' AND provider=? AND is_active=1 LIMIT 1",
//         [provider]
//       );

//       if (!active) {
//         throw new errors.BAD_REQUEST("SSLCommerz must be active before setting default");
//       }

//       await connection.query(
//         `INSERT INTO system_config (service, key_name, value, provider, is_active)
//          VALUES ('payment','PAYMENT_DEFAULT_PROVIDER',?,NULL,1)
//          ON DUPLICATE KEY UPDATE value=VALUES(value)`,
//         [provider]
//       );
//     }
//       // 3. Audit Logging
//     await connection.query(
//       `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
//        VALUES (?, 'EDIT_PAYMEN_METHODT', 'system_config', ?, ?)`,
//       [adminInfo.id, provider, JSON.stringify(req.typed.body)]
//     );

//     clearCache();
//     return { success: true };
//   })
// );

exports.editSslConfig = api(
  {
    body: {
      gateway_name: { type: "string", required: false },
      store_id: { type: "string", required: false },
      store_password: { type: "string", required: false },
      base_url: { type: "string", required: false },
      success_url: { type: "string", required: false },
      fail_url: { type: "string", required: false },
      cancel_url: { type: "string", required: false },
      ipn_url: { type: "string", required: false },
      type: { type: "string", required: false },
      note: { type: "string", required: false },
      env: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const b = req.typed.body;
    const provider = "sslcommerz";

    /* ---------------- 1. FETCH CURRENT CONFIG ---------------- */
    const existingRows = await connection.query(
      "SELECT key_name, value FROM system_config WHERE service='payment' AND provider=?",
      [provider]
    );
    const dbConfig = {};
    existingRows.forEach(row => dbConfig[row.key_name] = row.value);

    /* ---------------- RESET CONFIG ---------------- */
    if (b.setnull === true) {
      const isDefault = await connection.queryOne(
        "SELECT value FROM system_config WHERE key_name='PAYMENT_DEFAULT_PROVIDER'"
      );
      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST("Cannot clear default payment provider");
      }
      await connection.query(
        "UPDATE system_config SET value=NULL, is_active=0 WHERE service='payment' AND provider=?",
        [provider]
      );
      clearCache();
      return { success: true };
    }


  /* ---------------- VALIDATIONS ---------------- */
    if (b.env && !["sandbox", "production"].includes(b.env)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid env");
    }

    if (b.type && !["mobile_banking", "payment_gateway"].includes(b.type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid type");
    }


  const creds = [b.store_id, b.store_password, b.base_url, b.success_url, b.fail_url, b.cancel_url ,b.ipn_url];
    if (creds.some(Boolean)) {
      if (!creds.every(Boolean)) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "store_id, store_password, base_url, success_url, fail_url, cancel_url, and ipn_url all are required"
        );
      }

   
    }



    /* ---------------- 2. MERGE & CORE VALIDATION ---------------- */
    const finalCreds = {
      store_id: b.store_id ?? dbConfig.SSL_STORE_ID,
      store_password: b.store_password ?? dbConfig.SSL_STORE_PASS,
      base_url: b.base_url ?? dbConfig.SSL_BASE_URL,
      success_url: b.success_url ?? dbConfig.SSL_SUCCESS_URL,
      fail_url: b.fail_url ?? dbConfig.SSL_FAIL_URL,
      cancel_url: b.cancel_url ?? dbConfig.SSL_CANCEL_URL,
      ipn_url: b.ipn_url ?? dbConfig.SSL_IPN_URL
    };

    // All 6 fields are now defined as Core Credentials
    const coreKeys = ["store_id", "store_password", "base_url", "success_url", "fail_url", "cancel_url", "ipn_url"];
    const isAnyCoreInBody = coreKeys.some(key => b[key] !== undefined);
    const isEnabling = b.status === true;

    if (isAnyCoreInBody || isEnabling) {
      // Check if any of the 6 core fields are missing from the merged set
      const missingKeys = coreKeys.filter(key => !finalCreds[key]);
      
      if (missingKeys.length > 0) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Missing core credentials: ${missingKeys.join(", ")}. All 6 fields are required to configure or enable SSLCommerz.`
        );
      }

      // If updating any core credential, run the SSLCommerz API verification
      if (isAnyCoreInBody) {
        await verifySSLCommerz(finalCreds);
      }
    }

    /* ---------------- 3. UPDATE DATABASE ---------------- */
    const updates = [];
    const push = (key, value) => {
      if (value !== undefined) updates.push(["payment", key, value, provider, 1]);
    };

    push("SSL_GATEWAY_NAME", b.gateway_name);
    push("SSL_STORE_ID", b.store_id);
    push("SSL_STORE_PASS", b.store_password);
    push("SSL_BASE_URL", b.base_url);
    push("SSL_SUCCESS_URL", b.success_url);
    push("SSL_FAIL_URL", b.fail_url);
    push("SSL_CANCEL_URL", b.cancel_url);
    push("SSL_IPN_URL", b.ipn_url);
    push("SSL_TYPE", b.type);
    push("SSL_ENV", b.env);
    push("SSL_NOTE", b.note);

    if (updates.length) {
      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ?
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [updates]
      );
    }

    /* ---------------- STATUS & DEFAULT ---------------- */
    if (b.status !== undefined) {
      await connection.query(
        "UPDATE system_config SET is_active=? WHERE service='payment' AND provider=?",
        [b.status ? 1 : 0, provider]
      );
    }

    if (b.setdefault === true) {
      const active = await connection.queryOne(
        "SELECT 1 FROM system_config WHERE service='payment' AND provider=? AND is_active=1 LIMIT 1",
        [provider]
      );
      if (!active) throw new errors.BAD_REQUEST("SSLCommerz must be active before setting default");

      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ('payment','PAYMENT_DEFAULT_PROVIDER',?,NULL,1)
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [provider]
      );
    }

    // Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'EDIT_PAYMENT_METHOD', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(b)]
    );

    clearCache();
    return { success: true };
  })
);


exports.editShurjoPayConfig = api(
  {
    body: {
      gateway_name: { type: "string", required: false },
      username: { type: "string", required: false },
      password: { type: "string", required: false },
      prefix: { type: "string", required: false },
      base_url: { type: "string", required: false },
      type: { type: "string", required: false },
      note: { type: "string", required: false },
      env: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      gateway_name,
      username,
      password,
      prefix,
      base_url,
      type,
      note,
      env,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "shurjopay";

    /* ---------------- RESET CONFIG ---------------- */
    if (setnull === true) {
      const isDefault = await connection.queryOne(
        "SELECT value FROM system_config WHERE key_name='PAYMENT_DEFAULT_PROVIDER'"
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST("Cannot clear default payment provider");
      }

      await connection.query(
        "UPDATE system_config SET value=NULL, is_active=0 WHERE service='payment' AND provider=?",
        [provider]
      );

      clearCache();
      return { success: true };
    }

    /* ---------------- VALIDATIONS ---------------- */
    if (env && !["sandbox", "production"].includes(env)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid env");
    }

    if (type && !["mobile_banking", "payment_gateway"].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid type");
    }

    /* ---------------- VERIFY CREDS (ONLY IF ANY PROVIDED) ---------------- */
    const creds = [username, password, base_url];
    if (creds.some(Boolean)) {
      if (!creds.every(Boolean)) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "username, password, and base_url are required"
        );
      }

      await verifyShurjoPay({ username, password, base_url });
    }

    /* ---------------- UPDATE PROVIDED KEYS ONLY ---------------- */
    const updates = [];
    const push = (key, value) => {
      if (value !== undefined) {
        updates.push([
          "payment",
          key,
          value,
          provider,
          1
        ]);
      }
    };

    push("SHURJOPAY_GATEWAY_NAME", gateway_name);
    push("SHURJOPAY_USERNAME", username);
    push("SHURJOPAY_PASSWORD", password);
    push("SHURJOPAY_PREFIX", prefix);
    push("SHURJOPAY_BASE_URL", base_url);
    push("SHURJOPAY_TYPE", type);
    push("SHURJOPAY_ENV", env);
    push("SHURJOPAY_NOTE", note);

    if (updates.length) {
      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ?
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [updates]
      );
    }

    /* ---------------- APPLY STATUS GLOBALLY ---------------- */
    if (status !== undefined) {
      await connection.query(
        "UPDATE system_config SET is_active=? WHERE service='payment' AND provider=?",
        [status ? 1 : 0, provider]
      );
    }

    /* ---------------- SET DEFAULT PROVIDER ---------------- */
    if (setdefault === true) {
      const active = await connection.queryOne(
        "SELECT 1 FROM system_config WHERE service='payment' AND provider=? AND is_active=1 LIMIT 1",
        [provider]
      );

      if (!active) {
        throw new errors.BAD_REQUEST("shurjoPay must be active before setting default");
      }

      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ('payment','PAYMENT_DEFAULT_PROVIDER',?,NULL,1)
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [provider]
      );
    }
      // 3. Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'EDIT_PAYMEN_METHODT', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(req.typed.body)]
    );

    clearCache();
    return { success: true };
  })
);

exports.editNagadConfig = api(
  {
    body: {
      gateway_name: { type: "string", required: false },
      merchant_id: { type: "string", required: false },
      base_url: { type: "string", required: false },
      public_key: { type: "string", required: false }, // Nagad's Public Key
      private_key: { type: "string", required: false }, // Your Private Key
      type: { type: "string", required: false },
      note: { type: "string", required: false },
      env: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      gateway_name,
      merchant_id,
      base_url,
      public_key,
      private_key,
      type,
      note,
      env,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "nagad";

    /* ---------------- RESET CONFIG ---------------- */
    if (setnull === true) {
      const isDefault = await connection.queryOne(
        "SELECT value FROM system_config WHERE key_name='PAYMENT_DEFAULT_PROVIDER'"
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST("Cannot clear default payment provider");
      }

      await connection.query(
        "UPDATE system_config SET value=NULL, is_active=0 WHERE service='payment' AND provider=?",
        [provider]
      );

      clearCache();
      return { success: true };
    }

    /* ---------------- VALIDATIONS ---------------- */
    if (env && !["sandbox", "production"].includes(env)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid env");
    }

    if (type && !["mobile_banking", "payment_gateway"].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid type");
    }

    /* ---------------- VERIFY CREDS (ONLY IF ANY PROVIDED) ---------------- */
    const creds = [merchant_id, base_url, public_key, private_key];
    if (creds.some(Boolean)) {
      if (!creds.every(Boolean)) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "merchant_id, base_url, public_key, and private_key are required"
        );
      }

      // Nagad verification checks if keys are valid and can handshake
      await verifyNagad({ merchant_id, base_url, public_key, private_key });
    }

    /* ---------------- UPDATE PROVIDED KEYS ONLY ---------------- */
    const updates = [];
    const push = (key, value) => {
      if (value !== undefined) {
        updates.push(["payment", key, value, provider, 1]);
      }
    };

    push("NAGAD_GATEWAY_NAME", gateway_name);
    push("NAGAD_MERCHANT_ID", merchant_id);
    push("NAGAD_BASE_URL", base_url);
    push("NAGAD_PUB_KEY", public_key);
    push("NAGAD_PRIV_KEY", private_key);
    push("NAGAD_TYPE", type);
    push("NAGAD_ENV", env);
    push("NAGAD_NOTE", note);

    if (updates.length) {
      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ?
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [updates]
      );
    }

    /* ---------------- APPLY STATUS GLOBALLY ---------------- */
    if (status !== undefined) {
      await connection.query(
        "UPDATE system_config SET is_active=? WHERE service='payment' AND provider=?",
        [status ? 1 : 0, provider]
      );
    }

    /* ---------------- SET DEFAULT PROVIDER ---------------- */
    if (setdefault === true) {
      const active = await connection.queryOne(
        "SELECT 1 FROM system_config WHERE service='payment' AND provider=? AND is_active=1 LIMIT 1",
        [provider]
      );

      if (!active) {
        throw new errors.BAD_REQUEST("Nagad must be active before setting default");
      }

      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ('payment','PAYMENT_DEFAULT_PROVIDER',?,NULL,1)
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [provider]
      );
    }
      // 3. Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'EDIT_PAYMEN_METHODT', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(req.typed.body)]
    );

    clearCache();
    return { success: true };
  })
);

exports.editRocketConfig = api(
  {
    body: {
      gateway_name: { type: "string", required: false },
      rocket_acc_no: { type: "string", required: false },
      rocket_acc_name: { type: "string", required: false },
      rocket_bank_name: { type: "string", required: false },
      type: { type: "string", required: false },
      note: { type: "string", required: false },
      env: { type: "string", required: false },
      status: { type: "bool", required: false },
      setnull: { type: "bool", required: false },
      setdefault: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const {
      gateway_name,
      rocket_acc_no,
      rocket_acc_name,
      rocket_bank_name,
      type,
      note,
      env,
      status,
      setnull,
      setdefault
    } = req.typed.body;

    const provider = "rocket";

    /* ---------------- RESET CONFIG ---------------- */
    if (setnull === true) {
      const isDefault = await connection.queryOne(
        "SELECT value FROM system_config WHERE key_name='PAYMENT_DEFAULT_PROVIDER'"
      );

      if (isDefault?.value === provider) {
        throw new errors.BAD_REQUEST("Cannot clear default payment provider");
      }

      await connection.query(
        "UPDATE system_config SET value=NULL, is_active=0 WHERE service='payment' AND provider=?",
        [provider]
      );

      clearCache();
      return { success: true };
    }

    /* ---------------- VALIDATIONS ---------------- */
    if (env && !["sandbox", "production"].includes(env)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid env");
    }

    if (type && !["mobile_banking", "payment_gateway"].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid type");
    }

    /* ---------------- UPDATE PROVIDED KEYS ONLY ---------------- */
    const updates = [];
    const push = (key, value) => {
      if (value !== undefined) {
        updates.push([
          "payment",
          key,
          value,
          provider,
          1
        ]);
      }
    };

    push("ROCKET_GATEWAY_NAME", gateway_name);
    push("ROCKET_ACC_NO", rocket_acc_no);
    push("ROCKET_ACC_NAME", rocket_acc_name);
    push("ROCKET_BANK_NAME", rocket_bank_name);
    push("ROCKET_TYPE", type);
    push("ROCKET_ENV", env);
    push("ROCKET_NOTE", note);

    if (updates.length) {
      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ?
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [updates]
      );
    }

    /* ---------------- APPLY STATUS GLOBALLY ---------------- */
    if (status !== undefined) {
      await connection.query(
        "UPDATE system_config SET is_active=? WHERE service='payment' AND provider=?",
        [status ? 1 : 0, provider]
      );
    }

    /* ---------------- SET DEFAULT PROVIDER ---------------- */
    if (setdefault === true) {
      const active = await connection.queryOne(
        "SELECT 1 FROM system_config WHERE service='payment' AND provider=? AND is_active=1 LIMIT 1",
        [provider]
      );

      if (!active) {
        throw new errors.BAD_REQUEST("Rocket must be active before setting default");
      }

      await connection.query(
        `INSERT INTO system_config (service, key_name, value, provider, is_active)
         VALUES ('payment','PAYMENT_DEFAULT_PROVIDER',?,NULL,1)
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [provider]
      );
    }

      // 3. Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'EDIT_PAYMEN_METHODT', 'system_config', ?, ?)`,
      [adminInfo.id, provider, JSON.stringify(req.typed.body)]
    );


    clearCache();
    return { success: true };
  })
);

exports.editCodMeta = api(
  {
    body: {
      title: { type: "string", required: false },
      status: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    // ---------- 1️⃣ Authorization ----------
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { status, title } = req.typed.body;
    const provider = "cod";

    // ❗ FIXED: must check undefined, not falsy
    if (status === undefined && title === undefined) {
      throw new errors.NO_FIELDS_PROVIDED();
    }

    // ---------- 2️⃣ Update COD config safely ----------
    await connection.query(
      `
      UPDATE system_config
      SET
        is_active = COALESCE(?, is_active),
        value     = COALESCE(?, value)
      WHERE service = 'payment'
        AND provider = ?
        AND key_name = ?
      `,
      [
        typeof status === "boolean" ? (status ? 1 : 0) : null,
        title ?? null,
        provider,
        "CASH_ON_DELIVERY"
      ]
    );

    // ---------- 3️⃣ Audit Log ----------
    await connection.query(
      `
      INSERT INTO admin_audit_logs 
        (admin_id, action, resource, resource_id, meta)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        adminInfo.id,
        "UPDATE_COD_META",
        "system_config",
        provider,
        JSON.stringify({
          status_updated: status !== undefined,
          title_updated: title !== undefined,
          new_status: status,
          new_title: title
        })
      ]
    );

    // ---------- 4️⃣ Clear cache ----------
    clearCache();

    // ---------- 5️⃣ Response ----------
    return {
      success: true,
      message:
        status !== undefined
          ? `COD has been ${status ? "activated" : "deactivated"}`
          : "COD configuration updated"
    };
  })
);



// exports.getCodAdvancePayment = api(
//   {},
//   auth(async (req, connection,adminInfo) => {


//         if (!adminInfo.roles.includes("SUPER_ADMIN")) {
//       throw new errors.UNAUTHORIZED();
//     }
//     // Fetch POD configs only
//     const rows = await getConfig(connection, false, "payment");

//     let status = false;
//     let amount = 0;

//     for (const row of rows) {
//       if (row.provider !== "cod") continue;

//       // provider active check
//       status = Boolean(row.is_active);

//       if (row.key_name === "MIN_ADVANCE_PAYMENT_PERCENTAGE") {
//         amount = Number(row.value) || 0;
//       }
//     }

 

//     return {
//       status,
//       amount,
//       note: "It's in percentage"
//     };
//   })
// );


 
// exports.editCodAdvancePayment = api(
//   {
//     body: {
//       status: { type: "bool", required: false },
//       amount: { type: "int", required: false }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     if (!adminInfo.roles.includes("SUPER_ADMIN")) {
//       throw new errors.UNAUTHORIZED();
//     }

//     const { status, amount } = req.typed.body;

//     // Fix: Check specifically for undefined to allow 'false' or '0'
//     if (status === undefined && amount === undefined) {
//       throw new errors.NO_FIELDS_PROVIDED();
//     }

//     if (amount !== undefined && (amount < 0 || amount > 100)) {
//       throw new errors.BAD_REQUEST("Advance payment percentage must be between 0 and 100");
//     }

//     // Fetch existing data to handle partial updates
//     const currentConfig = await connection.queryOne(
//       `
//       SELECT is_active, value FROM system_config
//       WHERE service = 'payment'
//         AND provider = 'cod'
//         AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
//       `
//     );

//     if (!currentConfig) {
//       throw new errors.SERVICE_UNAVAILABLE("Advance payment service is currently unavailable");
//     }

    

//     const finalStatus = status !== undefined ? (status ? 1 : 0) : currentConfig.is_active;
// const finalAmount = amount !== undefined ? Number(amount) : Number(currentConfig.value);


//     await connection.query(
//       `
//       UPDATE system_config
//       SET is_active = ?, value = ?
//       WHERE service = 'payment' 
//         AND provider = 'cod' 
//         AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
//       `,
//       [finalStatus, finalAmount]
//     );

//     // Audit Logging
//     await connection.query(
//       `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
//        VALUES (?, 'EDIT_COD_ADVANCE_PAYMENT', 'system_config', ?, ?)`,
//       [adminInfo.id, 'cod', JSON.stringify({ status: finalStatus, amount: finalAmount })]
//     );
//  clearCache();
//     return {
//       success: true,
//       message: "cod advance payment updated successfully",
//       status: finalStatus==1?true:false,
//       amount:   Number(finalAmount) || 0
//     };
//   })
// );

 
exports.getCodAdvancePayment = api(
  {},
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    // 🔴 NEW: Check if COD is active
    const codActive = await connection.query(
      `
      SELECT key_name
      FROM system_config
      WHERE service = 'payment'
        AND provider = 'cod'
        AND is_active = 1  
     
      `
    );

  
const values = codActive.map(row => row.key_name);

if(!values.includes("CASH_ON_DELIVERY"))  throw new errors.BAD_REQUEST("COD payment method is currently inactive");

// return { x };

 
    const advanceCfg = await connection.queryOne(
      `
      SELECT is_active, value
      FROM system_config
      WHERE service = 'payment'
        AND provider = 'cod'
        AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
      LIMIT 1
      `
    );

    if (!advanceCfg) {
      throw new errors.NOT_FOUND("Advance payment configuration not found");
    }

    return {
      status: Number(advanceCfg.is_active) === 1,
      amount: Number(advanceCfg.value) || 0,
      note: "It's in percentage"
    };
  })
);


exports.editCodAdvancePayment = api(
  {
    body: {
      status: { type: "bool", required: false },
      amount: { type: "int", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    // ---- Authorization ----
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { status, amount } = req.typed.body;

    // ---- Validation ----
    if (status === undefined && amount === undefined) {
      throw new errors.NO_FIELDS_PROVIDED();
    }

    if (amount !== undefined && (amount < 0 || amount > 100)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Advance payment percentage must be between 0 and 100"
      );
    }

    // ---- Check COD availability ----
    const activeKeys = (
      await connection.query(
        `
        SELECT key_name
        FROM system_config
        WHERE service = 'payment'
          AND provider = 'cod'
          AND is_active = 1
        `
      )
    ).map(({ key_name }) => key_name);

    if (!activeKeys.includes("CASH_ON_DELIVERY")) {
      throw new errors.BAD_REQUEST("COD payment method is currently inactive");
    }

    // ---- Fetch current config (single row) ----
    const currentConfig = await connection.queryOne(
      `
      SELECT is_active, value
      FROM system_config
      WHERE service = 'payment'
        AND provider = 'cod'
        AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
      `
    );

    if (!currentConfig) {
      throw new errors.NOT_FOUND("Advance payment configuration not found");
    }

    // ---- Final values ----
    const finalStatus =
      status !== undefined ? Number(status) : currentConfig.is_active;

    const finalAmount =
      amount !== undefined ? Number(amount) : Number(currentConfig.value);

    // ---- Update ----
    const updateResult = await connection.query(
      `
      UPDATE system_config
      SET is_active = ?, value = ?
      WHERE service = 'payment'
        AND provider = 'cod'
        AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
      `,
      [finalStatus, finalAmount]
    );

    if (updateResult.affectedRows === 0) {
      throw new errors.NOT_FOUND("Advance payment configuration not found");
    }

    const updatedConfig = await connection.queryOne(
      `
      SELECT is_active, value
      FROM system_config
      WHERE service = 'payment'
        AND provider = 'cod'
        AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
      LIMIT 1
      `
    );

    // ---- Audit log ----
    await connection.query(
      `
      INSERT INTO admin_audit_logs
        (admin_id, action, resource, resource_id, meta)
      VALUES
        (?, 'EDIT_COD_ADVANCE_PAYMENT', 'system_config', ?, ?)
      `,
      [
        adminInfo.id,
        'cod',
        JSON.stringify({ status: !!finalStatus, amount: finalAmount })
      ]
    );

    clearCache();

    return {
      success: true,
      message: "COD advance payment updated successfully",
      status: Number(updatedConfig?.is_active) === 1,
      amount: Number(updatedConfig?.value) || 0
    };
  })
);


// // Get Page Views Count
// exports.getPageViews = api(
//   {
//     query: {
//       page_name: { type: "string", required: true },
//       date: { type: "string", required: false }
//     }
//   },
//   async (req, connection) => {
//     const { page_name, date } = req.typed.query;

//     const where = ["page_name = ?"];
//     const params = [page_name.toLowerCase()];

//     if (date) {
//       where.push("view_date = ?");
//       params.push(date);
//     }

//     const [{ total }] = await connection.query(
//       `
//       SELECT COUNT(*) as total
//       FROM page_view_logs
//       WHERE ${where.join(" AND ")}
//       `,
//       params
//     );

//     return {
//       success: true,
//       page_name,
//       total
//     };
//   }
// );

// Get Page Views Count
// exports.getAllActivePaymentprovider = api(
//   {
//     query: {
//       is_active: { type: "bool", required: false }
//     }
//   },
//   async (req, connection) => {

//     const rows = await getConfig(connection, false, "payment");

//     let defaultProvider = null;
//     const providersMap = new Map();

//     for (const row of rows) {
//       const provider = row.provider || "default";

//       /** Capture default provider */
//       if (provider === "default" && row.key_name === "PAYMENT_DEFAULT_PROVIDER") {
//         defaultProvider = row.value;
//         continue;
//       }

//       /** Initialize provider ONCE */
//       if (!providersMap.has(provider)) {
//         providersMap.set(provider, {
//           provider,
//           is_active: Boolean(row.is_active)
//         });
//       } else {
//         /** If any row is active → provider active */
//         const existing = providersMap.get(provider);
//         existing.is_active = existing.is_active || Boolean(row.is_active);
//       }
//     }

//     /** Apply filter AFTER aggregation */
//     let providers = Array.from(providersMap.values());

//     if (req.typed.query.is_active !== undefined) {
//       providers = providers.filter(
//         p => p.is_active === req.typed.query.is_active
//       );
//     }

//     // /** 🔥 Hardcode removal of cod */
//     // providers = providers.filter(p => p.provider !== "cod");

//     return {
//       default_provider: defaultProvider,
//       providers
//     };
//   }
// );

// Get Page Views Count
exports.getAllActivePaymentprovider = api(
  {
    query: {
      is_active: { type: "bool", required: false }
    }
  },
  async (req, connection) => {

    const rows = await getConfig(connection, false, "payment");

    let defaultProvider = null;
    const providersMap = new Map();

    for (const row of rows) {
      const provider = row.provider || "default";

      /** Capture default provider */
      if (provider === "default" && row.key_name === "PAYMENT_DEFAULT_PROVIDER") {
        defaultProvider = row.value;
        continue;
      }

      /** Initialize provider ONCE */
      if (!providersMap.has(provider)) {
        providersMap.set(provider, {
          provider,
          is_active: Boolean(row.is_active),
          gateway_name: "" // Initialize empty gateway name
        });
      } else {
        /** If any row is active → provider active */
        const existing = providersMap.get(provider);
        existing.is_active = existing.is_active || Boolean(row.is_active);
      }

      /** Extract gateway name from config keys */
      const currentProvider = providersMap.get(provider);
      if (row.key_name && row.value) {
        // Check for gateway name keys based on your data structure
        if (row.key_name.includes("GATEWAY_NAME")) {
          currentProvider.gateway_name = row.value;
        }
        
        // Special handling for COD since it doesn't follow the same pattern
        if (provider === "cod" && row.key_name === "CASH_ON_DELIVERY") {
          currentProvider.gateway_name = row.value;
        }
      }
    }

    /** Apply filter AFTER aggregation */
    let providers = Array.from(providersMap.values());

    if (req.typed.query.is_active !== undefined) {
      providers = providers.filter(
        p => p.is_active === req.typed.query.is_active
      );
    }

    // Ensure COD always has "cod" as gateway name if not set from config
    providers = providers.map(p => {
      if (p.provider === "cod" && !p.gateway_name) {
        return {
          ...p,
          gateway_name: "cod"
        };
      }
      return p;
    });

    return {
      default_provider: defaultProvider,
      providers
    };
  }
);

// exports.getStockAlertLimit = api(
//   {},
//   auth(async (req, connection, adminInfo) => {
//     // Allow ADMIN and CATALOG_MANAGER to view stock settings
//     const ALLOWED_ROLES = ["SUPER_ADMIN",  "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     // Fetch product configs
//     const rows = await getConfig(connection, false, "product");

//     let stockAlertLimit = 0;
//     let isActive = true; // Default to active if not specified
 
//     for (const row of rows) {
     
//       if (row.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT") {
//         stockAlertLimit = Number(row.value) || 0;
//         console.log("============",row.value);
//         isActive = Boolean(row.is_active);
//       }
//     }

//     return {
//       stock_alert_limit: stockAlertLimit,
//       is_active: isActive,
//       note: "System will alert when product stock reaches below this limit"
//     };
//   })
// );



exports.getStockAlertLimit = api(
  {},
  auth(async (req, connection, adminInfo) => {
    // Only Super Admins or Admins can view system configs
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    // Fetch product service configs
    const rows = await getConfig(connection, false, "product");

    let status = false;
    let limit = 0;

    for (const row of rows) {
      // if (row.provider !== "default") continue;

      if (row.key_name === "PRODUCT_STOCK_ALERT_MIN_COUNT") {
        status = Boolean(row.is_active);
        limit = Number(row.value) || 0;
      }
    }

    return {
      success: true,
      status,
      limit,
      note:status===true? "Alert triggers when stock is less than or equal to this limit":"Stock alert is not active"
    };
  })
);

// exports.patchStockAlertLimit = api(
//   {
//     body: {
//       limit: { type: "int", required: true }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//    const ALLOWED_ROLES = ["SUPER_ADMIN",  "CATALOG_MANAGER"];
//     if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
//       throw new errors.UNAUTHORIZED();
//     }

//     const { limit } = req.typed.body;

//     // Validation
//     if (limit < 0) {
//       throw new errors.BAD_REQUEST("Stock alert limit cannot be negative");
//     }

//     // Update only the value
//     const result = await connection.query(
//       `
//       UPDATE system_config
//       SET value = ?
//       WHERE service = 'product' 
        
//         AND key_name = 'PRODUCT_STOCK_ALERT_MIN_COUNT'
//       `,
//       [limit]
//     );

//     if (result.affectedRows === 0) {
//       throw new errors.NOT_FOUND("Configuration key not found in database");
//     }

//     // Audit Logging
//     await connection.query(
//       `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
//        VALUES (?, 'EDIT_STOCK_ALERT_LIMIT', 'system_config', 'PRODUCT_STOCK_ALERT_MIN_COUNT', ?)`,
//       [adminInfo.id, JSON.stringify({ new_limit: limit })]
//     );
 
//       clearCache();
    

//     return {
//       success: true,
//       message: "Stock alert limit updated successfully",
//       limit 
//     };
//   })
// );


exports.patchStockAlertLimit = api(
  {
    body: {
      status: { type: "bool", required: false },
      limit: { type: "int", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
   const ALLOWED_ROLES = ["SUPER_ADMIN",  "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const { status, limit } = req.typed.body;

    if (status === undefined && limit === undefined) {
      throw new errors.NO_FIELDS_PROVIDED();
    }

    if (limit !== undefined && limit < 0) {
      throw new errors.BAD_REQUEST("Stock alert limit cannot be negative");
    }

    // Fetch current config for partial update handling
    const currentConfig = await connection.queryOne(
      `
      SELECT is_active, value FROM system_config
      WHERE service = 'product'
       
        AND key_name = 'PRODUCT_STOCK_ALERT_MIN_COUNT'
      `
    );

    if (!currentConfig) {
      throw new errors.SERVICE_UNAVAILABLE("Stock alert configuration not found");
    }

    const finalStatus = status !== undefined ? (status ? 1 : 0) : currentConfig.is_active;
    const finalLimit = limit !== undefined ? Number(limit) : Number(currentConfig.value);

    await connection.query(
      `
      UPDATE system_config
      SET is_active = ?, value = ?
      WHERE service = 'product' 
        
        AND key_name = 'PRODUCT_STOCK_ALERT_MIN_COUNT'
      `,
      [finalStatus, finalLimit]
    );

    // Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
       VALUES (?, 'EDIT_STOCK_ALERT_LIMIT', 'system_config', ?, ?)`,
      [adminInfo.id, 'product_alert', JSON.stringify({ status: finalStatus, limit: finalLimit })]
    );

 
      clearCache();
   

    return {
      success: true,
      message: "Stock alert configuration updated successfully",
      status: finalStatus === 1,
      limit: finalLimit
    };
  })
);

// ─────────────── V2-014/15/16: Firebase Push Credentials ───────────────

exports.getFirebaseCredential = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const credential = await connection.queryOne(
      `SELECT id, is_active, credential_json, client_config, vapid_key, created_at, updated_at
       FROM firebase_push_credentials ORDER BY id DESC LIMIT 1`
    );

    if (!credential) {
      return { success: true, data: null, message: "No Firebase credential configured." };
    }

    // Build a safe version of credential_json (mask private_key for display)
    let safeCredentialJson = null;
    let projectId = null;
    let clientEmail = null;
    try {
      if (credential.credential_json) {
        const parsed = typeof credential.credential_json === 'string'
          ? JSON.parse(credential.credential_json)
          : credential.credential_json;
        projectId = parsed.project_id || null;
        clientEmail = parsed.client_email || null;
        // Return all fields but mask the private_key
        safeCredentialJson = { ...parsed };
        if (safeCredentialJson.private_key) {
          safeCredentialJson.private_key = '••••••••••••••••••••••••••••••••';
        }
      }
    } catch (e) { /* ignore parse error */ }

    // Parse client_config for display
    let clientConfig = null;
    try {
      if (credential.client_config) {
        clientConfig = typeof credential.client_config === 'string'
          ? JSON.parse(credential.client_config)
          : credential.client_config;
      }
    } catch (e) { /* ignore */ }

    return {
      success: true,
      data: {
        id: credential.id,
        project_id: projectId,
        client_email: clientEmail,
        credential_json_display: safeCredentialJson,
        has_credential_json: !!(projectId && clientEmail),
        is_active: !!credential.is_active,
        has_client_config: !!clientConfig,
        client_config: clientConfig,
        has_vapid_key: !!credential.vapid_key,
        vapid_key: credential.vapid_key || null,
        created_at: credential.created_at,
        updated_at: credential.updated_at
      }
    };
  })
);

exports.upsertFirebaseCredential = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { credential_json, client_config, vapid_key } = req.body;

    // At least one field must be provided
    if (!credential_json && !client_config && vapid_key === undefined) {
      throw new errors.INVALID_FIELDS_PROVIDED("At least one field must be provided.");
    }

    const existing = await connection.queryOne(
      `SELECT id, credential_json, client_config, vapid_key FROM firebase_push_credentials ORDER BY id DESC LIMIT 1`
    );

    // For first-time creation, all 3 are required
    if (!existing) {
      if (!credential_json || !client_config || !vapid_key) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "All three fields are required for initial setup: credential_json, client_config, and vapid_key."
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Validate Admin SDK credential_json (if provided)
    // ═══════════════════════════════════════════════════════════════════════
    let parsedCredJson = null;
    let credJsonString = null;
    let credChanged = false;
    if (credential_json) {
      try {
        parsedCredJson = typeof credential_json === 'string'
          ? JSON.parse(credential_json)
          : credential_json;
      } catch (e) {
        throw new errors.INVALID_FIELDS_PROVIDED("credential_json must be valid JSON.");
      }
      if (!parsedCredJson.project_id || !parsedCredJson.private_key || !parsedCredJson.client_email) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "credential_json must contain project_id, private_key, and client_email."
        );
      }
      // Detect if the private_key is the masked placeholder (not actually changed)
      if (parsedCredJson.private_key.includes('••')) {
        // User didn't change the service account — skip credential update
        parsedCredJson = null;
      } else {
        credChanged = true;
        credJsonString = JSON.stringify(parsedCredJson);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Validate client_config (if provided)
    // ═══════════════════════════════════════════════════════════════════════
    let parsedClientConfig = null;
    let clientConfigString = null;
    if (client_config) {
      try {
        parsedClientConfig = typeof client_config === 'string'
          ? JSON.parse(client_config)
          : client_config;
      } catch (e) {
        throw new errors.INVALID_FIELDS_PROVIDED("client_config must be valid JSON.");
      }
      const requiredClientFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      const missingClientFields = requiredClientFields.filter(f => !parsedClientConfig[f]);
      if (missingClientFields.length > 0) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `client_config is missing required fields: ${missingClientFields.join(', ')}.`
        );
      }
      clientConfigString = JSON.stringify(parsedClientConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Validate VAPID key (if provided)
    // ═══════════════════════════════════════════════════════════════════════
    let trimmedVapid = null;
    if (vapid_key !== undefined && vapid_key !== null) {
      trimmedVapid = (typeof vapid_key === 'string' ? vapid_key : '').trim();
      if (!trimmedVapid) {
        throw new errors.INVALID_FIELDS_PROVIDED("vapid_key cannot be empty.");
      }
      if (!/^[A-Za-z0-9_-]{87}$/.test(trimmedVapid)) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "vapid_key appears invalid. It must be exactly 87 base64url characters (P-256 public key)."
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. LIVE VALIDATION — only when Admin SDK credential changed
    // ═══════════════════════════════════════════════════════════════════════
    if (credChanged && parsedCredJson) {
      const firebaseAdmin = require('firebase-admin');
      const testAppName = `cred_test_${Date.now()}`;
      let testApp;
      try {
        testApp = firebaseAdmin.initializeApp(
          { credential: firebaseAdmin.credential.cert(parsedCredJson) },
          testAppName
        );
        await testApp.messaging().send(
          {
            topic: '__firebase_credential_validation_test__',
            notification: { title: 'Test', body: 'Credential validation' },
          },
          true // dryRun
        );
        console.log(`[Firebase] ✅ Admin SDK credential validated (project: ${parsedCredJson.project_id})`);
      } catch (e) {
        const errMsg = e.message || String(e);
        const errCode = e.code || e.errorInfo?.code || '';
        console.error(`[Firebase] ❌ Admin SDK validation failed:`, errCode, errMsg);

        let userMessage = 'Admin SDK credential validation failed: ';
        if (errCode === 'app/invalid-credential' || errMsg.includes('invalid_grant') || errMsg.includes('private_key')) {
          userMessage += 'The private key or client email is invalid.';
        } else if (errCode === 'messaging/authentication-error' || errMsg.includes('PERMISSION_DENIED')) {
          userMessage += 'The service account lacks FCM permissions. Enable the FCM API in Google Cloud Console.';
        } else if (errMsg.includes('ENOTFOUND') || errMsg.includes('ETIMEDOUT')) {
          userMessage += 'Could not reach Google servers. Check your internet connection.';
        } else {
          userMessage += errMsg;
        }
        throw new errors.INVALID_FIELDS_PROVIDED(userMessage);
      } finally {
        if (testApp) { try { await testApp.delete(); } catch { /* ignore */ } }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Save to DB
    // ═══════════════════════════════════════════════════════════════════════
    if (existing) {
      const updates = [];
      const values = [];
      if (credJsonString) { updates.push('credential_json = ?'); values.push(credJsonString); }
      if (clientConfigString) { updates.push('client_config = ?'); values.push(clientConfigString); }
      if (trimmedVapid) { updates.push('vapid_key = ?'); values.push(trimmedVapid); }
      if (updates.length) {
        updates.push('is_active = 1');
        updates.push('config_version = config_version + 1');
        updates.push('updated_at = NOW()');
        values.push(existing.id);
        await connection.query(
          `UPDATE firebase_push_credentials SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
    } else {
      await connection.query(
        `INSERT INTO firebase_push_credentials (credential_json, client_config, vapid_key, is_active, config_version)
         VALUES (?, ?, ?, 1, 1)`,
        [credJsonString, clientConfigString, trimmedVapid]
      );
    }

    // Reinitialize live Firebase app if credential changed
    if (credChanged) {
      try {
        const firebaseAdmin = require('firebase-admin');
        const liveApp = firebaseAdmin.app('admin_notif_v2');
        await liveApp.delete();
        console.log('[Firebase] Deleted cached admin_notif_v2 app — will reinit on next push.');
      } catch { /* app doesn't exist yet, fine */ }
    }

    // Audit log
    const auditMeta = {};
    if (parsedCredJson) auditMeta.credential_updated = true;
    if (parsedClientConfig) auditMeta.client_config_updated = true;
    if (trimmedVapid) auditMeta.vapid_key_updated = true;
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPSERT_FIREBASE_CREDENTIAL', 'firebase_push_credentials', ?, ?)`,
      [adminInfo.id, existing ? existing.id : 'new', JSON.stringify(auditMeta)]
    );

    return {
      success: true,
      message: credChanged
        ? `Firebase credentials validated and saved successfully.`
        : `Firebase configuration updated successfully.`
    };
  })
);

exports.toggleFirebaseCredentialStatus = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const existing = await connection.queryOne(
      `SELECT id, is_active, credential_json, client_config, vapid_key
       FROM firebase_push_credentials ORDER BY id DESC LIMIT 1`
    );

    if (!existing) {
      throw new errors.NOT_FOUND("No Firebase credential found to update.");
    }

    const currentStatus = Boolean(existing.is_active);
    const nextStatus = !currentStatus;

    // ── When ACTIVATING, verify all 3 credentials are present ──────────
    if (nextStatus) {
      const missing = [];

      // Check Admin SDK credential
      let hasAdminSdk = false;
      if (existing.credential_json) {
        try {
          const parsed = typeof existing.credential_json === 'string'
            ? JSON.parse(existing.credential_json)
            : existing.credential_json;
          hasAdminSdk = !!(parsed.project_id && parsed.private_key && parsed.client_email);
        } catch { /* invalid JSON */ }
      }
      if (!hasAdminSdk) missing.push('Admin SDK JSON (credential_json)');

      // Check Client Config
      let hasClientConfig = false;
      if (existing.client_config) {
        try {
          const parsed = typeof existing.client_config === 'string'
            ? JSON.parse(existing.client_config)
            : existing.client_config;
          hasClientConfig = !!(parsed.apiKey && parsed.projectId);
        } catch { /* invalid JSON */ }
      }
      if (!hasClientConfig) missing.push('Web App Config (client_config)');

      // Check VAPID Key
      if (!existing.vapid_key || !existing.vapid_key.trim()) {
        missing.push('VAPID Key');
      }

      if (missing.length > 0) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Cannot activate Firebase: missing ${missing.join(', ')}. Please save all three credentials first.`
        );
      }
    }

    await connection.query(
      `UPDATE firebase_push_credentials SET is_active = ?, updated_at = NOW() WHERE id = ?`,
      [nextStatus ? 1 : 0, existing.id]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'TOGGLE_FIREBASE_CREDENTIAL', 'firebase_push_credentials', ?, ?)`,
      [adminInfo.id, existing.id, JSON.stringify({ from_is_active: currentStatus, to_is_active: nextStatus })]
    );

    return {
      success: true,
      data: { id: existing.id, is_active: nextStatus },
      message: `Firebase credential ${nextStatus ? 'activated' : 'deactivated'} successfully.`
    };
  })
);

// ─────────────── V2-050: Public Firebase Client Config ───────────────
// Public endpoint — no auth. FIREBASE_CONFIG and VAPID_KEY are public by design.
exports.getFirebaseClientConfig = api(
  {},
  async (req, connection) => {
    const row = await connection.queryOne(
      `SELECT client_config, vapid_key, config_version FROM firebase_push_credentials WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
    );

    if (!row || !row.client_config) {
      return { success: true, data: null };
    }

    let firebaseConfig = null;
    try {
      firebaseConfig = typeof row.client_config === 'string'
        ? JSON.parse(row.client_config)
        : row.client_config;
    } catch (e) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        firebase_config: firebaseConfig,
        vapid_key: row.vapid_key || null,
        config_version: row.config_version || 1
      }
    };
  }
);

// ─────────────── V2-052: Clear Firebase Credential ───────────────
exports.clearFirebaseCredential = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const existing = await connection.queryOne(
      `SELECT id FROM firebase_push_credentials ORDER BY id DESC LIMIT 1`
    );

    if (!existing) {
      throw new errors.NOT_FOUND("No Firebase credential to clear.");
    }

    await connection.query(
      `DELETE FROM firebase_push_credentials WHERE id = ?`,
      [existing.id]
    );

    // Clean up cached Firebase Admin app
    try {
      const firebaseAdmin = require('firebase-admin');
      const liveApp = firebaseAdmin.app('admin_notif_v2');
      await liveApp.delete();
    } catch { /* app doesn't exist, fine */ }

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'CLEAR_FIREBASE_CREDENTIAL', 'firebase_push_credentials', ?, '{}')`,
      [adminInfo.id, existing.id]
    );

    return {
      success: true,
      message: "All Firebase credentials have been cleared."
    };
  })
);

// ─────────────── V2-018: Admin Notification Permissions ───────────────

const normalizeAdminNotificationPermissionFlags = (row) => {
  if (!row) return row;

  const boolKeys = [
    "order_notification_email",
    "order_notification_sms",
    "order_notification_firebase_push",
    "personal_notification_email",
    "personal_notification_sms",
    "personal_notification_firebase_push",
    "contact_notification_email",
    "contact_notification_sms",
    "contact_notification_firebase_push",
    "report_notification_email",
    "report_notification_sms",
    "report_notification_firebase_push",
    "allow_handle_unassigned_order"
  ];

  for (const key of boolKeys) {
    row[key] = Boolean(row[key]);
  }

  return row;
};

exports.getAdminNotificationPermissions = api(
  {
    params: { admin_id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const perms = await connection.queryOne(
      `SELECT
         anp.*,
         CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) AS admin_name,
         a.email AS admin_email,
         a.phone AS admin_phone,
         a.profile_img_path,
         GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS role_name
       FROM admin_notification_permissions anp
       JOIN admins a
         ON a.id = anp.admin_id
        AND a.deleted_at IS NULL
        AND a.is_active = 1
       LEFT JOIN admin_roles ar ON ar.admin_id = a.id
       LEFT JOIN roles r ON r.id = ar.role_id
       WHERE anp.admin_id = ?
       GROUP BY
         anp.id,
         anp.admin_id,
         anp.order_notification_email,
         anp.order_notification_sms,
         anp.order_notification_firebase_push,
         anp.personal_notification_email,
         anp.personal_notification_sms,
         anp.personal_notification_firebase_push,
         anp.contact_notification_email,
         anp.contact_notification_sms,
         anp.contact_notification_firebase_push,
         anp.report_notification_email,
         anp.report_notification_sms,
         anp.report_notification_firebase_push,
         anp.allow_handle_unassigned_order,
         anp.updated_by_admin,
         anp.created_at,
         anp.updated_at,
         a.first_name,
         a.last_name,
         a.email,
         a.phone,
         a.profile_img_path`,
      [req.typed.params.admin_id]
    );

    return { success: true, data: normalizeAdminNotificationPermissionFlags(perms) || null };
  })
);

exports.upsertAdminNotificationPermissions = api(
  {
    params: { admin_id: { type: "int", required: true } },
    body: {
      order_notification_email:            { type: "bool", required: false },
      order_notification_sms:              { type: "bool", required: false },
      order_notification_firebase_push:    { type: "bool", required: false },
      personal_notification_email:         { type: "bool", required: false },
      personal_notification_sms:           { type: "bool", required: false },
      personal_notification_firebase_push: { type: "bool", required: false },
      contact_notification_email:          { type: "bool", required: false },
      contact_notification_sms:            { type: "bool", required: false },
      contact_notification_firebase_push:  { type: "bool", required: false },
      report_notification_email:           { type: "bool", required: false },
      report_notification_sms:             { type: "bool", required: false },
      report_notification_firebase_push:   { type: "bool", required: false },
      allow_handle_unassigned_order:       { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const adminId = req.typed.params.admin_id;
    const {
      order_notification_email,
      order_notification_sms,
      order_notification_firebase_push,
      personal_notification_email,
      personal_notification_sms,
      personal_notification_firebase_push,
      contact_notification_email,
      contact_notification_sms,
      contact_notification_firebase_push,
      report_notification_email,
      report_notification_sms,
      report_notification_firebase_push,
      allow_handle_unassigned_order
    } = req.typed.body;

    // Verify admin exists and is editable (active + not soft-deleted)
    const admin = await connection.queryOne(
      "SELECT id FROM admins WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [adminId]
    );
    if (!admin) throw new errors.NOT_FOUND("Admin not found.");

    const existing = await connection.queryOne(
      "SELECT id FROM admin_notification_permissions WHERE admin_id = ?",
      [adminId]
    );

    if (existing) {
      const updates = [];
      const values = [];

      if (order_notification_email !== undefined)            { updates.push("order_notification_email = ?");            values.push(order_notification_email ? 1 : 0); }
      if (order_notification_sms !== undefined)              { updates.push("order_notification_sms = ?");              values.push(order_notification_sms ? 1 : 0); }
      if (order_notification_firebase_push !== undefined)    { updates.push("order_notification_firebase_push = ?");    values.push(order_notification_firebase_push ? 1 : 0); }
      if (personal_notification_email !== undefined)         { updates.push("personal_notification_email = ?");         values.push(personal_notification_email ? 1 : 0); }
      if (personal_notification_sms !== undefined)           { updates.push("personal_notification_sms = ?");           values.push(personal_notification_sms ? 1 : 0); }
      if (personal_notification_firebase_push !== undefined) { updates.push("personal_notification_firebase_push = ?"); values.push(personal_notification_firebase_push ? 1 : 0); }
      if (contact_notification_email !== undefined)          { updates.push("contact_notification_email = ?");          values.push(contact_notification_email ? 1 : 0); }
      if (contact_notification_sms !== undefined)            { updates.push("contact_notification_sms = ?");            values.push(contact_notification_sms ? 1 : 0); }
      if (contact_notification_firebase_push !== undefined)  { updates.push("contact_notification_firebase_push = ?");  values.push(contact_notification_firebase_push ? 1 : 0); }
      if (report_notification_email !== undefined)           { updates.push("report_notification_email = ?");           values.push(report_notification_email ? 1 : 0); }
      if (report_notification_sms !== undefined)             { updates.push("report_notification_sms = ?");             values.push(report_notification_sms ? 1 : 0); }
      if (report_notification_firebase_push !== undefined)   { updates.push("report_notification_firebase_push = ?");   values.push(report_notification_firebase_push ? 1 : 0); }
      if (allow_handle_unassigned_order !== undefined)       { updates.push("allow_handle_unassigned_order = ?");       values.push(allow_handle_unassigned_order ? 1 : 0); }

      if (updates.length) {
        updates.push("updated_by_admin = ?");
        values.push(adminInfo.id);
        values.push(adminId);
        await connection.query(
          `UPDATE admin_notification_permissions SET ${updates.join(", ")}, updated_at = NOW() WHERE admin_id = ?`,
          values
        );
      }
    } else {
      await connection.query(
        `INSERT INTO admin_notification_permissions
         (admin_id,
          order_notification_email,    order_notification_sms,    order_notification_firebase_push,
          personal_notification_email, personal_notification_sms, personal_notification_firebase_push,
          contact_notification_email,  contact_notification_sms,  contact_notification_firebase_push,
          report_notification_email,   report_notification_sms,   report_notification_firebase_push,
          updated_by_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminId,
          order_notification_email !== undefined ? (order_notification_email ? 1 : 0) : 1,
          order_notification_sms !== undefined ? (order_notification_sms ? 1 : 0) : 0,
          order_notification_firebase_push !== undefined ? (order_notification_firebase_push ? 1 : 0) : 0,
          personal_notification_email !== undefined ? (personal_notification_email ? 1 : 0) : 1,
          personal_notification_sms !== undefined ? (personal_notification_sms ? 1 : 0) : 0,
          personal_notification_firebase_push !== undefined ? (personal_notification_firebase_push ? 1 : 0) : 0,
          contact_notification_email !== undefined ? (contact_notification_email ? 1 : 0) : 1,
          contact_notification_sms !== undefined ? (contact_notification_sms ? 1 : 0) : 0,
          contact_notification_firebase_push !== undefined ? (contact_notification_firebase_push ? 1 : 0) : 0,
          report_notification_email !== undefined ? (report_notification_email ? 1 : 0) : 1,
          report_notification_sms !== undefined ? (report_notification_sms ? 1 : 0) : 0,
          report_notification_firebase_push !== undefined ? (report_notification_firebase_push ? 1 : 0) : 0,
          adminInfo.id
        ]
      );
    }

    return { success: true, message: "Notification permissions updated." };
  })
);

exports.getAllAdminNotificationPermissions = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const perms = await connection.query(
      `SELECT
         anp.*,
         CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) AS admin_name,
         a.email AS admin_email,
         a.phone AS admin_phone,
         a.profile_img_path,
         GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS role_name
       FROM admin_notification_permissions anp
       JOIN admins a ON a.id = anp.admin_id AND a.deleted_at IS NULL AND a.is_active = 1
       LEFT JOIN admin_roles ar ON ar.admin_id = a.id
       LEFT JOIN roles r ON r.id = ar.role_id
       GROUP BY
         anp.id,
         anp.admin_id,
         anp.order_notification_email,
         anp.order_notification_sms,
         anp.order_notification_firebase_push,
         anp.personal_notification_email,
         anp.personal_notification_sms,
         anp.personal_notification_firebase_push,
         anp.contact_notification_email,
         anp.contact_notification_sms,
         anp.contact_notification_firebase_push,
         anp.report_notification_email,
         anp.report_notification_sms,
         anp.report_notification_firebase_push,
         anp.allow_handle_unassigned_order,
         anp.updated_by_admin,
         anp.created_at,
         anp.updated_at,
         a.first_name,
         a.last_name,
         a.email,
         a.phone,
         a.profile_img_path
       ORDER BY a.first_name ASC`
    );

    return { success: true, data: perms.map(normalizeAdminNotificationPermissionFlags) };
  })
);
