// V2-017 Order Distribution & Assignment Controller — updated
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');
const database = require('../utils/connection');
const { sendAdminOrderNotification, sendOrderAssignmentNotification, sendPersonalNotification } = require('../helpers/notify');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');


/**
 * V2-017: Order Distribution & Assignment Controller
 * Manages distribution agents, settings, and order assignment (auto/manual/redistribute)
 */

// ═══════════════ NOTIFICATION HELPER ═══════════════

/**
 * Thin wrapper — delegates to the direct assignment notification pipeline.
 * Uses the adminId parameter directly so it is safe to call while the
 * caller's DB transaction is still open (avoids REPEATABLE READ race).
 */
async function sendAssignmentNotification(assignedAdminId, orderId) {
  sendOrderAssignmentNotification(assignedAdminId, orderId);
}


// ═══════════════ DISTRIBUTION SETTINGS ═══════════════

exports.getDistributionSettings = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const settings = await connection.queryOne(
      `SELECT * FROM order_distribution_settings WHERE id = 1`
    );

    return { success: true, data: settings || null };
  })
);

exports.updateDistributionSettings = api(
  {
    body: {
      auto_assign_enabled: { type: "bool", required: false },
      assign_on_order_create: { type: "bool", required: false },
      include_admin_role: { type: "bool", required: false },
      include_order_manager_role: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { auto_assign_enabled, assign_on_order_create, include_admin_role, include_order_manager_role } = req.typed.body;

    const updates = [];
    const values = [];

    if (auto_assign_enabled !== undefined) {
      updates.push("auto_assign_enabled = ?");
      values.push(auto_assign_enabled ? 1 : 0);
    }
    if (assign_on_order_create !== undefined) {
      updates.push("assign_on_order_create = ?");
      values.push(assign_on_order_create ? 1 : 0);
    }
    if (include_admin_role !== undefined) {
      updates.push("include_admin_role = ?");
      values.push(include_admin_role ? 1 : 0);
    }
    if (include_order_manager_role !== undefined) {
      updates.push("include_order_manager_role = ?");
      values.push(include_order_manager_role ? 1 : 0);
    }

    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED("No changes provided.");

    await connection.query(
      `UPDATE order_distribution_settings SET ${updates.join(", ")}, updated_by_admin = ?, updated_at = NOW() WHERE id = ?`,
      [...values, adminInfo.id, 1]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_DISTRIBUTION_SETTINGS', 'order_distribution_settings', 1, ?)`,
      [adminInfo.id, JSON.stringify({ auto_assign_enabled, assign_on_order_create, include_admin_role, include_order_manager_role })]
    );

    return { success: true, message: "Distribution settings updated." };
  })
);

// ═══════════════ UNASSIGN ACTIVE ORDERS HELPER ═══════════════

/**
 * When an admin is removed or deactivated from the distribution pool,
 * bulk-unassign ALL their active (non-terminal) orders so they become
 * available for reassignment / redistribute.
 *
 * Returns the number of orders that were freed.
 */
async function unassignActiveOrders(connection, adminId, changedByAdminId) {
  const TERMINAL = `'delivered','cancelled','returned','trash'`;

  // 1. Fetch the IDs of orders we are about to free
  const orders = await connection.query(
    `SELECT id FROM orders
     WHERE assigned_to_admin_id = ?
       AND order_status NOT IN (${TERMINAL})`,
    [adminId]
  );

  if (!orders.length) return 0;

  // 2. Bulk unassign
  await connection.query(
    `UPDATE orders
     SET assigned_to_admin_id = NULL,
         assigned_by_admin_id = NULL,
         assignment_method    = NULL,
         assigned_at          = NULL
     WHERE assigned_to_admin_id = ?
       AND order_status NOT IN (${TERMINAL})`,
    [adminId]
  );

  // 3. Write one audit-log row per order
  for (const order of orders) {
    await connection.query(
      `INSERT INTO order_assignment_logs
         (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id, note)
       VALUES (?, 'unassign', ?, NULL, ?, 'Admin removed or deactivated from distribution pool')`,
      [order.id, adminId, changedByAdminId]
    );
  }

  return orders.length;
}

// ═══════════════ ELIGIBLE ADMINS (for pool UI) ═══════════════

exports.getEligibleAdmins = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    // Return all active admins with ADMIN or ORDER_MANAGER role, PLUS the requesting
    // admin's own account (so a SUPER_ADMIN can add themselves to the pool).
    // Other SUPER_ADMINs are NOT shown.
    // Pre-aggregate counts into derived tables — avoids correlated-subquery
    // scope loss inside GROUP BY (MariaDB resolves outer aliases unreliably).
    const admins = await connection.query(`
      SELECT
        a.id,
        CONCAT(a.first_name, ' ', IFNULL(a.last_name,'')) AS admin_name,
        a.email,
        a.profile_img_path,
        a.is_active,
        r.name  AS role_name,
        r.id    AS role_id,
        da.id   AS pool_id,
        da.serial,
        da.max_active_orders,
        da.auto_assign_enabled AS pool_auto_assign,
        da.status              AS pool_status,
        IFNULL(ao.active_order_count,    0) AS active_order_count,
        IFNULL(ta.today_assigned_count,  0) AS today_assigned_count,
        IFNULL(tc.today_completed_count, 0) AS today_completed_count,
        IFNULL(tot.total_assigned_count, 0) AS total_assigned_count
      FROM admins a
      JOIN admin_roles ar ON ar.admin_id = a.id
      JOIN roles r        ON r.id = ar.role_id
      LEFT JOIN order_distribution_agents da ON da.admin_id = a.id
      /* orders admin still has pending work on (not yet shipped or resolved) */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS active_order_count
        FROM   orders
        WHERE  order_status NOT IN ('shipped','out_for_delivery','delivered','cancelled','returned','trash')
          AND  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
        GROUP  BY assigned_to_admin_id
      ) ao ON ao.assigned_to_admin_id = a.id
      /* orders assigned into this admin's queue today */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS today_assigned_count
        FROM   orders
        WHERE  DATE(assigned_at) = CURDATE()
          AND  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
        GROUP  BY assigned_to_admin_id
      ) ta ON ta.assigned_to_admin_id = a.id
      /* orders admin dispatched or resolved today — 'shipped' = admin's job done */
      LEFT JOIN (
        SELECT changed_by_admin,
               COUNT(DISTINCT order_id) AS today_completed_count
        FROM   order_status_history
        WHERE  new_status IN ('shipped','cancelled','returned','trash')
          AND  DATE(created_at) = CURDATE()
          AND  changed_by_admin IS NOT NULL
        GROUP  BY changed_by_admin
      ) tc ON tc.changed_by_admin = a.id
      /* lifetime total orders ever assigned to this admin */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS total_assigned_count
        FROM   orders
        WHERE  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
        GROUP  BY assigned_to_admin_id
      ) tot ON tot.assigned_to_admin_id = a.id
      WHERE a.is_active = 1
        AND a.deleted_at IS NULL
        AND (
          r.name IN ('ADMIN', 'ORDER_MANAGER')
          OR a.id = ?
        )
      ORDER BY r.name ASC, a.first_name ASC
    `, [adminInfo.id]);

    return { success: true, data: admins };
  })
);

// ═══════════════ DISTRIBUTION AGENTS ═══════════════

exports.getDistributionAgents = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const agents = await connection.query(
      `SELECT da.*,
              CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) AS admin_name,
              a.email AS admin_email,
              /* orders admin still has pending work on */
              (SELECT COUNT(*) FROM orders o
               WHERE o.assigned_to_admin_id = da.admin_id
                 AND o.order_status NOT IN ('shipped','out_for_delivery','delivered','cancelled','returned','trash')
                 AND o.deleted_at IS NULL) AS active_order_count,
              /* orders assigned into queue today */
              (SELECT COUNT(*) FROM orders o
               WHERE o.assigned_to_admin_id = da.admin_id
                 AND DATE(o.assigned_at) = CURDATE()
                 AND o.deleted_at IS NULL) AS today_assigned_count,
              /* orders admin dispatched or resolved today ('shipped' = admin job done) */
              (SELECT COUNT(DISTINCT osh.order_id) FROM order_status_history osh
               WHERE osh.changed_by_admin = da.admin_id
                 AND osh.new_status IN ('shipped','cancelled','returned','trash')
                 AND DATE(osh.created_at) = CURDATE()) AS today_completed_count,
              /* lifetime total orders ever assigned */
              (SELECT COUNT(*) FROM orders o
               WHERE o.assigned_to_admin_id = da.admin_id
                 AND o.deleted_at IS NULL) AS total_assigned_count
       FROM order_distribution_agents da
       JOIN admins a ON a.id = da.admin_id AND a.deleted_at IS NULL AND a.is_active = 1
       ORDER BY da.serial ASC, da.id ASC`
    );

    return { success: true, data: agents };
  })
);

exports.addDistributionAgent = api(
  {
    body: {
      admin_id: { type: "int", required: true },
      serial: { type: "int", required: false, default: 1 },
      max_active_orders: { type: "int", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { admin_id, serial, max_active_orders } = req.typed.body;

    // Verify admin exists, active, not deleted
    const admin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [admin_id]
    );
    if (!admin) throw new errors.NOT_FOUND("Admin not found or inactive.");

    // Check not already in pool
    const existing = await connection.queryOne(
      `SELECT id FROM order_distribution_agents WHERE admin_id = ?`,
      [admin_id]
    );
    if (existing) throw new errors.INVALID_FIELDS_PROVIDED("Admin is already in the distribution pool.");

    const result = await connection.query(
      `INSERT INTO order_distribution_agents (admin_id, serial, max_active_orders)
       VALUES (?, ?, ?)`,
      [admin_id, serial, max_active_orders || null]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'ADD_DISTRIBUTION_AGENT', 'order_distribution_agents', ?, ?)`,
      [adminInfo.id, result.insertId, JSON.stringify({ admin_id, serial, max_active_orders })]
    );

    // Notify the added admin (personal notification)
    sendPersonalNotification(
      connection, admin_id,
      'You have been added to the Order Distribution Pool',
      'You have been added to the order distribution pool and will start receiving auto-assigned orders. Please ensure your workload is manageable.',
      { type: 'pool_added' }
    );

    return {
      success: true,
      message: "Agent added to distribution pool.",
      data: { id: result.insertId }
    };
  })
);


exports.editDistributionAgent = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      serial: { type: "int", required: false },
      max_active_orders: { type: "int", required: false },
      status: { type: "bool", required: false },
      auto_assign_enabled: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const agentId = req.typed.params.id;
    const { serial, max_active_orders, status, auto_assign_enabled } = req.typed.body;

    const updates = [];
    const values = [];

    if (serial !== undefined) { updates.push("serial = ?"); values.push(serial); }
    if (max_active_orders !== undefined) { updates.push("max_active_orders = ?"); values.push(max_active_orders); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status ? 1 : 0); }
    if (auto_assign_enabled !== undefined) { updates.push("auto_assign_enabled = ?"); values.push(auto_assign_enabled ? 1 : 0); }

    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED("No changes provided.");

    // Resolve the admin_id for this agent (needed for order unassignment)
    const agent = await connection.queryOne(
      `SELECT admin_id FROM order_distribution_agents WHERE id = ?`, [agentId]
    );
    if (!agent) throw new errors.NOT_FOUND("Agent not found.");

    values.push(agentId);
    const result = await connection.query(
      `UPDATE order_distribution_agents SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) throw new errors.NOT_FOUND("Agent not found.");

    // If agent was deactivated, free their active orders
    let freedCount = 0;
    if (status === false || status === 0) {
      freedCount = await unassignActiveOrders(connection, agent.admin_id, adminInfo.id);
    }

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'EDIT_DISTRIBUTION_AGENT', 'order_distribution_agents', ?, ?)`,
      [adminInfo.id, agentId, JSON.stringify({ serial, max_active_orders, status, auto_assign_enabled, orders_freed: freedCount })]
    );

    return {
      success: true,
      message: freedCount > 0
        ? `Agent updated. ${freedCount} active order(s) unassigned and ready for redistribution.`
        : "Agent updated.",
      orders_freed: freedCount
    };
  })
);

exports.removeDistributionAgent = api(
  {
    params: { id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const agentId = req.typed.params.id;

    // Resolve admin_id BEFORE deleting so we can free their active orders
    const agent = await connection.queryOne(
      `SELECT admin_id FROM order_distribution_agents WHERE id = ?`, [agentId]
    );
    if (!agent) throw new errors.NOT_FOUND("Agent not found.");

    // Free all active orders assigned to this admin
    const freedCount = await unassignActiveOrders(connection, agent.admin_id, adminInfo.id);

    const result = await connection.query(
      "DELETE FROM order_distribution_agents WHERE id = ?",
      [agentId]
    );

    if (result.affectedRows === 0) throw new errors.NOT_FOUND("Agent not found.");

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'REMOVE_DISTRIBUTION_AGENT', 'order_distribution_agents', ?, ?)`,
      [adminInfo.id, agentId, JSON.stringify({ admin_id: agent.admin_id, orders_freed: freedCount })]
    );

    // Notify the removed admin
    const freedMsg = freedCount > 0
      ? ` Your ${freedCount} active order(s) have been unassigned and are available for redistribution.`
      : '';
    sendPersonalNotification(
      connection, agent.admin_id,
      'You have been removed from the Order Distribution Pool',
      `You have been removed from the order distribution pool and will no longer receive auto-assigned orders.${freedMsg}`,
      { type: 'pool_removed', orders_freed: String(freedCount) }
    );

    return {
      success: true,
      message: freedCount > 0
        ? `Agent removed. ${freedCount} active order(s) unassigned and ready for redistribution.`
        : "Agent removed from distribution pool.",
      orders_freed: freedCount
    };
  })
);

// ═══════════════ UPSERT AGENT BY ADMIN ID (toggle in/out of pool) ═══════════════

exports.upsertAgentByAdminId = api(
  {
    params: { admin_id: { type: "int", required: true } },
    body: {
      serial: { type: "int", required: false, default: 1 },
      max_active_orders: { type: "int", required: false },
      auto_assign_enabled: { type: "bool", required: false },
      status: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const admin_id = req.typed.params.admin_id;
    const { serial, max_active_orders, auto_assign_enabled, status } = req.typed.body;

    // Verify admin exists
    const admin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [admin_id]
    );
    if (!admin) throw new errors.NOT_FOUND("Admin not found or inactive.");

    const existing = await connection.queryOne(
      `SELECT id FROM order_distribution_agents WHERE admin_id = ?`,
      [admin_id]
    );

    if (existing) {
      // Update existing agent
      const updates = [];
      const values = [];
      if (serial !== undefined) { updates.push("serial = ?"); values.push(serial); }
      if (max_active_orders !== undefined) { updates.push("max_active_orders = ?"); values.push(max_active_orders || null); }
      if (auto_assign_enabled !== undefined) { updates.push("auto_assign_enabled = ?"); values.push(auto_assign_enabled ? 1 : 0); }
      if (status !== undefined) { updates.push("status = ?"); values.push(status ? 1 : 0); }

      if (updates.length) {
        values.push(existing.id);
        await connection.query(
          `UPDATE order_distribution_agents SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }

      // If being deactivated, free their active orders
      let freedCount = 0;
      if (status === false || status === 0) {
        freedCount = await unassignActiveOrders(connection, admin_id, adminInfo.id);
      }

      return {
        success: true,
        message: freedCount > 0
          ? `Agent updated. ${freedCount} active order(s) unassigned and ready for redistribution.`
          : "Agent updated.",
        pool_id: existing.id,
        orders_freed: freedCount
      };
    } else {
      // Insert new agent
      const result = await connection.query(
        `INSERT INTO order_distribution_agents (admin_id, serial, max_active_orders, auto_assign_enabled, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          admin_id,
          serial || 1,
          max_active_orders || null,
          auto_assign_enabled !== undefined ? (auto_assign_enabled ? 1 : 0) : 1,
          status !== undefined ? (status ? 1 : 0) : 1,
        ]
      );
      await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'ADD_DISTRIBUTION_AGENT', 'order_distribution_agents', ?, ?)`,
        [adminInfo.id, result.insertId, JSON.stringify({ admin_id })]
      );
      // Notify the newly added admin
      sendPersonalNotification(
        connection, admin_id,
        'You have been added to the Order Distribution Pool',
        'You have been added to the order distribution pool and will start receiving auto-assigned orders.',
        { type: 'pool_added' }
      );
      return { success: true, message: "Agent added to pool.", pool_id: result.insertId };
    }
  })
);

// ═══════════════ REDISTRIBUTE UNASSIGNED ORDERS ═══════════════

exports.redistributeUnassigned = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    // Get all unassigned orders where admin still has pending work
    // (i.e. not yet handed to courier or resolved)
    const orders = await connection.query(
      `SELECT id FROM orders
       WHERE assigned_to_admin_id IS NULL
         AND order_status NOT IN ('shipped','out_for_delivery','delivered','cancelled','returned','trash')
       ORDER BY id ASC`
    );

    if (!orders.length) {
      return { success: true, message: "No unassigned orders to redistribute.", assigned: 0, skipped: 0 };
    }

    let assigned = 0;
    let skipped = 0;
    let lastAssigned = null;

    for (const order of orders) {
      // Re-fetch live agent loads each iteration so running counts stay accurate.
      // This is the key: as we assign orders in this loop the counts change,
      // so the next order always goes to whoever is currently emptiest.
      const agents = await connection.query(
        `SELECT
           da.admin_id,
           da.max_active_orders,
           da.serial,
           -- Active = orders admin still has pending work on (not yet shipped or resolved)
           COUNT(CASE WHEN o.order_status NOT IN ('shipped','out_for_delivery','delivered','cancelled','returned','trash') THEN 1 END) AS active_count
         FROM order_distribution_agents da
         JOIN admins a ON a.id = da.admin_id AND a.is_active = 1 AND a.deleted_at IS NULL
         LEFT JOIN orders o ON o.assigned_to_admin_id = da.admin_id AND o.deleted_at IS NULL
         WHERE da.status = 1 AND da.auto_assign_enabled = 1
         GROUP BY da.admin_id, da.max_active_orders, da.serial
         ORDER BY active_count ASC, da.serial ASC, da.id ASC`
      );

      if (!agents.length) { skipped++; continue; }

      // Pick the least-loaded agent that is under their cap
      let chosen = null;
      for (const agent of agents) {
        if (agent.max_active_orders && agent.max_active_orders > 0) {
          if (agent.active_count >= agent.max_active_orders) continue;
        }
        chosen = agent;
        break;
      }

      if (!chosen) { skipped++; continue; }

      await connection.query(
        `UPDATE orders
           SET assigned_to_admin_id = ?,
               assigned_by_admin_id = ?,
               assignment_method    = 'auto',
               assigned_at          = NOW()
         WHERE id = ?`,
        [chosen.admin_id, adminInfo.id, order.id]
      );

      await connection.query(
        `INSERT INTO order_assignment_logs
           (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id)
         VALUES (?, 'redistribute', NULL, ?, ?)`,
        [order.id, chosen.admin_id, adminInfo.id]
      );

      lastAssigned = chosen.admin_id;
      assigned++;

      // Fire notification (non-blocking)
      sendAssignmentNotification(chosen.admin_id, order.id);
    }

    // Persist last assigned pointer
    if (lastAssigned) {
      await connection.query(
        `UPDATE order_distribution_settings SET last_assigned_admin_id = ? WHERE id = 1`,
        [lastAssigned]
      );
    }

    if (assigned > 0) bumpOrderEventVersion();
    return {
      success: true,
      message: `Redistribution complete. Assigned: ${assigned}, Skipped (agents at capacity): ${skipped}`,
      assigned,
      skipped,
    };
  })
);

// ═══════════════ ORDER ASSIGNMENT ═══════════════

exports.assignOrder = api(
  {
    body: {
      order_id: { type: "int", required: true },
      admin_id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { order_id, admin_id } = req.typed.body;
    const isSuperAdmin = adminInfo.roles.includes("SUPER_ADMIN");

    // Verify order exists
    const order = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM orders WHERE id = ?`,
      [order_id]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found.");

    // ADMIN can only reassign orders currently assigned to themselves
    if (!isSuperAdmin) {
      if (order.assigned_to_admin_id !== adminInfo.id) {
        throw new errors.UNAUTHORIZED("You can only reassign orders that are currently assigned to you.");
      }
    }

    // Verify target admin valid
    const targetAdmin = await connection.queryOne(
      `SELECT a.id, r.name AS role_name
       FROM admins a
       JOIN admin_roles ar ON ar.admin_id = a.id
       JOIN roles r ON r.id = ar.role_id
       WHERE a.id = ? AND a.is_active = 1 AND a.deleted_at IS NULL
       LIMIT 1`,
      [admin_id]
    );
    if (!targetAdmin) throw new errors.NOT_FOUND("Target admin not found or inactive.");

    // Role hierarchy check: ADMIN cannot assign to SUPER_ADMIN or another ADMIN
    if (!isSuperAdmin) {
      if (targetAdmin.role_name === "SUPER_ADMIN" || targetAdmin.role_name === "ADMIN") {
        throw new errors.UNAUTHORIZED("Admins can only assign orders to Order Managers or below.");
      }
    }

    // Determine action type
    const fromAdminId = order.assigned_to_admin_id;
    let actionType = 'manual';
    if (fromAdminId) {
      if (fromAdminId === admin_id) {
        throw new errors.INVALID_FIELDS_PROVIDED("Order is already assigned to this admin.");
      }
      actionType = 'redistribute';
    }

    // Update order
    await connection.query(
      `UPDATE orders 
       SET assigned_to_admin_id = ?, assigned_by_admin_id = ?, 
           assignment_method = ?, assigned_at = NOW()
       WHERE id = ?`,
      [admin_id, adminInfo.id, actionType, order_id]
    );

    // Log assignment
    await connection.query(
      `INSERT INTO order_assignment_logs 
       (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, actionType, fromAdminId || null, admin_id, adminInfo.id]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'ASSIGN_ORDER', 'orders', ?, ?)`,
      [adminInfo.id, order_id, JSON.stringify({ assigned_to_admin_id: admin_id, from_admin_id: fromAdminId || null, action_type: actionType })]
    );

    // Fire notifications to the assigned admin (non-blocking)
    sendAssignmentNotification(admin_id, order_id);

    bumpOrderEventVersion();
    return {
      success: true,
      message: actionType === 'redistribute'
        ? "Order reassigned successfully."
        : "Order assigned successfully."
    };
  })
);

exports.unassignOrder = api(
  {
    params: { order_id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    // Unassign is SUPER_ADMIN only — consistent with report/contact unassign behavior
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const order_id = req.typed.params.order_id;
    const order = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM orders WHERE id = ?`,
      [order_id]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found.");
    if (!order.assigned_to_admin_id) {
      throw new errors.INVALID_FIELDS_PROVIDED("Order is not currently assigned.");
    }

    await connection.query(
      `UPDATE orders 
       SET assigned_to_admin_id = NULL, assigned_by_admin_id = NULL,
           assignment_method = NULL, assigned_at = NULL
       WHERE id = ?`,
      [order_id]
    );

    await connection.query(
      `INSERT INTO order_assignment_logs 
       (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id)
       VALUES (?, 'unassign', ?, NULL, ?)`,
      [order_id, order.assigned_to_admin_id, adminInfo.id]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UNASSIGN_ORDER', 'orders', ?, ?)`,
      [adminInfo.id, order_id, JSON.stringify({ unassigned_from_admin_id: order.assigned_to_admin_id })]
    );

    bumpOrderEventVersion();
    return { success: true, message: "Order unassigned." };
  })
);

exports.getAssignmentLogs = api(
  {
    query: {
      order_id: { type: "int", required: false },
      limit: { type: "int", required: false, default: 50 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { order_id, limit, offset } = req.typed.query;
    const conditions = [];
    const values = [];

    if (order_id) {
      conditions.push("al.order_id = ?");
      values.push(order_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const logs = await connection.query(
      `SELECT al.*, 
              CONCAT(fa.first_name, ' ', IFNULL(fa.last_name, '')) as from_admin_name,
              CONCAT(ta.first_name, ' ', IFNULL(ta.last_name, '')) as to_admin_name,
              CONCAT(ca.first_name, ' ', IFNULL(ca.last_name, '')) as changed_by_name
       FROM order_assignment_logs al
       LEFT JOIN admins fa ON fa.id = al.from_admin_id
       LEFT JOIN admins ta ON ta.id = al.to_admin_id
       LEFT JOIN admins ca ON ca.id = al.changed_by_admin_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return { success: true, data: logs };
  })
);

/**
 * Auto-assign helper (called from order creation flow)
 * Uses round-robin over active distribution agents, balanced by today_handled_count
 */
// ═══════════════ AUTO-ASSIGN HELPER ═══════════════

/**
 * V2-017: Auto-assign an order to the least-loaded active pool agent.
 *
 * Algorithm (load-aware, replaces naive round-robin):
 *   1. Fetch all active agents + their current active-order count in ONE query.
 *   2. Filter out any agent that has hit their max_active_orders cap.
 *   3. Sort by: active_order_count ASC → serial ASC  (fewest orders first; tie breaks by serial).
 *   4. Assign to the top candidate.
 *
 * This guarantees that if Admin A has 10 active orders and Admin B has 5,
 * the next order always goes to Admin B — not plain round-robin 50/50.
 *
 * @param {object} connection  - DB connection (pooled)
 * @param {number} orderId     - Order to assign
 * @returns {number|null}      - Assigned admin_id, or null if no agent available
 */
exports.autoAssignOrder = async (connection, orderId) => {
  // 1. Settings guard
  const settings = await connection.queryOne(
    `SELECT auto_assign_enabled FROM order_distribution_settings WHERE id = 1`
  );
  if (!settings || !settings.auto_assign_enabled) return null;

  // 2. Load all active agents with their CURRENT active order count in one shot
  const agents = await connection.query(
    `SELECT
       da.admin_id,
       da.max_active_orders,
       da.serial,
       -- Active = orders admin still has pending work on (not yet shipped or resolved)
       COUNT(CASE WHEN o.order_status NOT IN ('shipped','out_for_delivery','delivered','cancelled','returned','trash') THEN 1 END) AS active_count
     FROM order_distribution_agents da
     JOIN admins a ON a.id = da.admin_id AND a.is_active = 1 AND a.deleted_at IS NULL
     LEFT JOIN orders o ON o.assigned_to_admin_id = da.admin_id AND o.deleted_at IS NULL
     WHERE da.status = 1 AND da.auto_assign_enabled = 1
     GROUP BY da.admin_id, da.max_active_orders, da.serial
     ORDER BY active_count ASC, da.serial ASC, da.id ASC`
  );

  if (!agents.length) return null;

  // 3. Find first agent under their cap (list is already sorted least-loaded first)
  let chosen = null;
  for (const agent of agents) {
    if (agent.max_active_orders && agent.max_active_orders > 0) {
      if (agent.active_count >= agent.max_active_orders) continue; // at cap
    }
    chosen = agent;
    break;
  }

  if (!chosen) return null; // all agents at capacity

  // 4. Assign
  await connection.query(
    `UPDATE orders
     SET assigned_to_admin_id = ?,
         assigned_by_admin_id = NULL,
         assignment_method    = 'auto',
         assigned_at          = NOW()
     WHERE id = ?`,
    [chosen.admin_id, orderId]
  );

  await connection.query(
    `INSERT INTO order_assignment_logs
       (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id)
     VALUES (?, 'auto_assign', NULL, ?, NULL)`,
    [orderId, chosen.admin_id]
  );

  // Update the round-robin pointer (kept for backwards compatibility / UI display)
  await connection.query(
    `UPDATE order_distribution_settings SET last_assigned_admin_id = ? WHERE id = 1`,
    [chosen.admin_id]
  );

  // Fire notifications (non-blocking)
  sendAssignmentNotification(chosen.admin_id, orderId);

  return chosen.admin_id;
};


exports.updateDistributionSettings = api(
  {
    body: {
      auto_assign_enabled: { type: "bool", required: false },
      assign_on_order_create: { type: "bool", required: false },
      include_admin_role: { type: "bool", required: false },
      include_order_manager_role: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { auto_assign_enabled, assign_on_order_create, include_admin_role, include_order_manager_role } = req.typed.body;

    const updates = [];
    const values = [];

    if (auto_assign_enabled !== undefined) {
      updates.push("auto_assign_enabled = ?");
      values.push(auto_assign_enabled ? 1 : 0);
    }
    if (assign_on_order_create !== undefined) {
      updates.push("assign_on_order_create = ?");
      values.push(assign_on_order_create ? 1 : 0);
    }
    if (include_admin_role !== undefined) {
      updates.push("include_admin_role = ?");
      values.push(include_admin_role ? 1 : 0);
    }
    if (include_order_manager_role !== undefined) {
      updates.push("include_order_manager_role = ?");
      values.push(include_order_manager_role ? 1 : 0);
    }

    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED("No changes provided.");

    values.push(1); // id = 1
    await connection.query(
      `UPDATE order_distribution_settings SET ${updates.join(", ")}, updated_by_admin = ?, updated_at = NOW() WHERE id = ?`,
      [...values.slice(0, -1), adminInfo.id, 1]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_DISTRIBUTION_SETTINGS', 'order_distribution_settings', 1, ?)`,
      [adminInfo.id, JSON.stringify({ auto_assign_enabled, assign_on_order_create, include_admin_role, include_order_manager_role })]
    );

    return { success: true, message: "Distribution settings updated." };
  })
);

// ═══════════════ DISTRIBUTION AGENTS ═══════════════

exports.getDistributionAgents = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const agents = await connection.query(
      `SELECT da.*, CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) as admin_name, a.email as admin_email,
              (SELECT COUNT(*) FROM orders o
               WHERE o.assigned_to_admin_id = da.admin_id
                 AND o.order_status NOT IN ('shipped','out_for_delivery','delivered','cancelled','returned','trash')
                 AND o.deleted_at IS NULL) as active_order_count
       FROM order_distribution_agents da
       JOIN admins a ON a.id = da.admin_id AND a.deleted_at IS NULL AND a.is_active = 1
       ORDER BY da.serial ASC, da.id ASC`
    );

    return { success: true, data: agents };
  })
);

exports.addDistributionAgent = api(
  {
    body: {
      admin_id: { type: "int", required: true },
      serial: { type: "int", required: false, default: 1 },
      max_active_orders: { type: "int", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const { admin_id, serial, max_active_orders } = req.typed.body;

    // Verify admin exists, active, not deleted
    const admin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [admin_id]
    );
    if (!admin) throw new errors.NOT_FOUND("Admin not found or inactive.");

    // Check not already in pool
    const existing = await connection.queryOne(
      `SELECT id FROM order_distribution_agents WHERE admin_id = ?`,
      [admin_id]
    );
    if (existing) throw new errors.INVALID_FIELDS_PROVIDED("Admin is already in the distribution pool.");

    const result = await connection.query(
      `INSERT INTO order_distribution_agents (admin_id, serial, max_active_orders)
       VALUES (?, ?, ?)`,
      [admin_id, serial, max_active_orders || null]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'ADD_DISTRIBUTION_AGENT', 'order_distribution_agents', ?, ?)`,
      [adminInfo.id, result.insertId, JSON.stringify({ admin_id, serial, max_active_orders })]
    );

    return {
      success: true,
      message: "Agent added to distribution pool.",
      data: { id: result.insertId }
    };
  })
);

exports.editDistributionAgent = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      serial: { type: "int", required: false },
      max_active_orders: { type: "int", required: false },
      status: { type: "bool", required: false },
      auto_assign_enabled: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const agentId = req.typed.params.id;
    const { serial, max_active_orders, status, auto_assign_enabled } = req.typed.body;

    const updates = [];
    const values = [];

    if (serial !== undefined) { updates.push("serial = ?"); values.push(serial); }
    if (max_active_orders !== undefined) { updates.push("max_active_orders = ?"); values.push(max_active_orders); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status ? 1 : 0); }
    if (auto_assign_enabled !== undefined) { updates.push("auto_assign_enabled = ?"); values.push(auto_assign_enabled ? 1 : 0); }

    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED("No changes provided.");

    values.push(agentId);
    const result = await connection.query(
      `UPDATE order_distribution_agents SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) throw new errors.NOT_FOUND("Agent not found.");

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'EDIT_DISTRIBUTION_AGENT', 'order_distribution_agents', ?, ?)`,
      [adminInfo.id, agentId, JSON.stringify({ serial, max_active_orders, status, auto_assign_enabled })]
    );

    return { success: true, message: "Agent updated." };
  })
);

// ═══════════════ ORDER ASSIGNMENT ═══════════════

exports.assignOrder = api(
  {
    body: {
      order_id: { type: "int", required: true },
      admin_id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { order_id, admin_id } = req.typed.body;

    // Verify order exists
    const order = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM orders WHERE id = ?`,
      [order_id]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found.");

    // Verify target admin valid
    const targetAdmin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [admin_id]
    );
    if (!targetAdmin) throw new errors.NOT_FOUND("Target admin not found or inactive.");

    // Determine action type
    const fromAdminId = order.assigned_to_admin_id;
    let actionType = 'manual_assign';
    if (fromAdminId) {
      if (fromAdminId === admin_id) {
        throw new errors.INVALID_FIELDS_PROVIDED("Order is already assigned to this admin.");
      }
      actionType = 'redistribute';
    }

    // Update order
    await connection.query(
      `UPDATE orders 
       SET assigned_to_admin_id = ?, assigned_by_admin_id = ?, 
           assignment_method = ?, assigned_at = NOW()
       WHERE id = ?`,
      [admin_id, adminInfo.id, actionType === 'redistribute' ? 'redistribute' : 'manual', order_id]
    );

    // Log assignment
    await connection.query(
      `INSERT INTO order_assignment_logs 
       (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, actionType, fromAdminId || null, admin_id, adminInfo.id]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'ASSIGN_ORDER', 'orders', ?, ?)`,
      [adminInfo.id, order_id, JSON.stringify({ assigned_to_admin_id: admin_id, from_admin_id: fromAdminId || null, action_type: actionType })]
    );

    return {
      success: true,
      message: actionType === 'redistribute'
        ? "Order redistributed successfully."
        : "Order assigned successfully."
    };
  })
);

exports.unassignOrder = api(
  {
    params: { order_id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const order_id = req.typed.params.order_id;
    const order = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM orders WHERE id = ?`,
      [order_id]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found.");
    if (!order.assigned_to_admin_id) {
      throw new errors.INVALID_FIELDS_PROVIDED("Order is not currently assigned.");
    }

    await connection.query(
      `UPDATE orders 
       SET assigned_to_admin_id = NULL, assigned_by_admin_id = NULL,
           assignment_method = NULL, assigned_at = NULL
       WHERE id = ?`,
      [order_id]
    );

    await connection.query(
      `INSERT INTO order_assignment_logs 
       (order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id)
       VALUES (?, 'unassign', ?, NULL, ?)`,
      [order_id, order.assigned_to_admin_id, adminInfo.id]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UNASSIGN_ORDER', 'orders', ?, ?)`,
      [adminInfo.id, order_id, JSON.stringify({ unassigned_from_admin_id: order.assigned_to_admin_id })]
    );

    return { success: true, message: "Order unassigned." };
  })
);

exports.getAssignmentLogs = api(
  {
    query: {
      order_id: { type: "int", required: false },
      limit: { type: "int", required: false, default: 50 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { order_id, limit, offset } = req.typed.query;
    const conditions = [];
    const values = [];

    if (order_id) {
      conditions.push("al.order_id = ?");
      values.push(order_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const logs = await connection.query(
      `SELECT al.*, 
              CONCAT(fa.first_name, ' ', IFNULL(fa.last_name, '')) as from_admin_name,
              CONCAT(ta.first_name, ' ', IFNULL(ta.last_name, '')) as to_admin_name,
              CONCAT(ca.first_name, ' ', IFNULL(ca.last_name, '')) as changed_by_name
       FROM order_assignment_logs al
       LEFT JOIN admins fa ON fa.id = al.from_admin_id
       LEFT JOIN admins ta ON ta.id = al.to_admin_id
       LEFT JOIN admins ca ON ca.id = al.changed_by_admin_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return { success: true, data: logs };
  })
);
