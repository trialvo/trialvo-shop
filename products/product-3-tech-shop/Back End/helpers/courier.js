const errors = require("./errors");

const axios = require("axios");
const {BRAND_NAME,FRAUDE_API_KEY,FRAUDE_API_URL ,TEST_SSL_PHONE,GUEST_SSL_EMAIL}=require("../config/ApplicationSettings")


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
 


exports.verifySteadfast = async ({ base_url, api_key, secret_key }) => {
  try {
    // Ensure the base URL ends correctly. Standard is: https://portal.packzy.com/api/v1
    const cleanBaseUrl = base_url.replace(/\/$/, "");

    const res = await axios.get(
      `${cleanBaseUrl}/get_balance`, // Use balance check to verify credentials
      {
        headers: {
          "Api-Key": api_key,
          "Secret-Key": secret_key,
          "Content-Type": "application/json"
        },
        timeout: 7000 // Increased timeout slightly for external API stability
      }
    );

    // Steadfast returns status 200 even for some errors, 
    // but the presence of 'balance' or 'status: 200' in data confirms validity.
    if (res.status === 200 && res.data) {
        return true;
    }

    throw new errors.BAD_REQUEST(`Invalid response from Steadfast server.: ${res.data?.message || 'Unknown error'}`);
  } catch (err) {
    // Handle Axios errors and custom error logic
    const errorMessage = err.response?.data?.message || err.message;
    throw new errors.BAD_REQUEST(
      `Steadfast credential verification failed: ${errorMessage}`
    );
  }
};

    

exports.verifyRedx = async ({ base_url, store_id, token }) => {
  try {
    // Standard Base URL: https://openapi.redx.com.bd/v1.0.0-beta
    const cleanBaseUrl = base_url.replace(/\/$/, "");

    const res = await axios.get(
      `${cleanBaseUrl}/store/list`, // Fetching stores is the best way to verify credentials
      {
        headers: {
          "API-ACCESS-TOKEN": `Bearer ${token}`, // RedX uses this specific header key
          "Content-Type": "application/json"
        },
        timeout: 7000
      }
    );

    // Verify if the response is successful and if our specific Store ID exists in their list
    if (res.status === 200 && res.data && Array.isArray(res.data.stores)) {
      const storeExists = res.data.stores.some(s => String(s.id) === String(store_id));
      
      if (!storeExists) {
        throw new errors.BAD_REQUEST(`Token is valid, but Store ID ${store_id} was not found in your account.`);
      }
      return true;
    }

    throw new errors.BAD_REQUEST(`Invalid response from RedX server: ${res.data?.message || 'Unknown error'}`);
  } catch (err) {
    // RedX often returns errors in err.response.data.message
    const errorMessage = err.response?.data?.message || err.message;
    throw new errors.BAD_REQUEST(
      `RedX credential verification failed: ${errorMessage}`
    );
  }
};


exports.verifyPathao = async ({ base_url, client_id, client_secret, email, password }) => {
  try {
    const cleanBaseUrl = base_url.replace(/\/$/, "");

    // Pathao strictly requires grant_type: "password" for merchant login
    const payload = {
      grant_type: "password",
      client_id: client_id,
      client_secret: client_secret,
      username: email, // Pathao uses 'username' field for email
      password: password,
    };

    const res = await axios.post(
      `${cleanBaseUrl}/aladdin/api/v1/issue-token`, 
      payload, 
      { 
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        timeout: 10000 // Pathao's auth can be slow, 10s is safer
      }
    );

    // Pathao returns access_token, refresh_token, and expires_in
    if (res.status === 200 && res.data && res.data.access_token) {
      return true;
    }
    throw new errors.BAD_REQUEST(`Invalid response from Pathao server: ${res.data?.message || 'Unknown error'}`);
    
  } catch (err) {
    // Pathao often returns error details in err.response.data
    const errorMessage = err.response?.data?.message || err.message;
    
    // Check for specific OAuth errors (like 'invalid_grant')
    const detailedError = err.response?.data?.error === 'invalid_grant' 
      ? "Invalid Email or Password" 
      : errorMessage;

    throw new errors.BAD_REQUEST(`Pathao verification failed: ${detailedError}`);
  }
};



exports.verifyPaperfly = async ({ base_url, api_key, user, password }) => {
  try {
    const cleanBaseUrl = base_url.replace(/\/$/, "");
    
    // Paperfly authentication typically requires credentials in the header
    // format: Base64(username:password)
    const authString = Buffer.from(`${user}:${password}`).toString('base64');

    const res = await axios.get(
      `${cleanBaseUrl}/api/v1/shipping/merchant-info`, // Standard endpoint to check account validity
      {
        headers: {
          "Authorization": `Basic ${authString}`,
          "paperfly-key": api_key, // Paperfly uses this custom header for the API key
          "Content-Type": "application/json"
        },
        timeout: 8000
      }
    );

    // Paperfly returns status 200 and a 'success' field in their response
    if (res.status === 200 && (res.data.success === true || res.data.status === "success")) {
      return true;
    }
    throw new errors.BAD_REQUEST(`Invalid response from Paperfly server: ` + (res.data?.message || 'Unknown error'));
  
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    throw new errors.BAD_REQUEST(`Paperfly verification failed: ${errorMessage}`);
  }
};



exports.fetchSteadfastLocations = async (cfg) => {
  const cleanBaseUrl = cfg.STEADFAST_BASE_URL.replace(/\/$/, "");
  
  try {
    // Per your doc, the correct endpoint is /police_stations
    const res = await axios.get(`${cleanBaseUrl}/police_stations`, {
      headers: { 
        "Api-Key": cfg.STEADFAST_API_KEY, 
        "Secret-Key": cfg.STEADFAST_SECRET_KEY,
        "Content-Type": "application/json"
      }
    });

    // Check for status 200 as per your doc's response examples
    if (res.data && res.data.status === "success") {
      // The doc says this returns a list of police stations
      return res.data.data; 
    }

    throw new Error(res.data?.message || "Failed to fetch Steadfast locations");
  } catch (err) {
    console.error("Steadfast Fetch Error:", err.response?.data || err.message);
    throw err;
  }
};


exports.fetchSteadfastLocations = async (cfg) => {
  const base = cfg.STEADFAST_BASE_URL.replace(/\/$/, "");
  const res = await axios.get(`${base}/police_stations`, {
    headers: {
      "Api-Key": cfg.STEADFAST_API_KEY,
      "Secret-Key": cfg.STEADFAST_SECRET_KEY
    }
  });
console.log("===========",res.data);
  if (res.data?.status === "success") return res.data.data;
  throw new Error("Invalid Steadfast response");
};

 
exports.fetchRedxAreas = async (cfg) => {
  const cleanBaseUrl = cfg.REDX_BASE_URL.replace(/\/$/, "");
  
  const res = await axios.get(`${cleanBaseUrl}/areas`, {
    headers: { "API-ACCESS-TOKEN": `Bearer ${cfg.REDX_TOKEN}` }
  });

  // Returns: [{ id: 12, name: 'Mirpur', city_name: 'Dhaka', post_code: '1216' }]
  return res.data.areas;
};


exports.getPathaoToken = async (cfg) => {
  const cleanBaseUrl = (cfg.PATHAO_BASE_URL || cfg.base_url || "").replace(/\/$/, "");
  const res = await axios.post(
    `${cleanBaseUrl}/aladdin/api/v1/issue-token`,
    {
      grant_type: "password",
      client_id: cfg.PATHAO_CLIENT_ID || cfg.client_id,
      client_secret: cfg.PATHAO_CLIENT_SECRET || cfg.client_secret,
      username: cfg.PATHAO_EMAIL || cfg.email,
      password: cfg.PATHAO_PASS || cfg.PATHAO_PASSWORD || cfg.password,
    },
    {
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      timeout: 15000
    }
  );
  if (res.data?.access_token) return res.data.access_token;
  throw new Error(`Pathao token error: ${res.data?.message || "no access_token"}`);
};

exports.fetchPathaoCities = async (cfg, token) => {
  const cleanBaseUrl = cfg.PATHAO_BASE_URL.replace(/\/$/, "");
  const res = await axios.get(`${cleanBaseUrl}/aladdin/api/v1/city-list`, {
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
  });
  // Pathao wraps list responses in a pagination object: { data: { data: [...], total, ... } }
  const payload = res.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

exports.fetchPathaoZones = async (cfg, token, cityId) => {
  const cleanBaseUrl = cfg.PATHAO_BASE_URL.replace(/\/$/, "");
  const res = await axios.get(`${cleanBaseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`, {
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
  });
  const payload = res.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};
 
exports.fetchPathaoAreas = async (cfg, token, zoneId) => {
  const cleanBaseUrl = cfg.PATHAO_BASE_URL.replace(/\/$/, "");
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await axios.get(
        `${cleanBaseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      // Pathao wraps lists: { data: { data: [...] } } or { data: [...] }
      const payload = res.data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < 5) {
        const waitSec = attempt * 5;
        console.warn(`Pathao Zone ${zoneId}: rate limited, retrying in ${waitSec}s (attempt ${attempt}/5)`);
        await sleep(waitSec * 1000);
        continue;
      }
      console.error(`Pathao Area Fetch Error for Zone ${zoneId}:`, err.response?.data || err.message);
      return [];
    }
  }
  return [];
};


exports.fetchPaperflyLocations = async (cfg) => {
  const cleanBaseUrl = cfg.PAPERFLY_BASE_URL.replace(/\/$/, "");
  const auth = Buffer.from(`${cfg.PAPERFLY_USER}:${cfg.PAPERFLY_PASS}`).toString('base64');

  const res = await axios.get(`${cleanBaseUrl}/api/v1/shipping/thana-list`, {
    headers: { 
      "Authorization": `Basic ${auth}`,
      "paperfly-key": cfg.PAPERFLY_API_KEY 
    }
  });
  return res.data.success ? res.data.data : [];
};




// exports.dispatchSteadfastOrder = async (order, config) => {
//     const baseUrl = config.STEADFAST_BASE_URL.replace(/\/$/, "");
    
//     // Prepare the payload according to the documentation you provided
//     const payload = {
//         invoice: order.invoice_no,            // Unique Invoice ID
//         recipient_name: order.customer_name||BRAND_NAME+" User",
//         recipient_phone: order.customer_phone,
//         recipient_address: order.full_address,
//         cod_amount: order.total_amount,       // Total amount to collect
//         note: order.delivery_note || "",      // Optional instructions
        
//         // While not strictly required by the basic create_order path, 
//         // passing the mapping helps their internal system.
//     };

//     try {
//         const response = await axios.post(`${baseUrl}/create_order`, payload, {
//             headers: {
//                 "Api-Key": config.STEADFAST_API_KEY,
//                 "Secret-Key": config.STEADFAST_SECRET_KEY,
//                 "Content-Type": "application/json"
//             }
//         });

//         if (response.data.status === 200) {
//             return {
//                 success: true,
//                 consignment_id: response.data.consignment.consignment_id,
//                 tracking_code: response.data.consignment.tracking_code,
//                 status: response.data.consignment.status
//             };
//         } else {
//             throw new Error(response.data.message || "Order creation failed");
//         }
//     } catch (error) {
//         console.error("Steadfast Dispatch Error:", error.response?.data || error.message);
//         return {
//             success: false,
//             error: error.response?.data?.message || error.message
//         };
//     }
// };

// exports.dispatchRedx = async (order, cfg, weight) => {
//   const cleanBaseUrl = cfg.REDX_BASE_URL.replace(/\/$/, "");
  
//   const payload = {
//     customer_name: order.customer_name,
//     customer_phone: order.customer_phone,
//     customer_address: order.full_address,
//     delivery_area: order.city, // RedX usually needs specific Area Name
//     delivery_area_id: order.area_id, // Important: ID from RedX Area API
//     cash_collection_amount: order.due_amount,
//     parcel_weight: weight, 
//     merchant_invoice_id: `INV-${order.id}`
//   };

//   const res = await axios.post(`${cleanBaseUrl}/parcel`, payload, {
//     headers: {
//       "API-ACCESS-TOKEN": `Bearer ${cfg.REDX_TOKEN}`,
//       "Content-Type": "application/json"
//     }
//   });

//   if (res.status === 201 || res.status === 200) {
//     return {
//       tracking_code: res.data.tracking_id,
//       invoice_id: order.id,
//       status: "pending"
//     };
//   }else{
//     throw new errors.SERVICE_UNAVAILABLE(res.data?.message || "RedX dispatch failed")
//   }
 
// };


// exports.dispatchPathao = async (order, cfg, weight) => {
//   const cleanBaseUrl = cfg.PATHAO_BASE_URL.replace(/\/$/, "");

//   // 1. Get Access Token
//   const authRes = await axios.post(`${cleanBaseUrl}/aladdin/api/v1/issue-token`, {
//     grant_type: "password",
//     client_id: cfg.PATHAO_CLIENT_ID,
//     client_secret: cfg.PATHAO_CLIENT_SECRET,
//     username: cfg.PATHAO_EMAIL,
//     password: cfg.PATHAO_PASS
//   });

//   const token = authRes.data.access_token;

//   // 2. Create Parcel
//   const payload = {
//     store_id: cfg.PATHAO_STORE_ID, // Merchant must set this in config
//     merchant_order_id: order.id,
//     recipient_name: order.customer_name,
//     recipient_phone: order.customer_phone,
//     recipient_address: order.full_address,
//     recipient_city: order.city_id, // Pathao specific ID
//     recipient_zone: order.zone_id, // Pathao specific ID
//     recipient_area: order.area_id, // Pathao specific ID
//     delivery_type: 48, // 48 for Normal, 12 for On Demand
//     item_type: 2,      // 1 for Document, 2 for Parcel
//     amount_to_collect: order.due_amount,
//     item_weight: weight
//   };

//   const res = await axios.post(`${cleanBaseUrl}/aladdin/api/v1/orders`, payload, {
//     headers: {
//       "Authorization": `Bearer ${token}`,
//       "Accept": "application/json"
//     }
//   });

//   if (res.data?.type === "success") {
//     return {
//       tracking_code: res.data.data.consignment_id,
//       status: "shipped"
//     };
//   }else{
//     throw new errors.SERVICE_UNAVAILABLE(res.data?.message || "Pathao dispatch failed")
//   }
 
// };




// exports.dispatchPaperfly = async (order, cfg, weight) => {
//   const cleanBaseUrl = cfg.PAPERFLY_BASE_URL.replace(/\/$/, "");
//   const authString = Buffer.from(`${cfg.PAPERFLY_USER}:${cfg.PAPERFLY_PASS}`).toString('base64');

//   const payload = {
//     merOrderRef: `INV-${order.id}`,
//     customerName: order.customer_name,
//     custPhone: order.customer_phone,
//     custAddress: order.full_address,
//     destination: order.city,
//     appliedWeight: weight,
//     collectableAmount: order.due_amount
//   };

//   const res = await axios.post(`${cleanBaseUrl}/api/v1/shipping/order-placement`, payload, {
//     headers: {
//       "Authorization": `Basic ${authString}`,
//       "paperfly-key": cfg.PAPERFLY_API_KEY,
//       "Content-Type": "application/json"
//     }
//   });

//   if (res.data?.status === "success" || res.data?.success === true) {
//     return {
//       tracking_code: res.data.trackingNumber || res.data.orderId,
//       status: "placed"
//     };
//   }else{
//     throw new errors.SERVICE_UNAVAILABLE(res.data?.message || "Paperfly dispatch failed")
//   }
   
// };




 


async function dispatchRedx(order, cfg, weight) {
  const cleanBaseUrl = cfg.REDX_BASE_URL.replace(/\/$/, "");

  const payload = {
    customer_name: order.customer_name||BRAND_NAME+" User",
    customer_phone: order.customer_phone,
    customer_address: order.full_address,
    delivery_area: order.city,
    delivery_area_id: order.area_id,
    cash_collection_amount: order.due_amount,
    parcel_weight: weight,
    merchant_invoice_id: `INV-${order.id}` // 👉 MEMO
  };

  const res = await axios.post(`${cleanBaseUrl}/parcel`, payload, {
    headers: {
      "API-ACCESS-TOKEN": `Bearer ${cfg.REDX_TOKEN}`,
      "Content-Type": "application/json"
    }
  });

  if (res.status === 200 || res.status === 201) {
    return {
      tracking_number: res.data.tracking_id,
      memo: `INV-${order.id}`,
      reference_id: res.data.id || null,
      raw: res.data
    };
  }

  throw new errors.SERVICE_UNAVAILABLE(
    res.data?.message || "RedX dispatch failed"
  );
}


async function dispatchPaperfly(order, cfg, weight) {
  const cleanBaseUrl = cfg.PAPERFLY_BASE_URL.replace(/\/$/, "");
  const authString = Buffer
    .from(`${cfg.PAPERFLY_USER}:${cfg.PAPERFLY_PASS}`)
    .toString("base64");

  const payload = {
    merOrderRef: `INV-${order.id}`, // 👉 MEMO
    customerName: order.customer_name||BRAND_NAME+" User",
    custPhone: order.customer_phone,
    custAddress: order.full_address,
    destination: order.city,
    appliedWeight: weight,
    collectableAmount: order.due_amount
  };

  const res = await axios.post(
    `${cleanBaseUrl}/api/v1/shipping/order-placement`,
    payload,
    {
      headers: {
        "Authorization": `Basic ${authString}`,
        "paperfly-key": cfg.PAPERFLY_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  if (res.data?.status === "success" || res.data?.success === true) {
    return {
      tracking_number: res.data.trackingNumber || res.data.orderId,
      memo: `INV-${order.id}`,
      reference_id: res.data.orderId || null,
      raw: res.data
    };
  }

  throw new errors.SERVICE_UNAVAILABLE(
    res.data?.message || "Paperfly dispatch failed"
  );
}



let pathaoTokenCache = { token: null, expiresAt: 0 };

async function getPathaoToken(config) {
  if (pathaoTokenCache.token && Date.now() < pathaoTokenCache.expiresAt) {
    return pathaoTokenCache.token;
  }
  
  const cleanBaseUrl = config.PATHAO_BASE_URL.replace(/\/$/, "");
  const payload = {
    grant_type: "password",
    client_id: config.PATHAO_CLIENT_ID,
    client_secret: config.PATHAO_CLIENT_SECRET,
    username: config.PATHAO_EMAIL,
    password: config.PATHAO_PASS
  };

  const res = await axios.post(
    `${cleanBaseUrl}/aladdin/api/v1/issue-token`, 
    payload, 
    { 
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      timeout: 10000 
    }
  );

  if (res.data?.access_token) {
    pathaoTokenCache.token = res.data.access_token;
    // Expire 1 minute early (usually 432,000s)
    pathaoTokenCache.expiresAt = Date.now() + ((res.data.expires_in || 3600) * 1000) - 60000;
    return pathaoTokenCache.token;
  }
  
  throw new errors.SERVICE_UNAVAILABLE("Unable to retrieve Pathao access token");
}

async function dispatchPathao(order, config, weight) {
  const token = await getPathaoToken(config);
  const cleanBaseUrl = config.PATHAO_BASE_URL.replace(/\/$/, "");
  // Pathao location IDs must be pre-joined from location_mappings by the calling controller
  if (!order.pathao_city_id || !order.pathao_zone_id || !order.pathao_area_id) {
    throw new errors.BAD_REQUEST("Zone not set for this order. Edit the order to assign a delivery zone.");
  }

  // Build the correct Pathao dispatch payload
  const payload = {
    store_id: config.PATHAO_STORE_ID,
    merchant_order_id: `INV-${order.id}`,
    recipient_name: order.customer_name || BRAND_NAME + " User",
    recipient_phone: normalizeBdPhone(order.customer_phone),
    recipient_address: order.full_address,
    recipient_city: order.pathao_city_id,
    recipient_zone: order.pathao_zone_id,
    recipient_area: order.pathao_area_id,
    delivery_type: 48, // 48 = Normal Delivery
    item_type: 2,      // 2 = Parcel
    item_quantity: 1, 
    item_weight: Math.max(0.1, Number(weight) || 1.0),
    amount_to_collect: order.payment_type === 'cod' ? order.due_amount : 0
  };

  console.log('[Pathao dispatch] payload:', JSON.stringify(payload));
  let res;
  try {
    res = await axios.post(
    `${cleanBaseUrl}/aladdin/api/v1/orders`,
    payload,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }
  );
  } catch (err) {
    const pathaoErr = err.response?.data;
    // Format field-level validation errors into a readable string
    let msg = pathaoErr?.message || err.message;
    if (pathaoErr?.errors && typeof pathaoErr.errors === 'object') {
      const fieldErrors = Object.entries(pathaoErr.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
        .join('; ');
      if (fieldErrors) msg = fieldErrors;
    }
    console.error('[Pathao dispatch] error:', err.response?.status, JSON.stringify(pathaoErr));
    throw new errors.SERVICE_UNAVAILABLE('Pathao: ' + msg);
  }

  if (res.data?.type === "success" || res.data?.data?.consignment_id) {
    return {
      tracking_number: res.data.data.consignment_id,
      memo: res.data.data.merchant_order_id,
      reference_id: res.data.data.order_id,
      raw: res.data
    };
  }

  throw new errors.SERVICE_UNAVAILABLE(
    res.data?.message || 'Pathao dispatch failed'
  );
}


async function dispatchSteadfast(order, config,weight) {
  const baseUrl = config.STEADFAST_BASE_URL.replace(/\/$/, "");
  const customerPhone = String(order.customer_phone || "").trim();
  const customerEmail = String(order.customer_email || "").trim();
  const isValidPhone = /^(?:\+?88)?01[3-9]\d{8}$/.test(customerPhone);
  const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const hasTypoTld = /\.comb$/i.test(customerEmail);
  const isValidEmail = isValidEmailFormat && !hasTypoTld;
  const recipientPhone = isValidPhone ? customerPhone : TEST_SSL_PHONE;
  const recipientEmail = isValidEmail ? customerEmail : GUEST_SSL_EMAIL;

  const res = await axios.post(
    `${baseUrl}/create_order`,
    {
      invoice: order.id,                 // 👉 MEMO
      recipient_name: order.customer_name||BRAND_NAME+" User",
      recipient_phone: recipientPhone,
      recipient_email: recipientEmail,
      recipient_address: order.full_address+", "+order.city,
      cod_amount: order.payment_type=='cod'? order.due_amount:0,
      note: order.note || "",
      weight,
      delivery_type: order.delivery_type ?? 0
    },
    {
      headers: {
        "Api-Key": config.STEADFAST_API_KEY,
        "Secret-Key": config.STEADFAST_SECRET_KEY,
        "Content-Type": "application/json"
      }
    }
  );

 
  if (!res.data?.consignment) {
    throw new errors.SERVICE_UNAVAILABLE(
      res.data?.message || "Steadfast dispatch failed"
    );
  }

  return {
    tracking_number: res.data.consignment.tracking_code,
    memo: res.data.consignment.invoice,
    reference_id: res.data.consignment.consignment_id,
    raw: res.data
  };
}

exports.dispatchToCourier=async(provider, order, configs, weight = 1)=> {
  switch (provider) {
    case "steadfast":
      return dispatchSteadfast(order, configs.steadfast,weight);

    case "pathao":
      return dispatchPathao(order, configs.pathao, weight);

    case "redx":
      return dispatchRedx(order, configs.redx, weight);

    case "paperfly":
      return dispatchPaperfly(order, configs.paperfly, weight);

    default:
      throw new errors.BAD_REQUEST(`Unsupported courier provider: ${provider}`);
  }
}

 
 




// --- STEADFAST ---
exports.getSteadfastBalance = async (config) => {
  try {
    const baseUrl = config.STEADFAST_BASE_URL.replace(/\/$/, "");
    const res = await axios.get(`${baseUrl}/get_balance`, {
      headers: {
        "Api-Key": config.STEADFAST_API_KEY,
        "Secret-Key": config.STEADFAST_SECRET_KEY,
        "Content-Type": "application/json"
      },
      timeout: 5000
    });
    return { balance: res.data.current_balance || 0 };
  } catch (err) {
    throw new errors.BAD_REQUEST(`Steadfast balance error: ${err.message}`);
  }
};

// --- REDX ---
exports.getRedxBalance = async (config) => {
  try {
    const baseUrl = config.REDX_BASE_URL.replace(/\/$/, "");
    const res = await axios.get(`${baseUrl}/merchant/balance`, {
      headers: {
        "Authorization": `Bearer ${config.REDX_TOKEN}`,
        "Content-Type": "application/json"
      },
      timeout: 5000
    });
    const balance = res.data.balance ?? res.data.data?.balance ?? 0;
    return { balance };
  } catch (err) {
    throw new errors.BAD_REQUEST(`RedX balance error: ${err.message}`);
  }
};

// --- PATHAO ---
exports.getPathaoBalance = async (config) => {
  try {
    const baseUrl = config.PATHAO_BASE_URL.replace(/\/$/, "");
    const token = await getPathaoToken(config); // must handle refresh inside

    const res = await axios.get(`${baseUrl}/aladdin/api/v1/merchant/balance`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Store-Id": config.PATHAO_STORE_ID,
        "Accept": "application/json"
      },
      timeout: 5000
    });

    const balance = res.data.data?.balance ?? 0;
    return { balance };
  } catch (err) {
    throw new errors.BAD_REQUEST(`Pathao balance error: ${err.message}`);
  }
};

// --- PAPERFLY ---
exports.getPaperflyBalance = async (config) => {
  try {
    const baseUrl = config.PAPERFLY_BASE_URL.replace(/\/$/, "");

    const res = await axios.get(`${baseUrl}/api/v1/balance`, {
      headers: {
        "api-key": config.PAPERFLY_API_KEY,
        "username": config.PAPERFLY_USER,
        "password": config.PAPERFLY_PASS
      },
      timeout: 5000
    });

    return { balance: res.data.balance || 0 };
  } catch (err) {
    throw new errors.BAD_REQUEST(`Paperfly balance error: ${err.message}`);
  }
};


// --- STEADFAST ---
exports.getSteadfastStatus = async (config, trackingNumber) => {
    const baseUrl = config.STEADFAST_BASE_URL.replace(/\/$/, "");
    const res = await axios.get(`${baseUrl}/status_by_trackingcode/${trackingNumber}`, {
        headers: {
            "Api-Key": config.STEADFAST_API_KEY,
            "Secret-Key": config.STEADFAST_SECRET_KEY
        }
    });
    // NOTE: Steadfast returns "unknown" for merchant-cancelled orders and "in_review" for
    // unprocessed orders. Their public tracking API does NOT expose "cancelled" for
    // merchant-initiated cancellations. This is a Steadfast API limitation — the only
    // workaround is to manually update order status in the admin panel after cancelling
    // in the Steadfast merchant dashboard.
    return {
        raw_status: res.data.delivery_status,
        status_code: res.data.status,
        updated_at: res.data.updated_at || new Date()
    };
};

// --- REDX ---
exports.getRedxStatus = async (config, trackingNumber) => {
    const baseUrl = config.REDX_BASE_URL.replace(/\/$/, "");
    const res = await axios.get(`${baseUrl}/parcel/track/${trackingNumber}`, {
        headers: { "Authorization": `Bearer ${config.REDX_TOKEN}` }
    });
    return {
        raw_status: res.data.tracking_status?.status_name,
        status_code: 200,
        updated_at: res.data.tracking_status?.created_at
    };
};

// --- PATHAO ---
exports.getPathaoStatus = async (config, trackingNumber) => {
  const baseUrl = config.PATHAO_BASE_URL.replace(/\/$/, "");
  const token = await getPathaoToken(config);
  let res;
  try {
    res = await axios.get(`${baseUrl}/aladdin/api/v1/orders/${trackingNumber}/tracking`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
    });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new errors.SERVICE_UNAVAILABLE(`Pathao tracking error (${err.response?.status || 'NETWORK'}): ${msg}`);
  }
  return {
    raw_status: res.data.data?.order_status,
    status_code: 200,
    updated_at: new Date()
  };
};

// --- PAPERFLY ---
exports.getPaperflyStatus = async (config, trackingNumber) => {
  const baseUrl = config.PAPERFLY_BASE_URL.replace(/\/$/, "");
  
  // Paperfly tracking usually returns an array of scan logs
  const res = await axios.get(`${baseUrl}/api/v1/tracking/${trackingNumber}`, {
    headers: {
      "api-key": config.PAPERFLY_API_KEY,
      "username": config.PAPERFLY_USER,
      "password": config.PAPERFLY_PASS, // Some endpoints require password
      "Content-Type": "application/json"
    }
  });

  // Paperfly response often looks like { success: { status_name: 'Picked', ... } }
  // or it returns an array of historical statuses.
  const latestStatus = Array.isArray(res.data.success) 
    ? res.data.success[0]?.status_name 
    : res.data.success?.status_name;

  return {
    raw_status: latestStatus || "Unknown",
    status_code: 200,
    updated_at: res.data.success?.status_time || new Date()
  };
};







exports.getFraudTestResults = async (phone) => {
  try {
    const normalizedPhone = normalizeBdPhone(phone);

    const params = new URLSearchParams();
    params.append('phone', normalizedPhone);

    const { data } = await axios.post(
      FRAUDE_API_URL,
      params,
      {
        headers: {
          Authorization: `Bearer ${FRAUDE_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000 
      }
    );

    // Return the result with a success note
    return {
      success: true,
      ...data,
      system_note: "Fraud check completed successfully",
      checked_at: new Date().toISOString()
    };
  } catch (error) {
     
 return {
      success: false,
      system_note: `Fraud check service was unavailable: ${error.message}`,
      checked_at: new Date().toISOString()
    };
  }
}

exports.dispatchBulkSteadfast = async (orders, config) => {
  const baseUrl = config.STEADFAST_BASE_URL.replace(/\/$/, "");
  
  // Prepare payload array
  const payloadData = orders.map(order => {
    const customerPhone = String(order.customer_phone || "").trim();
    const customerEmail = String(order.customer_email || "").trim();
    const isValidPhone = /^(?:\+?88)?01[3-9]\d{8}$/.test(customerPhone);
    const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
    const hasTypoTld = /\.comb$/i.test(customerEmail);
    const isValidEmail = isValidEmailFormat && !hasTypoTld;

    return {
      invoice: order.id,
      recipient_name: order.customer_name || BRAND_NAME + " User",
      recipient_phone: isValidPhone ? customerPhone : TEST_SSL_PHONE,
      recipient_email: isValidEmail ? customerEmail : GUEST_SSL_EMAIL,
      recipient_address: order.full_address + ", " + order.city,
      cod_amount: order.payment_type === 'cod' ? order.due_amount : 0,
      note: order.note || "",
      weight: order.weight_kg_total || 1.0,
      delivery_type: order.delivery_type ?? 0
    };
  });

  const res = await axios.post(
    `${baseUrl}/create_order/bulk-order`,
    { data: payloadData }, 
    {
      headers: {
        "Api-Key": config.STEADFAST_API_KEY,
        "Secret-Key": config.STEADFAST_SECRET_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data;
};

exports.dispatchBulkPathao = async (orders, config) => {
  const token = await getPathaoToken(config);
  const cleanBaseUrl = config.PATHAO_BASE_URL.replace(/\/$/, "");

  const payloadOrders = orders.map(order => ({
    store_id: config.PATHAO_STORE_ID,
    merchant_order_id: `INV-${order.id}`,
    recipient_name: order.customer_name || BRAND_NAME + " User",
    recipient_phone: normalizeBdPhone(order.customer_phone),
    recipient_address: order.full_address,
    recipient_city: order.pathao_city_id,
    recipient_zone: order.pathao_zone_id,
    recipient_area: order.pathao_area_id,
    delivery_type: 48,
    item_type: 2, // Parcel
    item_quantity: 1, 
    item_weight: Math.max(0.1, Number(order.weight_kg_total) || 1.0),
    amount_to_collect: order.payment_type === 'cod' ? order.due_amount : 0
  }));

  const res = await axios.post(
    `${cleanBaseUrl}/aladdin/api/v1/orders/bulk`,
    { orders: payloadOrders },
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }
  );

  return res.data;
};
