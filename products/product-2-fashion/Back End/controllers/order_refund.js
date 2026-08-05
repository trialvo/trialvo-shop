const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');

/**
 * V2-019: Order Refund Ledger
 * CRUD for order_refunds table — multi-refund records per order
 */

// ─────────────── Create Refund ───────────────
exports.createRefund = api(
  {
    body: {
      order_id: { type: "int", required: true },
      order_payment_id: { type: "int", required: false },
      refund_method: { type: "string", required: true },
      refund_amount: { type: "float", required: true },
      refund_reference: { type: "string", required: false },
      note: { type: "string", required: false }
    }
  },
  auth(async (req, connection, admin) => {
    const { order_id, order_payment_id, refund_method, refund_amount, refund_reference, note } = req.typed.body;

    const validMethods = ['original_method', 'bank_transfer', 'mobile_banking', 'cash', 'other'];
    if (!validMethods.includes(refund_method)) {
      throw new errors.INVALID_FIELDS_PROVIDED(`refund_method must be one of: ${validMethods.join(', ')}`);
    }

    if (refund_amount <= 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("refund_amount must be positive.");
    }

    // Verify order exists
    const order = await connection.queryOne(
      "SELECT id, paid_amount FROM orders WHERE id = ?",
      [order_id]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found.");

    // Validate: refund_amount must not exceed remaining refundable balance
    // Refundable = paid_amount - sum of already 'processed' refunds
    const [processed] = await connection.query(
      `SELECT COALESCE(SUM(refund_amount), 0) AS total_refunded
       FROM order_refunds WHERE order_id = ? AND status = 'processed'`,
      [order_id]
    );
    const alreadyRefunded = Number(processed?.[0]?.total_refunded ?? 0);
    const paidAmount = Number(order.paid_amount ?? 0);
    const refundableBalance = paidAmount - alreadyRefunded;

    if (refund_amount > refundableBalance) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `refund_amount (${refund_amount}) exceeds refundable balance (${refundableBalance}). Customer paid ${paidAmount} and ${alreadyRefunded} has already been refunded.`
      );
    }

    // Verify payment link if provided
    if (order_payment_id) {
      const payment = await connection.queryOne(
        "SELECT id FROM order_payments WHERE id = ? AND order_id = ?",
        [order_payment_id, order_id]
      );
      if (!payment) throw new errors.NOT_FOUND("Order payment not found.");
    }

    const result = await connection.query(
      `INSERT INTO order_refunds
       (order_id, order_payment_id, refund_method, refund_amount, refund_reference, note,
        refunded_by_admin, status, refunded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
      [order_id, order_payment_id || null, refund_method, refund_amount,
       refund_reference || null, note || null, admin.id]
    );

    // Audit log
    try {
      await connection.query(
        `INSERT INTO audit_logs (admin_id, action_id, entity_type, entity_id, prev_values, new_values, ip_address, created_at)
         VALUES (?, (SELECT id FROM audit_actions WHERE action_key = 'CREATE_REFUND' LIMIT 1),
                 'order_refunds', ?, NULL, ?, NULL, NOW())`,
        [admin.id, result.insertId, JSON.stringify({ order_id, refund_amount, refund_method })]
      );
    } catch (e) {
      console.error('Audit log failed for CREATE_REFUND', e);
    }

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Refund entry created.",
      data: { id: result.insertId }
    };
  })
);

// ─────────────── List Refunds by Order ───────────────
exports.getRefundsByOrder = api(
  {},
  auth(async (req, connection) => {
    const order_id = req.params.order_id;

    const refunds = await connection.query(
      `SELECT r.*,
              CONCAT(COALESCE(a.first_name,''), ' ', COALESCE(a.last_name,'')) AS refunded_by_name
       FROM order_refunds r
       LEFT JOIN admins a ON a.id = r.refunded_by_admin
       WHERE r.order_id = ?
       ORDER BY r.created_at DESC`,
      [order_id]
    );

    const totalRefunded = refunds.reduce(
      (sum, r) => sum + (r.status === 'processed' ? Number(r.refund_amount) : 0), 0
    );
    const totalPending = refunds.reduce(
      (sum, r) => sum + (r.status === 'pending' ? Number(r.refund_amount) : 0), 0
    );

    return {
      success: true,
      data: refunds,
      summary: { total_refunded: totalRefunded, total_pending: totalPending }
    };
  })
);

// ─────────────── Update Refund Status ───────────────
exports.updateRefundStatus = api(
  {
    body: {
      status: { type: "string", required: true },
      refund_reference: { type: "string", required: false },
      note: { type: "string", required: false }
    }
  },
  auth(async (req, connection, admin) => {
    const refundId = req.params.id;
    const { status, refund_reference, note } = req.typed.body;

    const validStatuses = ['pending', 'processed', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const existing = await connection.queryOne(
      "SELECT id, status FROM order_refunds WHERE id = ?",
      [refundId]
    );
    if (!existing) throw new errors.NOT_FOUND("Refund not found.");

    const updates = ["status = ?"];
    const values = [status];

    if (refund_reference !== undefined) {
      updates.push("refund_reference = ?");
      values.push(refund_reference);
    }
    if (note !== undefined) {
      updates.push("note = ?");
      values.push(note);
    }
    if (status === 'processed') {
      updates.push("refunded_at = NOW()");
    }

    values.push(refundId);
    await connection.query(
      `UPDATE order_refunds SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    try {
      await connection.query(
        `INSERT INTO audit_logs (admin_id, action_id, entity_type, entity_id, prev_values, new_values, ip_address, created_at)
         VALUES (?, (SELECT id FROM audit_actions WHERE action_key = 'UPDATE_REFUND_STATUS' LIMIT 1),
                 'order_refunds', ?, ?, ?, NULL, NOW())`,
        [admin.id, refundId, JSON.stringify({ old_status: existing.status }), JSON.stringify({ new_status: status })]
      );
    } catch (e) {
      console.error('Audit log failed for UPDATE_REFUND_STATUS', e);
    }

    bumpOrderEventVersion();
    return { success: true, message: `Refund status updated to '${status}'.` };
  })
);
