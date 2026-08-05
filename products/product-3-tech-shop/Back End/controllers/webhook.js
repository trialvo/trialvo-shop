const database = require("../utils/connection");
const { getConfig } = require("../config/ApplicationSettingsDB");
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');

// ─────────────────────────────────────────────────────────────────────────────
// STATUS MAPPING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map Steadfast delivery statuses to our internal order statuses.
 * Steadfast statuses: pending, pickup_in_progress, picked_up, sorting,
 *   in_transit, out_for_delivery, delivered, partial_delivered,
 *   return_in_progress, returned, cancelled
 */
function mapSteadfastStatus(sfStatus) {
  const s = (sfStatus || "").toLowerCase().trim();
  if (["delivered", "partial_delivered"].includes(s)) return "delivered";
  if (s === "out_for_delivery") return "out_for_delivery";
  if (["in_transit", "sorting", "picked_up", "pickup_in_progress"].includes(s)) return "shipped";
  if (["return_in_progress", "returned"].includes(s)) return "returned";
  if (s === "cancelled") return "cancelled";          // ← was incorrectly mapped to "returned"
  return null; // unknown — no status change needed
}

/**
 * Map Pathao event names to our internal order statuses.
 * Key Pathao events: order.created, order.updated, order.delivered,
 *   order.partial_delivered, order.returned, order.delivery_failed,
 *   order.on_hold, pickup.requested, pickup.assigned, pickup.done,
 *   at_sorting_hub, in_transit, received_at_hub, assigned_for_delivery
 */
function mapPathaoEvent(event) {
  const e = (event || "").toLowerCase().trim();
  if (e === "order.delivered" || e === "order.partial_delivered") return "delivered";
  if (e === "order.returned" || e === "order.delivery_failed" || e === "paid_return") return "returned";
  if (e === "order.cancelled" || e === "order.pickup-cancelled") return "cancelled";
  if (e === "order.on_hold") return "on_hold";
  if (e === "assigned_for_delivery") return "out_for_delivery";
  if (["in_transit", "at_sorting_hub", "received_at_hub", "pickup.done"].includes(e)) return "shipped";
  if (["pickup.requested", "pickup.assigned", "order.created", "order.updated"].includes(e)) return "processing";
  return null; // no actionable status change
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Look up order_id by consignment/tracking number or merchant_order_id
// ─────────────────────────────────────────────────────────────────────────────
async function findOrderId(connection, consignmentId, merchantOrderId) {
  // 1. Try via order_couriers table (tracking_number = consignment_id)
  if (consignmentId) {
    const row = await connection.queryOne(
      `SELECT order_id FROM order_couriers WHERE tracking_number = ? LIMIT 1`,
      [String(consignmentId)]
    );
    if (row) return row.order_id;
  }

  // 2. Fallback: merchant_order_id may be "INV-123" or "123"
  if (merchantOrderId) {
    const raw = String(merchantOrderId).replace(/^INV-/i, "").trim();
    const numericId = parseInt(raw, 10);
    if (!isNaN(numericId) && numericId > 0) {
      const order = await connection.queryOne(
        `SELECT id FROM orders WHERE id = ? LIMIT 1`,
        [numericId]
      );
      if (order) return order.id;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Record status history + optionally update order_status
// ─────────────────────────────────────────────────────────────────────────────
async function recordStatusChange(connection, orderId, mappedStatus, note) {
  const curr = await connection.queryOne(
    `SELECT order_status FROM orders WHERE id = ?`,
    [orderId]
  );
  const oldStatus = curr?.order_status || null;

  // Only update if we have a mapped status AND the order is not already in a terminal state
  const TERMINAL = ["delivered", "returned", "cancelled"];
  if (mappedStatus && !TERMINAL.includes(oldStatus)) {
    await connection.query(
      `UPDATE orders SET order_status = ? WHERE id = ?`,
      [mappedStatus, orderId]
    );
  }

  const effectiveNew = mappedStatus || oldStatus || "shipped";
  await connection.query(
    `INSERT INTO order_status_history (order_id, old_status, new_status, note, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [orderId, oldStatus, effectiveNew, note]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WEBHOOK HANDLER — Raw Express handler (not using api() wrapper)
// We need direct access to `res` for the Pathao handshake (202 + custom header)
// ─────────────────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  const provider = (req.params.provider || "").toLowerCase();
  const body = req.body || {};

  let connection;
  try {
    connection = await database.getConnection();

    // ── Load courier config for this provider from DB ──
    const configRows = await getConfig(connection, false, "courier");
    const courierConfig = {};
    for (const row of configRows) {
      if (row.provider === provider) {
        courierConfig[row.key_name] = row.value;
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // STEADFAST WEBHOOK
    //
    // Two notification_type values:
    //   "delivery_status"  — actual delivery status update
    //   "tracking_update"  — sub-status / note only (no core status change)
    //
    // Payload: { notification_type, consignment_id, invoice, status,
    //            tracking_message, updated_at, cod_amount, delivery_charge }
    //
    // Auth: Authorization: Bearer <jwt-token>
    //   → configured in Steadfast webhook settings, stored as STEADFAST_WEBHOOK_SECRET
    // ───────────────────────────────────────────────────────────────────────
    if (provider === "steadfast") {
      const webhookSecret = courierConfig.STEADFAST_WEBHOOK_SECRET;

      if (webhookSecret && webhookSecret.trim()) {
        const authHeader = req.headers["authorization"] || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
        if (!token || token !== webhookSecret.trim()) {
          console.warn("[Webhook steadfast] Invalid Authorization token");
          await connection.release();
          return res.status(200).json({ success: false, message: "Unauthorized" });
        }
      }

      const notificationType = body.notification_type || "delivery_status";
      const consignmentId    = body.consignment_id != null ? String(body.consignment_id) : null;
      const invoice          = body.invoice != null ? String(body.invoice) : null;
      const sfStatus         = body.status || "";
      const trackingMessage  = body.tracking_message || null;

      const orderId = await findOrderId(connection, consignmentId, invoice);
      if (!orderId) {
        console.warn(`[Webhook steadfast] Order not found — consignment_id=${consignmentId} invoice=${invoice}`);
        await connection.release();
        return res.status(200).json({ success: true, message: "Acknowledged — order not found" });
      }

      await connection.beginTransaction();
      if (notificationType === "tracking_update") {
        // Sub-status note only — do not change core order status
        const note = `[steadfast:tracking] ${trackingMessage || sfStatus || "Update"}`;
        await recordStatusChange(connection, orderId, null, note);
      } else {
        // delivery_status — map and update
        const mappedStatus = mapSteadfastStatus(sfStatus);
        const note = `[steadfast] ${sfStatus}${trackingMessage ? " — " + trackingMessage : ""}`;
        await recordStatusChange(connection, orderId, mappedStatus, note);
      }
      await connection.commit();
      await connection.release();

      bumpOrderEventVersion();
      return res.status(200).json({ success: true, message: "Steadfast webhook processed" });
    }

    // ───────────────────────────────────────────────────────────────────────
    // PATHAO WEBHOOK
    //
    // HANDSHAKE: POST body = { "event": "webhook_integration" }
    //   → Respond HTTP 202 with header:
    //     X-Pathao-Merchant-Webhook-Integration-Secret: <your-secret>
    //
    // ACTUAL EVENTS: Common payload fields:
    //   consignment_id, merchant_order_id, updated_at, store_id, event
    //
    // Signature: X-PATHAO-Signature header = webhook_secret value
    // ───────────────────────────────────────────────────────────────────────
    if (provider === "pathao") {
      const webhookSecret = courierConfig.PATHAO_WEBHOOK_SECRET;

      // ── HANDSHAKE ──
      if (body.event === "webhook_integration") {
        if (webhookSecret && webhookSecret.trim()) {
          res.setHeader("X-Pathao-Merchant-Webhook-Integration-Secret", webhookSecret.trim());
        }
        await connection.release();
        return res.status(202).json({ success: true, message: "Handshake accepted" });
      }

      // ── SIGNATURE VALIDATION for real events ──
      if (webhookSecret && webhookSecret.trim()) {
        const signature = req.headers["x-pathao-signature"] || "";
        if (signature !== webhookSecret.trim()) {
          console.warn(`[Webhook pathao] Invalid X-PATHAO-Signature`);
          await connection.release();
          return res.status(200).json({ success: false, message: "Invalid signature" });
        }
      }

      const event         = body.event || "";
      const consignmentId = body.consignment_id != null ? String(body.consignment_id) : null;
      const merchantId    = body.merchant_order_id != null ? String(body.merchant_order_id) : null;

      if (!event) {
        console.warn("[Webhook pathao] Missing event field in payload");
        await connection.release();
        return res.status(200).json({ success: true, message: "Acknowledged — no event" });
      }

      // Skip non-order events
      if (!event.startsWith("order.") && !event.startsWith("pickup.") && !["in_transit", "at_sorting_hub", "received_at_hub", "assigned_for_delivery", "paid_return"].includes(event)) {
        console.log(`[Webhook pathao] Skipping non-order event: ${event}`);
        await connection.release();
        return res.status(200).json({ success: true, message: "Acknowledged" });
      }

      const orderId = await findOrderId(connection, consignmentId, merchantId);
      if (!orderId) {
        console.warn(`[Webhook pathao] Order not found — consignment_id=${consignmentId} merchant_order_id=${merchantId}`);
        await connection.release();
        return res.status(200).json({ success: true, message: "Acknowledged — order not found" });
      }

      const mappedStatus = mapPathaoEvent(event);
      const reason       = body.reason ? ` — ${body.reason}` : "";
      const note         = `[pathao] ${event}${reason}`;

      await connection.beginTransaction();
      await recordStatusChange(connection, orderId, mappedStatus, note);
      await connection.commit();
      await connection.release();

      bumpOrderEventVersion();
      return res.status(200).json({ success: true, message: "Pathao webhook processed" });
    }

    // Unknown provider
    await connection.release();
    return res.status(400).json({ success: false, error: `Webhook not supported for provider: ${provider}` });

  } catch (err) {
    console.error("[Webhook] Unhandled error:", err);
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
      try { await connection.release(); } catch (_) {}
    }
    // Always return 200 to prevent courier retry storm
    return res.status(200).json({ success: false, message: "Internal error" });
  }
};
