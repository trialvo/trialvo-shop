const { pool } = require('../config/db');
const { verifyIpnSignature } = require('../config/payvault');

/**
 * POST /api/payments/ipn
 * Receives IPN (Instant Payment Notification) from PayVault
 * Updates the local order status based on payment result
 */
async function handleIpn(req, res) {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-payvault-signature'];

    console.log('[IPN] Received notification:', {
      event: req.body?.event,
      order_id: req.body?.data?.meta?.order_id,
      status: req.body?.data?.status,
    });

    // Verify signature
    if (!verifyIpnSignature(rawBody, signature)) {
      console.warn('[IPN] ⚠️  Signature verification FAILED — rejecting');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body?.event;
    const data = req.body?.data;

    if (!event || !data) {
      return res.status(400).json({ error: 'Missing event or data' });
    }

    // Extract our order_id from meta
    const orderId = data?.meta?.order_id || data?.external_order_id;
    const transactionId = data?.id;
    const billToken = data?.bill_token;

    if (!orderId) {
      console.warn('[IPN] No order_id in meta:', JSON.stringify(data?.meta));
      return res.status(200).json({ received: true }); // Acknowledge but skip
    }

    // Map PayVault events to order statuses
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
        paymentStatus = 'refunded';
        break;
      default:
        console.log(`[IPN] Unhandled event: ${event}`);
        return res.status(200).json({ received: true });
    }

    // Update the order in our database
    const [existing] = await pool.execute(
      'SELECT id, status FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (existing.length === 0) {
      console.warn(`[IPN] Order not found: ${orderId}`);
      return res.status(200).json({ received: true }); // Acknowledge anyway
    }

    const order = existing[0];

    // Build update fields
    const updates = [];
    const values = [];

    if (newStatus) {
      updates.push('status = ?');
      values.push(newStatus);
    }
    if (paymentStatus) {
      updates.push('payment_status = ?');
      values.push(paymentStatus);
    }
    if (transactionId) {
      updates.push('payvault_transaction_id = ?');
      values.push(transactionId);
    }
    if (billToken) {
      updates.push('payvault_bill_token = ?');
      values.push(billToken);
    }

    if (updates.length > 0) {
      values.push(order.id);
      await pool.execute(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
        values
      ).catch(err => {
        // Column might not exist yet if migration not done — log and continue
        console.error('[IPN] Update error (column missing?):', err.message);
      });
    }

    console.log(`[IPN] ✅ Order ${orderId} updated — event: ${event}, status: ${newStatus || 'unchanged'}`);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[IPN] Error:', error.message);
    // Always return 200 to PayVault to prevent retries for our bugs
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
}

module.exports = { handleIpn };
