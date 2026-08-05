// config/AnalyticsConfigDB.js
let cachedAnalyticsConfig = null;

/**
 * Fetch analytics config from DB and cache it
 * @param {Connection} connection
 * @param {boolean} forceReload - bypass cache
 * @returns {object} parsed config JSON
 */
exports.getAnalyticsConfig = async (connection, forceReload = false) => {
  if (cachedAnalyticsConfig && !forceReload) return cachedAnalyticsConfig;

  const row = await connection.queryOne(
    "SELECT config FROM analytics_config WHERE id = 1"
  );

  if (!row || !row.config) {
    cachedAnalyticsConfig = {};
    return cachedAnalyticsConfig;
  }

  // MariaDB/MySQL may return JSON as a string or already-parsed object
  cachedAnalyticsConfig =
    typeof row.config === "string" ? JSON.parse(row.config) : row.config;

  return cachedAnalyticsConfig;
};

/**
 * Clear cached analytics config (call after every update)
 */
exports.clearAnalyticsCache = () => {
  cachedAnalyticsConfig = null;
  console.log("Analytics Config Cache cleared.");
};
