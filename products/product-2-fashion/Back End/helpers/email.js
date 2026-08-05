const database = require('../utils/connection');

const {sendPaymentMail}=require('../mail-templates/payment');

const { SHOP_URL } = require('../config/ApplicationSettings');

exports.triggerPaymentEmail = (orderId, status, tranRef) => {
    (async () => {
        let emailConn;
        try {
            emailConn = await database.getConnection();
            
            // 1. Fetch full order details, items, and shipping address
            const [order, items, address] = await Promise.all([
                emailConn.queryOne(`SELECT * FROM orders WHERE id = ?`, [orderId]),
                emailConn.query(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]),
                emailConn.queryOne(`SELECT * FROM order_addresses WHERE order_id = ?`, [orderId])
            ]);

            if (!order) {
                console.error(`Email Trigger: Order #${orderId} not found.`);
                return;
            }

            // 2a. Fetch coupon discount from order_coupons (source of truth)
            const coupons = await emailConn.query(
                `SELECT discount_amount FROM order_coupons WHERE order_id = ?`,
                [orderId]
            );
            const couponDiscountTotal = coupons.reduce(
                (sum, c) => sum + Number(c.discount_amount ?? 0), 0
            );

            // SKU-level discount: use stored sku_discount_total.
            // Fallback: discount_total minus coupon (covers older orders where sku_discount_total was not stored separately).
            const rawSkuDiscount = Number(order.sku_discount_total ?? 0);
            const rawDiscountTotal = Number(order.discount_total ?? 0);
            const skuDiscountTotal = rawSkuDiscount > 0
                ? rawSkuDiscount
                : Math.max(0, rawDiscountTotal - couponDiscountTotal);

            const bulkDiscountTotal  = Number(order.bulk_discount_total  ?? 0);
            const comboDiscountTotal = Number(order.combo_discount_total ?? 0);
            const cartWideDiscount   = Number(order.cart_wide_discount   ?? 0);
            const weightExtraCharge  = Number(order.weight_extra_charge  ?? 0);
            const totalWeightKg      = Number(order.weight_kg_total      ?? 0);

            // 2b. Formatting Helpers
            const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
            
            const orderContext = {
                id: order.id,
                date: new Date(order.placed_at).toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
                }),
                status: order.order_status, 
                payment_method: "SSLCommerz",
                current_order_payment_status: order.payment_status,
                paid_amount: formatBDT(order.paid_amount),
                due_amount: formatBDT(order.due_amount),   
                shipping_address: address ? `${address.full_address}, ${address.city}` : "N/A",
                track_url: `${SHOP_URL}/account/my-order/${order.id}`,
                transaction_ref: tranRef,
                subtotal: formatBDT(order.subtotal),
                shipping_fee: formatBDT(order.delivery_charge),
                weight_surcharge: weightExtraCharge  > 0 ? formatBDT(weightExtraCharge)  : null,
                weight_kg:        totalWeightKg      > 0 ? Number(totalWeightKg.toFixed(3)) : null,
                discount:         skuDiscountTotal   > 0 ? formatBDT(skuDiscountTotal)   : null,
                bulk_discount:    bulkDiscountTotal  > 0 ? formatBDT(bulkDiscountTotal)  : null,
                combo_discount:   comboDiscountTotal > 0 ? formatBDT(comboDiscountTotal) : null,
                cart_wide_discount: cartWideDiscount > 0 ? formatBDT(cartWideDiscount)  : null,
                coupon_discount:  couponDiscountTotal > 0 ? formatBDT(couponDiscountTotal) : null,
                total: formatBDT(order.grand_total),
                items: items.map(item => ({
                    name: item.product_name,
                    variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
                    sku: item.product_sku_id,
                    qty: item.quantity,
                    price: formatBDT(item.final_unit_price),
                    subtotal: formatBDT(item.line_total)
                }))
            };

            // 3. Send the Mail
            // 'status' passed here will be "success", "failed", or "cancelled"
            await sendPaymentMail(emailConn, {
                name: order.customer_name,
                email: order.customer_email || "User",
                order: orderContext,
                status: status 
            });

            console.log(`[Email Service] Success email sent for Order #${orderId} (Status: ${status})`);

        } catch (err) {
            console.error(`[Email Service] Error for Order #${orderId}:`, err);
        } finally {
            if (emailConn) await emailConn.release();
        }
    })();
};