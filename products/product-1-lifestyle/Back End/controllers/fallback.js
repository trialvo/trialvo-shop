// paymentCallbackController.js
const axios = require('axios');
const errors = require('../helpers/errors');
const { getConfig } = require('../config/ApplicationSettingsDB');
const { SHOP_URL } = require('../config/ApplicationSettings');
const database = require('../utils/connection');


const {processSuccessfulPayment, processFailedPayment} = require('../helpers/payment');
  // const {sendPaymentMail}=require('../mail-templates/payment');
const {triggerPaymentEmail}=require('../helpers/email');
// Helper function to get frontend URL with proper format
function getFrontendUrl(status, orderId, additionalParams = {}) {
  const baseUrl = SHOP_URL;
  const paymentStatus = status === 'success' ? 'success' : status === 'cancelled' ? 'cancelled' : 'failed';
  return `${baseUrl}/checkout/success?orderId=${orderId}&payment=${paymentStatus}`;
}



exports.sslCommerzIPN = async (req, res) => {
    let connection;
    try {
        const data = req.body;
        connection = await database.getConnection();
        await connection.beginTransaction();

        let result;
    
console.log("tesy===================");

        if (data.status === "VALID" || data.status === "AUTHENTICATED") {
            /* -------------------- 1️⃣ Fetch Config for Validation -------------------- */
            const configs = await getConfig(connection, false, "payment");
            const providerRows = configs.filter(c => c.provider === "sslcommerz");
            const sslConfig = {};
            providerRows.forEach(r => (sslConfig[r.key_name] = r.value));

            /* -------------------- 2️⃣ Call SSLCommerz Validation API -------------------- */
            const isSandbox = sslConfig.SSL_ENV === "sandbox";
            const validationEndpoint = isSandbox
                ? "/validator/api/validationserverAPI.php"
                : "/validator/api/ordervalidate.php";

            const params = new URLSearchParams({
                val_id: data.val_id,
                store_id: sslConfig.SSL_STORE_ID,
                store_passwd: sslConfig.SSL_STORE_PASS,
                format: "json"
            });

            const validationUrl = `${sslConfig.SSL_BASE_URL}${validationEndpoint}?${params.toString()}`;
            const { data: verifyData } = await axios.get(validationUrl);

            // Verify the response from SSLCommerz
            if (verifyData.status !== "VALID" && verifyData.status !== "AUTHENTICATED") {
                throw new Error("IPN Transaction validation failed");
            }

            // Verify amount integrity
            if (parseFloat(verifyData.amount) < parseFloat(data.amount)) {
                throw new Error("IPN Amount mismatch during validation");
            }

            /* -------------------- 3️⃣ Process Success -------------------- */
            result = await processSuccessfulPayment(
                connection, 
                data.tran_id, 
                data.bank_tran_id, 
                data.amount
            );
        } else {
            /* -------------------- 4️⃣ Process Failure/Cancel -------------------- */
            result = await processFailedPayment(
                connection, 
                data.tran_id, 
                data.status.toLowerCase()
            );
        }

        await connection.commit();

        /* -------------------- 5️⃣ Trigger Email -------------------- */
        if (result.success && !result.alreadyProcessed) {
            const emailStatus = (data.status === "VALID" || data.status === "AUTHENTICATED") ? "success" : "failed";
            triggerPaymentEmail(
                result.orderId, 
                emailStatus, 
                data.bank_tran_id || data.tran_id
            );
        }

        // SSLCommerz requires a 200 OK response to stop retrying the IPN
        return res.status(200).send("OK");

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("SSL IPN Critical Error:", error.message);
        
        // We still send 200 "OK" so SSLCommerz doesn't spam the server 
        // unless you specifically want them to retry later.
        return res.status(200).send("OK");
    } finally {
        if (connection) await connection.release();
    }
};




// // SSLCommerz Callback with Redirect
// exports.sslCommerzCallback = async (req, res) => {
//   let connection;
//   try {
//     connection = await database.getConnection();
//     await connection.beginTransaction();

//     const data = req.body;
//     const frontendBaseUrl = SHOP_URL;

//     // 1. Initial Status Check
//     if (data.status !== "VALID" && data.status !== "AUTHENTICATED") {
//       return res.redirect(getFrontendUrl('failed', data.tran_id, {
//         message: `Payment status: ${data.status}`,
//         payment_method: 'sslcommerz'
//       }));
//     }

//     // 2. Fetch Config
//     const configs = await getConfig(connection, false, "payment");
//     const providerRows = configs.filter(c => c.provider === "sslcommerz");
//     const sslConfig = {};
//     providerRows.forEach(r => (sslConfig[r.key_name] = r.value));

//     // 3. Validate with SSLCommerz
//     const isSandbox = sslConfig.SSL_ENV === "sandbox";
//     const validationEndpoint = isSandbox
//       ? "/validator/api/validationserverAPI.php"
//       : "/validator/api/ordervalidate.php";

//     const params = new URLSearchParams({
//       val_id: data.val_id,
//       store_id: sslConfig.SSL_STORE_ID,
//       store_passwd: sslConfig.SSL_STORE_PASS,
//       format: "json"
//     });

//     const validationUrl = `${sslConfig.SSL_BASE_URL}${validationEndpoint}?${params.toString()}`;

//     try {
//       const { data: verifyData } = await axios.get(validationUrl);

//       if (verifyData.status !== "VALID" && verifyData.status !== "AUTHENTICATED") {
//         throw new Error("Transaction validation failed");
//       }

//       if (parseFloat(verifyData.amount) < parseFloat(data.amount)) {
//         throw new Error("Amount mismatch during validation");
//       }
//     } catch (err) {
//       console.error(`SSL ${sslConfig.SSL_ENV} Verification Error:`, err.message);
//       await connection.rollback();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('failed', data.tran_id, {
//         message: 'Payment verification failed',
//         payment_method: 'sslcommerz',
//         error: 'verification_error'
//       }));
//     }

//     // 4. Load order state
//     const paymentRecord = await connection.queryOne(
//       `SELECT op.id as payment_id, op.order_id, op.status as payment_record_status, 
//               o.grand_total, o.paid_amount, o.due_amount, o.payment_status
//        FROM order_payments op
//        JOIN orders o ON op.order_id = o.id
//        WHERE op.id = ?`,
//       [data.tran_id]
//     );

//     if (!paymentRecord) {
//       await connection.rollback();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('failed', data.tran_id, {
//         message: 'Payment record not found',
//         payment_method: 'sslcommerz',
//         error: 'record_not_found'
//       }));
//     }

//     if (paymentRecord.payment_record_status === "success") {
//       await connection.commit();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('success', paymentRecord.order_id, {
//         message: 'Payment already processed',
//         payment_method: 'sslcommerz',
//         already_processed: true
//       }));
//     }

//     // 5. Update Database
//     const paidAmountNow = Number(data.amount) || 0;
//     const totalPaidUpdated = Math.min(
//       Number(paymentRecord.paid_amount) + paidAmountNow, 
//       Number(paymentRecord.grand_total)
//     );
//     const newDue = Math.max(0, Number(paymentRecord.grand_total) - totalPaidUpdated);
//     const finalPaymentStatus = totalPaidUpdated >= Number(paymentRecord.grand_total) 
//       ? 'paid' 
//       : 'partial_paid';

//     await connection.query(
//       `UPDATE order_payments 
//        SET transaction_ref = ?, status = 'success', paid_at = NOW() 
//        WHERE id = ?`,
//       [data.bank_tran_id, data.tran_id]
//     );

//     await connection.query(
//       `UPDATE orders SET 
//          payment_status = ?,   
//          paid_amount = ?, 
//          due_amount = ?, 
//          paid_at = NOW(),
//          updated_at = NOW() 
//        WHERE id = ?`,
//       [finalPaymentStatus, totalPaidUpdated, newDue, paymentRecord.order_id]
//     );

//     // 6. If order becomes fully paid, update order status
//     if (finalPaymentStatus === 'paid') {
//       await connection.query(
//         `UPDATE orders 
//          SET order_status = 'approved', updated_at = NOW() 
//          WHERE id = ? AND order_status = 'new'`,
//         [paymentRecord.order_id]
//       );

//       // Update order status history
//       await connection.query(
//         `INSERT INTO order_status_history (
//           order_id, old_status, new_status, note
//         ) VALUES (?, 'new', 'approved', 'Payment completed via SSLCommerz')`,
//         [paymentRecord.order_id]
//       );
//     }




// // ... after await connection.commit() ...

//     /* -------------------- 8️⃣ Send Payment Success Email -------------------- */
//     // Using a self-invoking async function so it doesn't block the redirect
//     (async () => {
//       let emailConn;
//       try {
//         emailConn = await database.getConnection();
        
//         // Fetch full order details for the template
//         const [order, items, address] = await Promise.all([
//           emailConn.queryOne(`SELECT * FROM orders WHERE id = ?`, [paymentRecord.order_id]),
//           emailConn.query(`SELECT * FROM order_items WHERE order_id = ?`, [paymentRecord.order_id]),
//           emailConn.queryOne(`SELECT * FROM order_addresses WHERE order_id = ?`, [paymentRecord.order_id])
//         ]);

//         const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
        
//         const orderContext = {
//           id: order.id,
//           date: new Date(order.placed_at).toLocaleString('en-GB', { 
//             day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
//           }),
//           status: order.order_status, // approved, new, etc.
          
          
//           payment_method: "SSLCommerz ",
//           current_order_payment_status: order.payment_status, // paid, partial_paid
//           paid_amount: formatBDT(order.paid_amount), // NEW field
//           due_amount: formatBDT(order.due_amount),   // NEW field
//           shipping_address: `${address.full_address}, ${address.city}`,
//           track_url: `${SHOP_URL}/account/my-order/${order.id}`,
//           transaction_ref:data.bank_tran_id,
//           subtotal: formatBDT(order.subtotal),
//           shipping_fee: formatBDT(order.delivery_charge),
//           discount: formatBDT(order.discount_total),
//           total: formatBDT(order.grand_total),
//           items: items.map(item => ({
//             name: item.product_name,
//             variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
//             sku: item.product_sku_id,
//             qty: item.quantity,
//             price: formatBDT(item.final_unit_price),
//             subtotal: formatBDT(item.line_total)
//           }))
//         };

//         await sendPaymentMail(emailConn, {
//           name: order.customer_name,
//           email: order.customer_email || "User",
//           order: orderContext ,
//           status:"success"
//         });

//       } catch (err) {
//         console.error("SSL Payment Success Email Error:", err);
  
//       } finally {
//         if (emailConn) await emailConn.release();
//       }
//     })();



//     await connection.commit();
//     await connection.release();


//     // 7. Redirect to success page
//     return res.redirect(getFrontendUrl('success', paymentRecord.order_id, {
//       message: 'Payment successful',
//       payment_method: 'sslcommerz',
//       amount: paidAmountNow,
//       payment_status: finalPaymentStatus
//     }));

//   } catch (error) {
//     console.error('SSLCommerz Callback Error:', error);
    
//     if (connection) {
//       await connection.rollback();
//       await connection.release();
//     }

//     const tranId = req.body?.tran_id || 'unknown';
//     return res.redirect(getFrontendUrl('failed', tranId, {
//       message: 'Payment processing failed',
//       payment_method: 'sslcommerz',
//       error: 'server_error'
//     }));
//   }
// };

// // SSLCommerz Fail Handler with Redirect
// exports.sslCommerzFail = async (req, res) => {
//   let connection;
//   try {
//     connection = await database.getConnection();
//     await connection.beginTransaction();

//     const data = req.body;
//     const tranId = data.tran_id;

//     if (!tranId) {
//       await connection.rollback();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('failed', 'unknown', {
//         message: 'Invalid transaction reference',
//         payment_method: 'sslcommerz',
//         error: 'invalid_reference'
//       }));
//     }

//     // Load payment + order
//     const paymentRecord = await connection.queryOne(
//       `SELECT 
//           op.id           AS payment_id,
//           op.status       AS payment_status,
//           op.order_id,
//           o.payment_status AS order_payment_status
//        FROM order_payments op
//        JOIN orders o ON o.id = op.order_id
//        WHERE op.id = ?`,
//       [tranId]
//     );

//     if (!paymentRecord) {
//       await connection.rollback();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('failed', tranId, {
//         message: 'Payment record not found',
//         payment_method: 'sslcommerz',
//         error: 'record_not_found'
//       }));
//     }

//     // Idempotency check
//     if (paymentRecord.payment_status === "success") {
//       await connection.commit();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('success', paymentRecord.order_id, {
//         message: 'Payment already completed',
//         payment_method: 'sslcommerz',
//         already_processed: true
//       }));
//     }

//     if (paymentRecord.payment_status === "failed") {
//       await connection.commit();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('failed', paymentRecord.order_id, {
//         message: 'Payment already marked as failed',
//         payment_method: 'sslcommerz',
//         already_failed: true
//       }));
//     }

//     // Mark payment as failed
//     await connection.query(
//       `UPDATE order_payments
//        SET status = 'failed' 
//        WHERE id = ?`,
//       [paymentRecord.payment_id]
//     );



// /* -------------------- 6️⃣ Send Payment Failure Email -------------------- */
//     (async () => {
//       let emailConn;
//       try {
//         emailConn = await database.getConnection();
        
//         // Fetch full order details
//         const [order, items, address] = await Promise.all([
//           emailConn.queryOne(`SELECT * FROM orders WHERE id = ?`, [paymentRecord.order_id]),
//           emailConn.query(`SELECT * FROM order_items WHERE order_id = ?`, [paymentRecord.order_id]),
//           emailConn.queryOne(`SELECT * FROM order_addresses WHERE order_id = ?`, [paymentRecord.order_id])
//         ]);

//         const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
        
//         const orderContext = {
//           id: order.id,
//           date: new Date(order.placed_at).toLocaleString('en-GB', { 
//             day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
//           }),
//           status: order.order_status, 
//           payment_method: "SSLCommerz",
//           current_order_payment_status: order.payment_status, 
//           paid_amount: formatBDT(order.paid_amount), 
//           due_amount: formatBDT(order.due_amount),   
//           shipping_address: address ? `${address.full_address}, ${address.city}` : "N/A",
//           track_url: `${SHOP_URL}/account/my-order/${order.id}`,
//           transaction_ref: tranId, // The failed transaction ID
//           subtotal: formatBDT(order.subtotal),
//           shipping_fee: formatBDT(order.delivery_charge),
//           discount: formatBDT(order.discount_total),
//           total: formatBDT(order.grand_total),
//           items: items.map(item => ({
//             name: item.product_name,
//             variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
//             sku: item.product_sku_id,
//             qty: item.quantity,
//             price: formatBDT(item.final_unit_price),
//             subtotal: formatBDT(item.line_total)
//           }))
//         };

//         await sendPaymentMail(emailConn, {
//           name: order.customer_name,
//           email: order.customer_email || "User",
//           order: orderContext,
//           status: "failed"
//         });

//       } catch (err) {
//         console.error("SSL Payment Failure Email Error:", err);
//       } finally {
//         if (emailConn) await emailConn.release();
//       }
//     })();


//     await connection.commit();
//     await connection.release();

//     return res.redirect(getFrontendUrl('failed', paymentRecord.order_id, {
//       message: 'Payment failed',
//       payment_method: 'sslcommerz',
//       reason: 'payment_failed'
//     }));

//   } catch (error) {
//     console.error('SSLCommerz Fail Handler Error:', error);
    
//     if (connection) {
//       await connection.rollback();
//       await connection.release();
//     }

//     const tranId = req.body?.tran_id || 'unknown';
//     return res.redirect(getFrontendUrl('failed', tranId, {
//       message: 'Payment processing error',
//       payment_method: 'sslcommerz',
//       error: 'server_error'
//     }));
//   }
// };

// // SSLCommerz Cancel Handler with Redirect
// exports.sslCommerzCancel = async (req, res) => {
//   let connection;
//   try {
//     connection = await database.getConnection();
//     await connection.beginTransaction();

//     const data = req.body;
//     const tranId = data.tran_id;

//     if (!tranId) {
//       await connection.rollback();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('cancelled', 'unknown', {
//         message: 'Invalid transaction reference',
//         payment_method: 'sslcommerz',
//         error: 'invalid_reference'
//       }));
//     }

//     // Load payment + order
//     const paymentRecord = await connection.queryOne(
//       `SELECT 
//           op.id           AS payment_id,
//           op.status       AS payment_status,
//           op.order_id,
//           o.payment_status AS order_payment_status
//        FROM order_payments op
//        JOIN orders o ON o.id = op.order_id
//        WHERE op.id = ?`,
//       [tranId]
//     );

//     if (!paymentRecord) {
//       await connection.rollback();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('cancelled', tranId, {
//         message: 'Payment record not found',
//         payment_method: 'sslcommerz',
//         error: 'record_not_found'
//       }));
//     }

//     // Idempotency checks
//     if (paymentRecord.payment_status === "success") {
//       await connection.commit();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('success', paymentRecord.order_id, {
//         message: 'Payment already completed',
//         payment_method: 'sslcommerz',
//         already_processed: true
//       }));
//     }

//     if (paymentRecord.payment_status === "failed") {
//       await connection.commit();
//       await connection.release();
      
//       return res.redirect(getFrontendUrl('cancelled', paymentRecord.order_id, {
//         message: 'Payment already cancelled',
//         payment_method: 'sslcommerz',
//         already_cancelled: true
//       }));
//     }

//     // Mark payment as failed (cancelled by user)
//     await connection.query(
//       `UPDATE order_payments
//        SET status = 'failed' 
//        WHERE id = ?`,
//       [paymentRecord.payment_id]
//     );


//     /* -------------------- 6️⃣ Send Payment Cancellation Email -------------------- */
//     (async () => {
//       let emailConn;
//       try {
//         emailConn = await database.getConnection();
        
//         // Fetch full order details
//         const [order, items, address] = await Promise.all([
//           emailConn.queryOne(`SELECT * FROM orders WHERE id = ?`, [paymentRecord.order_id]),
//           emailConn.query(`SELECT * FROM order_items WHERE order_id = ?`, [paymentRecord.order_id]),
//           emailConn.queryOne(`SELECT * FROM order_addresses WHERE order_id = ?`, [paymentRecord.order_id])
//         ]);

//         const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
        
//         const orderContext = {
//           id: order.id,
//           date: new Date(order.placed_at).toLocaleString('en-GB', { 
//             day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
//           }),
//           status: order.order_status, 
//           payment_method: "SSLCommerz",
//           current_order_payment_status: order.payment_status, 
//           paid_amount: formatBDT(order.paid_amount), 
//           due_amount: formatBDT(order.due_amount),   
//           shipping_address: address ? `${address.full_address}, ${address.city}` : "N/A",
//           track_url: `${SHOP_URL}/account/my-order/${order.id}`,
//           transaction_ref: tranId, 
//           subtotal: formatBDT(order.subtotal),
//           shipping_fee: formatBDT(order.delivery_charge),
//           discount: formatBDT(order.discount_total),
//           total: formatBDT(order.grand_total),
//           items: items.map(item => ({
//             name: item.product_name,
//             variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
//             sku: item.product_sku_id,
//             qty: item.quantity,
//             price: formatBDT(item.final_unit_price),
//             subtotal: formatBDT(item.line_total)
//           }))
//         };

//         await sendPaymentMail(emailConn, {
//           name: order.customer_name,
//           email: order.customer_email || "User",
//           order: orderContext,
//           status: "cancelled" // Passed as "cancelled" to distinguish from hard "failed"
//         });

//       } catch (err) {
//         console.error("SSL Payment Cancellation Email Error:", err);
//       } finally {
//         if (emailConn) await emailConn.release();
//       }
//     })();

//     await connection.commit();
//     await connection.release();

//     return res.redirect(getFrontendUrl('cancelled', paymentRecord.order_id, {
//       message: 'Payment cancelled by user',
//       payment_method: 'sslcommerz',
//       reason: 'user_cancelled'
//     }));

//   } catch (error) {
//     console.error('SSLCommerz Cancel Handler Error:', error);
    
//     if (connection) {
//       await connection.rollback();
//       await connection.release();
//     }

//     const tranId = req.body?.tran_id || 'unknown';
//     return res.redirect(getFrontendUrl('cancelled', tranId, {
//       message: 'Payment cancellation error',
//       payment_method: 'sslcommerz',
//       error: 'server_error'
//     }));
//   }
// };


//Success Callback




exports.sslCommerzCallback = async (req, res) => {
    let connection;
    try {
        const data = req.body;
        connection = await database.getConnection();
        await connection.beginTransaction();

        // 1. Check if IPN already successfully processed this
        const existingPayment = await connection.queryOne(
            `SELECT op.status, op.order_id, o.payment_status 
             FROM order_payments op 
             JOIN orders o ON o.id = op.order_id 
             WHERE op.id = ?`,
            [data.tran_id]
        );

        if (existingPayment && existingPayment.status === 'success') {
            await connection.commit();
            console.log("Payment already success via IPN. Redirecting...");
            return res.redirect(getFrontendUrl('success', existingPayment.order_id, { 
                payment_method: 'sslcommerz',
                payment_status: existingPayment.payment_status
            }));
        }

        // 2. Initial Status Check
        if (data.status !== "VALID" && data.status !== "AUTHENTICATED") {
             throw new Error(`Payment status: ${data.status}`);
        }

        // 3. Fetch Config
        const configs = await getConfig(connection, false, "payment");
        const providerRows = configs.filter(c => c.provider === "sslcommerz");
        const sslConfig = {};
        providerRows.forEach(r => (sslConfig[r.key_name] = r.value));

        // 4. Call SSLCommerz Validation API
        const isSandbox = sslConfig.SSL_ENV === "sandbox";
        const validationEndpoint = isSandbox
            ? "/validator/api/validationserverAPI.php"
            : "/validator/api/ordervalidate.php";

        const params = new URLSearchParams({
            val_id: data.val_id,
            store_id: sslConfig.SSL_STORE_ID,
            store_passwd: sslConfig.SSL_STORE_PASS,
            format: "json"
        });

        const validationUrl = `${sslConfig.SSL_BASE_URL}${validationEndpoint}?${params.toString()}`;
        const { data: verifyData } = await axios.get(validationUrl);

        console.log("verifyData status:", verifyData.status);

        // --- THE FIX: Added 'VALIDATED' to the check ---
        const VALID_STATUSES = ['VALID', 'AUTHENTICATED', 'VALIDATED'];
        
        if (!VALID_STATUSES.includes(verifyData.status)) {
            throw new Error(`Transaction validation failed: ${verifyData.status}`);
        }

        // 5. Integrity Check
        if (parseFloat(verifyData.amount) < parseFloat(data.amount)) {
            throw new Error("Amount mismatch during validation");
        }

        /* -------------------- 6️⃣ Process Success -------------------- */
        const result = await processSuccessfulPayment(
            connection, 
            data.tran_id, 
            data.bank_tran_id, 
            data.amount
        );

        await connection.commit();

        /* -------------------- 7️⃣ Trigger Email -------------------- */
        if (result.success && !result.alreadyProcessed) {
            triggerPaymentEmail(result.orderId, "success", data.bank_tran_id);
        }

        return res.redirect(getFrontendUrl('success', result.orderId, { 
            payment_method: 'sslcommerz',
            payment_status: result.finalPaymentStatus,
            tran_id: data.tran_id
        }));

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("SSL Callback Error:", error.message);

        const tranId = req.body?.tran_id || 'unknown';
        // Try to resolve the actual order_id from the payment record
        let displayOrderId = tranId;
        try {
            if (connection && tranId !== 'unknown') {
                const rec = await connection.queryOne(
                    `SELECT order_id FROM order_payments WHERE id = ?`, [tranId]
                );
                if (rec) displayOrderId = rec.order_id;
            }
        } catch (_) { /* best-effort */ }
        return res.redirect(getFrontendUrl('failed', displayOrderId));
    } finally {
        if (connection) await connection.release();
    }
};

// Fail Handler
exports.sslCommerzFail = async (req, res) => {
    let connection;
    try {
        connection = await database.getConnection();
        await connection.beginTransaction();
        const result = await processFailedPayment(connection, req.body.tran_id, "failed");
        await connection.commit();

        if (result.success && !result.alreadyProcessed) {
            triggerPaymentEmail(result.orderId, "failed", req.body.tran_id);
        }

        return res.redirect(getFrontendUrl('failed', result.orderId, { payment_method: 'sslcommerz' }));
    } catch (error) {
        if (connection) await connection.rollback();
        return res.redirect(getFrontendUrl('failed', 'unknown'));
    } finally {
        if (connection) await connection.release();
    }
};

// Cancel Handler
exports.sslCommerzCancel = async (req, res) => {
    let connection;
    try {
        connection = await database.getConnection();
        await connection.beginTransaction();
        const result = await processFailedPayment(connection, req.body.tran_id, "cancelled");
        await connection.commit();

        if (result.success && !result.alreadyProcessed) {
            triggerPaymentEmail(result.orderId, "cancelled", req.body.tran_id);
        }

        return res.redirect(getFrontendUrl('cancelled', result.orderId, { payment_method: 'sslcommerz' }));
    } catch (error) {
        if (connection) await connection.rollback();
        return res.redirect(getFrontendUrl('cancelled', 'unknown'));
    } finally {
        if (connection) await connection.release();
    }
};




// bKash Callback with Redirect
exports.bkashCallback = async (req, res) => {
  let connection;
  try {
    connection = await database.getConnection();
    await connection.beginTransaction();

    const { status, paymentID, merchantInvoiceNumber } = req.query;

    if (!merchantInvoiceNumber) {
      await connection.rollback();
      await connection.release();
      
      return res.redirect(getFrontendUrl('failed', 'unknown', {
        message: 'Invalid payment reference',
        payment_method: 'bkash',
        error: 'invalid_reference'
      }));
    }

    const paymentId = Number(merchantInvoiceNumber);

    // Load payment + order state
    const paymentRecord = await connection.queryOne(
      `SELECT 
          op.id           AS payment_id,
          op.status       AS payment_status,
          op.order_id,
          o.payment_status AS order_payment_status,
          o.grand_total,
          o.paid_amount,
          o.due_amount
       FROM order_payments op
       JOIN orders o ON o.id = op.order_id
       WHERE op.id = ?`,
      [paymentId]
    );

    if (!paymentRecord) {
      await connection.rollback();
      await connection.release();
      
      return res.redirect(getFrontendUrl('failed', paymentId.toString(), {
        message: 'Payment record not found',
        payment_method: 'bkash',
        error: 'record_not_found'
      }));
    }

    // Handle non-success immediately
    if (status !== "success") {
      if (paymentRecord.payment_status !== "success") {
        await connection.query(
          `UPDATE order_payments SET status = 'failed' WHERE id = ?`,
          [paymentId]
        );
      }

      await connection.commit();
      await connection.release();
      
      return res.redirect(getFrontendUrl('failed', paymentRecord.order_id, {
        message: 'Payment failed or cancelled',
        payment_method: 'bkash',
        reason: status === 'cancel' ? 'user_cancelled' : 'payment_failed'
      }));
    }

    // Idempotency check
    if (paymentRecord.payment_status === "success") {
      await connection.commit();
      await connection.release();
      
      return res.redirect(getFrontendUrl('success', paymentRecord.order_id, {
        message: 'Payment already completed',
        payment_method: 'bkash',
        already_processed: true
      }));
    }

    // Load bKash credentials
    const configs = await getConfig(connection, false, "payment");
    const creds = {};
    configs
      .filter(c => c.provider === "bkash")
      .forEach(r => (creds[r.key_name] = r.value));

    try {
      // Grant token
      const tokenRes = await axios.post(
        `${creds.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
        {
          app_key: creds.BKASH_APP_KEY,
          app_secret: creds.BKASH_APP_SECRET
        },
        {
          headers: {
            username: creds.BKASH_USERNAME,
            password: creds.BKASH_PASSWORD
          }
        }
      );

      const idToken = tokenRes.data.id_token;

      // Execute payment
      const executeRes = await axios.post(
        `${creds.BKASH_BASE_URL}/tokenized/checkout/execute`,
        { paymentID },
        {
          headers: {
            Authorization: idToken,
            "X-APP-Key": creds.BKASH_APP_KEY
          }
        }
      );

      const result = executeRes.data;

      // Validate execution response
      if (
        result.statusCode !== "0000" ||
        result.transactionStatus !== "Completed"
      ) {
        throw new Error(result.statusMessage || "bKash execution failed");
      }

      // Financial calculation
      const paidAmountNow = Number(result.amount) || 0;
      const totalPaidUpdated = Math.min(
        Number(paymentRecord.paid_amount) + paidAmountNow,
        Number(paymentRecord.grand_total)
      );
      const newDue = Math.max(
        0,
        Number(paymentRecord.grand_total) - totalPaidUpdated
      );

      let finalPaymentStatus = paymentRecord.order_payment_status;
      if (totalPaidUpdated >= Number(paymentRecord.grand_total)) {
        finalPaymentStatus = "paid";
      } else if (totalPaidUpdated > 0) {
        finalPaymentStatus = "partial_paid";
      }

      // Update order_payments
      await connection.query(
        `UPDATE order_payments
         SET transaction_ref = ?, status = 'success', paid_at = NOW()
         WHERE id = ?`,
        [result.trxID, paymentId]
      );

      // Update orders
      if (
        paymentRecord.order_payment_status !== finalPaymentStatus ||
        Number(paymentRecord.paid_amount) !== totalPaidUpdated ||
        Number(paymentRecord.due_amount) !== newDue
      ) {
        await connection.query(
          `UPDATE orders SET
             payment_status = ?,
             paid_amount = ?,
             due_amount = ?,
             order_status = CASE WHEN ? = 'paid' THEN 'approved' ELSE order_status END,
             paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
             updated_at = NOW()
           WHERE id = ?`,
          [
            finalPaymentStatus,
            totalPaidUpdated,
            newDue,
            finalPaymentStatus,
            finalPaymentStatus,
            paymentRecord.order_id
          ]
        );

        // Update order status history if status changed to approved
        if (finalPaymentStatus === 'paid') {
          await connection.query(
            `INSERT INTO order_status_history (
              order_id, old_status, new_status, note
            ) VALUES (?, 'new', 'approved', 'Payment completed via bKash')`,
            [paymentRecord.order_id]
          );
        }
      }

      await connection.commit();
      await connection.release();

      return res.redirect(getFrontendUrl('success', paymentRecord.order_id, {
        message: 'Payment successful',
        payment_method: 'bkash',
        amount: paidAmountNow,
        payment_status: finalPaymentStatus,
        transaction_id: result.trxID
      }));

    } catch (err) {
      console.error("bKash Callback Error:", err.message);

      // Mark failed safely
      if (paymentRecord.payment_status !== "success") {
        await connection.query(
          `UPDATE order_payments SET status = 'failed' WHERE id = ?`,
          [paymentId]
        );
      }

      await connection.commit();
      await connection.release();

      return res.redirect(getFrontendUrl('failed', paymentRecord.order_id, {
        message: 'Payment processing failed',
        payment_method: 'bkash',
        error: 'payment_execution_failed'
      }));
    }

  } catch (error) {
    console.error('bKash Callback Handler Error:', error);
    
    if (connection) {
      await connection.rollback();
      await connection.release();
    }

    const paymentId = req.query?.merchantInvoiceNumber || 'unknown';
    return res.redirect(getFrontendUrl('failed', paymentId, {
      message: 'Payment processing error',
      payment_method: 'bkash',
      error: 'server_error'
    }));
  }
};

// ShurjoPay Callback with Redirect
exports.shurjopayCallback = async (req, res) => {
  let connection;
  try {
    connection = await database.getConnection();
    await connection.beginTransaction();

    const { order_id } = req.query;

    if (!order_id) {
      await connection.rollback();
      await connection.release();
      
      return res.redirect(getFrontendUrl('failed', 'unknown', {
        message: 'Invalid payment reference',
        payment_method: 'shurjopay',
        error: 'invalid_reference'
      }));
    }

    // Load payment configs
    const configs = await getConfig(connection, false, "payment");
    const creds = Object.fromEntries(
      configs
        .filter(c => c.provider === "shurjopay")
        .map(r => [r.key_name, r.value])
    );

    try {
      // Get Auth Token
      const authRes = await axios.post(
        `${creds.SP_ENDPOINT}/api/get_token`,
        {
          username: creds.SP_USERNAME,
          password: creds.SP_PASSWORD
        }
      );

      // Verify Payment
      const verifyRes = await axios.post(
        `${creds.SP_ENDPOINT}/api/verification`,
        { order_id },
        {
          headers: {
            Authorization: `Bearer ${authRes.data.token}`
          }
        }
      );

      if (!Array.isArray(verifyRes.data) || !verifyRes.data.length) {
        throw new Error("Empty verification response");
      }

      const paymentInfo = verifyRes.data[0];
      const spCode = String(paymentInfo.sp_code);
      const paymentId = paymentInfo.customer_order_id;

      // Load existing payment
      const [[payment]] = await connection.query(
        `SELECT id, status, order_id FROM order_payments WHERE id = ? FOR UPDATE`,
        [paymentId]
      );

      if (!payment) {
        await connection.rollback();
        await connection.release();
        
        return res.redirect(getFrontendUrl('failed', order_id, {
          message: 'Payment record not found',
          payment_method: 'shurjopay',
          error: 'record_not_found'
        }));
      }

      // Already finalized
      if (payment.status !== "pending") {
        await connection.commit();
        await connection.release();
        
        const status = payment.status === 'success' ? 'success' : 'failed';
        return res.redirect(getFrontendUrl(status, payment.order_id, {
          message: `Payment already ${payment.status}`,
          payment_method: 'shurjopay',
          already_processed: true
        }));
      }

      // ShurjoPay Status Handling
      if (spCode === "1000") {
        // SUCCESS
        await connection.query(
          `UPDATE order_payments 
           SET status = 'success', transaction_ref = ?, paid_at = NOW() 
           WHERE id = ?`,
          [order_id, paymentId]
        );

        // Update order
        await connection.query(
          `UPDATE orders 
           SET payment_status = 'paid', 
               paid_amount = grand_total,
               due_amount = 0,
               order_status = 'approved',
               paid_at = NOW(),
               updated_at = NOW()
           WHERE id = ?`,
          [payment.order_id]
        );

        // Update order status history
        await connection.query(
          `INSERT INTO order_status_history (
            order_id, old_status, new_status, note
          ) VALUES (?, 'new', 'approved', 'Payment completed via ShurjoPay')`,
          [payment.order_id]
        );

        await connection.commit();
        await connection.release();

        return res.redirect(getFrontendUrl('success', payment.order_id, {
          message: 'Payment successful',
          payment_method: 'shurjopay',
          transaction_id: order_id
        }));

      } else if (spCode === "1001" || spCode === "1002") {
        // FAILED / CANCELLED
        await connection.query(
          `UPDATE order_payments 
           SET status = 'failed' 
           WHERE id = ?`,
          [paymentId]
        );

        await connection.commit();
        await connection.release();

        const reason = spCode === "1002" ? "cancelled_by_user" : "bank_declined";
        return res.redirect(getFrontendUrl('failed', payment.order_id, {
          message: `Payment ${reason}`,
          payment_method: 'shurjopay',
          reason: reason
        }));
      }

      // UNKNOWN CODE
      await connection.commit();
      await connection.release();
      
      return res.redirect(getFrontendUrl('pending', payment.order_id, {
        message: 'Payment status pending verification',
        payment_method: 'shurjopay',
        status_code: spCode
      }));

    } catch (err) {
      console.error("ShurjoPay verification failed:", err.message);
      
      await connection.rollback();
      await connection.release();
      
      return res.redirect(getFrontendUrl('pending', order_id, {
        message: 'Payment verification in progress',
        payment_method: 'shurjopay',
        error: 'verification_pending'
      }));
    }

  } catch (error) {
    console.error('ShurjoPay Callback Handler Error:', error);
    
    if (connection) {
      await connection.rollback();
      await connection.release();
    }

    const orderId = req.query?.order_id || 'unknown';
    return res.redirect(getFrontendUrl('failed', orderId, {
      message: 'Payment processing error',
      payment_method: 'shurjopay',
      error: 'server_error'
    }));
  }
};

// ShurjoPay Cancel Handler with Redirect
exports.shurjopayCancel = async (req, res) => {
  let connection;
  try {
    connection = await database.getConnection();
    await connection.beginTransaction();

    const { order_id } = req.query;

    if (!order_id) {
      await connection.rollback();
      await connection.release();
      
      return res.redirect(getFrontendUrl('cancelled', 'unknown', {
        message: 'Invalid transaction reference',
        payment_method: 'shurjopay',
        error: 'invalid_reference'
      }));
    }

    // Load payment row
    const [[payment]] = await connection.query(
      `SELECT id, status, order_id 
       FROM order_payments 
       WHERE transaction_ref = ? 
       FOR UPDATE`,
      [order_id]
    );

    if (!payment) {
      await connection.rollback();
      await connection.release();
      
      return res.redirect(getFrontendUrl('cancelled', order_id, {
        message: 'Payment record not found',
        payment_method: 'shurjopay',
        error: 'record_not_found'
      }));
    }

    // Already finalized
    if (payment.status === "success" || payment.status === "failed") {
      await connection.commit();
      await connection.release();
      
      const status = payment.status === 'success' ? 'success' : 'cancelled';
      return res.redirect(getFrontendUrl(status, payment.order_id, {
        message: `Payment already ${payment.status}`,
        payment_method: 'shurjopay',
        already_processed: true
      }));
    }

    // Mark as cancelled
    if (payment.status === "pending") {
      await connection.query(
        `UPDATE order_payments 
         SET status = 'failed' 
         WHERE id = ?`,
        [payment.id]
      );
    }

    await connection.commit();
    await connection.release();

    return res.redirect(getFrontendUrl('cancelled', payment.order_id, {
      message: 'Payment cancelled by user',
      payment_method: 'shurjopay',
      reason: 'user_cancelled'
    }));

  } catch (error) {
    console.error('ShurjoPay Cancel Handler Error:', error);
    
    if (connection) {
      await connection.rollback();
      await connection.release();
    }

    const orderId = req.query?.order_id || 'unknown';
    return res.redirect(getFrontendUrl('cancelled', orderId, {
      message: 'Payment cancellation error',
      payment_method: 'shurjopay',
      error: 'server_error'
    }));
  }
};