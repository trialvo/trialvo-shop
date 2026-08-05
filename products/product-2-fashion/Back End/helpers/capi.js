/**
 * helpers/capi.js — Facebook Conversions API (Server-Side)
 *
 * HOW IT WORKS:
 * ─────────────
 * 1. Browser fires FB Pixel event (via GTM) with a unique event_id.
 * 2. Frontend sends that same event_id + fbp/fbc cookies to our Express API
 *    as part of the order payload.
 * 3. After a successful payment, Express calls sendCapiEvent() here
 *    WITH THE SAME event_id.
 * 4. Facebook receives both hits, sees matching event_id → deduplicates → counts 1.
 *
 * SECURITY:
 * ─────────
 * - The CAPI Access Token is read from system_config (DB), NEVER from the frontend.
 * - All PII (email, phone) is SHA-256 hashed before being sent to Meta.
 * - This function fires ASYNC and never blocks the API response.
 *
 * REFERENCE:
 * ──────────
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const crypto = require('crypto');
const axios = require('axios');
const { getAnalyticsConfig } = require('../config/AnalyticsConfigDB');

const META_GRAPH_API_VERSION = 'v19.0';
const META_CAPI_ENDPOINT = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

/* ── SHA-256 Hashing ───────────────────────────────────────── */

/**
 * Normalises and SHA-256 hashes a string value for FB Advanced Matching.
 * Returns null if input is empty/null so we can omit missing fields.
 *
 * @param {string|null} value
 * @param {'email'|'phone'|'name'|'generic'} type
 * @returns {string|null}
 */
function hashValue(value, type = 'generic') {
    if (!value) return null;

    let normalised = String(value).trim();

    switch (type) {
        case 'email':
            normalised = normalised.toLowerCase();
            break;
        case 'phone':
            // Strip all non-digit characters, then ensure it starts with country code
            normalised = normalised.replace(/\D/g, '');
            // Bangladesh: 01XXXXXXXXX → 8801XXXXXXXXX
            if (normalised.length === 11 && normalised.startsWith('0')) {
                normalised = '88' + normalised;
            }
            break;
        case 'name':
            normalised = normalised.toLowerCase();
            break;
        default:
            break;
    }

    return crypto.createHash('sha256').update(normalised).digest('hex');
}

/* ── Config Loader ─────────────────────────────────────────── */

/**
 * Loads the FB CAPI config from the analytics_config JSON blob.
 * Single source of truth — same table the frontend reads from.
 *
 * @param {import('../utils/connection').Connection} connection
 * @returns {Promise<{pixelId:string, accessToken:string, testEventCode:string, enabled:boolean}|null>}
 */
async function loadCapiConfig(connection) {
    try {
        const config = await getAnalyticsConfig(connection);

        const pixel = config?.analytics?.facebook_pixel;
        const capi  = pixel?.conversion_api;

        // Check if CAPI is enabled
        if (!capi?.enabled) return null;

        // Must have pixel ID and access token
        if (!pixel?.pixel_id || !capi?.access_token) return null;

        return {
            enabled: true,
            pixelId: pixel.pixel_id,
            accessToken: capi.access_token,
            testEventCode: capi.test_event_code || null,
        };
    } catch (err) {
        console.warn('[CAPI] Failed to load config:', err.message);
        return null;
    }
}

/* ── Core Sender ───────────────────────────────────────────── */

/**
 * Sends a server-side event to Facebook Conversions API.
 * This function is FIRE-AND-FORGET — it does NOT throw or block.
 *
 * @param {import('../utils/connection').Connection} connection - DB connection for config
 * @param {string} eventName - e.g. 'Purchase', 'CompleteRegistration'
 * @param {object} eventData
 * @param {string} eventData.event_id       - Must match the browser Pixel event_id for deduplication
 * @param {number} [eventData.value]        - Order total
 * @param {string} [eventData.currency]     - ISO currency code, default 'BDT'
 * @param {string} [eventData.order_id]     - External reference (order ID)
 * @param {string[]} [eventData.content_ids]  - Array of product SKU IDs
 * @param {string} [eventData.content_type]   - 'product' or 'product.group'
 * @param {object} userData
 * @param {string} [userData.email]         - Raw email (will be hashed)
 * @param {string} [userData.phone]         - Raw phone (will be hashed)
 * @param {string} [userData.first_name]    - Raw first name (will be hashed)
 * @param {string} [userData.last_name]     - Raw last name (will be hashed)
 * @param {string} [userData.fbp]           - Facebook _fbp cookie value
 * @param {string} [userData.fbc]           - Facebook _fbc cookie value
 * @param {string} [userData.external_id]   - User ID from your DB (will be hashed)
 * @param {object} serverData
 * @param {string} [serverData.client_ip_address]  - From req.ip
 * @param {string} [serverData.client_user_agent]  - From req.headers['user-agent']
 */
exports.sendCapiEvent = async (connection, eventName, eventData = {}, userData = {}, serverData = {}) => {
    // Fire async — wrap everything so we never throw and never block a response
    (async () => {
        try {
            const config = await loadCapiConfig(connection);
            if (!config) return; // CAPI disabled or misconfigured

            // Build user_data object with hashed PII
            const user_data = {};

            const hashedEmail = hashValue(userData.email, 'email');
            const hashedPhone = hashValue(userData.phone, 'phone');
            const hashedFName = hashValue(userData.first_name, 'name');
            const hashedLName = hashValue(userData.last_name, 'name');
            const hashedExtId = hashValue(userData.external_id, 'generic');

            if (hashedEmail)          user_data.em = [hashedEmail];
            if (hashedPhone)          user_data.ph = [hashedPhone];
            if (hashedFName)          user_data.fn = [hashedFName];
            if (hashedLName)          user_data.ln = [hashedLName];
            if (hashedExtId)          user_data.external_id = [hashedExtId];
            if (userData.fbp)         user_data.fbp = userData.fbp;
            if (userData.fbc)         user_data.fbc = userData.fbc;
            if (serverData.client_ip_address) user_data.client_ip_address = serverData.client_ip_address;
            if (serverData.client_user_agent) user_data.client_user_agent = serverData.client_user_agent;

            // Build custom_data (ecommerce event data)
            const custom_data = {};
            if (eventData.value !== undefined)       custom_data.value = Number(eventData.value);
            if (eventData.currency)                  custom_data.currency = eventData.currency;
            if (eventData.order_id)                  custom_data.order_id = String(eventData.order_id);
            if (eventData.content_ids?.length)       custom_data.content_ids = eventData.content_ids;
            if (eventData.content_type)              custom_data.content_type = eventData.content_type;

            const payload = {
                data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        event_id: eventData.event_id || `sv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                        event_source_url: eventData.event_source_url || null,
                        action_source: 'website',
                        user_data,
                        custom_data,
                    },
                ],
            };

            // Include test event code if set (for Meta Events Manager debugging)
            if (config.testEventCode) {
                payload.test_event_code = config.testEventCode;
            }

            const url = `${META_CAPI_ENDPOINT}/${config.pixelId}/events?access_token=${config.accessToken}`;

            const response = await axios.post(url, payload, {
                timeout: 10000, // 10s timeout — don't hang the server
            });

            console.log(`[CAPI] ${eventName} sent. events_received: ${response.data?.events_received || '?'} | fbtrace_id: ${response.data?.fbtrace_id || '?'}`);

        } catch (err) {
            // NEVER throw — CAPI failure should not affect order processing
            const apiError = err.response?.data?.error?.message || err.message;
            console.error(`[CAPI] ${eventName} failed:`, apiError);
        }
    })();
};

/* ── Purchase Event Helper ─────────────────────────────────── */

/**
 * Convenience wrapper: fire a Purchase CAPI event after a successful payment.
 * Call this inside processSuccessfulPayment, AFTER the DB commit.
 *
 * @param {import('../utils/connection').Connection} connection
 * @param {object} order - Full order row from DB
 * @param {object} opts
 * @param {string} [opts.fbp]
 * @param {string} [opts.fbc]
 * @param {string} [opts.event_id]  - capi_event_id stored on the order
 * @param {string} [opts.client_ip]
 * @param {string} [opts.client_ua]
 */
exports.sendPurchaseCapiEvent = (connection, order, opts = {}) => {
    exports.sendCapiEvent(
        connection,
        'Purchase',
        {
            event_id: opts.event_id || order.capi_event_id,
            value: order.grand_total,
            currency: 'BDT',
            order_id: String(order.id),
            content_ids: [], // Populated by caller if item SKU IDs are available
            content_type: 'product',
        },
        {
            email: order.customer_email,
            phone: order.customer_phone || order.phone,
            external_id: order.user_id ? String(order.user_id) : undefined,
            fbp: opts.fbp || order.fbp,
            fbc: opts.fbc || order.fbc,
        },
        {
            client_ip_address: opts.client_ip,
            client_user_agent: opts.client_ua,
        }
    );
};

/* ── Registration Event Helper ─────────────────────────────── */

/**
 * Convenience wrapper: fire a CompleteRegistration CAPI event.
 *
 * @param {import('../utils/connection').Connection} connection
 * @param {object} user - User row from DB
 * @param {object} opts
 */
exports.sendRegistrationCapiEvent = (connection, user, opts = {}) => {
    exports.sendCapiEvent(
        connection,
        'CompleteRegistration',
        {
            event_id: opts.event_id,
            currency: 'BDT',
            value: 0,
        },
        {
            email: user.email,
            phone: user.phone,
            first_name: user.first_name || user.name,
            external_id: String(user.id),
            fbp: opts.fbp,
            fbc: opts.fbc,
        },
        {
            client_ip_address: opts.client_ip,
            client_user_agent: opts.client_ua,
        }
    );
};
