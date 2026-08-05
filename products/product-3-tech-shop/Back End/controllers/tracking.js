/**
 * CAPI Tracking Controller
 *
 * Provides server-side Facebook CAPI event endpoints.
 * These are called when the browser cannot reliably fire the Pixel
 * (ad-blockers, Brave, iOS ITP, etc.).
 *
 * EVENT DEDUPLICATION:
 * The browser fires fbq("track", ...) via GTM with a specific event_id.
 * The API also sends the same event to Meta CAPI with the same event_id.
 * Meta deduplicates: only one conversion is counted.
 *
 * SECURITY:
 * - The CAPI Access Token never leaves the server.
 * - PII (email, phone) is SHA-256 hashed before sending to Meta.
 * - Endpoints accept cookies (fbp, fbc) from the client for attribution.
 */

const { api, auth } = require("../helpers/common");
const errors = require("../helpers/errors");
const {
  sendPurchaseCapiEvent,
  sendCompleteRegistrationCapiEvent,
} = require("../helpers/capi");

/* ── POST /api/v1/track/purchase ─────────────────────────────
   Called from the frontend after an order is successfully placed.
   Ensures we fire CAPI even if the browser Pixel was blocked.

   Body:
     order_id         (int, required)
     event_id         (string, required)  — must match the client-side event_id
     value            (float, required)
     currency         (string, optional, default "BDT")
     fbp              (string, optional)  — _fbp cookie
     fbc              (string, optional)  — _fbc cookie
──────────────────────────────────────────────────────────────── */
exports.trackPurchase = api(
  {
    body: {
      order_id:  { type: "int",    required: true  },
      event_id:  { type: "string", required: true  },
      value:     { type: "float",  required: true  },
      currency:  { type: "string", required: false },
      fbp:       { type: "string", required: false },
      fbc:       { type: "string", required: false },
    },
  },
  async (req, connection) => {
    const { order_id, event_id, value, currency, fbp, fbc } = req.typed.body;

    // Verify the order actually exists and get customer PII for advanced matching
    const order = await connection.queryOne(
      `SELECT o.id, o.customer_email, o.customer_phone, o.grand_total,
              o.capi_event_id
       FROM orders o
       WHERE o.id = ?`,
      [order_id]
    );

    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    // Use stored event_id from the order row if none provided
    const capiEventId = event_id || order.capi_event_id;
    if (!capiEventId) {
      throw new errors.BAD_REQUEST("event_id is required for deduplication");
    }

    // Fire CAPI asynchronously — don't block the response
    setImmediate(async () => {
      try {
        await sendPurchaseCapiEvent(connection, {
          order_id,
          event_id: capiEventId,
          value: value || order.grand_total,
          currency: currency || "BDT",
          fbp: fbp || null,
          fbc: fbc || null,
          email: order.customer_email,
          phone: order.customer_phone,
          client_ip_address: req.ip,
          client_user_agent: req.headers["user-agent"],
        });
      } catch (err) {
        console.error("[CAPI] /track/purchase error:", err.message);
      }
    });

    return { success: true, message: "Purchase event queued for CAPI" };
  }
);

/* ── POST /api/v1/track/registration ─────────────────────────
   Called after a user successfully registers.
   Fires server-side CompleteRegistration to Meta CAPI.

   Body:
     user_id    (int,    optional)
     event_id   (string, required)
     email      (string, optional)
     phone      (string, optional)
     fbp        (string, optional)
     fbc        (string, optional)
──────────────────────────────────────────────────────────────── */
exports.trackRegistration = api(
  {
    body: {
      user_id:  { type: "int",    required: false },
      event_id: { type: "string", required: true  },
      email:    { type: "string", required: false },
      phone:    { type: "string", required: false },
      fbp:      { type: "string", required: false },
      fbc:      { type: "string", required: false },
    },
  },
  async (req, connection) => {
    const { user_id, event_id, email, phone, fbp, fbc } = req.typed.body;

    if (!event_id) {
      throw new errors.BAD_REQUEST("event_id is required for deduplication");
    }

    // If user_id given, look up PII from DB (more reliable than frontend-sent PII)
    let resolvedEmail = email;
    let resolvedPhone = phone;

    if (user_id) {
      const user = await connection.queryOne(
        `SELECT u.email, up.phone_number
         FROM users u
         LEFT JOIN user_phones up ON up.user_id = u.id AND up.is_verified = 1
         WHERE u.id = ?
         LIMIT 1`,
        [user_id]
      );
      if (user) {
        resolvedEmail = user.email || email;
        resolvedPhone = user.phone_number || phone;
      }
    }

    setImmediate(async () => {
      try {
        await sendCompleteRegistrationCapiEvent(connection, {
          event_id,
          email: resolvedEmail,
          phone: resolvedPhone,
          fbp: fbp || null,
          fbc: fbc || null,
          client_ip_address: req.ip,
          client_user_agent: req.headers["user-agent"],
        });
      } catch (err) {
        console.error("[CAPI] /track/registration error:", err.message);
      }
    });

    return { success: true, message: "Registration event queued for CAPI" };
  }
);
