const { pool } = require('../config/db');
const { verifyIpnSignature } = require('../config/trialvo_pay');

/**
 * POST /api/payments/ipn
 * Receives IPN (Instant Payment Notification) from Trialvo Pay
 * Updates the local order status based on payment result
 */
async function handleIpn(req, res) {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-trialvo-pay-signature'];

    console.log('[IPN] Received notification:', {
      event: req.body?.event,
      order_id: req.body?.data?.meta?.order_id || req.body?.data?.external_order_id,
      status: req.body?.data?.status,
    });

    // Verify signature
    if (!verifyIpnSignature(rawBody, signature)) {
      console.warn('[IPN] ⚠️  Signature verification FAILED — rejecting');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body?.event;
    // Support both nested (data wrapper) and flat payload formats
    const data = req.body?.data || req.body;

    if (!event) {
      return res.status(400).json({ error: 'Missing event' });
    }

    // Extract our order_id — try meta first, then external_order_id
    const orderId = data?.meta?.order_id || data?.external_order_id;
    const transactionId = data?.id || data?.transaction_id;
    const billToken = data?.bill_token;

    // Extract enriched payment details
    const paymentMethod = data?.payment_method || data?.gateway_provider || data?.financial_entity || null;
    const paymentReference = data?.payment_reference || null;
    const paidAt = data?.paid_at || data?.timestamp || null;
    const gatewayTxId = data?.gateway_transaction_id || data?.eps_transaction_id || null;

    if (!orderId) {
      console.warn('[IPN] No order_id in payload:', JSON.stringify(data?.meta));
      return res.status(200).json({ received: true }); // Acknowledge but skip
    }

    // Map Trialvo Pay events to order statuses
    let newStatus = null;
    let paymentStatus = null;

    switch (event) {
      case 'payment.success':
        newStatus = 'confirmed';
        paymentStatus = 'paid';
        break;
      case 'payment.failed':
        newStatus = 'payment_failed';
        paymentStatus = 'failed';
        break;
      case 'payment.cancelled':
        newStatus = 'cancelled';
        paymentStatus = 'cancelled';
        break;
      case 'payment.expired':
        newStatus = 'cancelled';
        paymentStatus = 'expired';
        break;
      case 'refund.success':
      case 'refund.approved':
        paymentStatus = 'refunded';
        break;
      default:
        console.log(`[IPN] Unhandled event: ${event}`);
        return res.status(200).json({ received: true });
    }

    // Update the order in our database
    const existing = await pool.query(
      'SELECT id, status FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (existing.rows.length === 0) {
      console.warn(`[IPN] Order not found: ${orderId}`);
      return res.status(200).json({ received: true }); // Acknowledge anyway
    }

    const order = existing.rows[0];

    // Build update fields
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (newStatus) {
      updates.push(`status = $${paramIdx}`);
      values.push(newStatus);
      paramIdx++;
    }
    if (paymentStatus) {
      updates.push(`payment_status = $${paramIdx}`);
      values.push(paymentStatus);
      paramIdx++;
    }
    if (transactionId) {
      updates.push(`trialvo_pay_transaction_id = $${paramIdx}`);
      values.push(String(transactionId));
      paramIdx++;
    }
    if (billToken) {
      updates.push(`trialvo_pay_bill_token = $${paramIdx}`);
      values.push(billToken);
      paramIdx++;
    }
    // Enriched fields
    if (paymentMethod) {
      updates.push(`payment_method = $${paramIdx}`);
      values.push(paymentMethod);
      paramIdx++;
    }
    if (paymentReference) {
      updates.push(`payment_reference = $${paramIdx}`);
      values.push(paymentReference);
      paramIdx++;
    }
    if (paidAt && event === 'payment.success') {
      updates.push(`paid_at = $${paramIdx}`);
      values.push(paidAt);
      paramIdx++;
    }
    if (gatewayTxId) {
      updates.push(`gateway_transaction_id = $${paramIdx}`);
      values.push(gatewayTxId);
      paramIdx++;
    }

    if (updates.length > 0) {
      values.push(order.id);
      await pool.query(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
        values
      ).catch(err => {
        // Column might not exist yet if migration not done — log and continue
        console.error('[IPN] Update error (column missing?):', err.message);
      });
    }

    console.log(`[IPN] ✅ Order ${orderId} updated — event: ${event}, status: ${newStatus || 'unchanged'}, method: ${paymentMethod || 'N/A'}, ref: ${paymentReference || 'N/A'}`);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[IPN] Error:', error.message);
    // Always return 200 to Trialvo Pay to prevent retries for our bugs
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
}

module.exports = { handleIpn };
