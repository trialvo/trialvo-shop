const {verifySteadfast,verifyRedx,verifyPathao,verifyPaperfly}=require("../helpers/courier")

// utils/systemConfig.js
let cachedConfig = null;
let cachedAutoAvailability = null;

/**
 * Fetch all configs from DB and cache them
 * @param {Connection} connection
 * @param {boolean} forceReload - bypass cache
 * @param {string} service - optional: filter by service
 */
exports.getConfig=async(connection, forceReload = false, service = null) =>{
  if (cachedConfig && !forceReload && !service) return cachedConfig;

  let sql = "SELECT service, key_name, value,provider, is_active ,updated_at FROM system_config";
  const params = [];
  if (service) {
    sql += " WHERE service = ?";
    params.push(service);
  }

  const rows = await connection.query(sql, params);

  const config = rows
  
  // {};
  // for (const row of rows) {
  //   config[row.key_name] = row.value;
  // }

  if (!service) cachedConfig = config; // only cache full config
  return config;
}

 
 
exports.getAvailableAutoCouriers = async (connection, forceRefresh = false) => {
  /* -------------------- 1️⃣ Cache -------------------- */
  if (!forceRefresh && cachedAutoAvailability) {
    return cachedAutoAvailability;
  }

  /* -------------------- 2️⃣ Load courier config -------------------- */
  const rows = await exports.getConfig(connection, forceRefresh, "courier");

  const providers = {};
  for (const row of rows) {
    const provider = row.provider;

    if (!provider || provider === "default") continue;

    if (!providers[provider]) {
      providers[provider] = {
        is_active: Boolean(row.is_active),
        config: {}
      };
    }

    providers[provider].config[row.key_name] = row.value;
  }

  /* -------------------- 3️⃣ Verify active providers -------------------- */
  const allProviderNames = Object.keys(providers);

  const verificationPromises = allProviderNames.map(async (name) => {
    const data = providers[name];
    if (!data.is_active) {
      return { provider: name, is_auto_available: 0 };
    }

    const cfg = data.config;
    try {
      let verified = false;

      switch (name) {
        case "steadfast":
          if (cfg.STEADFAST_BASE_URL && cfg.STEADFAST_API_KEY && cfg.STEADFAST_SECRET_KEY) {
            verified = await verifySteadfast({
              base_url: cfg.STEADFAST_BASE_URL,
              api_key: cfg.STEADFAST_API_KEY,
              secret_key: cfg.STEADFAST_SECRET_KEY
            });
          }
          break;

        case "redx":
          if (cfg.REDX_BASE_URL && cfg.REDX_STORE_ID && cfg.REDX_TOKEN) {
            verified = await verifyRedx({
              base_url: cfg.REDX_BASE_URL,
              store_id: cfg.REDX_STORE_ID,
              token: cfg.REDX_TOKEN
            });
          }
          break;

        case "pathao":
          if (cfg.PATHAO_BASE_URL && cfg.PATHAO_CLIENT_ID && cfg.PATHAO_CLIENT_SECRET && cfg.PATHAO_EMAIL && cfg.PATHAO_PASS) {
            verified = await verifyPathao({
              base_url: cfg.PATHAO_BASE_URL,
              client_id: cfg.PATHAO_CLIENT_ID,
              client_secret: cfg.PATHAO_CLIENT_SECRET,
              email: cfg.PATHAO_EMAIL,
              password: cfg.PATHAO_PASS
            });
          }
          break;

        case "paperfly":
          if (cfg.PAPERFLY_BASE_URL && cfg.PAPERFLY_API_KEY && cfg.PAPERFLY_USER && cfg.PAPERFLY_PASS) {
            verified = await verifyPaperfly({
              base_url: cfg.PAPERFLY_BASE_URL,
              api_key: cfg.PAPERFLY_API_KEY,
              user: cfg.PAPERFLY_USER,
              password: cfg.PAPERFLY_PASS
            });
          }
          break;

        default:
          return { provider: name, is_auto_available: 0 };
      }

      return { provider: name, is_auto_available: verified ? 1 : 0 };
    } catch (err) {
      console.error(`Courier auto-check failed for ${name}:`, err.message);
      return { provider: name, is_auto_available: 0 };
    }
  });

  const results = await Promise.all(verificationPromises);

  /* -------------------- 4️⃣ Cache & return -------------------- */
  cachedAutoAvailability = {
    any_auto_available: results.some(p => p.is_auto_available === 1),
    available_providers: results
  };

  return cachedAutoAvailability;
};


 
// This is the "Trigger" that ensures the cache is never stale
exports.clearCache = () => {
  cachedConfig = null;
  cachedAutoAvailability = null;
  console.log("System Config and Courier Cache cleared.");
};
