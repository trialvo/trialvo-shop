const cron = require("node-cron");
const database = require("../utils/connection");
const { getConfig } = require('../config/ApplicationSettingsDB');
const { getSteadfastStatus, getPathaoStatus, getRedxStatus, getPaperflyStatus } = require("../helpers/courier");

// Run once daily at 2:00 AM as a reconciliation sweep.
// Webhooks are the primary real-time mechanism; this catches any missed webhook deliveries.
cron.schedule("0 2 * * *", async () => {
  console.log("[Cron] Nightly Courier Status Reconciliation...");
  let connection;

  try {
    connection = await database.getConnection();
    
    // Get all orders that are dispatched but not yet in a terminal state
    const activeOrders = await connection.query(`
      SELECT o.id, o.order_status, c.courier_provider, c.tracking_number 
      FROM orders o
      JOIN order_couriers c ON o.id = c.order_id
      WHERE o.order_status IN ('shipped', 'out_for_delivery')
        AND c.tracking_number IS NOT NULL
      ORDER BY o.id DESC
      LIMIT 100
    `);

    if (activeOrders.length === 0) {
      return connection.release();
    }

    // Load configs
    const cfgRows = await getConfig(connection, true, "courier");
    const configs = {};
    for (const r of cfgRows) {
      if (!r.provider) continue;
      if (!configs[r.provider]) configs[r.provider] = {};
      configs[r.provider][r.key_name] = r.value;
    }

    let updatedCount = 0;

    for (const order of activeOrders) {
      try {
        let courierStatus = null;
        const provider = order.courier_provider;
        
        if (provider === "steadfast") courierStatus = await getSteadfastStatus(configs.steadfast, order.tracking_number);
        else if (provider === "pathao") courierStatus = await getPathaoStatus(configs.pathao, order.tracking_number);
        else if (provider === "redx") courierStatus = await getRedxStatus(configs.redx, order.tracking_number);
        else if (provider === "paperfly") courierStatus = await getPaperflyStatus(configs.paperfly, order.tracking_number);

        if (!courierStatus || !courierStatus.raw_status) continue;

        const rawStatus = (courierStatus.raw_status || "Unknown").toLowerCase();
        let mappedStatus = null;

        if (provider === "steadfast") {
            if (['delivered', 'partial_delivered'].includes(rawStatus)) mappedStatus = "delivered";
            if (['out_for_delivery'].includes(rawStatus)) mappedStatus = "out_for_delivery";
            if (['return_in_progress', 'returned', 'cancelled'].includes(rawStatus)) mappedStatus = "returned";
        } else if (provider === "pathao") {
            if (rawStatus === "delivered") mappedStatus = "delivered";
            if (rawStatus === "delivery in progress") mappedStatus = "out_for_delivery";
            if (rawStatus.includes("return")) mappedStatus = "returned";
        } else if (provider === "redx") {
            if (rawStatus === "delivered") mappedStatus = "delivered";
            if (rawStatus === "returning" || rawStatus === "returned") mappedStatus = "returned";
        } else if (provider === "paperfly") {
            if (rawStatus === "delivery_partial" || rawStatus === "delivery_done") mappedStatus = "delivered";
            if (rawStatus === "return_done") mappedStatus = "returned";
        }

        // Check if history already has this raw status for this order (dedup by note prefix)
        const existingHistory = await connection.queryOne(`
          SELECT id FROM order_status_history 
          WHERE order_id = ? AND new_status = ? AND note LIKE ?
          ORDER BY id DESC LIMIT 1
        `, [order.id, mappedStatus || order.order_status, `[${provider}] Cron:%`]);

        if (!existingHistory) {
          await connection.query(`
            INSERT INTO order_status_history (order_id, old_status, new_status, note, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [order.id, order.order_status, mappedStatus || order.order_status, `[${provider}] Cron: ${courierStatus.raw_status}`]);
        }

        if (mappedStatus && mappedStatus !== order.order_status) {
          await connection.query(`UPDATE orders SET order_status = ? WHERE id = ?`, [mappedStatus, order.id]);
          updatedCount++;
        }

      } catch (e) {
        // Skip individual errors
        console.error(`[Cron Sync] Error syncing order ${order.id}:`, e.message);
      }
    }

    console.log(`[Cron] Sync complete. Updated ${updatedCount} orders.`);

  } catch (err) {
    console.error("[Cron] Global Error in Tracking Sync:", err);
  } finally {
    if (connection) connection.release();
  }
}, {
  timezone: "Asia/Dhaka"
});
