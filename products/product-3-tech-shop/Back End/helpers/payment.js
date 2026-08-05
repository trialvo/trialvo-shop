const axios = require('axios');
const errors =require('../helpers/errors')
const {GUEST_SSL_EMAIL,TEST_SSL_PHONE}=require('../config/ApplicationSettings');
const { sendPurchaseCapiEvent } = require('./capi');
const { bumpOrderEventVersion } = require('./orderEventVersion');

/**
 * bKash Verification: We try to grant an ID Token. 
 * If the credentials are wrong, bKash returns a 401 or an error message.
 */
 

exports.verifyBkash=async({ base_url, username, password, app_key, app_secret })=> {
  try {
    // Standard bKash Tokenized Grant Token URL
    const cleanUrl = base_url.replace(/\/$/, ""); 
    const response = await axios({
      method: 'post',
      url: `${cleanUrl}/checkout/token/grant`,
      headers: {
        "Content-Type": "application/json",
        "username": username,
        "password": password
      },
      data: {
        app_key: app_key,
        app_secret: app_secret
      }
    });

    // bKash returns statusCode '0000' for a successful token grant
    if (!response.data || response.data.statusCode !== '0000') {
      throw new Error(response.data.statusMessage || "Authentication failed");
    }

    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.statusMessage || error.message;
    throw new errors.BAD_REQUEST(`bKash Verification Failed: ${errorMsg}`);
  }
}



// exports.verifySSLCommerz= async({ store_id, store_password, base_url })=> {
//   try {
//     const cleanUrl = base_url.replace(/\/$/, "");
    
//     // SSLCommerz requires data as Form Data (x-www-form-urlencoded)
//     const formData = new URLSearchParams();
//     formData.append('store_id', store_id);
//     formData.append('store_passwd', store_password);
//     formData.append('total_amount', '10.00'); // Test amount
//     formData.append('currency', 'BDT');
//     formData.append('tran_id', `TEST_${Date.now()}`);
//     formData.append('success_url', 'http://localhost/success');
//     formData.append('fail_url', 'http://localhost/fail');
//     formData.append('cancel_url', 'http://localhost/cancel');
//     formData.append('cus_name', 'Test Customer');
//     formData.append('cus_email', 'test@test.com');
//     formData.append('cus_phone', '01700000000');
//     formData.append('cus_add1', 'Dhaka');
//     formData.append('cus_city', 'Dhaka');
//     formData.append('cus_country', 'Bangladesh');
//     formData.append('shipping_method', 'NO');
//     formData.append('product_name', 'Test Product');
//     formData.append('product_category', 'Test');
//     formData.append('product_profile', 'general');

//     const response = await axios.post(`${cleanUrl}/gwprocess/v4/api.php`, formData);

//     // SSLCommerz returns status: 'SUCCESS' if credentials and params are valid
//     if (response.data && response.data.status === 'SUCCESS') {
//       return true;
//     } else {
//       const reason = response.data?.failedreason || "Invalid Store ID or Password";
//       throw new Error(reason);
//     }
//   } catch (error) { 
//     const errorMsg = error.response?.data?.failedreason || error.message;
//     throw new errors.BAD_REQUEST(`SSLCommerz Verification Failed: ${errorMsg}`);
//   }
// }


exports.verifySSLCommerz = async ({ 
  store_id, 
  store_password, 
  base_url, 
  success_url, 
  fail_url, 
  cancel_url 
}) => {
  try {
    const cleanUrl = base_url.replace(/\/$/, "");
    
    const formData = new URLSearchParams();
    formData.append('store_id', store_id);
    formData.append('store_passwd', store_password);
    formData.append('total_amount', '10.00'); 
    formData.append('currency', 'BDT');
    formData.append('tran_id', `V_TEST_${Date.now()}`);
    
    // UPDATED: Using the real URLs passed from the config
    // Fallback included just in case, but live requires the real domain
    formData.append('success_url', success_url || 'https://www.graduatefashionbd.com/api/v1/success');
    formData.append('fail_url', fail_url || 'https://www.graduatefashionbd.com/api/v1/fail');
    formData.append('cancel_url', cancel_url || 'https://www.graduatefashionbd.com/api/v1/cancel');
    
    formData.append('cus_name', 'Live Verification');
    formData.append('cus_email', GUEST_SSL_EMAIL || 'Sazzadtex1997@gmail.com');
    formData.append('cus_phone', TEST_SSL_PHONE||'01711233709');
    formData.append('cus_add1', 'Dhaka');
    formData.append('cus_city', 'Dhaka');
    formData.append('cus_country', 'Bangladesh');
    formData.append('shipping_method', 'NO');
    formData.append('product_name', 'System Verify');
    formData.append('product_category', 'General');
    formData.append('product_profile', 'general');

    // Added a custom header to ensure axios handles the form data correctly
    const response = await axios.post(`${cleanUrl}/gwprocess/v4/api.php`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data && response.data.status === 'SUCCESS') {
      return true;
    } else {
      
      // For Live, FailedReason is very helpful to debug IP/Domain white-listing issues
      const reason = response.data?.failedreason || "Verification Failed: Check Store ID/Password or Domain Whitelist";
      throw new Error(reason);
    }
  } catch (error) { 
    const errorMsg = error.response?.data?.failedreason || error.message;
    throw new errors.BAD_REQUEST(`SSLCommerz Verification Failed: ${errorMsg}`);
  }
}






/**
 * Shared logic for successful payments
 * @param {import('../utils/connection').Connection} connection
 * @param {string|number} tranId   - order_payments.id
 * @param {string} bankTranId      - Transaction ref from payment gateway
 * @param {number} amount          - Amount paid now
 * @param {object} [capiMeta]      - Optional: browser context for Facebook CAPI
 * @param {string} [capiMeta.client_ip]
 * @param {string} [capiMeta.client_ua]
 */
exports.processSuccessfulPayment = async (connection, tranId, bankTranId, amount, capiMeta = {}) => {
    // 1. Load payment + order state (include CAPI columns)
    const paymentRecord = await connection.queryOne(
        `SELECT op.id as payment_id, op.order_id, op.status as payment_record_status, 
                o.grand_total, o.paid_amount, o.due_amount, o.payment_status, o.order_status,
                o.customer_email, o.customer_phone, o.customer_id,
                o.fbp, o.fbc, o.capi_event_id
         FROM order_payments op
         JOIN orders o ON op.order_id = o.id
         WHERE op.id = ?`,
        [tranId]
    );

    if (!paymentRecord) return { success: false, error: "record_not_found" };

    // 2. Idempotency Check
    if (paymentRecord.payment_record_status === "success") {
        return { success: true, alreadyProcessed: true, orderId: paymentRecord.order_id };
    }

    // 3. Update Calculations
    const paidAmountNow = Number(amount) || 0;
    const totalPaidUpdated = Math.min(
        Number(paymentRecord.paid_amount) + paidAmountNow, 
        Number(paymentRecord.grand_total)
    );
    const newDue = Math.max(0, Number(paymentRecord.grand_total) - totalPaidUpdated);
    const finalPaymentStatus = totalPaidUpdated >= Number(paymentRecord.grand_total) ? 'paid' : 'partial_paid';

    // 4. Update Database
    await connection.query(
        `UPDATE order_payments SET transaction_ref = ?, status = 'success', paid_at = NOW() WHERE id = ?`,
        [bankTranId, tranId]
    );

    await connection.query(
        `UPDATE orders SET payment_status = ?, paid_amount = ?, due_amount = ?, paid_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [finalPaymentStatus, totalPaidUpdated, newDue, paymentRecord.order_id]
    );

    // 5. Update Order Status if fully paid
    if (finalPaymentStatus === 'paid' && paymentRecord.order_status === 'new') {
        await connection.query(`UPDATE orders SET order_status = 'approved' WHERE id = ?`, [paymentRecord.order_id]);
        await connection.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, note) 
             VALUES (?, 'new', 'approved', 'Payment completed via SSLCommerz')`,
            [paymentRecord.order_id]
        );
    }

    // 6. 🔥 Fire Facebook CAPI Purchase event (async, non-blocking)
    //    This sends a server-to-server event directly to Meta, bypassing ad-blockers.
    //    Uses the same event_id as the browser Pixel so Meta deduplicates to 1 hit.
    sendPurchaseCapiEvent(connection, paymentRecord, {
        event_id: paymentRecord.capi_event_id,
        fbp: paymentRecord.fbp,
        fbc: paymentRecord.fbc,
        client_ip: capiMeta.client_ip,
        client_ua: capiMeta.client_ua,
    });

    bumpOrderEventVersion();
    return { 
        success: true, 
        orderId: paymentRecord.order_id, 
        finalPaymentStatus, 
        paidAmountNow 
    };
};

/**
 * Shared logic for failed/cancelled payments
 */
exports.processFailedPayment = async (connection, tranId, statusType) => {
    const paymentRecord = await connection.queryOne(
        `SELECT id, order_id, status FROM order_payments WHERE id = ?`,
        [tranId]
    );

    if (!paymentRecord) return { success: false, error: "record_not_found" };
    if (paymentRecord.status === "success") return { success: true, alreadyProcessed: true, orderId: paymentRecord.order_id };

    await connection.query(`UPDATE order_payments SET status = 'failed' WHERE id = ?`, [tranId]);

    return { success: true, orderId: paymentRecord.order_id, status: statusType };
};









exports.verifyShurjoPay=async({ username, password, base_url }) =>{
  try {
    const cleanUrl = base_url.replace(/\/$/, "");
    
    // shurjoPay v2 uses a JSON POST to /api/get_token
    const response = await axios.post(`${cleanUrl}/api/get_token`, {
      username: username,
      password: password
    });

    // A successful response contains a 'token' field and 'sp_code' 200
    if (response.data && response.data.token) {
      return true;
    } else {
      const reason = response.data?.message || "Invalid Username or Password";
      throw new Error(reason);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    throw new errors.BAD_REQUEST(`shurjoPay Verification Failed: ${errorMsg}`);
  }
}




exports.verifyNagad= async({ merchant_id, base_url, public_key, private_key }) =>{
  try {
    const cleanUrl = base_url.replace(/\/$/, "");
    
    // 1. Initial Handshake Request
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const response = await axios.get(`${cleanUrl}/checkout/init/${merchant_id}/${timestamp}`);

    // If we get a response, the Merchant ID and Base URL are likely correct.
    // For a deeper check, Nagad requires complex encryption. 
    // Usually, a 200 OK from the 'init' endpoint with Nagad's public data is enough to verify connectivity.
    
    if (response.data && response.data.sensitiveData) {
      return true;
    } else {
      throw new Error(response.data?.reason || "Nagad Init Failed");
    }
  } catch (error) {
    const errorMsg = error.response?.data?.reason || error.message;
    throw new errors.BAD_REQUEST(`Nagad Verification Failed: ${errorMsg}`);
  }
}