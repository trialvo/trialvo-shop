// adminOrderController.js
const { api, auth, validateAndCast } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require("validator");
const { getConfig } = require('../config/ApplicationSettingsDB');
const { handleSSLCommerz, handleShurjopay, handleBkash, handleNagad, handleRocket } = require('../service/payment');

// V2-017: auto-assign hook
const { autoAssignOrder } = require('./order_assignment');
// V2-034: admin notification hook
const { sendAdminOrderNotification } = require('../helpers/notify');


const {getFraudTestResults}= require('../helpers/courier');
// V2: configurable order placement permissions
const { validateAdminManualOrderPermission } = require('../helpers/orderPermission');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');



// Schema definitions - UPDATED: product_sku_id renamed to product_variation_id
const manualOrderItemSchema = {
  body: {
    product_variation_id: { type: "int", required: true },
    quantity: { type: "int", required: true }
  }
};

const manualOrderSchema = {
  body: {
    customer_id: { type: "int", required: true },
    address_id: { type: "int", required: true },
    payment_type: { type: "string", required: true }, // gateway | cod | mixed
    delivery_charge_id: { type: "int", required: true },
    coupon_code: { type: "string", required: false },
    note: { type: "string", required: false }
  }
};

// Helper function to calculate order totals - UPDATED
async function calculateOrderTotals(connection, items, couponCode = null, customerId = null) {
  let subtotal = 0;
  let skuDiscountTotal = 0;
  
  const enrichedItems = items.map(item => {
    const rawUnitPrice = Number(item.variation.selling_price);
    const skuDiscount = item.variation.discount_type === 1
      ? (rawUnitPrice * item.variation.discount) / 100
      : Number(item.variation.discount || 0);
    const finalUnitPrice = rawUnitPrice - skuDiscount;
    
    const lineSubtotal = rawUnitPrice * item.quantity;
    const lineDiscount = skuDiscount * item.quantity;
    const lineTotal = finalUnitPrice * item.quantity;
    
    subtotal += lineSubtotal;
    skuDiscountTotal += lineDiscount;
    
    return {
      ...item,
      rawUnitPrice,
      skuDiscount,
      finalUnitPrice,
      lineTotal,
      lineSubtotal,
      lineDiscount
    };
  });

  // Handle coupon validation - UPDATED: product_sku_id renamed to product_variation_id
  let couponDiscountTotal = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await connection.queryOne(
      `SELECT * FROM coupons
       WHERE code = ?
         AND status = 1
         AND start_date <= NOW()
         AND expire_date >= NOW()`,
      [couponCode]
    );
    
    if (!coupon) {
      throw new errors.BAD_REQUEST("Invalid coupon");
    }

    const discountBase = subtotal - skuDiscountTotal;
    if (discountBase < coupon.min_purchase_amount) {
      throw new errors.BAD_REQUEST(
        `Minimum purchase amount is ${coupon.min_purchase_amount}`
      );
    }

    if (coupon.customer_scope === "specified" && customerId) {
      const usageCount = await connection.queryOne(
        `SELECT COUNT(*) AS cnt
         FROM coupon_usages
         WHERE coupon_id = ? AND customer_id = ?`,
        [coupon.id, customerId]
      );

      if (usageCount.cnt >= coupon.limit_per_user) {
        throw new errors.BAD_REQUEST(
          "Customer has already used this coupon the maximum allowed times"
        );
      }
    }

    let discountAmount = 0;

    if (coupon.product_scope === "all") {
      discountAmount =
        coupon.discount_type === 0
          ? coupon.discount
          : (discountBase * coupon.discount) / 100;
    } else {
      const targets = await connection.query(
        `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
        [coupon.id]
      );
      const targetIds = targets.map(t => t.product_sku_id);

      enrichedItems.forEach(item => {
        if (targetIds.includes(item.variation.id)) {
          discountAmount +=
            coupon.discount_type === 0
              ? coupon.discount
              : (item.lineTotal * coupon.discount) / 100;
        }
      });
    }

    if (coupon.max_discount_amount != null) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }

    couponDiscountTotal = Number(discountAmount.toFixed(2));
    appliedCoupon = coupon;
  }

  const discountTotal = Number((skuDiscountTotal + couponDiscountTotal).toFixed(2));
  
  return {
    subtotal,
    skuDiscountTotal,
    couponDiscountTotal,
    discountTotal,
    enrichedItems,
    appliedCoupon
  };
}

// Helper function to check COD advance requirement
// async function checkCODAdvanceRequired(connection) {
//   const paymentCfgRows = await getConfig(connection, false, "payment");
  
//   for (const row of paymentCfgRows) {
//     if (row.provider === 'cod' && row.key_name === "MIN_ADVANCE_PAYMENT_PERCENTAGE") {
//       const advancePercent = Number(row.value) || 0;
//       return advancePercent > 0;
//     }
//   }
//   return false;
// }

async function checkCODAdvanceRequired(connection) {
  const paymentCfgRows = await getConfig(connection, false, "payment");

  let codActive = false;
  let advanceCfg = null;

  for (const row of paymentCfgRows) {
    if (row.provider !== "cod") continue;

    if (row.key_name === "CASH_ON_DELIVERY") {
      codActive = Boolean(row.is_active);
    }

    if (row.key_name === "MIN_ADVANCE_PAYMENT_PERCENTAGE") {
      advanceCfg = {
        is_active: Boolean(row.is_active),
        value: Number(row.value) || 0
      };
    }
  }

  // ❌ COD disabled → hard error
  if (!codActive) {
    throw new errors.BAD_REQUEST("Cash on Delivery is currently unavailable");
  }

  // ✅ Advance required only if enabled & > 0
  return Boolean(
    advanceCfg &&
    advanceCfg.is_active &&
    advanceCfg.value > 0
  );
}


// Main API: Create Manual Order for Customer - UPDATED
// exports.createManualOrder = api(
//   {
//     body: manualOrderSchema.body
//   },
//   auth(async (req, connection, adminInfo) => {
//     // 1️⃣ Authorization Check
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
//     if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
//       throw new errors.UNAUTHORIZED("You do not have permission to create manual orders");
//     }

//     const {
//       customer_id,
//       address_id,
//       payment_type,
//       delivery_charge_id,
//       coupon_code,
//       note
//     } = req.typed.body;

//     const orderItemsInput = req.body.order_items;
    
//     // 2️⃣ Validate Input
//     if (!Array.isArray(orderItemsInput) || !orderItemsInput.length) {
//       throw new errors.BAD_REQUEST("order_items must be a non-empty array");
//     }

//     if (!["gateway", "cod", "mixed"].includes(payment_type)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment_type");
//     }

//     // Set default statuses
//     const order_status = "new"; // Default order status
//     const payment_status = "unpaid"; // Default payment status

//     // 3️⃣ Validate Order Items - UPDATED: product_sku_id renamed to product_variation_id
//     const order_items = orderItemsInput.map((item, index) => {
//       try {
//         return validateAndCast({ body: item }, manualOrderItemSchema).body;
//       } catch (err) {
//         throw new errors.INVALID_FIELDS_PROVIDED(
//           `Item at index ${index}: ${err.message}`
//         );
//       }
//     });

//     // 4️⃣ Validate Customer Exists
//     const customer = await connection.queryOne(
//       `SELECT id, email, first_name, last_name, status 
//        FROM users 
//        WHERE id = ? AND deleted_at IS NULL`,
//       [customer_id]
//     );

//     if (!customer) {
//       throw new errors.NOT_FOUND("Customer not found");
//     }

//     if (customer.status !== 'active') {
//       throw new errors.BAD_REQUEST(`Customer account is ${customer.status}`);
//     }

//     // 5️⃣ Validate Address and Phone
//     const address = await connection.queryOne(
//       `SELECT 
//          a.*, 
//          p.phone_number, 
//          p.is_verified AS phone_verified,
//          u.id AS user_id
//        FROM user_addresses a
//        LEFT JOIN user_phones p ON p.id = a.phone_id
//        LEFT JOIN users u ON u.id = a.user_id
//        WHERE a.id = ? AND a.user_id = ?`,
//       [address_id, customer_id]
//     );

//     if (!address) {
//       throw new errors.NOT_FOUND("Address not found or doesn't belong to this customer");
//     }

//     if (!address.phone_verified) {
//       throw new errors.BAD_REQUEST("Phone number associated with this address is not verified");
//     }

//     // 6️⃣ Validate Delivery Charge
//     const deliveryCharge = await connection.queryOne(
//       `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
//       [delivery_charge_id]
//     );
    
//     if (!deliveryCharge) {
//       throw new errors.BAD_REQUEST("Invalid delivery charge");
//     }

//     // 7️⃣ Load Product Variations with free_delivery info - UPDATED: product_sku_id renamed to product_variation_id
//     // Get unique variation IDs to avoid duplicates
//     const variationIds = [...new Set(order_items.map(i => i.product_variation_id))];

//     const variations = await connection.query(
//       `SELECT s.*, p.name AS product_name, p.free_delivery
//        FROM product_skus s
//        JOIN products p ON p.id = s.product_id
//        INNER JOIN main_categories mc ON mc.id = p.main_category_id
//        LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//        LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//        WHERE s.id IN (?) AND s.status = 1
//          AND mc.status = 1
//          AND (p.sub_category_id IS NULL OR sc.status = 1)
//          AND (p.child_category_id IS NULL OR cc.status = 1)`,
//       [variationIds]
//     );

//     if (variations.length !== variationIds.length) {
//       throw new errors.BAD_REQUEST("Some product variations are invalid or belong to an inactive category");
//     }

//     // Map variations to items - UPDATED: product_sku_id renamed to product_variation_id
//     const variationMap = {};
//     variations.forEach(v => {
//       variationMap[v.id] = v;
//     });

//     // 8️⃣ Check free_delivery consistency
//     // Identify free delivery and paid delivery products
//     const freeDeliveryProducts = [];
//     const paidDeliveryProducts = [];
    
//     for (const item of order_items) {
//       const variation = variationMap[item.product_variation_id];
//       if (!variation) {
//         throw new errors.BAD_REQUEST(`Invalid product variation ${item.product_variation_id}`);
//       }
      
//       // Check stock availability
//       if (variation.stock < item.quantity) {
//         throw new errors.BAD_REQUEST(
//           `Insufficient stock for product ${variation.sku}. Available: ${variation.stock}, Requested: ${item.quantity}`
//         );
//       }
      
//       // Categorize products by free delivery status
//       if (variation.free_delivery === 1) {
//         freeDeliveryProducts.push({
//           product_variation_id: variation.id,
//           product_name: variation.product_name,
//           quantity: item.quantity
//         });
//       } else {
//         paidDeliveryProducts.push({
//           product_variation_id: variation.id,
//           product_name: variation.product_name,
//           quantity: item.quantity
//         });
//       }
//     }

//     // Check if there's a mix of free and paid delivery products
//     if (freeDeliveryProducts.length > 0 && paidDeliveryProducts.length > 0) {
//       // Build detailed error message
//       let errorMessage = "Cannot mix products with free delivery and paid delivery in the same order.";
//       throw new errors.BAD_REQUEST(errorMessage);
//     }

//     const hasFreeDelivery = freeDeliveryProducts.length === order_items.length;
    
//     // 9️⃣ Process quantities for same SKUs
//     // Group items by product_variation_id and sum quantities
//     const itemGroups = {};
//     order_items.forEach(item => {
//       const variationId = item.product_variation_id;
//       if (!itemGroups[variationId]) {
//         itemGroups[variationId] = {
//           ...item,
//           totalQuantity: 0
//         };
//       }
//       itemGroups[variationId].totalQuantity += item.quantity;
//     });

//     // Convert grouped items back to array
//     const groupedItems = Object.values(itemGroups);

//     // Create items with variations
//     const itemsWithVariations = groupedItems.map(groupedItem => {
//       const variation = variationMap[groupedItem.product_variation_id];
//       return {
//         product_variation_id: groupedItem.product_variation_id,
//         quantity: groupedItem.totalQuantity,
//         variation
//       };
//     });

//     // 🔟 Calculate Totals
//     const totals = await calculateOrderTotals(
//       connection, 
//       itemsWithVariations, 
//       coupon_code, 
//       customer_id
//     );

//     // Apply free delivery logic - if all products have free_delivery = 1, delivery charge is 0
//     const deliveryAmount = hasFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);

//     const grandTotal = Number(
//       (totals.subtotal - totals.discountTotal + deliveryAmount).toFixed(2)
//     );

//     // 1️⃣1️⃣ Determine Payment Amounts (default to unpaid)
//     let paidAmount = 0;
//     let dueAmount = grandTotal;

//     // 1️⃣2️⃣ Create Order
//     const orderResult = await connection.query(
//       `INSERT INTO orders (
//         customer_id,
//         customer_name,
//         customer_email,
//         customer_phone,
//         order_type,
//         payment_type,
//         payment_status,
//         subtotal,
//         discount_total,
//         delivery_charge,
//         grand_total,
//         paid_amount,
//         due_amount,
//         order_status,
//         note,
//         placed_at,
//         created_by_admin
//       ) VALUES (?, ?, ?, ?, 'regular', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
//       [
//         customer_id,
//         `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
//         customer.email || "",
//         address.phone_number || "",
//         payment_type,
//         payment_status, // Default: unpaid
//         totals.subtotal,
//         totals.discountTotal,
//         deliveryAmount,
//         grandTotal,
//         paidAmount, // Default: 0
//         dueAmount, // Default: grand_total
//         order_status, // Default: new
//         note || "",
//         adminInfo.id
//       ]
//     );

//     const orderId = orderResult.insertId;

//     /* -------------------- 1️⃣3️⃣ Order items (OPTIMIZED with batch image fetch) -------------------- */
//     // Get all unique product IDs from the order
//     const productIds = totals.enrichedItems.map(item => item.variation.product_id);
//     const uniqueProductIds = [...new Set(productIds)];

//     // Fetch first images for all products in one query
//     let productImagesMap = {};
//     if (uniqueProductIds.length > 0) {
//       // Using subquery to get the first image (by priority, then ID)
//       const productImages = await connection.query(
//         `SELECT 
//            pi.product_id,
//            pi.img_path 
//          FROM product_images pi
//          WHERE pi.product_id IN (?)
//            AND pi.id = (
//              SELECT MIN(pi2.id) 
//              FROM product_images pi2 
//              WHERE pi2.product_id = pi.product_id
//              ORDER BY pi2.serial ASC, pi2.id ASC
//              LIMIT 1
//            )`,
//         [uniqueProductIds]
//       );
      
//       // Create a map for quick lookup
//       productImages.forEach(img => {
//         productImagesMap[img.product_id] = img.img_path;
//       });
//     }

//     // Insert order items with product images
//     for (const item of totals.enrichedItems) {
//       const imagePath = productImagesMap[item.variation.product_id] || null;

//       await connection.query(
//         `INSERT INTO order_items (
//           order_id,
//           product_id,
//           product_sku_id,
//           product_name,
//           product_image,
//           color_id,
//           color_name,
//           color_hex,
//           attribute_id,
//           variant_id,
//           variant_name,
//           quantity,
//           buying_price,
//           selling_price,
//           discount,
//           discount_type,
//           final_unit_price,
//           line_total,
//           stock_adjusted
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           orderId,
//           item.variation.product_id,
//           item.variation.id,
//           item.variation.product_name,
//           imagePath,
//           item.variation.color_id,
//           item.variation.color_name,
//           item.variation.color_hex,
//           item.variation.attribute_id,
//           item.variation.variant_id,
//           item.variation.variant_name,
//           item.quantity,
//           item.variation.buying_price,
//           item.rawUnitPrice,
//           item.skuDiscount,
//           item.variation.discount_type,
//           item.finalUnitPrice,
//           item.lineTotal,
//           0 // stock_adjusted = 0 for new orders
//         ]
//       );

//       // DO NOT update product stock for new orders
//       // Stock will be adjusted when order moves to approved status
//     }

//     // 1️⃣4️⃣ Address Snapshot
//     await connection.query(
//       `INSERT INTO order_addresses (
//         order_id, 
//         address_id, 
//         address_type, 
//         full_address, 
//         city, 
//         zip_code
//       ) VALUES (?, ?, ?, ?, ?, ?)`,
//       [
//         orderId,
//         address_id,
//         address.address_type || 'n/a',
//         address.full_address,
//         address.city || null,
//         address.zip_code || null
//       ]
//     );

//     // 1️⃣5️⃣ Courier Snapshot (EXACTLY AS REQUESTED)
//     await connection.query(
//       `INSERT INTO order_couriers (
//         order_id,
//         delivery_charge_id,
//         delivery_title,
//         customer_charge,
//         our_charge,
//         created_at
//       ) VALUES (?, ?, ?, ?, ?, NOW())`,
//       [
//         orderId,
//         deliveryCharge.id,
//         deliveryCharge.title,
//         hasFreeDelivery ? 0 : deliveryCharge.customer_charge || 0,
//         deliveryCharge.our_charge || 0
//       ]
//     );

//     // 1️⃣6️⃣ Coupon Handling
//     if (totals.appliedCoupon) {
//       await connection.query(
//         `INSERT INTO coupon_usages (
//           coupon_id, 
//           order_id, 
//           customer_id, 
//           used_at
//         ) VALUES (?, ?, ?, NOW())`,
//         [totals.appliedCoupon.id, orderId, customer_id]
//       );

//       await connection.query(
//         `INSERT INTO order_coupons (
//           order_id,
//           coupon_id,
//           coupon_code,
//           coupon_title,
//           discount_type,
//           discount_value,
//           discount_amount,
//           applied_on
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           orderId,
//           totals.appliedCoupon.id,
//           totals.appliedCoupon.code,
//           totals.appliedCoupon.title,
//           totals.appliedCoupon.discount_type,
//           totals.appliedCoupon.discount,
//           totals.couponDiscountTotal,
//           totals.appliedCoupon.product_scope === "all" ? "order" : "sku"
//         ]
//       );
//     }

//     // 1️⃣7️⃣ Order Status History
//     await connection.query(
//       `INSERT INTO order_status_history (
//         order_id,
//         old_status,
//         new_status,
//         changed_by_admin,
//         note
//       ) VALUES (?, NULL, ?, ?, ?)`,
//       [
//         orderId,
//         order_status,
//         adminInfo.id,
//         note || "Order created manually by admin"
//       ]
//     );

//     // 1️⃣8️⃣ Admin Audit Log
//     await connection.query(
//       `INSERT INTO admin_audit_logs (
//         admin_id,
//         action,
//         resource,
//         resource_id,
//         meta,
//         ip_address
//       ) VALUES (?, 'CREATE_MANUAL_ORDER', 'order', ?, ?, ?)`,
//       [
//         adminInfo.id,
//         orderId,
//         JSON.stringify({
//           customer_id,
//           address_id,
//           payment_type,
//           delivery_charge_id,
//           coupon_code,
//           order_status,
//           payment_status,
//           item_count: order_items.length,
//           totals: {
//             subtotal: totals.subtotal,
//             discount_total: totals.discountTotal,
//             delivery_charge: deliveryAmount,
//             grand_total: grandTotal,
//             paid_amount: paidAmount,
//             due_amount: dueAmount
//           }
//         }),
//         req.ip || null
//       ]
//     );

//     // 1️⃣9️⃣ Determine if payment URL is needed
//     let payment_url = null;
//     const codAdvanceRequired = payment_type === "cod" ? await checkCODAdvanceRequired(connection) : false;
    
//     // Conditions for payment URL:
//     // 1. Gateway payment always needs URL
//     // 2. Mixed payment always needs URL (for partial online payment)
//     // 3. COD with advance required needs URL
//     if (
//       payment_type === "gateway" ||
//       payment_type === "mixed" ||
//       (payment_type === "cod" && codAdvanceRequired)
//     ) {
//       payment_url = `/api/v1/payment/stranger/${orderId}/initiate`;
//     }

//     // 2️⃣0️⃣ Return Response - UPDATED: product_sku_id renamed to product_variation_id
//     return {
//       success: true,
//       message: "Manual order created successfully",
//       order: {
//         id: orderId,
//         customer: {
//           id: customer_id,
//           name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
//           email: customer.email
//         },
//         totals: {
//           subtotal: totals.subtotal,
//           sku_discount: totals.skuDiscountTotal,
//           coupon_discount: totals.couponDiscountTotal,
//           discount_total: totals.discountTotal,
//           delivery: deliveryAmount,
//           grand_total: grandTotal,
//           paid_amount: paidAmount,
//           due_amount: dueAmount
//         },
//         delivery_info: {
//           free_delivery: hasFreeDelivery,
//           message: hasFreeDelivery ? "Free delivery applied" : "Standard delivery"
//         },
//         payment: {
//           type: payment_type,
//           status: payment_status,
//           advance_required: codAdvanceRequired,
//           url: payment_url  // Added payment URL
//         },
//         items: totals.enrichedItems.map(item => ({
//           product_id: item.variation.product_id,
//           product_variation_id: item.variation.id, // UPDATED
//           product_name: item.variation.product_name,
//           quantity: item.quantity,
//           unit_price: item.finalUnitPrice,
//           line_total: item.lineTotal
//         })),
//         status: {
//           order: order_status,
//           payment: payment_status
//         },
//         delivery: {
//           charge_id: delivery_charge_id,
//           title: deliveryCharge.title,
//           amount: deliveryAmount
//         },
//         coupon: totals.appliedCoupon ? {
//           code: totals.appliedCoupon.code,
//           title: totals.appliedCoupon.title,
//           discount_amount: totals.couponDiscountTotal
//         } : null,
//         next_steps: payment_url 
//           ? [
//               "Order created in 'new' status",
//               "Share payment URL with customer",
//               "Customer can pay using the payment URL",
//               "Update order status to 'approved' after payment confirmation"
//             ]
//           : [
//               "Order created in 'new' status",
//               "Update order status to 'approved' to adjust stock",
//               payment_type === "cod" 
//                 ? "Collect full payment on delivery"
//                 : "Customer needs to complete payment"
//             ]
//       }
//     };
//   })
// );

exports.createManualOrder = api(
  {
    body: manualOrderSchema.body
  },
  auth(async (req, connection, adminInfo) => {
    // 1️⃣ Authorization Check
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to create manual orders");
    }

    const {
      customer_id,
      address_id,
      payment_type,
      delivery_charge_id,
      coupon_code,
      note
    } = req.typed.body;

    const orderItemsInput = req.body.order_items;
    
    // 2️⃣ Validate Input
    if (!Array.isArray(orderItemsInput) || !orderItemsInput.length) {
      throw new errors.BAD_REQUEST("order_items must be a non-empty array");
    }

    if (!["gateway", "cod", "mixed"].includes(payment_type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment_type");
    }

    // Set default statuses
    const order_status = "new"; // Default order status
    const payment_status = "unpaid"; // Default payment status

    // 3️⃣ Validate Order Items
    const order_items = orderItemsInput.map((item, index) => {
      try {
        return validateAndCast({ body: item }, manualOrderItemSchema).body;
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Item at index ${index}: ${err.message}`
        );
      }
    });

    // 4️⃣ Validate Customer Exists
    const customer = await connection.queryOne(
      `SELECT id, email, first_name, last_name, status, is_email_verified, is_fully_verified
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [customer_id]
    );

    if (!customer) {
      throw new errors.NOT_FOUND("Customer not found");
    }

    if (customer.status !== 'active') {
      throw new errors.BAD_REQUEST(`Customer account is ${customer.status}`);
    }

    // ---------- NEW: Coupon Usage & Limit Check ----------
    if (coupon_code) {
      const coupon = await connection.queryOne(
        `SELECT id, limit_per_user, customer_scope FROM coupons 
         WHERE code = ? AND status = 1 
         AND start_date <= NOW() AND expire_date >= NOW()`,
        [coupon_code]
      );

      if (!coupon) {
        throw new errors.BAD_REQUEST("Invalid or expired coupon");
      }

      // Check per-user limit
      if (coupon.limit_per_user !== null) {
        const usageCount = await connection.queryOne(
          `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND customer_id = ?`,
          [coupon.id, customer_id]
        );

        if (usageCount.cnt >= coupon.limit_per_user) {
          throw new errors.BAD_REQUEST(`Customer has already reached the limit for coupon "${coupon_code}" (${coupon.limit_per_user} uses allowed)`);
        }
      }

      // Check customer scope targeting
      if (coupon.customer_scope === "specified") {
        const isTargeted = await connection.queryOne(
          `SELECT 1 FROM coupon_customer_targets WHERE coupon_id = ? AND customer_id = ? LIMIT 1`,
          [coupon.id, customer_id]
        );
        if (!isTargeted) {
          throw new errors.BAD_REQUEST("This coupon is not available for this specific customer account");
        }
      }
    }

    // 5️⃣ Validate Address and Phone
    const address = await connection.queryOne(
      `SELECT 
          a.*, 
          p.phone_number, 
          p.is_verified AS phone_verified,
          u.id AS user_id
       FROM user_addresses a
       LEFT JOIN user_phones p ON p.id = a.phone_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = ? AND a.user_id = ?`,
      [address_id, customer_id]
    );

    if (!address) {
      throw new errors.NOT_FOUND("Address not found or doesn't belong to this customer");
    }

    // 🔐 V2: Enforce configurable admin manual order placement permissions (reads from DB)
    await validateAdminManualOrderPermission(connection, customer, address);

    // 6️⃣ Validate Delivery Charge
    const deliveryCharge = await connection.queryOne(
      `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
      [delivery_charge_id]
    );
    
    if (!deliveryCharge) {
      throw new errors.BAD_REQUEST("Invalid delivery charge");
    }

    // 7️⃣ Load Product Variations with Category Filter
    const variationIds = [...new Set(order_items.map(i => i.product_variation_id))];

    const variations = await connection.query(
      `SELECT s.*, p.name AS product_name,
              COALESCE(s.free_delivery, p.free_delivery) AS free_delivery
       FROM product_skus s
       JOIN products p ON p.id = s.product_id
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       WHERE s.id IN (?) AND s.status = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [variationIds]
    );

    if (variations.length !== variationIds.length) {
      throw new errors.BAD_REQUEST("Some product variations are invalid or belong to an inactive category");
    }

    const variationMap = {};
    variations.forEach(v => {
      variationMap[v.id] = v;
    });

    // 8️⃣ Stock check — mixed free+paid delivery is ALLOWED (matches shop checkout)
    for (const item of order_items) {
      const variation = variationMap[item.product_variation_id];
      if (!variation) throw new errors.BAD_REQUEST(`Invalid product variation ${item.product_variation_id}`);

      if (variation.stock < item.quantity) {
        throw new errors.BAD_REQUEST(
          `Insufficient stock for product ${variation.sku}. Available: ${variation.stock}, Requested: ${item.quantity}`
        );
      }
    }

    // 9️⃣ Process quantities for same SKUs
    const itemGroups = {};
    order_items.forEach(item => {
      const variationId = item.product_variation_id;
      if (!itemGroups[variationId]) {
        itemGroups[variationId] = { ...item, totalQuantity: 0 };
      }
      itemGroups[variationId].totalQuantity += item.quantity;
    });

    const groupedItems = Object.values(itemGroups);

    const itemsWithVariations = groupedItems.map(groupedItem => {
      const variation = variationMap[groupedItem.product_variation_id];
      return {
        product_variation_id: groupedItem.product_variation_id,
        quantity: groupedItem.totalQuantity,
        variation
      };
    });

    // 🔟 Calculate SKU-level + coupon totals
    const totals = await calculateOrderTotals(
      connection,
      itemsWithVariations,
      coupon_code,
      customer_id
    );

    /* ── Weight surcharge constants ── */
    const freeWeightKg  = Number(deliveryCharge.default_weight_kg   ?? 0);
    const extraPerKg    = Number(deliveryCharge.extra_charge_per_kg ?? 0);

    // Initial delivery: waived only if EVERY item is free-delivery (SKU/product flag)
    const allFreeDelivery    = totals.enrichedItems.every(i => !!i.variation.free_delivery);
    const deliveryChargeAmount = allFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);

    /* ── Bulk / Combo / Cart-Wide Discounts ── */
    const { calculateBulkComboDiscounts } = require('./user_discount');
    const cartItemsForDiscount = totals.enrichedItems.map(i => ({
      product_sku_id: i.variation.id,
      quantity: i.quantity,
      final_unit_price: i.finalUnitPrice,
      selling_price: i.rawUnitPrice,
    }));
    const discountResult     = await calculateBulkComboDiscounts(connection, cartItemsForDiscount);
    const bulkDiscountTotal  = discountResult.bulkDiscountTotal;
    const comboDiscountTotal = discountResult.comboDiscountTotal;
    const cartWideDiscount   = discountResult.cartWideDiscount;

    // Merge bulk/combo metadata + rule-granted free delivery onto enrichedItems
    for (const enriched of totals.enrichedItems) {
      const match = discountResult.enrichedItems.find(x => x.product_sku_id === enriched.variation.id);
      if (match) {
        enriched.bulk_rule_id           = match.bulk_rule_id;
        enriched.bulk_discount_applied  = match.bulk_discount_applied;
        enriched.combo_rule_id          = match.combo_rule_id;
        enriched.combo_discount_applied = match.combo_discount_applied;
        // If rule grants free delivery, mark this item
        if (match.effective_free_delivery) enriched.effectiveFreeDelivery = true;
      }
    }

    // Effective free delivery per item: SKU/product flag OR rule-granted
    const isEffFree  = (item) => !!(item.variation.free_delivery || item.effectiveFreeDelivery);
    const allEffFree = totals.enrichedItems.length > 0 && totals.enrichedItems.every(isEffFree);

    // Final delivery amount (waived if ALL items are effectively free-delivery)
    const effectiveDeliveryAmount = allEffFree ? 0 : deliveryChargeAmount;

    // Only bill weight for PAID-delivery items — free-delivery items excluded (matches shop)
    const paidWeightKg = allEffFree ? 0 : totals.enrichedItems
      .filter(i => !isEffFree(i))
      .reduce((sum, i) => sum + Number(i.variation.weight_kg || 0) * i.quantity, 0);
    const excessKg          = Math.max(0, paidWeightKg - freeWeightKg);
    const weightExtraCharge = allEffFree ? 0 : Number((excessKg * extraPerKg).toFixed(2));
    // Store only chargeable (paid-delivery) weight — matches shop checkout
    const totalWeightKg = paidWeightKg;

    const grandTotal = Number(
      (totals.subtotal - totals.discountTotal - bulkDiscountTotal - comboDiscountTotal - cartWideDiscount + effectiveDeliveryAmount + weightExtraCharge).toFixed(2)
    );

    // ── DEBUG: trace calculation (matches shop checkout log format) ──────────
    console.log('\n[createManualOrder DEBUG] ────────────────────────────────');
    console.log('  subtotal:', totals.subtotal);
    console.log('  skuDiscountTotal:', totals.skuDiscountTotal);
    console.log('  couponDiscountTotal:', totals.couponDiscountTotal);
    console.log('  discountTotal:', totals.discountTotal, '(sku+coupon)');
    console.log('  bulkDiscountTotal:', bulkDiscountTotal);
    console.log('  comboDiscountTotal:', comboDiscountTotal);
    console.log('  cartWideDiscount:', cartWideDiscount);
    console.log('  allFreeDelivery:', allFreeDelivery, '| allEffFree:', allEffFree);
    console.log('  deliveryChargeAmount:', deliveryChargeAmount, '| effectiveDeliveryAmount:', effectiveDeliveryAmount);
    console.log('  paidWeightKg:', paidWeightKg, '| freeWeightKg:', freeWeightKg, '| extraPerKg:', extraPerKg);
    console.log('  excessKg:', excessKg, '| weightExtraCharge:', weightExtraCharge);
    console.log('  grandTotal:', grandTotal);
    console.log('  Item breakdown:');
    totals.enrichedItems.forEach(i => {
      console.log(`    SKU ${i.variation.id}: qty=${i.quantity}, weight_kg=${i.variation.weight_kg}, free_delivery=${i.variation.free_delivery}, effFree=${isEffFree(i)}`);
    });
    console.log('────────────────────────────────────────────────────────\n');

    // 1️⃣1️⃣ Determine Payment Amounts
    let paidAmount = 0;
    let dueAmount = grandTotal;


   // 🛡️ Perform the fraud check
const fraudResults = await getFraudTestResults(address.phone_number);

    
// 1️⃣2️⃣ Create Order
    const orderResult = await connection.query(
      `INSERT INTO orders (
        customer_id, customer_name, customer_email, customer_phone,
        order_type, payment_type, payment_status, subtotal,
        discount_total, sku_discount_total, bulk_discount_total, combo_discount_total, cart_wide_discount,
        delivery_charge, grand_total, paid_amount,
        due_amount, order_status, note, placed_at, created_by_admin, fraud_test_results,
        weight_kg_total, weight_extra_charge,
        origin, ip_address
      ) VALUES (?, ?, ?, ?, 'admin_regular', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, 'Admin panel', INET6_ATON(?))`,
      [
        customer_id,
        `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        customer.email || "",
        address.phone_number || "",
        payment_type,
        payment_status,
        totals.subtotal,
        totals.discountTotal,
        totals.skuDiscountTotal,
        bulkDiscountTotal,
        comboDiscountTotal,
        cartWideDiscount,
        effectiveDeliveryAmount,
        grandTotal,
        paidAmount,
        dueAmount,
        order_status,
        note || "",
        adminInfo.id,
        JSON.stringify(fraudResults),
        totalWeightKg,
        weightExtraCharge,
        req.ip || '127.0.0.1'
      ]
    );

    const orderId = orderResult.insertId;

    /* -------------------- 1️⃣3️⃣ Order items & Images -------------------- */
    const uniqueProductIds = [...new Set(totals.enrichedItems.map(item => item.variation.product_id))];
    let productImagesMap = {};
    if (uniqueProductIds.length > 0) {
      const productImages = await connection.query(
        `SELECT pi.product_id, pi.img_path FROM product_images pi
         WHERE pi.product_id IN (?) AND pi.id = (
           SELECT MIN(pi2.id) FROM product_images pi2 
           WHERE pi2.product_id = pi.product_id ORDER BY pi2.serial ASC, pi2.id ASC LIMIT 1
         )`, [uniqueProductIds]
      );
      productImages.forEach(img => { productImagesMap[img.product_id] = img.img_path; });
    }

    for (const item of totals.enrichedItems) {
      const imagePath = productImagesMap[item.variation.product_id] || null;
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_sku_id, product_name, product_image,
          color_id, color_name, color_hex, attribute_id, variant_id, variant_name,
          quantity, buying_price, selling_price, discount, discount_type,
          bulk_rule_id, bulk_discount_applied, combo_rule_id, combo_discount_applied,
          final_unit_price, line_total, stock_adjusted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [orderId, item.variation.product_id, item.variation.id, item.variation.product_name, imagePath, item.variation.color_id, item.variation.color_name, item.variation.color_hex, item.variation.attribute_id, item.variation.variant_id, item.variation.variant_name, item.quantity, item.variation.buying_price, item.rawUnitPrice, item.skuDiscount, item.variation.discount_type, item.bulk_rule_id || null, item.bulk_discount_applied || 0, item.combo_rule_id || null, item.combo_discount_applied || 0, item.finalUnitPrice, item.lineTotal]
      );
    }

    // 1️⃣4️⃣ Address Snapshot
    await connection.query(`INSERT INTO order_addresses (order_id, address_id, address_type, full_address, city, zip_code) VALUES (?, ?, ?, ?, ?, ?)`, [orderId, address_id, address.address_type || 'n/a', address.full_address, address.city || null, address.zip_code || null]);

    // 1️⃣5️⃣ Courier Snapshot
    await connection.query(`INSERT INTO order_couriers (order_id, delivery_charge_id, delivery_title, customer_charge, our_charge, created_at) VALUES (?, ?, ?, ?, ?, NOW())`, [orderId, deliveryCharge.id, deliveryCharge.title, effectiveDeliveryAmount, deliveryCharge.our_charge || 0]);

    // 1️⃣6️⃣ Coupon Logging
    if (totals.appliedCoupon) {
      await connection.query(`INSERT INTO coupon_usages (coupon_id, order_id, customer_id, used_at) VALUES (?, ?, ?, NOW())`, [totals.appliedCoupon.id, orderId, customer_id]);
      await connection.query(`INSERT INTO order_coupons (order_id, coupon_id, coupon_code, coupon_title, discount_type, discount_value, discount_amount, applied_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, totals.appliedCoupon.id, totals.appliedCoupon.code, totals.appliedCoupon.title, totals.appliedCoupon.discount_type, totals.appliedCoupon.discount, totals.couponDiscountTotal, totals.appliedCoupon.product_scope === "all" ? "order" : "sku"]);
    }

    // 1️⃣7️⃣-1️⃣8️⃣ Audit & History
    await connection.query(`INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_admin, note) VALUES (?, NULL, ?, ?, ?)`, [orderId, order_status, adminInfo.id, note || "Order created manually by admin"]);
    
    // 1️⃣9️⃣ Payment URL
    const codAdvanceRequired = payment_type === "cod" ? await checkCODAdvanceRequired(connection) : false;
    let payment_url = (payment_type === "gateway" || payment_type === "mixed" || (payment_type === "cod" && codAdvanceRequired)) ? `/api/v1/payment/stranger/${orderId}/initiate` : null;

    // ─── V2-017: Auto-assign on order creation (non-blocking) ────────────────
    autoAssignOrder(connection, orderId).catch((err) => {
      console.error(`[AutoAssign] Failed for manual order #${orderId}:`, err.message);
    });
    // ─── V2-034: Notify all admins about new manual order (non-blocking) ──────
    sendAdminOrderNotification(connection, orderId, 'new_order');
    // ─────────────────────────────────────────────────────────────────────────

    // 2️⃣0️⃣ Response (STRICTLY MAINTAINED)
    bumpOrderEventVersion();
    return {
      success: true,
      message: "Manual order created successfully",
      order: {
        id: orderId,
        customer: {
          id: customer_id,
          name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
          email: customer.email
        },
        totals: {
          subtotal: totals.subtotal,
          sku_discount: totals.skuDiscountTotal,
          coupon_discount: totals.couponDiscountTotal,
          discount_total: totals.discountTotal,
          delivery: effectiveDeliveryAmount,
          grand_total: grandTotal,
          paid_amount: paidAmount,
          due_amount: dueAmount
        },
        delivery_info: {
          free_delivery: allEffFree,
          message: allEffFree ? "Free delivery applied" : "Standard delivery"
        },
        payment: {
          type: payment_type,
          status: payment_status,
          advance_required: codAdvanceRequired,
          url: payment_url
        },
        items: totals.enrichedItems.map(item => ({
          product_id: item.variation.product_id,
          product_variation_id: item.variation.id,
          product_name: item.variation.product_name,
          quantity: item.quantity,
          unit_price: item.finalUnitPrice,
          line_total: item.lineTotal
        })),
        status: {
          order: order_status,
          payment: payment_status
        },
        delivery: {
          charge_id: delivery_charge_id,
          title: deliveryCharge.title,
          amount: effectiveDeliveryAmount
        },
        coupon: totals.appliedCoupon ? {
          code: totals.appliedCoupon.code,
          title: totals.appliedCoupon.title,
          discount_amount: totals.couponDiscountTotal
        } : null,
        next_steps: payment_url 
          ? [
              "Order created in 'new' status",
              "Share payment URL with customer",
              "Customer can pay using the payment URL",
              "Update order status to 'approved' after payment confirmation"
            ]
          : [
              "Order created in 'new' status",
              "Update order status to 'approved' to adjust stock",
              payment_type === "cod" 
                ? "Collect full payment on delivery"
                : "Customer needs to complete payment"
            ]
      }
    };
  })
);
 

const strangerManualOrderSchema = {
  body: {
    name: { type: "string", required: true },
    phone: { type: "string", required: true },
    email: { type: "string", required: false },
    full_address: { type: "string", required: true },
    city: { type: "string", required: false },
    zip_code: { type: "string", required: false },
    payment_type: { type: "string", required: true }, // gateway | cod | mixed
    delivery_charge_id: { type: "int", required: true },
    coupon_code: { type: "string", required: false },
    note: { type: "string", required: false }
  }
};

// API: Create Manual Order for Stranger (no existing user)
exports.createManualOrderForStranger = api(
  {
    body: strangerManualOrderSchema.body
  },
  auth(async (req, connection, adminInfo) => {
    // 1️⃣ Authorization Check
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to create manual orders");
    }

    const {
      name,
      phone,
      email,
      full_address,
      city,
      zip_code,
      payment_type,
      delivery_charge_id,
      coupon_code,
      note
    } = req.typed.body;

    const orderItemsInput = req.body.order_items;
    
    // 2️⃣ Validate Input
    if (!Array.isArray(orderItemsInput) || !orderItemsInput.length) {
      throw new errors.BAD_REQUEST("order_items must be a non-empty array");
    }

    if (!["gateway", "cod", "mixed"].includes(payment_type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment_type");
    }

    // Validate name
    if (!name || name.trim().length < 2 || name.length > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED("Name must be between 2 and 100 characters");
    }
    
    if (email && !validator.isEmail(email)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");
    if (phone && !validator.isMobilePhone(phone, 'any')) throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone format");

    // Validate address
    if (!full_address || full_address.trim().length < 10 || full_address.length > 500) {
      throw new errors.INVALID_FIELDS_PROVIDED("Full address must be between 10 and 500 characters");
    }

    // 3️⃣ Validate Order Items
    const order_items = orderItemsInput.map((item, index) => {
      try {
        return validateAndCast({ body: item }, manualOrderItemSchema).body;
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Item at index ${index}: ${err.message}`
        );
      }
    });

    // 4️⃣ Validate Delivery Charge
    const deliveryCharge = await connection.queryOne(
      `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
      [delivery_charge_id]
    );
    
    if (!deliveryCharge) {
      throw new errors.BAD_REQUEST("Invalid delivery charge");
    }

    // 5️⃣ Load Product Variations with free_delivery info
    // Get unique variation IDs to avoid duplicates
    const variationIds = [...new Set(order_items.map(i => i.product_variation_id))];

    const variations = await connection.query(
      `SELECT s.*, p.name AS product_name,
              COALESCE(s.free_delivery, p.free_delivery) AS free_delivery
       FROM product_skus s
       JOIN products p ON p.id = s.product_id
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       WHERE s.id IN (?) AND s.status = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [variationIds]
    );

    if (variations.length !== variationIds.length) {
      throw new errors.BAD_REQUEST("Some product variations are invalid or belong to an inactive category");
    }

    // Map variations to items
    const variationMap = {};
    variations.forEach(v => {
      variationMap[v.id] = v;
    });

    // 6️⃣ Stock check — mixed free+paid delivery is ALLOWED (matches shop checkout)
    for (const item of order_items) {
      const variation = variationMap[item.product_variation_id];
      if (!variation) {
        throw new errors.BAD_REQUEST(`Invalid product variation ${item.product_variation_id}`);
      }

      if (variation.stock < item.quantity) {
        throw new errors.BAD_REQUEST(
          `Insufficient stock for product ${variation.sku}. Available: ${variation.stock}, Requested: ${item.quantity}`
        );
      }
    }

    // 7️⃣ Process quantities for same SKUs
    const itemGroups = {};
    order_items.forEach(item => {
      const variationId = item.product_variation_id;
      if (!itemGroups[variationId]) {
        itemGroups[variationId] = {
          ...item,
          totalQuantity: 0
        };
      }
      itemGroups[variationId].totalQuantity += item.quantity;
    });

    // Convert grouped items back to array
    const groupedItems = Object.values(itemGroups);

    // Create items with variations
    const itemsWithVariations = groupedItems.map(groupedItem => {
      const variation = variationMap[groupedItem.product_variation_id];
      return {
        product_variation_id: groupedItem.product_variation_id,
        quantity: groupedItem.totalQuantity,
        variation
      };
    });

    // 8️⃣ Calculate SKU-level + coupon totals
    const totals = await calculateOrderTotals(
      connection,
      itemsWithVariations,
      coupon_code,
      null // No customer ID for stranger
    );

    /* ── Weight surcharge constants ── */
    const freeWeightKg  = Number(deliveryCharge.default_weight_kg   ?? 0);
    const extraPerKg    = Number(deliveryCharge.extra_charge_per_kg ?? 0);

    // Initial delivery: waived only if EVERY item is free-delivery (SKU/product flag)
    const allFreeDelivery    = totals.enrichedItems.every(i => !!i.variation.free_delivery);
    const deliveryChargeAmount = allFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);

    /* ── Bulk / Combo / Cart-Wide Discounts ── */
    const { calculateBulkComboDiscounts: calcDiscounts } = require('./user_discount');
    const cartItemsD = totals.enrichedItems.map(i => ({
      product_sku_id: i.variation.id,
      quantity: i.quantity,
      final_unit_price: i.finalUnitPrice,
      selling_price: i.rawUnitPrice,
    }));
    const discResult = await calcDiscounts(connection, cartItemsD);
    const bulkDiscountTotal  = discResult.bulkDiscountTotal;
    const comboDiscountTotal = discResult.comboDiscountTotal;
    const cartWideDiscount   = discResult.cartWideDiscount;

    // Merge bulk/combo metadata + rule-granted free delivery onto enrichedItems
    for (const enriched of totals.enrichedItems) {
      const match = discResult.enrichedItems.find(x => x.product_sku_id === enriched.variation.id);
      if (match) {
        enriched.bulk_rule_id           = match.bulk_rule_id;
        enriched.bulk_discount_applied  = match.bulk_discount_applied;
        enriched.combo_rule_id          = match.combo_rule_id;
        enriched.combo_discount_applied = match.combo_discount_applied;
        // If rule grants free delivery, mark this item
        if (match.effective_free_delivery) enriched.effectiveFreeDelivery = true;
      }
    }

    // Effective free delivery per item: SKU/product flag OR rule-granted
    const isEffFree  = (item) => !!(item.variation.free_delivery || item.effectiveFreeDelivery);
    const allEffFree = totals.enrichedItems.length > 0 && totals.enrichedItems.every(isEffFree);

    // Final delivery amount (waived if ALL items are effectively free-delivery)
    const effectiveDeliveryAmount = allEffFree ? 0 : deliveryChargeAmount;

    // Only bill weight for PAID-delivery items — free-delivery items excluded (matches shop)
    const paidWeightKg = allEffFree ? 0 : totals.enrichedItems
      .filter(i => !isEffFree(i))
      .reduce((sum, i) => sum + Number(i.variation.weight_kg || 0) * i.quantity, 0);
    const excessKg          = Math.max(0, paidWeightKg - freeWeightKg);
    const weightExtraCharge = allEffFree ? 0 : Number((excessKg * extraPerKg).toFixed(2));
    // Store only chargeable (paid-delivery) weight — matches shop checkout
    const totalWeightKg = paidWeightKg;

    const grandTotal = Number(
      (totals.subtotal - totals.discountTotal - bulkDiscountTotal - comboDiscountTotal - cartWideDiscount + effectiveDeliveryAmount + weightExtraCharge).toFixed(2)
    );

    // 9️⃣ Set default statuses
    const order_status = "new";
    const payment_status = "unpaid";
    const paidAmount = 0;
    const dueAmount = grandTotal;

    // 🔟 Generate unique guest order ID
    const guestOrderId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;



    // 🛡️ Perform the fraud check
const fraudResults = await getFraudTestResults(phone);

    // 1️⃣1️⃣ Create Order as guest order
    const orderResult = await connection.query(
      `INSERT INTO orders (
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        order_type,
        guest_order_uuid,
        payment_type,
        payment_status,
        subtotal,
        discount_total,
        bulk_discount_total,
        combo_discount_total,
        cart_wide_discount,
        delivery_charge,
        grand_total,
        paid_amount,
        due_amount,
        order_status,
        note,
        placed_at,
        created_by_admin,
        is_fraud, fraud_test_results,
        weight_kg_total, weight_extra_charge,
        origin, ip_address
      ) VALUES (NULL, ?, ?, ?, 'admin_stranger', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 0, ?, ?, ?, 'Admin panel', INET6_ATON(?))`,
      [
        name.trim(),
        email || null,
        phone,
        guestOrderId,
        payment_type,
        payment_status,
        totals.subtotal,
        totals.discountTotal,
        bulkDiscountTotal,
        comboDiscountTotal,
        cartWideDiscount,
        effectiveDeliveryAmount,
        grandTotal,
        paidAmount,
        dueAmount,
        order_status,
        note || "",
        adminInfo.id,
        JSON.stringify(fraudResults),
        totalWeightKg,
        weightExtraCharge,
        req.ip || '127.0.0.1'
      ]
    );

    const orderId = orderResult.insertId;

    /* -------------------- 1️⃣2️⃣ Order items (OPTIMIZED with batch image fetch) -------------------- */
    // Get all unique product IDs from the order
    const productIds = totals.enrichedItems.map(item => item.variation.product_id);
    const uniqueProductIds = [...new Set(productIds)];

    // Fetch first images for all products in one query
    let productImagesMap = {};
    if (uniqueProductIds.length > 0) {
      // Using subquery to get the first image (by priority, then ID)
      const productImages = await connection.query(
        `SELECT 
           pi.product_id,
           pi.img_path 
         FROM product_images pi
         WHERE pi.product_id IN (?)
           AND pi.id = (
             SELECT MIN(pi2.id) 
             FROM product_images pi2 
             WHERE pi2.product_id = pi.product_id
             ORDER BY pi2.serial ASC, pi2.id ASC
             LIMIT 1
           )`,
        [uniqueProductIds]
      );
      
      // Create a map for quick lookup
      productImages.forEach(img => {
        productImagesMap[img.product_id] = img.img_path;
      });
    }

    for (const item of totals.enrichedItems) {
      const imagePath = productImagesMap[item.variation.product_id] || null;

      await connection.query(
        `INSERT INTO order_items (
          order_id,
          product_id,
          product_sku_id,
          product_name,
          product_image,
          color_id,
          color_name,
          color_hex,
          attribute_id,
          variant_id,
          variant_name,
          quantity,
          buying_price,
          selling_price,
          discount,
          discount_type,
          bulk_rule_id,
          bulk_discount_applied,
          combo_rule_id,
          combo_discount_applied,
          final_unit_price,
          line_total,
          stock_adjusted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.variation.product_id,
          item.variation.id,
          item.variation.product_name,
          imagePath,
          item.variation.color_id,
          item.variation.color_name,
          item.variation.color_hex,
          item.variation.attribute_id,
          item.variation.variant_id,
          item.variation.variant_name,
          item.quantity,
          item.variation.buying_price,
          item.rawUnitPrice,
          item.skuDiscount,
          item.variation.discount_type,
          item.bulk_rule_id || null,
          item.bulk_discount_applied || 0,
          item.combo_rule_id || null,
          item.combo_discount_applied || 0,
          item.finalUnitPrice,
          item.lineTotal,
          0 // stock_adjusted = 0 for new orders
        ]
      );
    }

    // 1️⃣3️⃣ Address Snapshot (no user address reference)
    await connection.query(
      `INSERT INTO order_addresses (
        order_id, 
        address_id, 
        address_type, 
        full_address, 
        city, 
        zip_code
      ) VALUES (?, NULL, 'n/a', ?, ?, ?)`,
      [
        orderId,
        full_address.trim(),
        city || null,
        zip_code || null
      ]
    );

    // 1️⃣4️⃣ Courier Snapshot (EXACTLY AS REQUESTED)
    await connection.query(
      `INSERT INTO order_couriers (
        order_id,
        delivery_charge_id,
        delivery_title,
        customer_charge,
        our_charge,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        orderId,
        deliveryCharge.id,
        deliveryCharge.title,
        effectiveDeliveryAmount,
        deliveryCharge.our_charge || 0
      ]
    );

    // 1️⃣5️⃣ Coupon Handling (no customer_id for stranger)
    if (totals.appliedCoupon) {
      await connection.query(
        `INSERT INTO coupon_usages (
          coupon_id, 
          order_id, 
          customer_id, 
          used_at
        ) VALUES (?, ?, NULL, NOW())`,
        [totals.appliedCoupon.id, orderId]
      );

      await connection.query(
        `INSERT INTO order_coupons (
          order_id,
          coupon_id,
          coupon_code,
          coupon_title,
          discount_type,
          discount_value,
          discount_amount,
          applied_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          totals.appliedCoupon.id,
          totals.appliedCoupon.code,
          totals.appliedCoupon.title,
          totals.appliedCoupon.discount_type,
          totals.appliedCoupon.discount,
          totals.couponDiscountTotal,
          totals.appliedCoupon.product_scope === "all" ? "order" : "sku"
        ]
      );
    }

    // 1️⃣6️⃣ Create guest order record for tracking
    await connection.query(
      `INSERT INTO guest_orders (
        id,
        order_id,
        status,
        name,
        email,
        phone,
        is_phone_verified,
        full_address,
        city,
        zip_code,
        coupon_code,
        delivery_charge_id,
        created_at,
        updated_at
      ) VALUES (?, ?, 'complete', ?, ?, ?, 1, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        guestOrderId,
        orderId,
        name.trim(),
        email || null,
        phone,
        full_address.trim(),
        city || null,
        zip_code || null,
        coupon_code || null,
        delivery_charge_id
      ]
    );

    // 1️⃣7️⃣ Order Status History
    await connection.query(
      `INSERT INTO order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by_admin,
        note
      ) VALUES (?, NULL, ?, ?, ?)`,
      [
        orderId,
        order_status,
        adminInfo.id,
        note || "Order created manually by admin for stranger"
      ]
    );

    // 1️⃣8️⃣ Admin Audit Log
    await connection.query(
      `INSERT INTO admin_audit_logs (
        admin_id,
        action,
        resource,
        resource_id,
        meta,
        ip_address
      ) VALUES (?, 'CREATE_STRANGER_ORDER', 'order', ?, ?, ?)`,
      [
        adminInfo.id,
        orderId,
        JSON.stringify({
          name,
          phone,
          email,
          address: full_address,
          payment_type,
          delivery_charge_id,
          coupon_code,
          order_status,
          payment_status,
          item_count: order_items.length,
          totals: {
            subtotal: totals.subtotal,
            discount_total: totals.discountTotal,
            delivery_charge: effectiveDeliveryAmount,
            grand_total: grandTotal,
            paid_amount: paidAmount,
            due_amount: dueAmount
          }
        }),
        req.ip || null
      ]
    );

    // 1️⃣9️⃣ Determine if payment URL is needed
    let payment_url = null;
    const codAdvanceRequired = payment_type === "cod" ? await checkCODAdvanceRequired(connection) : false;
    
    if (
      payment_type === "gateway" ||
      payment_type === "mixed" ||
      (payment_type === "cod" && codAdvanceRequired)
    ) {
      payment_url = `/api/v1/payment/stranger/${orderId}/initiate`;
    }

    // ─── V2-017: Auto-assign on order creation (non-blocking) ────────────────
    autoAssignOrder(connection, orderId).catch((err) => {
      console.error(`[AutoAssign] Failed for stranger order #${orderId}:`, err.message);
    });
    // ─── V2-034: Notify all admins about new stranger order (non-blocking) ───
    sendAdminOrderNotification(connection, orderId, 'new_order');
    // ─────────────────────────────────────────────────────────────────────────


    // 2️⃣0️⃣ Return Response
    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order created successfully for stranger",
      order: {
        id: orderId,
        guest_order_id: guestOrderId,
        customer: {
          name: name.trim(),
          phone: phone,
          email: email || null,
          type: "stranger"
        },
        totals: {
          subtotal: totals.subtotal,
          sku_discount: totals.skuDiscountTotal,
          coupon_discount: totals.couponDiscountTotal,
          discount_total: totals.discountTotal,
          delivery: effectiveDeliveryAmount,
          grand_total: grandTotal,
          paid_amount: paidAmount,
          due_amount: dueAmount
        },
        delivery_info: {
          free_delivery: allEffFree,
          message: allEffFree ? "Free delivery applied" : "Standard delivery"
        },
        payment: {
          type: payment_type,
          status: payment_status,
          advance_required: codAdvanceRequired,
          url: payment_url
        },
        items: totals.enrichedItems.map(item => ({
          product_id: item.variation.product_id,
          product_variation_id: item.variation.id,
          product_name: item.variation.product_name,
          quantity: item.quantity,
          unit_price: item.finalUnitPrice,
          line_total: item.lineTotal
        })),
        delivery: {
          charge_id: delivery_charge_id,
          title: deliveryCharge.title,
          amount: effectiveDeliveryAmount
        },
        address: {
          full_address: full_address.trim(),
          city: city || null,
          zip_code: zip_code || null
        },
        coupon: totals.appliedCoupon ? {
          code: totals.appliedCoupon.code,
          title: totals.appliedCoupon.title,
          discount_amount: totals.couponDiscountTotal
        } : null,
        next_steps: payment_url 
          ? ["Order created", "Customer can pay using the payment URL"]
          : ["Order created", "Collect payment on delivery"]
      }
    };
  })
);

// paymentController.js - Add this function

// Payment Initiation API for Strangers (No authentication required)
exports.initiateOrderPayment = api(
  {
    params: {
      orderId: { type: "int", required: true }
    },
    body: {
      payment_method: { type: "string", required: true } // sslcommerz, bkash, nagad, shurjopay, rocket
    }
  },
  async (req, connection) => {
    const { orderId } = req.typed.params;
    const { payment_method } = req.typed.body;

    // Validate payment method
    if (!["sslcommerz", "bkash", "nagad", "shurjopay", "rocket"].includes(payment_method)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment method");
    }

    /* -------------------- 1️⃣ Fetch order -------------------- */
    const order = await connection.queryOne(
      `SELECT 
         o.id,
         o.customer_id,
         o.customer_name,
         o.customer_email,
         o.customer_phone,
         o.payment_type,
         o.payment_status,
         o.paid_amount,
         o.due_amount,
         o.order_status,
         oa.full_address,
         oa.city,
         oa.zip_code
       FROM orders o
       LEFT JOIN order_addresses oa ON o.id = oa.order_id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    // Check if order is guest order (stranger)
    if (order.customer_id !== null) {
      throw new errors.UNAUTHORIZED("This order belongs to a registered customer. Please use the authenticated payment endpoint.");
    }

    const BLOCKED_ORDER_STATUSES = {
      cancelled: "Order is cancelled",
      returned: "Order is returned",
      on_hold: "Order is on hold",
    };

    // Check Order Status
    if (BLOCKED_ORDER_STATUSES[order.order_status]) {
      throw new errors.BAD_REQUEST(BLOCKED_ORDER_STATUSES[order.order_status]);
    }

    // Check Payment Status
    if (order.payment_status === "paid") {
      throw new errors.BAD_REQUEST("Order is already paid");
    }

    /* -------------------- 2️⃣ Fetch payment config & validate provider -------------------- */
    const paymentConfigs = await getConfig(connection, false, "payment");
    const providerRows = paymentConfigs.filter(
      r => r.provider === payment_method
    );

    if (!providerRows.length || !providerRows[0].is_active) {
      throw new errors.BAD_REQUEST(
        `Payment method ${payment_method} is currently unavailable.`
      );
    }

    const paymentConfig = {};
    providerRows.forEach(r => (paymentConfig[r.key_name] = r.value));

    /* -------------------- 3️⃣ COD advance re-check -------------------- */
    let codAdvanceRequired = false;
    let codAdvancePercent = 0;

    if (order.payment_type === "cod") {
      for (const row of paymentConfigs) {
        if (row.provider !== "cod") continue;

        if (row.key_name === "MIN_ADVANCE_PAYMENT_PERCENTAGE") {
          codAdvancePercent = Number(row.value) || 0;
          codAdvanceRequired = Boolean(row.is_active);
        }
      }
    }

    /* -------------------- 4️⃣ Check existing pending payment -------------------- */
    let paymentRow = null;

    const existingPayment = await connection.queryOne(
      `SELECT *
       FROM order_payments
       WHERE order_id = ?
         AND provider = ?
         AND status = 'pending'
       ORDER BY id DESC
       LIMIT 1`,
      [order.id, payment_method]
    );

    const shouldReusePayment =
      (order.payment_type === "gateway" &&
        order.payment_status === "unpaid" &&
        existingPayment) ||

      (order.payment_type === "cod" &&
        order.payment_status === "unpaid" &&
        codAdvanceRequired &&
        existingPayment) ||

      false;

    if (shouldReusePayment) {
      paymentRow = existingPayment;
    } else {
      /* -------------------- 5️⃣ Insert new payment row -------------------- */
      let payableAmount = order.due_amount;

      if (order.payment_type === "cod") {
        payableAmount = Number(
          ((order.due_amount * codAdvancePercent) / 100).toFixed(2)
        );
      }

      if (order.payment_type === "mixed") {
        payableAmount = order.due_amount;
      }

      const insertResult = await connection.query(
        `INSERT INTO order_payments (
          order_id,
          provider,
          amount,
          status,
          created_at
        ) VALUES (?, ?, ?, 'pending', NOW())`,
        [order.id, payment_method, payableAmount]
      );

      paymentRow = {
        id: insertResult.insertId,
        amount: payableAmount
      };
    }

    /* -------------------- 6️⃣ Route to payment handlers -------------------- */
    switch (payment_method) {
      case "sslcommerz":
        return await handleSSLCommerz(order, paymentConfig, paymentRow);

      case "bkash":
        return await handleBkash(order, paymentConfig, paymentRow);

      case "nagad":
        return await handleNagad(order, paymentConfig, paymentRow);

      case "shurjopay":
        return await handleShurjopay(order, paymentConfig, paymentRow);

      case "rocket":
        return await handleRocket(order, paymentConfig, paymentRow);

      default:
        throw new errors.BAD_REQUEST(
          "Automated payment is not supported for this method"
        );
    }
  }
);

// Add to your schemas file
const manualPaymentSchema = {
  body: {
    payment_method: {
      type: "string",
      required: true,
    },
    transaction_ref: { type: "string", required: false }, // allow null / empty
    amount: { type: "int", required: true }, // positive, 2 decimal precision
    note: { type: "string", required: false }, // allow null / empty
  }
};

// API: Mark Order as Paid Manually (Admin)
exports.markOrderPaidManually = api(
  {
    params: { order_id: { type: "int", required: true } },
    body: manualPaymentSchema.body
  },
  auth(async (req, connection, adminInfo) => {
    // 1️⃣ Authorization Check
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to mark orders as paid");
    }

    const { order_id } = req.typed.params;
    const { payment_method, transaction_ref, amount, note } = req.typed.body;
    
    if (!["sslcommerz", "bkash", "nagad", "shurjopay", "rocket", "bank"].includes(payment_method)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment method");
    }

    // 2️⃣ Validate Order Exists and is Active
    const order = await connection.queryOne(
      `SELECT 
         o.id,
         o.customer_id,
         o.order_type,
         o.customer_name,
         o.customer_email,
         o.customer_phone,
         o.payment_type,
         o.payment_status,
         o.subtotal,
         o.discount_total,
         o.delivery_charge,
         o.grand_total,
         o.paid_amount,
         o.due_amount,
         o.order_status,
         o.deleted_at,
         g.id as guest_order_id
       FROM orders o
       LEFT JOIN guest_orders g ON g.order_id = o.id
       WHERE o.id = ?`,
      [order_id]
    );

    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    if (order.deleted_at) {
      throw new errors.BAD_REQUEST("Cannot process payment for deleted order");
    }

    // 3️⃣ Check current payment status
    if (order.payment_status === 'paid') {
      throw new errors.BAD_REQUEST("Order is already fully paid");
    }

    // 4️⃣ Validate amount
    const maxAllowedAmount = order.due_amount;
    if (amount > maxAllowedAmount) {
      throw new errors.BAD_REQUEST(
        `Amount (${amount}) exceeds due amount (${maxAllowedAmount}). Maximum allowed: ${maxAllowedAmount}`
      );
    }

    // 5️⃣ Check if order can accept payment
    const validOrderStatuses = ['new', 'approved', 'processing', 'packaging', 'shipped', 'out_for_delivery'];
    if (!validOrderStatuses.includes(order.order_status)) {
      throw new errors.BAD_REQUEST(
        `Cannot accept payment for order with status: ${order.order_status}. ` +
        `Allowed statuses: ${validOrderStatuses.join(', ')}`
      );
    }

    // 6️⃣ Calculate new payment values
    const newPaidAmount = Number((Number(order.paid_amount) + Number(amount)).toFixed(2));
    const newDueAmount = Number((Number(order.due_amount) - Number(amount)).toFixed(2));
    
    // Determine new payment status
    let newPaymentStatus = order.payment_status;
    if (newDueAmount <= 0) {
      newPaymentStatus = 'paid';
    } else if (newPaidAmount > 0 && newDueAmount > 0) {
      newPaymentStatus = 'partial_paid';
    }

    // 7️⃣ Insert payment record
    const paymentResult = await connection.query(
      `
      INSERT INTO order_payments (
        order_id,
        provider,
        transaction_ref,
        amount,
        status,
        paid_at,
        created_at 
      ) VALUES (?, ?, ?, ?, 'success', NOW(), NOW())
      `,
      [
        order_id,
        payment_method,
        transaction_ref || null,
        amount
      ]
    );

    const paymentId = paymentResult.insertId;

    // 8️⃣ Update order payment status and amounts
    await connection.query(
      `UPDATE orders 
       SET 
         payment_status = ?,
         paid_amount = ?,
         due_amount = ?,
         paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
         updated_at = NOW()
       WHERE id = ?`,
      [
        newPaymentStatus,
        newPaidAmount,
        newDueAmount,
        newPaymentStatus,
        order_id
      ]
    );

    // 9️⃣ If order becomes fully paid, also update payment date if not already set
    if (newPaymentStatus === 'paid' && !order.paid_at) {
      await connection.query(
        `UPDATE orders SET paid_at = NOW() WHERE id = ? AND paid_at IS NULL`,
        [order_id]
      );
    }

    // 🔟 Log order status change for payment
    await connection.query(
      `INSERT INTO order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by_admin,
        note
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        order_id,
        order.payment_status,
        newPaymentStatus,
        adminInfo.id,
        note || `Manual payment recorded via ${payment_method}. Amount: ${amount}, Ref: ${transaction_ref || 'N/A'}`
      ]
    );

    // 1️⃣1️⃣ Admin Audit Log
    await connection.query(
      `INSERT INTO admin_audit_logs (
        admin_id,
        action,
        resource,
        resource_id,
        meta 
      ) VALUES (?, 'MANUAL_PAYMENT_RECORDED', 'order', ?, ?)`,
      [
        adminInfo.id,
        order_id,
        JSON.stringify({
          order_id,
          payment_method,
          transaction_ref,
          amount,
          previous_paid: order.paid_amount,
          previous_due: order.due_amount,
          previous_status: order.payment_status,
          new_paid: newPaidAmount,
          new_due: newDueAmount,
          new_status: newPaymentStatus,
          note,
          payment_id: paymentId
        })
      ]
    );

    // 1️⃣2️⃣ Fetch updated order details
    const updatedOrder = await connection.queryOne(
      `SELECT 
         o.*,
         COUNT(DISTINCT op.id) as payment_count,
         SUM(op.amount) as total_payments
       FROM orders o
       LEFT JOIN order_payments op ON op.order_id = o.id AND op.status = 'success'
       WHERE o.id = ?
       GROUP BY o.id`,
      [order_id]
    );

    // 1️⃣3️⃣ Return response
    bumpOrderEventVersion();
    return {
      success: true,
      message: `Payment of ${amount} recorded successfully`,
      payment: {
        id: paymentId,
        order_id,
        payment_method,
        transaction_ref,
        amount,
        status: 'success',
        paid_at: new Date().toISOString()
      },
      order: {
        id: order_id,
        previous: {
          payment_status: order.payment_status,
          paid_amount: order.paid_amount,
          due_amount: order.due_amount
        },
        current: {
          payment_status: newPaymentStatus,
          paid_amount: newPaidAmount,
          due_amount: newDueAmount
        },
        totals: {
          subtotal: updatedOrder.subtotal,
          discount_total: updatedOrder.discount_total,
          delivery_charge: updatedOrder.delivery_charge,
          grand_total: updatedOrder.grand_total,
          total_payments: updatedOrder.total_payments || 0,
          payment_count: updatedOrder.payment_count || 0
        },
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          type: order.order_type
        }
      },
      next_actions: newPaymentStatus === 'paid' 
        ? [
            "Order is now fully paid",
            "Proceed with order processing and fulfillment",
            "Update order status to 'approved' if not already done"
          ]
        : [
            "Partial payment recorded",
            `Remaining due amount: ${newDueAmount}`,
            "Record additional payments when received"
          ]
    };
  })
);



//-------------cutter api
// exports.createAddressForCustomer = api(
//   {
//     body: {
//       customer_id: { type: "number", required: true },
//       phone: { type: "string", required: true },
//       full_address: { type: "string", required: true },
//       city: { type: "string", required: false },
//       zip_code: { type: "string", required: false },
//       type: { type: "string", required: false, default: "n/a" },
//       name: { type: "string", required: false }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     // 1️⃣ Authorization Check
//     const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_MANAGER"];
//     if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
//       throw new errors.UNAUTHORIZED("You do not have permission to create addresses for customers");
//     }

//     const {
//       customer_id,
//       phone,
//       full_address,
//       city,
//       zip_code,
//       type,
//       name
//     } = req.typed.body;

//     // 2️⃣ Validate customer exists
//     const customer = await connection.queryOne(
//       `SELECT id, first_name, last_name, default_phone_id, default_address_id 
//        FROM users 
//        WHERE id = ? AND deleted_at IS NULL`,
//       [customer_id]
//     );

//     if (!customer) {
//       throw new errors.NOT_FOUND("Customer not found");
//     }

//     // 3️⃣ Validate inputs
//     if (!validator.isMobilePhone(phone, 'any')) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
//     }

//     if (!full_address || full_address.trim().length < 5 || full_address.length > 500) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Full address must be between 5 and 500 characters");
//     }

//     if (city && (city.length < 2 || city.length > 100)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("City must be between 2 and 100 characters");
//     }

//     if (zip_code && (zip_code.length < 2 || zip_code.length > 20)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Zip code must be between 2 and 20 characters");
//     }

//     if (type && !['home', 'office', 'n/a'].includes(type)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type. Must be 'home', 'office', or 'n/a'");
//     }

//     if (name && (name.length < 2 || name.length > 200)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Name must be between 2 and 200 characters");
//     }

//     // 4️⃣ Check if phone already exists for any user
//     const existingPhone = await connection.queryOne(
//       `SELECT id, user_id, is_verified 
//        FROM user_phones 
//        WHERE phone_number = ? 
//        ORDER BY is_verified DESC, created_at DESC 
//        LIMIT 1`,
//       [phone]
//     );

//     let phoneId = null;
//     let phoneCreated = false;

//     if (existingPhone) {
//       // Check if phone belongs to another user and is verified
//       if (existingPhone.is_verified === 1 && existingPhone.user_id !== customer_id) {
//         throw new errors.ALREADY_EXIST(
//           "Phone number is already verified by another customer"
//         );
//       }

//       // If phone exists for this customer
//       if (existingPhone.user_id === customer_id) {
//         phoneId = existingPhone.id;
        
//         // If not verified, update to verified
//         if (existingPhone.is_verified === 0) {
//           await connection.query(
//             `UPDATE user_phones SET is_verified = 1 WHERE id = ?`,
//             [existingPhone.id]
//           );
//         }
//       } else {
//         // Phone exists for another user but is not verified - we can reassign
//         await connection.query(
//           `UPDATE user_phones SET user_id = ? WHERE id = ?`,
//           [customer_id, existingPhone.id]
//         );
        
//         // Mark as verified since admin is creating it
//         await connection.query(
//           `UPDATE user_phones SET is_verified = 1 WHERE id = ?`,
//           [existingPhone.id]
//         );
        
//         phoneId = existingPhone.id;
//       }
//     } else {
//       // Phone doesn't exist - create new verified phone
//       const phoneResult = await connection.query(
//         `INSERT INTO user_phones (user_id, phone_number, is_verified)
//          VALUES (?, ?, 1)`,
//         [customer_id, phone]
//       );
      
//       phoneId = phoneResult.insertId;
//       phoneCreated = true;
//     }

//     // 5️⃣ Set as default phone if customer doesn't have one
//     if (!customer.default_phone_id) {
//       await connection.query(
//         `UPDATE users SET default_phone_id = ? WHERE id = ?`,
//         [phoneId, customer_id]
//       );
//     }

//     // 6️⃣ Determine name for address
//     const finalName = name || 
//       [customer.first_name, customer.last_name].filter(Boolean).join(" ") || 
//       null;

//     // 7️⃣ Create address
//     const addressResult = await connection.query(
//       `INSERT INTO user_addresses (
//         user_id,
//         phone_id,
//         name,
//         address_type,
//         full_address,
//         city,
//         zip_code
//       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         customer_id,
//         phoneId,
//         finalName,
//         type || "n/a",
//         full_address.trim(),
//         city || null,
//         zip_code || null
//       ]
//     );

//     const addressId = addressResult.insertId;

//     // 8️⃣ Set as default address if customer doesn't have one
//     if (!customer.default_address_id) {
//       await connection.query(
//         `UPDATE users SET default_address_id = ? WHERE id = ?`,
//         [addressId, customer_id]
//       );
//     }

//     // 9️⃣ Admin audit log
//     await connection.query(
//       `INSERT INTO admin_audit_logs (
//         admin_id,
//         action,
//         resource,
//         resource_id,
//         meta,
//         ip_address
//       ) VALUES (?, 'CREATE_CUSTOMER_ADDRESS', 'address', ?, ?, ?)`,
//       [
//         adminInfo.id,
//         addressId,
//         JSON.stringify({
//           customer_id,
//           phone,
//           address_type: type || "n/a",
//           city: city || null,
//           zip_code: zip_code || null,
//           phone_created: phoneCreated,
//           set_as_default_phone: !customer.default_phone_id,
//           set_as_default_address: !customer.default_address_id
//         }),
//         req.ip || null
//       ]
//     );

//     // 🔟 User audit log (from admin action)
//     await connection.query(
//       `INSERT INTO user_audit_logs (
//         user_id,
//         action,
//         ip_address
//       ) VALUES (?, 'ADDRESS_CREATE_BY_ADMIN', ?)`,
//       [customer_id, req.ip || null]
//     );

//     return {
//       success: true,
//       message: "Address created successfully for customer",
//       data: {
//         address_id: addressId,
//         phone_id: phoneId,
//         phone_created: phoneCreated,
//         phone_verified: true,
//         set_as_default_phone: !customer.default_phone_id,
//         set_as_default_address: !customer.default_address_id,
//         address: {
//           id: addressId,
//           user_id: customer_id,
//           phone_id: phoneId,
//           name: finalName,
//           type: type || "n/a",
//           full_address: full_address.trim(),
//           city: city || null,
//           zip_code: zip_code || null
//         },
    
//       }
//     };
//   })
// );


exports.createAddressForCustomer = api(
  {
    body: {
      customer_id: { type: "number", required: true },
      phone: { type: "string", required: true },
      full_address: { type: "string", required: true },
      city: { type: "string", required: false },
      zip_code: { type: "string", required: false },
      type: { type: "string", required: false, default: "n/a" },
      name: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    // --------------------------------------------------
    // 1. AUTHORIZATION
    // --------------------------------------------------
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED(
        "You do not have permission to create addresses for customers"
      );
    }

    const {
      customer_id,
      phone,
      full_address,
      city,
      zip_code,
      type,
      name
    } = req.typed.body;

    // --------------------------------------------------
    // 2. LOAD CUSTOMER
    // --------------------------------------------------
    const customer = await connection.queryOne(
      `
      SELECT id, first_name, last_name, default_phone_id, default_address_id
      FROM users
      WHERE id = ? AND deleted_at IS NULL
      `,
      [customer_id]
    );

    if (!customer) {
      throw new errors.NOT_FOUND("Customer not found");
    }

    // --------------------------------------------------
    // 3. VALIDATIONS
    // --------------------------------------------------
    if (!validator.isMobilePhone(phone)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
    }

    if (!full_address || full_address.trim().length < 5 || full_address.length > 500) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Full address must be between 5 and 500 characters"
      );
    }

    if (city && (city.length < 2 || city.length > 100)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "City must be between 2 and 100 characters"
      );
    }

    if (zip_code && (zip_code.length < 2 || zip_code.length > 20)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Zip code must be between 2 and 20 characters"
      );
    }

    if (type && !['home', 'office', 'n/a'].includes(type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid address type");
    }

    if (name && (name.length < 2 || name.length > 200)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Name must be between 2 and 200 characters"
      );
    }

    // --------------------------------------------------
    // 4. HANDLE PHONE (USER-SCOPED, ADMIN VERIFIED)
    // --------------------------------------------------
    let phoneId = null;
    let phoneCreated = false;

    const existingPhone = await connection.queryOne(
      `
      SELECT id, is_verified
      FROM user_phones
      WHERE user_id = ? AND phone_number = ?
      `,
      [customer_id, phone]
    );

    if (existingPhone) {
      phoneId = existingPhone.id;

      // Admin action → ensure verified
      // if (existingPhone.is_verified === 0) {
      //   await connection.query(
      //     `UPDATE user_phones SET is_verified = 1 WHERE id = ?`,
      //     [existingPhone.id]
      //   );
      // }
    } else {
      const phoneResult = await connection.query(
        `
        INSERT INTO user_phones (user_id, phone_number, is_verified)
        VALUES (?, ?, 0)
        `,
        [customer_id, phone]
      );

      phoneId = phoneResult.insertId;
      phoneCreated = true;
    }

    // --------------------------------------------------
    // 5. SET DEFAULT PHONE (IF NONE)
    // --------------------------------------------------
    // if (!customer.default_phone_id) {
    //   await connection.query(
    //     `UPDATE users SET default_phone_id = ? WHERE id = ?`,
    //     [phoneId, customer_id]
    //   );
    // }

    // --------------------------------------------------
    // 6. ADDRESS NAME FALLBACK
    // --------------------------------------------------
    const finalName =
      name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      null;

    // --------------------------------------------------
    // 7. CREATE ADDRESS
    // --------------------------------------------------
    const addressResult = await connection.query(
      `
      INSERT INTO user_addresses (
        user_id,
        phone_id,
        name,
        address_type,
        full_address,
        city,
        zip_code
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        customer_id,
        phoneId,
        finalName,
        type || "n/a",
        full_address.trim(),
        city || null,
        zip_code || null
      ]
    );

    const addressId = addressResult.insertId;

    // --------------------------------------------------
    // 8. SET DEFAULT ADDRESS (IF NONE)
    // --------------------------------------------------
    if (!customer.default_address_id) {
      await connection.query(
        `UPDATE users SET default_address_id = ? WHERE id = ?`,
        [addressId, customer_id]
      );
    }

    // --------------------------------------------------
    // 9. ADMIN AUDIT LOG
    // --------------------------------------------------
    await connection.query(
      `
      INSERT INTO admin_audit_logs (
        admin_id,
        action,
        resource,
        resource_id,
        meta,
        ip_address
      )
      VALUES (?, 'CREATE_CUSTOMER_ADDRESS', 'address', ?, ?, ?)
      `,
      [
        adminInfo.id,
        addressId,
        JSON.stringify({
          customer_id,
          phone,
          address_type: type || "n/a",
          city: city || null,
          zip_code: zip_code || null,
          phone_created: phoneCreated,
          set_as_default_phone: !customer.default_phone_id,
          set_as_default_address: !customer.default_address_id
        }),
        req.ip || null
      ]
    );

    // --------------------------------------------------
    // 🔟 USER AUDIT LOG
    // --------------------------------------------------
    await connection.query(
      `
      INSERT INTO user_audit_logs (user_id, action, ip_address)
      VALUES (?, 'ADDRESS_CREATE_BY_ADMIN', ?)
      `,
      [customer_id, req.ip || null]
    );

    return {
      success: true,
      message: "Address created successfully for customer",
      data: {
        address_id: addressId,
        phone_id: phoneId,
        phone_created: phoneCreated,
        phone_verified: true,
        set_as_default_phone: !customer.default_phone_id,
        set_as_default_address: !customer.default_address_id,
        address: {
          id: addressId,
          user_id: customer_id,
          phone_id: phoneId,
          name: finalName,
          type: type || "n/a",
          full_address: full_address.trim(),
          city: city || null,
          zip_code: zip_code || null
        }
      }
    };
  })
);
