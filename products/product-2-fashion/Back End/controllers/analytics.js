const { api, auth } = require("../helpers/common");
const errors = require("../helpers/errors");
const {
  getAnalyticsConfig,
  clearAnalyticsCache,
} = require("../config/AnalyticsConfigDB");

/**
 * Admin — GET full analytics config (includes secrets)
 */
exports.getAnalyticsConfig = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const config = await getAnalyticsConfig(connection);
    return { success: true, data:config };
  })
);

/**
 * Admin — PUT replace full analytics config
 */
exports.updateAnalyticsConfig = api(
  {
   
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const config = req.body.config;

    // Basic structure validation — top-level keys must exist
    if (!config ) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "config must be provided in the request body."
      );
    }

    // Basic structure validation — top-level keys must exist
    if ( typeof config !== "object") {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "config must be a valid JSON object."
      );
    }

    // const requiredKeys = ["analytics", "tracking", "meta"];
    // const missingKeys = requiredKeys.filter((k) => !(k in config));

    // if (missingKeys.length > 0) {
    //   throw new errors.INVALID_FIELDS_PROVIDED(
    //     `Missing required top-level keys: ${missingKeys.join(", ")}`
    //   );
    // }

    // Full replace
    await connection.query(
      `INSERT INTO analytics_config (id, config)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [JSON.stringify(config)]
    );

    // Audit log
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPDATE_ANALYTICS_CONFIG', 'analytics_config', '1', ?)`,
      [
        adminInfo.id,
        JSON.stringify({
          keys_updated: Object.keys(config),
        }),
      ]
    );

    clearAnalyticsCache();

    return {
      success: true,
      message: "Analytics configuration updated successfully.",
    };
  })
);

/**
 * Public — GET analytics config with sensitive fields stripped
 * No auth required (frontend script loader uses this)
 */
exports.getAnalyticsPublic = api({}, async (req, connection) => {
  const config = await getAnalyticsConfig(connection);

  // Deep clone to avoid mutating cache
  const safeConfig = JSON.parse(JSON.stringify(config));

  // Strip sensitive fields
  if (safeConfig.analytics) {
    // Facebook Pixel — mask conversion API secrets
    if (safeConfig.analytics.facebook_pixel?.conversion_api) {
      const capi = safeConfig.analytics.facebook_pixel.conversion_api;
      if (capi.access_token) capi.access_token = "***";
      if (capi.test_event_code) capi.test_event_code = "***";
    }

    // GTM — remove auth & preview tokens
    if (safeConfig.analytics.google_tag_manager) {
      delete safeConfig.analytics.google_tag_manager.auth;
      delete safeConfig.analytics.google_tag_manager.preview;
    }
  }

  return { success: true, config: safeConfig };
});
