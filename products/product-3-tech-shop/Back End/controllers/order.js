const { api, auth, userAuth, validateAndCast } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require("validator");
const { getConfig, getAvailableAutoCouriers } = require('../config/ApplicationSettingsDB');
const { getPermissionConfig } = require('../config/PermissionSettingsDB');
const { SHOP_URL } = require('../config/ApplicationSettings');
const axios = require("axios");
const database = require('../utils/connection');
const { sendPaymentMail } = require('../mail-templates/payment');
const { sendSMS } = require('../helpers/sms');
// V2: configurable order placement permissions
const { validateRegularOrderPermission } = require('../helpers/orderPermission');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');

// V2-017: auto-assign hook
const { autoAssignOrder } = require('./order_assignment');


const { handleSSLCommerz, handleShurjopay, handleBkash, handleNagad, handleRocket } = require('../service/payment')
const { dispatchToCourier,
  getPaperflyBalance,
  getPathaoBalance,
  getRedxBalance,
  getSteadfastBalance,
  getPaperflyStatus,
  getPathaoStatus,
  getRedxStatus,
  getSteadfastStatus,getFraudTestResults
} = require('../helpers/courier')

const { sendOrdermail } = require("../mail-templates/ordercreate");
// V2-034 + V2-035: notification hooks
const { sendAdminOrderNotification, sendCustomerOrderNotification } = require('../helpers/notify');




const orderItemSchema = {
  body: {
    product_variation_id: { type: "int", required: true },
    quantity: { type: "int", required: true }
  }
};



// exports.createOrder = api(
//   {
//     body: {
//       address_id: { type: "int", required: true },
//       payment_type: { type: "string", required: true }, // gateway | cod | mixed
//       delivery_charge_id: { type: "int", required: true },
//       coupon_code: { type: "string", required: false },
//       note: { type: "string", required: false }
//     }
//   },
//   userAuth(async (req, connection, user) => {
//     const {
//       address_id,
//       payment_type,
//       delivery_charge_id,
//       coupon_code,
//       note
//     } = req.typed.body;

//     const orderItemsInput = req.body.order_items;
//     if (!Array.isArray(orderItemsInput) || !orderItemsInput.length) {
//       throw new errors.BAD_REQUEST("order_items must be a non-empty array");
//     }

//     if (!["gateway", "cod", "mixed"].includes(payment_type)) {
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment_type");
//     }

//     /* -------------------- 1️⃣ Validate order items -------------------- */
//     const order_items = orderItemsInput.map((item, index) => {
//       try {
//         return validateAndCast({ body: item }, orderItemSchema).body;
//       } catch (err) {
//         throw new errors.INVALID_FIELDS_PROVIDED(
//           `Item at index ${index}: ${err.message}`
//         );
//       }
//     });

//     /* -------------------- 2️⃣ Address + phone -------------------- */
//     const address = await connection.queryOne(
//       `SELECT a.*, p.phone_number, p.is_verified AS phone_verified
//        FROM user_addresses a
//        LEFT JOIN user_phones p ON p.id = a.phone_id
//        WHERE a.id = ? AND a.user_id = ?`,
//       [address_id, user.id]
//     );

//     if (!address) throw new errors.NOT_FOUND("Address not found");

//     if (!address.phone_id ) {

//       throw new errors.NOT_FOUND("Theirs no phone number .Please insert a phone number on address" );
//     }
//     if (address.phone_id && !address.phone_verified) {

//       throw new errors.PHONE_NOT_VERIFIED( );
//     }

//     /* -------------------- 3️⃣ Delivery charge -------------------- */
//     const deliveryCharge = await connection.queryOne(
//       `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
//       [delivery_charge_id]
//     );
//     if (!deliveryCharge) {
//       throw new errors.BAD_REQUEST("Invalid delivery charge");
//     }

//     /* -------------------- 4️⃣ Load Product Variations with free_delivery info -------------------- */
//     const variationIds = [...new Set(order_items.map(i => i.product_variation_id))];

//      const variations = await connection.query(
//       `SELECT s.*, p.name AS product_name, p.free_delivery
//        FROM product_skus s
//        JOIN products p ON p.id = s.product_id
//        INNER JOIN main_categories mc ON mc.id = p.main_category_id
//        LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//        LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//        WHERE s.id IN (?) 
//          AND s.status = 1
//          AND mc.status = 1
//          AND (p.sub_category_id IS NULL OR sc.status = 1)
//          AND (p.child_category_id IS NULL OR cc.status = 1)`,
//       [variationIds]
//     );

//     if (variations.length !== variationIds.length) {
//       throw new errors.BAD_REQUEST("Some product variations are invalid or belong to an inactive category");
//     }

//     /* -------------------- 5️⃣ Validate all requested variations exist -------------------- */
//     const variationMap = {};
//     variations.forEach(v => {
//       variationMap[v.id] = v;
//     });

//     for (const item of order_items) {
//       if (!variationMap[item.product_variation_id]) {
//         throw new errors.BAD_REQUEST(`Invalid product variation ${item.product_variation_id}`);
//       }
//     }

//     /* -------------------- 6️⃣ Check free_delivery consistency -------------------- */
//     let freeDeliveryStatus = null;
//     let hasMixedDelivery = false;

//     const freeDeliveryProducts = [];
//     const paidDeliveryProducts = [];

//     for (const item of order_items) {
//       const variation = variationMap[item.product_variation_id];
//       const currentFreeDelivery = variation.free_delivery === 1;

//       if (freeDeliveryStatus === null) {
//         freeDeliveryStatus = currentFreeDelivery;
//       } else if (freeDeliveryStatus !== currentFreeDelivery) {
//         hasMixedDelivery = true;
//       }

//       if (currentFreeDelivery) {
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

//     if (hasMixedDelivery) {
//       let errorMessage = "Cannot mix products with free delivery and paid delivery in the same order.";
//       throw new errors.BAD_REQUEST(errorMessage);
//     }

//     const hasFreeDelivery = freeDeliveryStatus === true;

//     /* -------------------- 7️⃣ Process quantities for same SKUs -------------------- */
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

//     const groupedItems = Object.values(itemGroups);

//     /* -------------------- 8️⃣ Pricing (FIXED LOGIC) -------------------- */
//     let subtotal = 0;
//     let skuDiscountTotal = 0;

//     const enrichedItems = groupedItems.map(groupedItem => {
//       const variation = variationMap[groupedItem.product_variation_id];

//       const rawUnitPrice = Number(variation.selling_price);

//       const skuDiscount =
//         variation.discount_type === 1
//           ? (rawUnitPrice * variation.discount) / 100
//           : Number(variation.discount || 0);

//       const finalUnitPrice = rawUnitPrice - skuDiscount;

//       const lineSubtotal = rawUnitPrice * groupedItem.totalQuantity;
//       const lineDiscount = skuDiscount * groupedItem.totalQuantity;
//       const lineTotal = finalUnitPrice * groupedItem.totalQuantity;

//       subtotal += lineSubtotal;
//       skuDiscountTotal += lineDiscount;

//       return {
//         ...groupedItem,
//         variation,
//         quantity: groupedItem.totalQuantity,
//         rawUnitPrice,
//         skuDiscount,
//         finalUnitPrice,
//         lineTotal
//       };
//     });

//     /* -------------------- 9️⃣ Coupon -------------------- */
//     let couponDiscountTotal = 0;
//     let appliedCoupon = null;

//     if (coupon_code) {
//       const coupon = await connection.queryOne(
//         `SELECT * FROM coupons
//          WHERE code = ?
//            AND status = 1
//            AND start_date <= NOW()
//            AND expire_date >= NOW()`,
//         [coupon_code]
//       );
//       if (!coupon) throw new errors.BAD_REQUEST("Invalid coupon");

//       const discountBase = subtotal - skuDiscountTotal;
//       if (discountBase < coupon.min_purchase_amount) {
//         throw new errors.BAD_REQUEST(
//           `Minimum purchase amount is ${coupon.min_purchase_amount}`
//         );
//       }

//       if (coupon.customer_scope === "specified") {
//         const usageCount = await connection.queryOne(
//           `SELECT COUNT(*) AS cnt
//            FROM coupon_usages
//            WHERE coupon_id = ? AND customer_id = ?`,
//           [coupon.id, user.id]
//         );

//         if (usageCount.cnt >= coupon.limit_per_user) {
//           throw new errors.BAD_REQUEST(
//             "You have already used this coupon the maximum allowed times"
//           );
//         }
//       }

//       let discountAmount = 0;

//       if (coupon.product_scope === "all") {
//         discountAmount =
//           coupon.discount_type === 0
//             ? coupon.discount
//             : (discountBase * coupon.discount) / 100;
//       } else {
//         const targets = await connection.query(
//           `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
//           [coupon.id]
//         );
//         const targetIds = targets.map(t => t.product_sku_id);

//         enrichedItems.forEach(item => {
//           if (targetIds.includes(item.product_variation_id)) {
//             discountAmount +=
//               coupon.discount_type === 0
//                 ? coupon.discount
//                 : (item.lineTotal * coupon.discount) / 100;
//           }
//         });
//       }

//       if (coupon.max_discount_amount != null) {
//         discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
//       }

//       couponDiscountTotal = Number(discountAmount.toFixed(2));
//       appliedCoupon = coupon;
//     }

//     /* -------------------- 🔟 Final Totals -------------------- */
//     const discountTotal = Number(
//       (skuDiscountTotal + couponDiscountTotal).toFixed(2)
//     );

//     const deliveryChargeAmount = hasFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);

//     const grandTotal = Number(
//       (
//         subtotal -
//         discountTotal +
//         deliveryChargeAmount
//       ).toFixed(2)
//     );

//     /* -------------------- 1️⃣1️⃣ Insert order -------------------- */
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
//         note,
//         order_status,
//         placed_at
//       ) VALUES (?, ?, ?, ?, 'regular', ?, 'unpaid', ?, ?, ?, ?, 0, ?, ?, 'new', NOW())`,
//       [
//         user.id,
//         `${user.first_name || ""} ${user.last_name || ""}`.trim(),
//         user.email || "",
//         address.phone_number || "",
//         payment_type,
//         subtotal,
//         discountTotal,
//         deliveryChargeAmount,
//         grandTotal,
//         grandTotal,
//         note || ""
//       ]
//     );

//     const orderId = orderResult.insertId;

//     /* -------------------- 1️⃣2️⃣ Order items (OPTIMIZED with batch image fetch) -------------------- */
//     // Get all unique product IDs from the order
//     const productIds = enrichedItems.map(item => item.variation.product_id);
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
//              ORDER BY pi2.priority ASC, pi2.id ASC
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
//     for (const item of enrichedItems) {
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
//           line_total
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
//           item.lineTotal
//         ]
//       );
//     }

//     /* -------------------- 1️⃣3️⃣ Address snapshot -------------------- */
//     await connection.query(
//       `INSERT INTO order_addresses
//        (order_id, address_id, address_type, full_address, city, zip_code)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [
//         orderId,
//         address_id,
//         address.address_type,
//         address.full_address,
//         address.city,
//         address.zip_code
//       ]
//     );

//     /* -------------------- 1️⃣4️⃣ Initial courier snapshot -------------------- */
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

//     /* -------------------- 1️⃣5️⃣ Coupon snapshot -------------------- */
//     if (appliedCoupon) {
//       await connection.query(
//         `INSERT INTO coupon_usages
//          (coupon_id, order_id, customer_id, used_at)
//          VALUES (?, ?, ?, NOW())`,
//         [appliedCoupon.id, orderId, user.id]
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
//           appliedCoupon.id,
//           appliedCoupon.code,
//           appliedCoupon.title,
//           appliedCoupon.discount_type,
//           appliedCoupon.discount,
//           couponDiscountTotal,
//           appliedCoupon.product_scope === "all" ? "order" : "sku"
//         ]
//       );
//     }

//     /* -------------------- 1️⃣6️⃣ COD advance check -------------------- */
//     const cfgRows = await getConfig(connection, false, "payment");
//     const paymentConfigs = {};

//     for (const row of cfgRows) {
//       const provider = row.provider || "default";
//       if (!paymentConfigs[provider]) {
//         paymentConfigs[provider] = {
//           is_active: Boolean(row.is_active),
//           config: {}
//         };
//       }
//       paymentConfigs[provider].config[row.key_name] = row.value;
//     }

//     /* -------------------- 1️⃣7️⃣ COD advance check -------------------- */
//     let codAdvanceRequired = false;

//     if (payment_type === "cod") {
//       const codProvider = paymentConfigs.cod;
//       if (
//         codProvider &&
//         codProvider.is_active &&
//         Number(codProvider.config.MIN_ADVANCE_PAYMENT_PERCENTAGE || 0) > 0
//       ) {
//         codAdvanceRequired = true;
//       }
//     }

//     /* -------------------- 1️⃣8️⃣ Decide payment URL -------------------- */
//     let payment_url = null;
//     if (
//       payment_type === "gateway" ||
//       payment_type === "mixed" ||
//       (payment_type === "cod" && codAdvanceRequired)
//     ) {
//       payment_url = `/api/v1/payment/initiatePayment/${orderId}`;
//     }

//     return {
//       success: true,
//       message: "Order placed successfully",
//       order_id: orderId,
//       totals: {
//         subtotal,
//         sku_discount: Number(skuDiscountTotal.toFixed(2)),
//         coupon_discount: couponDiscountTotal,
//         discount_total: discountTotal,
//         delivery: deliveryChargeAmount,
//         grand_total: grandTotal
//       },
//       delivery_info: {
//         free_delivery: hasFreeDelivery,
//         message: hasFreeDelivery ? "Free delivery applied" : "Standard delivery"
//       },
//       items_summary: {
//         unique_skus: variationIds.length,
//         total_items: order_items.length,
//         grouped_skus: groupedItems.length
//       },
//       payment: {
//         type: payment_type,
//         advance_required: codAdvanceRequired,
//         url: payment_url
//       },
//       deliveryCharge
//     };
//   })
// );


exports.createOrder = api(
  {
    body: {
      address_id: { type: "int", required: true },
      payment_type: { type: "string", required: true }, // gateway | cod | mixed
      delivery_charge_id: { type: "int", required: true },
      coupon_code: { type: "string", required: false },
      note: { type: "string", required: false },
      // Analytics / CAPI cookie handoff (optional — from useCookieIds hook)
      fbp: { type: "string", required: false },
      fbc: { type: "string", required: false },
      capi_event_id: { type: "string", required: false }
    }
  },
  userAuth(async (req, connection, user) => {

    const {
      address_id,
      payment_type,
      delivery_charge_id,
      coupon_code,
      note,
      fbp,
      fbc,
      capi_event_id
    } = req.typed.body;

    const orderItemsInput = req.body.order_items;
    if (!Array.isArray(orderItemsInput) || !orderItemsInput.length) {
      throw new errors.BAD_REQUEST("order_items must be a non-empty array");
    }

    if (!["gateway", "cod", "mixed"].includes(payment_type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment_type");
    }

    /* -------------------- 1️⃣ Validate order items -------------------- */
    const order_items = orderItemsInput.map((item, index) => {
      try {
        return validateAndCast({ body: item }, orderItemSchema).body;
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Item at index ${index}: ${err.message}`
        );
      }
    });

    /* -------------------- 2️⃣ Address + phone -------------------- */
    const address = await connection.queryOne(
      `SELECT a.*, p.phone_number, p.is_verified AS phone_verified
       FROM user_addresses a
       LEFT JOIN user_phones p ON p.id = a.phone_id
       WHERE a.id = ? AND a.user_id = ?`,
      [address_id, user.id]
    );

    if (!address) throw new errors.NOT_FOUND("Address not found");

    if (!address.phone_id) {
      throw new errors.NOT_FOUND("There is no phone number. Please insert a phone number on address");
    }

    // 🔐 V2: Enforce configurable order placement permissions (reads from DB)
    await validateRegularOrderPermission(connection, user, address);

    // 🛡️ Perform the fraud check
    const fraudResults = await getFraudTestResults(address.phone_number);





    /* -------------------- 3️⃣ Delivery charge -------------------- */
    const deliveryCharge = await connection.queryOne(
      `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
      [delivery_charge_id]
    );
    if (!deliveryCharge) {
      throw new errors.BAD_REQUEST("Invalid delivery charge");
    }

    /* -------------------- 4️⃣ Load Product Variations with Category Status Check -------------------- */
    const variationIds = [...new Set(order_items.map(i => i.product_variation_id))];

    const variations = await connection.query(
      `SELECT s.*, p.name AS product_name,
              COALESCE(s.free_delivery, p.free_delivery) AS free_delivery
       FROM product_skus s
       JOIN products p ON p.id = s.product_id
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       WHERE s.id IN (?) 
         AND s.status = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [variationIds]
    );

    if (variations.length !== variationIds.length) {
      throw new errors.BAD_REQUEST("Some product variations are invalid or belong to an inactive category");
    }

    /* -------------------- 5️⃣ Map variations for easy access -------------------- */
    const variationMap = {};
    variations.forEach(v => {
      variationMap[v.id] = v;
    });

    /* -------------------- 6️⃣ Check free_delivery consistency -------------------- */
    let freeDeliveryStatus = null;
    let hasMixedDelivery = false;

    for (const item of order_items) {
      const variation = variationMap[item.product_variation_id];
      const currentFreeDelivery = variation.free_delivery === 1;

      if (freeDeliveryStatus === null) {
        freeDeliveryStatus = currentFreeDelivery;
      } else if (freeDeliveryStatus !== currentFreeDelivery) {
        hasMixedDelivery = true;
      }
    }

    // Mixed delivery is now ALLOWED — free + paid items can be ordered together.
    // hasMixedDelivery is kept for logging/analytics but no longer throws.
    // NOTE: allFreeDelivery is computed below, after enrichedItems is built.

    /* -------------------- 7️⃣ Process quantities for same SKUs -------------------- */
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

    const groupedItems = Object.values(itemGroups);

    /* -------------------- 8️⃣ Pricing (Item level discounts) -------------------- */
    let subtotal = 0;
    let skuDiscountTotal = 0;

    const enrichedItems = groupedItems.map(groupedItem => {
      const variation = variationMap[groupedItem.product_variation_id];
      const rawUnitPrice = Number(variation.selling_price);

      const skuDiscount =
        variation.discount_type === 1
          ? (rawUnitPrice * variation.discount) / 100
          : Number(variation.discount || 0);

      const finalUnitPrice = rawUnitPrice - skuDiscount;

      const lineSubtotal = rawUnitPrice * groupedItem.totalQuantity;
      const lineDiscount = skuDiscount * groupedItem.totalQuantity;
      const lineTotal = finalUnitPrice * groupedItem.totalQuantity;

      subtotal += lineSubtotal;
      skuDiscountTotal += lineDiscount;

      return {
        ...groupedItem,
        variation,
        quantity: groupedItem.totalQuantity,
        rawUnitPrice,
        skuDiscount,
        finalUnitPrice,
        lineTotal
      };
    });

    // allFreeDelivery: true only if every item resolves to free delivery
    // Handles both integer 1 (DB) and boolean true (JS coercion)
    const allFreeDelivery = enrichedItems.every(i => !!i.variation.free_delivery);

    /* -------------------- 9️⃣ Coupon Logic (Updated with Limit Check) -------------------- */
    let couponDiscountTotal = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const coupon = await connection.queryOne(
        `SELECT * FROM coupons
         WHERE code = ?
           AND status = 1
           AND start_date <= NOW()
           AND expire_date >= NOW() and deleted_at is null`,
        [coupon_code]
      );
      if (!coupon) throw new errors.BAD_REQUEST("Invalid coupon");

      const discountBase = subtotal - skuDiscountTotal;
      if (discountBase < coupon.min_purchase_amount) {
        throw new errors.BAD_REQUEST(`Minimum purchase amount is ${coupon.min_purchase_amount}`);
      }

      // --- GLOBAL LIMIT PER USER CHECK (Applies to all scopes) ---
      const usageCount = await connection.queryOne(
        `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND customer_id = ?`,
        [coupon.id, user.id]
      );

      if (usageCount.cnt >= coupon.limit_per_user) {
        throw new errors.BAD_REQUEST(`You have already reached the limit for this coupon (${coupon.limit_per_user} uses allowed)`);
      }

      // Customer Target Check
      if (coupon.customer_scope === "specified") {
        const isTargeted = await connection.queryOne(
          `SELECT 1 FROM coupon_customer_targets WHERE coupon_id = ? AND customer_id = ? LIMIT 1`,
          [coupon.id, user.id]
        );
        if (!isTargeted) throw new errors.BAD_REQUEST("This coupon is not available for your account.");
      }

      let discountAmount = 0;
      if (coupon.product_scope === "all") {
        discountAmount = coupon.discount_type === 0 ? coupon.discount : (discountBase * coupon.discount) / 100;
      } else {
        const targets = await connection.query(`SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`, [coupon.id]);
        const targetIds = targets.map(t => t.product_sku_id);

        enrichedItems.forEach(item => {
          if (targetIds.includes(item.product_variation_id)) {
            discountAmount += coupon.discount_type === 0 ? coupon.discount : (item.lineTotal * coupon.discount) / 100;
          }
        });
      }

      if (coupon.discount_type === 1 && coupon.max_discount_amount != null) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }

      couponDiscountTotal = Number(discountAmount.toFixed(2));
      appliedCoupon = coupon;
    }

    /* -------------------- 🔟 Final Totals -------------------- */
    const discountTotal = Number((skuDiscountTotal + couponDiscountTotal).toFixed(2));

    // Delivery charge: ৳0 if ALL items are free-delivery; otherwise apply full charge
    const deliveryChargeAmount = allFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);

    /* ── Weight surcharge: only count PAID-delivery items ── */
    // Free-delivery items are excluded from weight billing entirely
    const paidWeightKgInitial = allFreeDelivery ? 0 : enrichedItems
      .filter(i => !i.variation.free_delivery)  // falsy = paid (0, false, null, undefined)
      .reduce((sum, i) => sum + Number(i.variation.weight_kg || 0) * i.quantity, 0);
    const freeWeightKg = Number(deliveryCharge.default_weight_kg || 0);
    const extraChargePerKg = Number(deliveryCharge.extra_charge_per_kg || 0);
    const excessKg = Math.max(0, paidWeightKgInitial - freeWeightKg);
    const weightExtraCharge = allFreeDelivery ? 0 : Number((excessKg * extraChargePerKg).toFixed(2));
    const totalWeightKg = paidWeightKgInitial; // Only chargeable (paid-delivery) weight recorded

    /* ── Bulk / Combo / Cart-Wide Discounts ── */
    const { calculateBulkComboDiscounts } = require('./user_discount');
    const cartItemsForDiscount = enrichedItems.map(i => ({
      product_sku_id: i.variation.id,
      quantity: i.quantity,
      final_unit_price: i.finalUnitPrice,
      selling_price: i.rawUnitPrice,
    }));
    const discountResult = await calculateBulkComboDiscounts(connection, cartItemsForDiscount);
    const bulkDiscountTotal = discountResult.bulkDiscountTotal;
    const comboDiscountTotal = discountResult.comboDiscountTotal;
    const cartWideDiscount = discountResult.cartWideDiscount;

    // Merge bulk/combo applied back onto enrichedItems (keyed by product_sku_id)
    for (const enriched of enrichedItems) {
      const match = discountResult.enrichedItems.find(x => x.product_sku_id === enriched.variation.id);
      if (match) {
        enriched.bulk_rule_id = match.bulk_rule_id;
        enriched.bulk_discount_applied = match.bulk_discount_applied;
        enriched.combo_rule_id = match.combo_rule_id;
        enriched.combo_discount_applied = match.combo_discount_applied;
        // Inherit per-item effective_free_delivery from rule (if rule grants it)
        if (match.effective_free_delivery) enriched.effectiveFreeDelivery = true;
      }
    }

    // Determine effective free-delivery per item: per-SKU flag OR rule-granted
    const isEffFree = (item) => !!(item.variation.free_delivery || item.effectiveFreeDelivery);
    const allEffFree = enrichedItems.length > 0 && enrichedItems.every(isEffFree);

    // Recalculate delivery and weight surcharge using effective per-item free delivery
    const effectiveDeliveryAmount = allEffFree ? 0 : deliveryChargeAmount;
    const paidWeightKg = allEffFree ? 0 : enrichedItems
      .filter(i => !isEffFree(i))
      .reduce((sum, i) => sum + Number(i.variation.weight_kg || 0) * i.quantity, 0);
    const excessKgEff = Math.max(0, paidWeightKg - freeWeightKg);
    const effectiveWeightExtraCharge = allEffFree ? 0 : Number((excessKgEff * extraChargePerKg).toFixed(2));

    const grandTotal = Number(
      (subtotal - discountTotal - bulkDiscountTotal - comboDiscountTotal - cartWideDiscount + effectiveDeliveryAmount + effectiveWeightExtraCharge).toFixed(2)
    );
    // ── DEBUG: trace weight + grand total calculation (REMOVE AFTER DEBUGGING) ──
    console.log('\n[createOrder DEBUG] ──────────────────────────────────────');
    console.log('  subtotal:', subtotal);
    console.log('  skuDiscountTotal:', skuDiscountTotal);
    console.log('  couponDiscountTotal:', couponDiscountTotal);
    console.log('  discountTotal:', discountTotal, '(sku+coupon)');
    console.log('  bulkDiscountTotal:', bulkDiscountTotal);
    console.log('  comboDiscountTotal:', comboDiscountTotal);
    console.log('  cartWideDiscount:', cartWideDiscount);
    console.log('  allFreeDelivery:', allFreeDelivery, '| allEffFree:', allEffFree);
    console.log('  deliveryChargeAmount:', deliveryChargeAmount, '| effectiveDeliveryAmount:', effectiveDeliveryAmount);
    console.log('  paidWeightKgInitial:', paidWeightKgInitial, '| paidWeightKg:', paidWeightKg);
    console.log('  freeWeightKg:', freeWeightKg, '| extraChargePerKg:', extraChargePerKg);
    console.log('  excessKgEff:', excessKgEff, '| effectiveWeightExtraCharge:', effectiveWeightExtraCharge);
    console.log('  grandTotal:', grandTotal);
    console.log('  Item weight breakdown:');
    enrichedItems.forEach(i => {
      console.log(`    SKU ${i.variation.id}: qty=${i.quantity}, weight_kg=${i.variation.weight_kg}, free_delivery=${i.variation.free_delivery}, effFree=${!!i.effectiveFreeDelivery}, isEffFree=${isEffFree(i)}`);
    });
    console.log('──────────────────────────────────────────────────────────\n');

    /* -------------------- 1️⃣1️⃣ Insert order (FIXED MAPPING) -------------------- */
    const orderResult = await connection.query(
      `INSERT INTO orders (
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        order_type,
        payment_type,
        payment_status,
        subtotal,
        discount_total,
        sku_discount_total,
        bulk_discount_total,
        combo_discount_total,
        cart_wide_discount,
        delivery_charge,
        weight_kg_total,
        weight_extra_charge,
        grand_total,
        paid_amount,
        due_amount,
        note,
        order_status,
        placed_at,
        fraud_test_results,
        origin,
        ip_address,
        fbp,
        fbc,
        capi_event_id
      ) VALUES (?, ?, ?, ?, 'regular', ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'new', NOW(), ?, 'Own platform', INET6_ATON(?), ?, ?, ?)`,
      [
        user.id,
        `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        user.email || "",
        address.phone_number || "",
        payment_type,
        subtotal,
        discountTotal,
        skuDiscountTotal,
        bulkDiscountTotal,
        comboDiscountTotal,
        cartWideDiscount,
        effectiveDeliveryAmount,
        Number(paidWeightKg.toFixed(3)),
        effectiveWeightExtraCharge,
        grandTotal,
        grandTotal, // due_amount (paid is 0)
        note || "",
        JSON.stringify(fraudResults),
        req.ip || '127.0.0.1',
        fbp || null,
        fbc || null,
        capi_event_id || null
      ]
    );

    const orderId = orderResult.insertId;

    /* -------------------- 1️⃣2️⃣ Order items with images -------------------- */
    const uniqueProductIds = [...new Set(enrichedItems.map(item => item.variation.product_id))];
    let productImagesMap = {};
    if (uniqueProductIds.length > 0) {
      const productImages = await connection.query(
        `SELECT pi.product_id, pi.img_path FROM product_images pi
         WHERE pi.product_id IN (?) AND pi.id = (
           SELECT MIN(pi2.id) FROM product_images pi2 
           WHERE pi2.product_id = pi.product_id
           ORDER BY pi2.serial ASC, pi2.id ASC LIMIT 1
         )`, [uniqueProductIds]
      );
      productImages.forEach(img => { productImagesMap[img.product_id] = img.img_path; });
    }

    for (const item of enrichedItems) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_sku_id, product_name, product_image,
          color_id, color_name, color_hex, attribute_id, variant_id, variant_name,
          quantity, buying_price, selling_price, discount, discount_type,
          bulk_rule_id, bulk_discount_applied, combo_rule_id, combo_discount_applied,
          final_unit_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.variation.product_id, item.variation.id, item.variation.product_name,
          productImagesMap[item.variation.product_id] || null,
          item.variation.color_id, item.variation.color_name, item.variation.color_hex,
          item.variation.attribute_id, item.variation.variant_id, item.variation.variant_name,
          item.quantity, item.variation.buying_price, item.rawUnitPrice,
          item.skuDiscount, item.variation.discount_type,
          item.bulk_rule_id || null, item.bulk_discount_applied || 0,
          item.combo_rule_id || null, item.combo_discount_applied || 0,
          item.finalUnitPrice, item.lineTotal
        ]
      );
    }

    /* -------------------- 1️⃣3️⃣-1️⃣5️⃣ Snapshots -------------------- */
    await connection.query(`INSERT INTO order_addresses (order_id, address_id, address_type, full_address, city, zip_code, location_mapping_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, [orderId, address_id, address.address_type, address.full_address, address.city, address.zip_code, address.location_mapping_id || null]);
    await connection.query(`INSERT INTO order_couriers (order_id, delivery_charge_id, delivery_title, customer_charge, our_charge, created_at) VALUES (?, ?, ?, ?, ?, NOW())`, [orderId, deliveryCharge.id, deliveryCharge.title, deliveryChargeAmount, deliveryCharge.our_charge || 0]);

    if (appliedCoupon) {
      await connection.query(`INSERT INTO coupon_usages (coupon_id, order_id, customer_id, used_at) VALUES (?, ?, ?, NOW())`, [appliedCoupon.id, orderId, user.id]);
      await connection.query(`INSERT INTO order_coupons (order_id, coupon_id, coupon_code, coupon_title, discount_type, discount_value, discount_amount, applied_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, appliedCoupon.id, appliedCoupon.code, appliedCoupon.title, appliedCoupon.discount_type, appliedCoupon.discount, couponDiscountTotal, appliedCoupon.product_scope === "all" ? "order" : "sku"]);
    }

    /* -------------------- 1️⃣6️⃣ COD advance check -------------------- */
    const cfgRows = await getConfig(connection, false, "payment");


    // Build payment config map
    const paymentConfigs = {};

    for (const row of cfgRows) {
      const provider = row.provider;
      if (!provider) continue;

      if (!paymentConfigs[provider]) {
        paymentConfigs[provider] = { config: {} };
      }

      paymentConfigs[provider].config[row.key_name] = {
        value: row.value,
        is_active: Boolean(row.is_active)
      };
    }

    let codAdvanceRequired = false;

    if (payment_type === "cod") {
      const codConfig = paymentConfigs.cod?.config;

      // ❌ COD inactive → hard stop
      if (!codConfig?.CASH_ON_DELIVERY?.is_active) {
        throw new errors.BAD_REQUEST("Cash on Delivery is currently unavailable");
      }

      // ✅ Advance check
      const advanceCfg = codConfig.MIN_ADVANCE_PAYMENT_PERCENTAGE;

      if (
        advanceCfg?.is_active &&
        Number(advanceCfg.value) > 0
      ) {
        codAdvanceRequired = true;
      }
    }
//

    /* -------------------- 17️⃣ Prepare Email Context -------------------- */
    // Formatting helpers
    const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
    const orderDateText = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Construct Shipping Address String
    const shippingAddressText = `${address.full_address}, ${address.city}${address.zip_code ? '-' + address.zip_code : ''}`;

    // Map payment type to readable text
    const paymentMethodMap = { gateway: "Online Payment", cod: "Cash on Delivery", mixed: "Partial Payment" };

    // Map enrichedItems to the specific items format
    const emailItems = enrichedItems.map(item => ({
      name: item.variation.product_name,
      variant: `${item.variation.color_name || ''} ${item.variation.variant_name || ''}`.trim() || "Default",
      sku: item.variation.sku,
      qty: item.quantity,
      unite_selling_price: formatBDT(item.rawUnitPrice),
      unite_discount: formatBDT(item.skuDiscount),
      final_unite_price: formatBDT(item.finalUnitPrice),
      line_total: formatBDT(item.lineTotal)
    }));

    const orderContext = {
      id: orderId,
      date: orderDateText,
      status: "pending", // Since it's 'new' in the DB
      payment_method: paymentMethodMap[payment_type] || payment_type,
      shipping_address: shippingAddressText,
      track_url: `${SHOP_URL}/account/my-order/${orderId}`,
      subtotal: formatBDT(subtotal),
      shipping_fee: formatBDT(deliveryChargeAmount),
      weight_surcharge: weightExtraCharge > 0 ? formatBDT(weightExtraCharge) : null,
      weight_kg: totalWeightKg > 0 ? Number(totalWeightKg.toFixed(3)) : null,
      item_discount: skuDiscountTotal > 0 ? formatBDT(skuDiscountTotal) : null,
      bulk_discount: bulkDiscountTotal > 0 ? formatBDT(bulkDiscountTotal) : null,
      combo_discount: comboDiscountTotal > 0 ? formatBDT(comboDiscountTotal) : null,
      cart_wide_discount: cartWideDiscount > 0 ? formatBDT(cartWideDiscount) : null,
      coupon_discount: couponDiscountTotal > 0 ? formatBDT(couponDiscountTotal) : null,
      total: formatBDT(grandTotal),
      items: emailItems
    };

    // ─────────────────── Send Email ───────────────────
    // ─────────────────── Send Email ───────────────────
    await sendOrdermail(connection, {
      name: `${user.first_name} ${user.last_name}`.trim() || "Customer",
      email: user.email, // Using user.email from the auth object
      order: orderContext
    });

    // ─── User Audit Log ─────────────────────────────────────────────
    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
       VALUES (?, 'PLACE_ORDER', ?, ?)`,
      [
        user.id,
        req.ip || null,
        JSON.stringify({
          order_id:     orderId,
          grand_total:  grandTotal,
          payment_type: payment_type,
          item_count:   enrichedItems.length,
          coupon_used:  appliedCoupon ? appliedCoupon.code : null
        })
      ]
    );

    // ─── V2-017: Auto-assign on order creation ─────────────────────────────────
    // MUST be awaited — it uses the handler's `connection` which the api() wrapper
    // commits + releases immediately after this handler returns.
    try {
      await autoAssignOrder(connection, orderId);
    } catch (err) {
      console.error(`[AutoAssign] Failed for order #${orderId}:`, err.message);
    }
    // ─── V2-034: Notify all admins about new order (non-blocking) ────────────
    // This opens its own DB connection, so fire-and-forget is safe.
    sendAdminOrderNotification(connection, orderId, 'new_order');
    // ─────────────────────────────────────────────────────────────────────────

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order placed successfully",
      order_id: orderId,

      totals: {
        subtotal,
        sku_discount: Number(skuDiscountTotal.toFixed(2)),
        coupon_discount: couponDiscountTotal,
        discount_total: discountTotal,
        delivery: deliveryChargeAmount,
        grand_total: grandTotal
      },
      payment: {
        type: payment_type,
        advance_required: codAdvanceRequired,
        url: (payment_type === "gateway" || payment_type === "mixed" || (payment_type === "cod" && codAdvanceRequired)) ? `/api/v1/payment/initiatePayment/${orderId}` : null
      }
    };
  })
);



exports.initiatePayment = api(
  {
    params: {
      orderId: { type: "int", required: true }
    },
    body: {
      payment_method: { type: "string", required: true } // sslcommerz, bkash, nagad, shurjopay, rocket
    }
  },
  userAuth(async (req, connection, user) => {
    const { orderId } = req.typed.params;
    const { payment_method } = req.typed.body;

    if (!["sslcommerz", "bkash", "nagad", "shurjopay", "rocket"].includes(payment_method)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment method")

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
       WHERE o.id = ? AND o.customer_id = ?`,
      [orderId, user.id]
    );

    if (!order) throw new errors.NOT_FOUND("Order not found");

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



    if (

      !providerRows.length || !providerRows[0].is_active
    ) {
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
  })
);




exports.sslCommerzCallback = api({}, async (req, connection) => {
  const data = req.body;

  // 1. Initial Status Check
  if (data.status !== "VALID" && data.status !== "AUTHENTICATED") {
    return { success: false, message: "Payment status: " + data.status };
  }

  // 2. Fetch Config
  const configs = await getConfig(connection, false, "payment");
  const providerRows = configs.filter(c => c.provider === "sslcommerz");
  const sslConfig = {};
  providerRows.forEach(r => (sslConfig[r.key_name] = r.value));

  // 3. Handle Scenarios using SSL_ENV
  // Sandbox uses validationserverAPI.php, while Live usually uses ordervalidate.php
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

  try {
    const { data: verifyData } = await axios.get(validationUrl);

    if (verifyData.status !== "VALID" && verifyData.status !== "AUTHENTICATED") {
      throw new errors.BAD_REQUEST("Transaction validation failed");
    }

    // Double check amount for security
    if (parseFloat(verifyData.amount) < parseFloat(data.amount)) {
      throw new errors.BAD_REQUEST("Amount mismatch during validation");
    }
  } catch (err) {
    console.error(`SSL ${sslConfig.SSL_ENV} Verification Error====================:`, err.message);
    throw new errors.BAD_REQUEST(`SSLCommerz ${sslConfig.SSL_ENV} unreachable or 404`);
  }

  // 4. Load order state (Using tran_id as order_payments.id)
  const paymentRecord = await connection.queryOne(
    `SELECT op.id as payment_id, op.order_id, op.status as payment_record_status, 
            o.grand_total, o.paid_amount, o.due_amount, o.payment_status, o.order_type
     FROM order_payments op
     JOIN orders o ON op.order_id = o.id
     WHERE op.id = ?`,
    [data.tran_id]
  );

  if (!paymentRecord) throw new errors.NOT_FOUND("Payment record not found");
  if (paymentRecord.payment_record_status === "success") {
    const { QRedirect: QRedDup } = require('../helpers/responses');
    return new QRedDup(`${SHOP_URL}/checkout/success?orderId=${paymentRecord.order_id}&payment=success`);
  }

  // 5. Update Database Logic
  const paidAmountNow = Number(data.amount) || 0;
  const totalPaidUpdated = Math.min(Number(paymentRecord.paid_amount) + paidAmountNow, Number(paymentRecord.grand_total));
  const newDue = Math.max(0, Number(paymentRecord.grand_total) - totalPaidUpdated);
  const finalPaymentStatus = totalPaidUpdated >= Number(paymentRecord.grand_total) ? 'paid' : 'partial_paid';


  await connection.query(
    `UPDATE order_payments SET transaction_ref = ?, status = 'success', paid_at = NOW() WHERE id = ?`,
    [data.bank_tran_id, data.tran_id]
  );

  await connection.query(
    `UPDATE orders SET 
        payment_status = ?,   
        paid_amount = ?, 
        due_amount = ?, 
        paid_at = NOW(),
        updated_at = NOW() 
       WHERE id = ?`,
    [finalPaymentStatus, totalPaidUpdated, newDue, paymentRecord.order_id]
  );

  // 6. Redirect to frontend
  const { QRedirect } = require('../helpers/responses');
  return new QRedirect(`${SHOP_URL}/checkout/success?orderId=${paymentRecord.order_id}&payment=success`);
});


// --- FAIL HANDLER ---
exports.sslCommerzFail = api({}, async (req, connection) => {
  const data = req.body;

  // 1️⃣ Basic validation
  if (!data.tran_id) {
    throw new errors.BAD_REQUEST("Invalid transaction reference");
  }

  // 2️⃣ Load payment + order (tran_id === order_payments.id)
  const paymentRecord = await connection.queryOne(
    `SELECT 
        op.id           AS payment_id,
        op.status       AS payment_status,
        op.order_id,
        o.payment_status AS order_payment_status,
        o.order_type
     FROM order_payments op
     JOIN orders o ON o.id = op.order_id
     WHERE op.id = ?`,
    [data.tran_id]
  );

  if (!paymentRecord) {
    throw new errors.NOT_FOUND("Payment record not found");
  }

  // 3️⃣ Idempotency: already finalized
  if (paymentRecord.payment_status === "success") {


    throw new errors.BAD_REQUEST("Payment already completed, ignoring fail callback");

  }

  if (paymentRecord.payment_status === "failed") {


    throw new errors.BAD_REQUEST("Payment already marked as failed");

  }

  // 4️⃣ Mark payment as failed
  await connection.query(
    `UPDATE order_payments
     SET status = 'failed' 
     WHERE id = ?`,
    [paymentRecord.payment_id]
  );


  // 6️⃣ Redirect user to frontend status page
  const { QRedirect: QRed } = require('../helpers/responses');
  return new QRed(`${SHOP_URL}/checkout/success?orderId=${paymentRecord.order_id}&payment=failed`);
});


// --- CANCEL HANDLER ---
exports.sslCommerzCancel = api({}, async (req, connection) => {
  const data = req.body;

  // 1️⃣ Basic validation
  if (!data.tran_id) {
    throw new errors.BAD_REQUEST("Invalid transaction reference");
  }

  // 2️⃣ Load payment + order (tran_id === order_payments.id)
  const paymentRecord = await connection.queryOne(
    `SELECT 
        op.id           AS payment_id,
        op.status       AS payment_status,
        op.order_id,
        o.payment_status AS order_payment_status
     FROM order_payments op
     JOIN orders o ON o.id = op.order_id
     WHERE op.id = ?`,
    [data.tran_id]
  );

  if (!paymentRecord) {
    throw new errors.NOT_FOUND("Payment record not found");
  }

  // 3️⃣ Idempotency checks
  if (paymentRecord.payment_status === "success") {

    throw new errors.BAD_REQUEST("Payment already completed, ignoring cancel callback");

  }

  if (paymentRecord.payment_status === "failed") {


    throw new errors.BAD_REQUEST("Payment already cancelled/failed");

  }

  // 4️⃣ Mark payment as failed (cancelled by user)
  await connection.query(
    `UPDATE order_payments
     SET status = 'failed'
     WHERE id = ?`,
    [paymentRecord.payment_id]
  );

  // ⚠️ IMPORTANT:
  // We do NOT change order_status
  // We do NOT force payment_status = cancelled
  // User can retry payment safely

  const { QRedirect: QRedC } = require('../helpers/responses');
  return new QRedC(`${SHOP_URL}/checkout/success?orderId=${paymentRecord.order_id}&payment=cancelled`);
});


exports.bkashCallback = api({}, async (req, connection) => {
  const { status, paymentID, merchantInvoiceNumber } = req.query;

  // 1️⃣ Basic validation
  if (!merchantInvoiceNumber) {
    throw new errors.BAD_REQUEST("Invalid payment reference");
  }

  const paymentId = Number(merchantInvoiceNumber);

  // 2️⃣ Load payment + order state
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
    throw new errors.NOT_FOUND("Payment record not found");
  }

  // 3️⃣ Handle non-success immediately (cancel / failure)
  if (status !== "success") {
    if (paymentRecord.payment_status !== "success") {
      await connection.query(
        `UPDATE order_payments SET status = 'failed' WHERE id = ?`,
        [paymentId]
      );
    }


    return { success: true, message: "Order payment successful" };
  }

  // 4️⃣ Idempotency check
  if (paymentRecord.payment_status === "success") {

    return { success: true, message: "Order payment successful" };
  }

  // 5️⃣ Load bKash credentials
  const configs = await getConfig(connection, false, "payment");
  const creds = {};
  configs
    .filter(c => c.provider === "bkash")
    .forEach(r => (creds[r.key_name] = r.value));

  try {
    // 6️⃣ Grant token
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

    // 7️⃣ Execute payment
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

    // 8️⃣ Validate execution response
    if (
      result.statusCode !== "0000" ||
      result.transactionStatus !== "Completed"
    ) {
      throw new Error(result.statusMessage || "bKash execution failed");
    }

    // 9️⃣ Financial calculation
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

    // 🔟 Update order_payments
    await connection.query(
      `UPDATE order_payments
       SET transaction_ref = ?, status = 'success', paid_at = NOW()
       WHERE id = ?`,
      [result.trxID, paymentId]
    );

    // 1️⃣1️⃣ Update orders ONLY if state changes
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
           order_status = 'approved',
           paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
           updated_at = NOW()
         WHERE id = ?`,
        [
          finalPaymentStatus,
          totalPaidUpdated,
          newDue,
          finalPaymentStatus,
          paymentRecord.order_id
        ]
      );
    }


    return { success: true, message: "Order payment successful" };
  } catch (err) {
    console.error("bKash Callback Error:", err.message);

    // Mark failed safely
    if (paymentRecord.payment_status !== "success") {
      await connection.query(
        `UPDATE order_payments SET status = 'failed' WHERE id = ?`,
        [paymentId]
      );
    }


    return { success: false, message: "Order payment faild" };
  }
});



exports.shurjopayCallback = api({}, async (req, connection) => {
  const { order_id } = req.query; // shurjoPay order_id

  // 🔹 Fallback URL must NEVER hard-fail
  if (!order_id) {
    return {
      success: false,
      message: "Payment failed"
    };
  }

  // 1️⃣ Load payment configs
  const configs = await getConfig(connection, false, "payment");
  const creds = Object.fromEntries(
    configs
      .filter(c => c.provider === "shurjopay")
      .map(r => [r.key_name, r.value])
  );

  try {
    // 2️⃣ Get Auth Token
    const authRes = await axios.post(
      `${creds.SP_ENDPOINT}/api/get_token`,
      {
        username: creds.SP_USERNAME,
        password: creds.SP_PASSWORD
      }
    );

    // 3️⃣ Verify Payment
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
    const paymentId = paymentInfo.customer_order_id; // your order_payments.id

    // 🔁 Load existing payment (idempotency check)
    const [[payment]] = await connection.query(
      `SELECT id, status FROM order_payments WHERE id = ? FOR UPDATE`,
      [paymentId]
    );

    if (!payment) {
      return {
        success: false,
        message: "Payment failed"
      };
    }

    // 🛑 Already finalized → just redirect
    if (payment.status !== "pending") {

      return {
        success: payment.status,
        message: "Payment" + payment.status
      };

    }

    // --- SHURJOPAY STATUS HANDLING ---
    if (spCode === "1000") {
      /* ✅ SUCCESS */
      await connection.query(
        `UPDATE order_payments 
         SET status = 'success', updated_at = NOW()
         WHERE id = ?`,
        [paymentId]
      );

      // 👉 Update order table here if needed
      // await connection.query(`UPDATE orders SET payment_status='paid' WHERE id=?`, [...])
      return {
        success: success,
        message: "Payment success"
      };

    } else if (spCode === "1001" || spCode === "1002") {
      /* ❌ FAILED / CANCELLED */
      await connection.query(
        `UPDATE order_payments 
         SET status = 'failed', updated_at = NOW()
         WHERE id = ?`,
        [paymentId]
      );

      const reason =
        spCode === "1002" ? "cancelled_by_user" : "bank_declined";

      return {
        success: false,
        message: "Payment failed : " + reason
      };
    }

    /* ⚠️ UNKNOWN CODE → keep pending */
    req.logger?.warn("Unknown shurjoPay sp_code:", spCode);

    return {
      _redirect: `${process.env.FRONTEND_URL}/payment/status?status=pending`
    };

  } catch (err) {
    /* 🌐 Verification API failed */
    req.logger?.error("shurjoPay verification failed:", err.message);

    // ❗ DO NOT fail payment
    // Leave it as pending for cron / manual verification

    return {
      success: false,
      message: "Payment failed"
    };
  }
});


exports.shurjopayCancel = api({}, async (req, connection) => {
  const { order_id } = req.query; // shurjoPay transaction ref

  // 🔹 Cancel URL must always redirect safely
  if (!order_id) {
    return {
      success: false,
      message: "Payment failed"
    };
  }

  // 1️⃣ Load payment row safely
  const [[payment]] = await connection.query(
    `SELECT id, status 
     FROM order_payments 
     WHERE transaction_ref = ? 
     FOR UPDATE`,
    [order_id]
  );

  // ❗ Payment not found → just redirect
  if (!payment) {
    return {
      success: false,
      message: "Payment failed"
    };
  }

  // 🛑 Already finalized → don't touch
  if (payment.status === "success" || payment.status === "failed") {
    return {
      _redirect: `${process.env.FRONTEND_URL}/payment/status?status=${payment.status}`
    };
  }

  // 2️⃣ Mark as cancelled (only if pending)
  if (payment.status === "pending") {
    await connection.query(
      `UPDATE order_payments 
       SET status = 'cancelled', updated_at = NOW() 
       WHERE id = ?`,
      [payment.id]
    );
  }

  // 3️⃣ Redirect back to checkout
  return {
    success: success,
    message: "Payment success"
  };
});









exports.getOrders = api(
  {
    query: {
      customer_phone: { type: "string", required: false },
      customer_email: { type: "string", required: false },
      order_status: { type: "string", required: false },
      order_type: { type: "string", required: false },
      payment_status: { type: "string", required: false },
      payment_type: { type: "string", required: false },
      payment_provider: { type: "string", required: false },
      is_fraud: { type: "bool", required: false },
      min_total: { type: "int", required: false },
      max_total: { type: "int", required: false },
      date_from: { type: "string", required: false },
      date_to: { type: "string", required: false },
      assigned_to_me: { type: "bool", required: false },
      assigned_to_admin_id: { type: "int", required: false },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Role Authorization */
    const ORDER_ALLOWED_ROLES = [
      "SUPER_ADMIN",
      "ADMIN",
      "ORDER_MANAGER",
      "READ_ONLY_ADMIN"
    ];

    if (!adminInfo.roles.some(r => ORDER_ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to read orders.");
    }

    /** 2️⃣ Validation */
    if (req.typed.date_from && !validator.isDate(req.typed.date_from))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date_from");

    if (req.typed.date_to && !validator.isDate(req.typed.date_to))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date_to");

    if (req.typed.order_type && !['regular', 'guest', 'admin_regular', 'admin_stranger', 'single_page'].includes(req.typed.order_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid order type");

    if (req.typed.order_status && ![
      'new', 'approved', 'processing', 'packaging', 'shipped',
      'out_for_delivery', 'delivered', 'returned', 'cancelled', 'on_hold', 'trash'
    ].includes(req.typed.order_status))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid order status");

    if (req.typed.payment_status && !['unpaid', 'partial_paid', 'paid'].includes(req.typed.payment_status))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment status");

    if (req.typed.payment_type && !['gateway', 'cod', 'mixed'].includes(req.typed.payment_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment type");

    if (req.typed.payment_provider && !['sslcommerz', 'bkash', 'nagad', 'shurjopay', 'rocket'].includes(req.typed.payment_provider))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment provider");

    if (req.typed.customer_email && !validator.isEmail(req.typed.customer_email))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid email");

    if (req.typed.customer_phone && !validator.isMobilePhone(req.typed.customer_phone, 'any'))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone");

    let { limit, offset, ...q } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    /** 3️⃣ WHERE builder */
    const where = [];
    const params = [];

    if (q.customer_phone) { where.push("o.customer_phone LIKE ?"); params.push(`%${q.customer_phone}%`); }
    if (q.customer_email) { where.push("o.customer_email LIKE ?"); params.push(`%${q.customer_email}%`); }
    if (q.order_status) { where.push("o.order_status = ?"); params.push(q.order_status); }
    if (q.order_type) { where.push("o.order_type = ?"); params.push(q.order_type); }
    if (q.payment_status) { where.push("o.payment_status = ?"); params.push(q.payment_status); }
    if (q.payment_type) { where.push("o.payment_type = ?"); params.push(q.payment_type); }
    if (q.is_fraud !== undefined) { where.push("o.is_fraud = ?"); params.push(q.is_fraud); }
    if (q.min_total) { where.push("o.grand_total >= ?"); params.push(q.min_total); }
    if (q.max_total) { where.push("o.grand_total <= ?"); params.push(q.max_total); }
    if (q.date_from) { where.push("o.created_at >= ?"); params.push(q.date_from); }
    if (q.date_to) { where.push("o.created_at <= ?"); params.push(q.date_to); }
    // Assignment filters
    if (q.assigned_to_me) { where.push("o.assigned_to_admin_id = ?"); params.push(adminInfo.id); }
    else if (q.assigned_to_admin_id) { where.push("o.assigned_to_admin_id = ?"); params.push(q.assigned_to_admin_id); }

    if (q.payment_provider) {
      where.push(`
        EXISTS (
          SELECT 1 FROM order_payments op
          WHERE op.order_id = o.id AND op.provider = ?
        )
      `);
      params.push(q.payment_provider);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    /** 4️⃣ Count */
    const [count] = await connection.query(`
      SELECT COUNT(DISTINCT o.id) total
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      ${whereSQL}
    `, params);

    /** 5️⃣ Orders (DESC BY ID) */
    const orders = await connection.query(`
      SELECT
        o.id,
        o.customer_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.order_type,
        o.is_fraud,
        o.fraud_test_results,
        o.payment_type,
        o.payment_status,
        o.subtotal,
        o.discount_total,
        o.sku_discount_total,
        o.bulk_discount_total,
        o.combo_discount_total,
        o.cart_wide_discount,
        o.delivery_charge,
        o.weight_kg_total,
        o.weight_extra_charge,
        o.grand_total,
        o.paid_amount,
        o.due_amount,
        o.order_status,
        o.note,
        o.created_at,
        o.assigned_to_admin_id,
        o.assigned_by_admin_id,
        o.assignment_method,
        o.assigned_at,
        CONCAT(aa.first_name, ' ', IFNULL(aa.last_name,'')) AS assigned_admin_name,
        aa.email AS assigned_admin_email,
        aa.profile_img_path AS assigned_admin_img,
        u.img_path AS customer_img,
        oa.full_address,
        oa.city,
        oa.zip_code,
        oa.location_mapping_id,
        lm_oa.area_name,
        lm_oa.city_name AS lm_city_name,
        COALESCE(cp.coupon_discount, 0) AS coupon_discount
      FROM orders o
      LEFT JOIN users u ON u.id = o.customer_id
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      LEFT JOIN location_mappings lm_oa ON lm_oa.id = oa.location_mapping_id
      LEFT JOIN admins aa ON aa.id = o.assigned_to_admin_id
      LEFT JOIN (
        SELECT order_id, SUM(discount_amount) AS coupon_discount
        FROM order_coupons
        GROUP BY order_id
      ) cp ON cp.order_id = o.id
      ${whereSQL}
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    if (!orders.length) {
      return { success: true, data: [], pagination: { limit, offset, total: count.total } };
    }

    /** 6️⃣ Use MAP to preserve order */
    const orderMap = new Map();
    orders.forEach(o => {
      orderMap.set(o.id, { ...o, items: [], payments: [], couriers: [], coupons: [] });
    });

    const orderIds = orders.map(o => o.id);

    /** 7️⃣ Related Data */
    const items = await connection.query(`
      SELECT
        oi.*,
        ps.sku,
        c.name AS color_name,
        c.hex AS color_hex,
        a.name AS attribute_name,
        v.name AS variant_name,
        b.name AS brand_name
      FROM order_items oi
      JOIN product_skus ps ON ps.id = oi.product_sku_id
      LEFT JOIN colors c ON c.id = oi.color_id
      LEFT JOIN attributes a ON a.id = oi.attribute_id
      LEFT JOIN variants v ON v.id = oi.variant_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE oi.order_id IN (?)
    `, [orderIds]);
    const payments = await connection.query(`SELECT * FROM order_payments WHERE order_id IN (?)`, [orderIds]);
    const couriers = await connection.query(`SELECT * FROM order_couriers WHERE order_id IN (?)`, [orderIds]);
    const coupons = await connection.query(`SELECT * FROM order_coupons WHERE order_id IN (?)`, [orderIds]);

    items.forEach(i => orderMap.get(i.order_id)?.items.push(i));
    payments.forEach(p => orderMap.get(p.order_id)?.payments.push(p));
    couriers.forEach(c => orderMap.get(c.order_id)?.couriers.push(c));
    coupons.forEach(c => orderMap.get(c.order_id)?.coupons.push(c));

    const courierOption = await getAvailableAutoCouriers(connection);



    /** 4.5️⃣ Summary (NO limit / offset) */
    const summaryRows = await connection.query(`
  SELECT 
    COUNT(*) AS total,
    SUM(order_status = 'new') AS new,
    SUM(order_status = 'delivered') AS delivered,
    SUM(order_status = 'cancelled') AS cancelled
  FROM orders o
  ${whereSQL}
`, params);

    const total = summaryRows[0].total || 0;
    const _new = summaryRows[0].new || 0;
    const delivered = summaryRows[0].delivered || 0;
    const cancelled = summaryRows[0].cancelled || 0;

    const summary = {
      total,
      new: _new,
      delivered,
      cancelled,
      others: total - (_new + delivered + cancelled) // ✅ rest of statuses
    };


    return {
      success: true,
      courierOption,
      data: Array.from(orderMap.values()), // ✅ ORDER PRESERVED
      pagination: {
        limit,
        offset,
        total: count.total
      },
      summary
    };
  })
);


exports.getSingleOrderById = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Role Authorization */
    const ORDER_ALLOWED_ROLES = [
      "SUPER_ADMIN",
      "ADMIN",
      "ORDER_MANAGER",
      "READ_ONLY_ADMIN"
    ];

    const hasPermission = adminInfo.roles.some(role =>
      ORDER_ALLOWED_ROLES.includes(role)
    );

    if (!hasPermission) {
      throw new errors.UNAUTHORIZED("You do not have permission to read orders.");
    }

    const orderId = req.typed.params.id;

    /** 2️⃣ Fetch Order */
    const [order] = await connection.query(`
  SELECT
    o.id,
    o.customer_id,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.order_type,
    o.is_fraud,
    o.fraud_test_results,
    o.payment_type,
    o.payment_status,
    o.subtotal,
    o.discount_total,
    o.sku_discount_total,
    o.bulk_discount_total,
    o.combo_discount_total,
    o.cart_wide_discount,
    o.delivery_charge,
    o.weight_kg_total,
    o.weight_extra_charge,
    o.grand_total,
    o.paid_amount,
    o.due_amount,
    o.order_status,
    o.note,
    o.created_at,
    u.img_path AS customer_img,
    oa.full_address,
    oa.city,
    oa.zip_code,
    oa.location_mapping_id,
    lm_oa.area_name,
    lm_oa.city_name AS lm_city_name,
    COALESCE(cp.coupon_discount, 0) AS coupon_discount
  FROM orders o
  LEFT JOIN users u ON u.id = o.customer_id
  LEFT JOIN order_addresses oa ON oa.order_id = o.id
  LEFT JOIN location_mappings lm_oa ON lm_oa.id = oa.location_mapping_id
  LEFT JOIN (
    SELECT order_id, SUM(discount_amount) AS coupon_discount
    FROM order_coupons
    GROUP BY order_id
  ) cp ON cp.order_id = o.id
  WHERE o.id = ?
  LIMIT 1
`, [orderId]);


    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    /** 3️⃣ Order Items */
    const items = await connection.query(`
      SELECT
        oi.*,
        ps.sku,
        c.name AS color_name,
        c.hex AS color_hex,
        a.name AS attribute_name,
        v.name AS variant_name,
        b.name AS brand_name
      FROM order_items oi
      JOIN product_skus ps ON ps.id = oi.product_sku_id
      LEFT JOIN colors c ON c.id = oi.color_id
      LEFT JOIN attributes a ON a.id = oi.attribute_id
      LEFT JOIN variants v ON v.id = oi.variant_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE oi.order_id = ?
    `, [orderId]);

    /** 4️⃣ Product First Images */
    const productIds = [...new Set(items.map(i => i.product_id))];

    const images = productIds.length
      ? await connection.query(`
          SELECT pi.product_id, pi.img_path
          FROM product_images pi
          WHERE pi.id IN (
            SELECT MIN(id)
            FROM product_images
            WHERE product_id IN (?)
            GROUP BY product_id
          )
        `, [productIds])
      : [];

    const imageMap = {};
    images.forEach(i => {
      imageMap[i.product_id] = i.img_path;
    });

    items.forEach(i => {
      i.product_image = imageMap[i.product_id] || null;
    });

    /** 5️⃣ Payments / Couriers / Coupons */
    const payments = await connection.query(
      `SELECT * FROM order_payments WHERE order_id = ?`,
      [orderId]
    );

    const couriers = await connection.query(
      `SELECT * FROM order_couriers WHERE order_id = ?`,
      [orderId]
    );

    const coupons = await connection.query(
      `SELECT * FROM order_coupons WHERE order_id = ?`,
      [orderId]
    );

    /** 6️⃣ Courier Options */
    const courierOption = await getAvailableAutoCouriers(connection);

    /** 7️⃣ Final Response */
    return {
      success: true,
      courierOption,
      data: {
        ...order,
        items,
        payments,
        couriers,
        coupons
      }
    };
  })
);


exports.updateOrderPaymentStatus = api(
  {
    params: {
      order_id: { type: "int", required: true }
    },
    body: {
      new_payment_status: {
        type: "string",
        required: true
      }
    }
  },
  auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const { order_id } = req.typed.params;
    const { new_payment_status } = req.typed.body;

    if (!['unpaid', 'partial_paid', 'paid'].includes(new_payment_status)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment status");
    }

    /** 2️⃣ Fetch order */
    const order = await connection.queryOne(
      `SELECT * FROM orders WHERE id = ?`,
      [order_id]
    );

    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    /** 3️⃣ Recalculate gateway-paid amount */
    const paymentSum = await connection.queryOne(
      `SELECT COALESCE(SUM(amount),0) AS total_paid
       FROM order_payments
       WHERE order_id = ?
         AND status = 'success'`,
      [order_id]
    );

    let recalculatedPaid = Number(paymentSum.total_paid.toFixed(2));
    let recalculatedDue = Number(
      Math.max(order.grand_total - recalculatedPaid, 0).toFixed(2)
    );

    /** 4️⃣ Validation & force-settle logic */
    const isForceSettle =
      new_payment_status === 'paid' &&
      ['cod', 'mixed'].includes(order.payment_type);

    if (!isForceSettle) {
      // NORMAL STRICT VALIDATION
      if (new_payment_status === "unpaid" && recalculatedPaid !== 0) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "Cannot mark unpaid when payment exists"
        );
      }

      if (
        new_payment_status === "partial_paid" &&
        !(recalculatedPaid > 0 && recalculatedDue > 0)
      ) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "Partial payment status does not match payment data"
        );
      }

      if (new_payment_status === "paid" && recalculatedDue !== 0) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "Gateway orders must be fully paid before marking as paid"
        );
      }
    }

    /** 5️⃣ Force settle (COD / MIXED) */
    if (isForceSettle) {
      recalculatedPaid = Number(order.grand_total);
      recalculatedDue = 0;
    }

    /** 6️⃣ Delta calculation */
    const previousPaid = Number(order.paid_amount);
    const deltaPaid = Number((recalculatedPaid - previousPaid).toFixed(2));

    /** 7️⃣ Update order */
    await connection.query(
      `UPDATE orders
       SET
         paid_amount = ?,
         due_amount = ?,
         payment_status = ?,
         paid_at = ?
       WHERE id = ?`,
      [
        recalculatedPaid,
        recalculatedDue,
        new_payment_status,
        new_payment_status === 'paid'
          ? (order.paid_at || new Date())
          : null,
        order_id
      ]
    );

    /** 8️⃣ Update user's total_spent */
    if (deltaPaid > 0 && order.customer_id) {
      await connection.query(
        `UPDATE users
         SET total_spent = total_spent + ?
         WHERE id = ?`,
        [deltaPaid, order.customer_id]
      );
    }

    /** 9️⃣ Audit log */
    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'CHANGE_ORDER_PAYMENT_STATUS', 'order', ?, ?)
      `,
      [adminInfo.id, order_id, JSON.stringify({ ...req.typed })]
    );




    /** 🔟 Send Payment Update Email */
    if (new_payment_status !== order.payment_status) {
      (async () => {
        let emailConn;
        try {
          emailConn = await database.getConnection();

          const [updatedOrder, items, address, couponRows] = await Promise.all([
            emailConn.queryOne(`SELECT * FROM orders WHERE id = ?`, [order_id]),
            emailConn.query(`SELECT * FROM order_items WHERE order_id = ?`, [order_id]),
            emailConn.queryOne(`SELECT * FROM order_addresses WHERE order_id = ?`, [order_id]),
            emailConn.query(`SELECT discount_amount FROM order_coupons WHERE order_id = ?`, [order_id])
          ]);

          const formatBDT = (amount) => `BDT ${Number(amount || 0).toLocaleString('en-BD')}`;

          // Determine the context status for the template
          let emailStatus = "success";
          if (new_payment_status === 'unpaid') emailStatus = "failed";
          if (new_payment_status === 'partial_paid') emailStatus = "partial";

          // Derive itemized discounts
          const couponDiscountTotal = couponRows.reduce((sum, c) => sum + Number(c.discount_amount ?? 0), 0);
          const rawSkuDiscount   = Number(updatedOrder.sku_discount_total ?? 0);
          const rawDiscountTotal = Number(updatedOrder.discount_total ?? 0);
          const skuDiscountTotal = rawSkuDiscount > 0
            ? rawSkuDiscount
            : Math.max(0, rawDiscountTotal - couponDiscountTotal);
          const bulkDiscountTotal  = Number(updatedOrder.bulk_discount_total  ?? 0);
          const comboDiscountTotal = Number(updatedOrder.combo_discount_total ?? 0);
          const cartWideDiscount   = Number(updatedOrder.cart_wide_discount   ?? 0);
          const weightExtraCharge  = Number(updatedOrder.weight_extra_charge  ?? 0);
          const totalWeightKg      = Number(updatedOrder.weight_kg_total      ?? 0);

          const orderContext = {
            id: updatedOrder.id,
            date: new Date(updatedOrder.placed_at).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
            }),
            status: updatedOrder.order_status,
            payment_method: updatedOrder.payment_type.toUpperCase(),
            current_order_payment_status: updatedOrder.payment_status.replace('_', ' ').toUpperCase(),
            paid_amount: formatBDT(updatedOrder.paid_amount),
            due_amount: formatBDT(updatedOrder.due_amount),
            shipping_address: address ? `${address.full_address}, ${address.city}` : "N/A",
            track_url: `${SHOP_URL}/account/my-order/${updatedOrder.id}`,
            subtotal: formatBDT(updatedOrder.subtotal),
            shipping_fee: formatBDT(updatedOrder.delivery_charge),
            weight_surcharge: weightExtraCharge  > 0 ? formatBDT(weightExtraCharge)  : null,
            weight_kg:        totalWeightKg      > 0 ? Number(totalWeightKg.toFixed(3)) : null,
            discount:         skuDiscountTotal   > 0 ? formatBDT(skuDiscountTotal)   : null,
            bulk_discount:    bulkDiscountTotal  > 0 ? formatBDT(bulkDiscountTotal)  : null,
            combo_discount:   comboDiscountTotal > 0 ? formatBDT(comboDiscountTotal) : null,
            cart_wide_discount: cartWideDiscount > 0 ? formatBDT(cartWideDiscount)  : null,
            coupon_discount:  couponDiscountTotal > 0 ? formatBDT(couponDiscountTotal) : null,
            total: formatBDT(updatedOrder.grand_total),
            items: items.map(item => ({
              name: item.product_name,
              variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
              sku: item.product_sku_id,
              qty: item.quantity,
              price: formatBDT(item.final_unit_price),
              subtotal: formatBDT(item.line_total)
            }))
          };

          await sendPaymentMail(emailConn, {
            name: updatedOrder.customer_name,
            email: updatedOrder.customer_email || "User",
            order: orderContext,
            status: emailStatus
          });

        } catch (err) {
          console.error("Manual Payment Update Email Error:", err);
        } finally {
          if (emailConn) await emailConn.release();
        }
      })();
    }


    bumpOrderEventVersion();
    return {
      success: true,
      message: "Payment status updated successfully",
      data: {
        order_id,
        payment_status: new_payment_status,
        paid_amount: recalculatedPaid,
        due_amount: recalculatedDue,
        added_to_total_spent: deltaPaid,
        force_settled: isForceSettle
      }
    };
  })
);


exports.updateOrderStatus = api(
  {
    params: { order_id: { type: "int", required: true } },
    body: {
      new_status: { type: "string", required: true },
      note: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const { order_id } = req.typed.params;
    const { new_status, note } = req.typed.body;

    const ALLOWED_STATUSES = [
      'new', 'approved', 'processing', 'packaging',
      'shipped', 'out_for_delivery', 'delivered',
      'returned', 'cancelled', 'on_hold', 'trash'
    ];
    if (!ALLOWED_STATUSES.includes(new_status)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid order status");
    }

    // `processing` is the dispatch entry point and should come from dispatch APIs.
    const DISPATCH_MANAGED_STATUSES = ['processing'];
    if (DISPATCH_MANAGED_STATUSES.includes(new_status)) {
      throw new errors.BAD_REQUEST(
        `Status "${new_status}" must be updated through dispatch flow`
      );
    }

    /** 2️⃣ Lock order */
    const order = await connection.queryOne(
      `SELECT * FROM orders WHERE id = ? FOR UPDATE`,
      [order_id]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found");

    const oldStatus = order.order_status;
    if (oldStatus === new_status) {
      return {
        success: true,
        message: "Order status unchanged",
        data: { order_id, status: oldStatus }
      };
    }

    /** 3️⃣ Transition validation */
    const FLOW = ['new', 'approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'];
    const oldFlowIndex = FLOW.indexOf(oldStatus);
    const newFlowIndex = FLOW.indexOf(new_status);
    const isForwardFlow =
      oldFlowIndex !== -1 &&
      newFlowIndex !== -1 &&
      newFlowIndex === oldFlowIndex + 1;

    const isAllowed =
      isForwardFlow ||
      new_status === 'on_hold' ||
      oldStatus === 'on_hold' ||
      (oldStatus === 'delivered' && new_status === 'returned') ||
      (new_status === 'cancelled' && oldStatus !== 'delivered') ||
      new_status === 'trash';

    if (!isAllowed) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `Invalid status transition from ${oldStatus} to ${new_status}`
      );
    }

    /** 4️⃣ Timestamp mapping */
    const timestampColumns = {
      shipped: 'shipped_at',
      delivered: 'delivered_at',
      cancelled: 'cancelled_at'
    };

    const updateTimestamps = {};
    if (timestampColumns[new_status]) {
      updateTimestamps[timestampColumns[new_status]] = new Date();
    }

    /** 5️⃣ Adjust financials if cancelled/returned/trash */
    let deltaTotalSpent = 0;
    let updatedPaidAmount = order.paid_amount;
    let updatedDueAmount = order.due_amount;
    const originalPaidAmount = Number(order.paid_amount ?? 0);
    let refundCreatedId = null;

    if (['returned', 'cancelled', 'trash'].includes(new_status) && originalPaidAmount > 0) {
      deltaTotalSpent = -originalPaidAmount;
      updatedPaidAmount = 0;
      updatedDueAmount = order.grand_total;

      if (order.customer_id) {
        await connection.query(
          `UPDATE users SET total_spent = total_spent + ? WHERE id = ?`,
          [deltaTotalSpent, order.customer_id]
        );
      }

      // Auto-create a pending refund entry so admin can track it
      try {
        const refundNote = `Auto-created: order #${order_id} cancelled from '${oldStatus}' status. Customer had paid ${originalPaidAmount}.`;
        const refundResult = await connection.query(
          `INSERT INTO order_refunds
             (order_id, refund_method, refund_amount, note, refunded_by_admin, status, created_at)
           VALUES (?, 'cash', ?, ?, ?, 'pending', NOW())`,
          [order_id, originalPaidAmount, refundNote, adminInfo.id]
        );
        refundCreatedId = refundResult.insertId;
      } catch (e) {
        console.error('[updateOrderStatus] Failed to auto-create refund entry:', e.message);
      }
    }

    /** 6️⃣ Update order */
    const updateFields = ['order_status = ?', 'paid_amount = ?', 'due_amount = ?'];
    const updateValues = [new_status, updatedPaidAmount, updatedDueAmount];

    for (const [col, val] of Object.entries(updateTimestamps)) {
      updateFields.push(`${col} = ?`);
      updateValues.push(val);
    }

    await connection.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, order_id]
    );

    /** 7️⃣ Adjust stock for approved/cancelled/returned/trash */
    if (['approved'].includes(new_status) && !['approved'].includes(oldStatus)) {
      // Deduct stock
      await connection.query(
        `UPDATE product_skus sku
         JOIN order_items item ON sku.id = item.product_sku_id
         SET sku.stock = GREATEST(sku.stock - item.quantity, 0),
             item.stock_adjusted = 1
         WHERE item.order_id = ? AND item.stock_adjusted = 0`,
        [order_id]
      );
    }

    if (['cancelled', 'returned', 'trash'].includes(new_status)) {
      // Restock all items where stock was actually deducted.
      // stock_adjusted = 1 is set only when stock was reserved (at 'approved').
      // This safely handles: on_hold → cancelled, delivered → returned, etc.
      await connection.query(
        `UPDATE product_skus sku
         JOIN order_items item ON sku.id = item.product_sku_id
         SET sku.stock = sku.stock + item.quantity,
             item.stock_adjusted = 0
         WHERE item.order_id = ? AND item.stock_adjusted = 1`,
        [order_id]
      );
    }

    /** 8️⃣ Insert status history */
    await connection.query(
      `INSERT INTO order_status_history
       (order_id, old_status, new_status, changed_by_admin, note)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, oldStatus, new_status, adminInfo.id, note || null]
    );

    /** 9️⃣ Admin audit log */
    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'CHANGE_ORDER_STATUS', 'order', ?, ?)`,
      [adminInfo.id, order_id, JSON.stringify({ old_status: oldStatus, new_status, note })]
    );




    // /** 🔟 Status-Specific Email Notification */
    // if (['approved', 'cancelled'].includes(new_status)) {

    //   // 1. Fetch necessary details for the email context
    //   const [items, address] = await Promise.all([
    //     connection.query(
    //       `SELECT * FROM order_items WHERE order_id = ?`,
    //       [order_id]
    //     ),
    //     connection.queryOne(
    //       `SELECT * FROM order_addresses WHERE order_id = ?`,
    //       [order_id]
    //     )
    //   ]);

    //   // 2. Formatting Helpers
    //   const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
    //   const orderDateText = new Date(order.placed_at).toLocaleString('en-GB', {
    //     day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    //   });

    //   // 3. Map items to context format
    //   const emailItems = items.map(item => ({
    //     name: item.product_name,
    //     variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
    //     sku: item.product_sku_id, // Or join with product_skus table if you need the string SKU
    //     qty: item.quantity,
    //    unite_selling_price: formatBDT(item.rawUnitPrice),
    //   unite_discount: formatBDT(item.skuDiscount),
    //   final_unite_price: formatBDT(item.finalUnitPrice),
    //   line_total: formatBDT(item.lineTotal)
    //   }));

    //   // 4. Build Context
    //   const orderContext = {
    //     id: order_id,
    //     date: orderDateText,
    //     status: new_status,
    //     payment_method: order.payment_type === 'cod' ? "Cash on Delivery" : "Online Payment",
    //     shipping_address: `${address.full_address}, ${address.city}`,
    //     track_url: `${SHOP_URL}account/my-order/${order_id}`,
    //     // Update with your actual domain
    //     subtotal: formatBDT(order.subtotal),
    //     shipping_fee: formatBDT(order.delivery_charge),
    //      coupon_discount: formatBDT(couponDiscountTotal),
    //     discount: formatBDT(order.discount_total),
    //     total: formatBDT(order.grand_total),
    //     items: emailItems
    //   };

    //   // 5. Send Email
    //   // Note: ensure 'sendUpdateOrderMail' (or similar) is defined to handle status changes
    //   await sendOrdermail(connection, {
    //     name: order.customer_name || "Customer",
    //     email: order.customer_email,
    //     order: orderContext

    //   });


    // }





    /** 🔟 Customer Notification — Email + SMS + Push (non-blocking, V2-035) */
    sendCustomerOrderNotification(connection, order_id, new_status);

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order status updated successfully",
      data: {
        order_id,
        old_status: oldStatus,
        new_status,
        updated_paid_amount: updatedPaidAmount,
        updated_due_amount: updatedDueAmount,
        delta_total_spent: deltaTotalSpent,
        updated_timestamps: updateTimestamps,
        // Refund info — present when the order was cancelled/returned and customer had paid
        refund_suggested: refundCreatedId !== null,
        refund_id: refundCreatedId,
        refund_amount: refundCreatedId !== null ? originalPaidAmount : null
      }
    };
  })
);


exports.cancelOrderByUser = api(
  {
    params: {
      order_id: { type: "int", required: true }
    },
    body: {
      reason: { type: "string", required: false }
    }
  },
  userAuth(async (req, connection, userInfo) => {



    const { order_id } = req.typed.params;
    const { reason } = req.typed.body;

    /** 2️⃣ Lock order */
    const order = await connection.queryOne(
      `SELECT *
       FROM orders
       WHERE id = ?
         AND customer_id = ? AND deleted_at IS NULL
       FOR UPDATE`,
      [order_id, userInfo.id]
    );

    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    if (order.order_status == 'cancelled') throw new errors.BAD_REQUEST("Order is already cancelled")

    /** 3️⃣ Validate strict cancel rule */
    if (order.order_status !== 'new' || order.payment_status !== 'unpaid') {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Order can only be cancelled when status is new and payment is unpaid"
      );
    }

    /** 4️⃣ Cancel order */
    await connection.query(
      `UPDATE orders
       SET order_status = 'cancelled',
           cancelled_at = ?
       WHERE id = ?`,
      [new Date(), order_id]
    );

    /** 5️⃣ Status history */
    await connection.query(
      `INSERT INTO order_status_history
       (order_id, old_status, new_status, note)
       VALUES (?, 'new', 'cancelled', ?)`,
      [
        order_id,
        reason || 'Cancelled by user'
      ]
    );



    // 1. Fetch items and address snapshot for this specific order
    const [items, address] = await Promise.all([
      connection.query(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order_id]
      ),
      connection.queryOne(
        `SELECT * FROM order_addresses WHERE order_id = ?`,
        [order_id]
      )
    ]);

    // 2. Formatting Helpers
    const formatBDT = (amount) => `BDT ${Number(amount).toLocaleString('en-BD')}`;
    const orderDateText = new Date(order.placed_at).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    // 3. Map items to email context
    const emailItems = items.map(item => ({
      name: item.product_name,
      variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || "Default",
      sku: item.product_sku_id,
      qty: item.quantity,
      price: formatBDT(item.final_unit_price),
      subtotal: formatBDT(item.line_total)
    }));

    // 4. Build Context (Matching your .handlebars requirements)
    const orderContext = {
      id: order_id,
      date: orderDateText,
      status: "cancelled", // Must be lowercase for the 'eq' helper to match in template
      payment_method: order.payment_type === 'cod' ? "Cash on Delivery" : "Online Payment",
      shipping_address: address ? `${address.full_address}, ${address.city}` : "N/A",

      track_url: `${SHOP_URL}account/my-order/${order_id}`,
      subtotal: formatBDT(order.subtotal),
      shipping_fee: formatBDT(order.delivery_charge),
      discount: formatBDT(order.discount_total),
      total: formatBDT(order.grand_total),
      items: emailItems
    };

    // 5. Execute Mailer
    await sendOrdermail(connection, {
      name: `${userInfo.first_name} ${userInfo.last_name}`.trim() || "Customer",
      email: userInfo.email,
      order: orderContext
    });



    // ─── User Audit Log ───────────────────────────────────────────────
    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action, ip_address, old_values, new_values)
       VALUES (?, 'CANCEL_ORDER', ?, ?, ?)`,
      [
        userInfo.id,
        req.ip || null,
        JSON.stringify({ order_status: "new", order_id }),
        JSON.stringify({ order_status: "cancelled", reason: reason || null })
      ]
    );

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order cancelled successfully",

      data: {
        order_id,
        old_status: "new",
        new_status: "cancelled"
      }
    };
  })
);




exports.dispatchOrder = api(
  {
    params: {
      orderId: { type: "int", required: true }
    },
    body: {
      courier_provider: { type: "string", required: true }, // steadfast | redx | pathao | paperfly
      weight: { type: "float", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { orderId } = req.typed.params;
    const { courier_provider, weight } = req.typed.body;

    console.log(`[dispatch] orderId=${orderId} courier=${courier_provider} weight=${weight} (type=${typeof weight})`);
    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }


    if (!["paperfly", "redx", "pathao", "steadfast"].includes(courier_provider)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid provider")

    /* ── Per-courier weight limits ──────────────────────────────────
       Pathao:    0.001 – 200 kg  (hard API limit, confirmed from 422 error)
       Steadfast: no documented max  (billed per tier; DB cap 999,999.99)
       Others:    200 kg safe default
    ──────────────────────────────────────────────────────────────── */
    if (weight != null) {
      if (!Number.isFinite(weight) || weight <= 0) {
        throw new errors.BAD_REQUEST("Please enter a valid weight in kg (e.g. 1.5).");
      }
      const COURIER_MAX_WEIGHT = {
        pathao:    200,    // Pathao hard API cap
        steadfast: 999999, // No hard cap — DB DECIMAL(8,2) ceiling only
        redx:      200,
        paperfly:  200,
      };
      const maxWeight = COURIER_MAX_WEIGHT[courier_provider] ?? 200;
      if (weight > maxWeight) {
        const limitLabel = maxWeight >= 999999 ? "no hard limit" : `${maxWeight} kg`;
        throw new errors.BAD_REQUEST(
          `Weight ${weight} kg exceeds the maximum limit for ${courier_provider} (${limitLabel}). Please enter a realistic parcel weight.`
        );
      }
    }

    const autoStatus = await getAvailableAutoCouriers(connection, true);

    const providerStatus = autoStatus.available_providers.find(
      p => p.provider === courier_provider
    );

    if (!providerStatus || providerStatus.is_auto_available !== 1) {
      throw new errors.BAD_REQUEST(
        `Courier ${courier_provider} is not available for auto dispatch`
      );
    }


    /* -------------------- 1️⃣ Load order + address -------------------- */
    const order = await connection.queryOne(
      `
      SELECT 
        o.*,
        oa.full_address,
        oa.city,
        oa.location_mapping_id,
        COALESCE(lm.pathao_city_id, lm2.pathao_city_id) AS pathao_city_id,
        COALESCE(lm.pathao_zone_id, lm2.pathao_zone_id) AS pathao_zone_id,
        COALESCE(lm.pathao_area_id, lm2.pathao_area_id) AS pathao_area_id,
        COALESCE(lm.steadfast_id,   lm3.steadfast_id)   AS steadfast_id
      FROM orders o
      JOIN order_addresses oa ON oa.order_id = o.id
      -- Primary: FK lookup
      LEFT JOIN location_mappings lm ON oa.location_mapping_id IS NOT NULL AND lm.id = oa.location_mapping_id
      -- Fallback for Pathao: text match on area/city when FK row has no pathao IDs
      LEFT JOIN location_mappings lm2 ON lm.pathao_city_id IS NULL
        AND lm2.pathao_city_id IS NOT NULL
        AND (lm2.area_name = oa.city OR lm2.city_name = oa.city)
      -- Fallback for Steadfast: text match on city_name when FK row has no steadfast_id
      LEFT JOIN location_mappings lm3 ON COALESCE(lm.steadfast_id, 0) = 0
        AND lm3.steadfast_id IS NOT NULL
        AND lm3.city_name = SUBSTRING_INDEX(oa.city, ' ', 1)
      WHERE o.id = ? AND o.deleted_at IS NULL
      LIMIT 1
      `,
      [orderId]
    );
    // return {order}
    if (!order) throw new errors.NOT_FOUND("Order not found");

    const status = order.order_status;

    const ALLOWED_STATUS = ["approved", "packaging"];

    const ALREADY_DISPATCHED = [
      "processing",
      "packaging",
      "shipped",
      "out_for_delivery",
      "delivered"
    ];

    const TERMINAL_STATUS = [
      "returned",
      "cancelled",
      "trash"
    ];

    const BLOCKED_STATUS = [
      "new",
      "on_hold"
    ];

    if (ALLOWED_STATUS.includes(status)) {
      // ✅ ok, continue
    }
    else if (ALREADY_DISPATCHED.includes(status)) {
      throw new errors.BAD_REQUEST(
        `Order is already ${status.replace(/_/g, " ")}`
      );
    }
    else if (TERMINAL_STATUS.includes(status)) {
      throw new errors.BAD_REQUEST(
        `Order is ${status.replace(/_/g, " ")} and cannot be dispatched`
      );
    }
    else if (BLOCKED_STATUS.includes(status)) {
      throw new errors.BAD_REQUEST(
        `Order must be approved before dispatch`
      );
    }
    else {
      throw new errors.BAD_REQUEST(
        `Order is in invalid state: ${status}`
      );
    }


    /* -------------------- COD advance payment check -------------------- */
    /* -------------------- COD Advance Enforcement -------------------- */
    let codAdvanceRequired = false;

    if (order.payment_type === "cod") {
      const advanceCfg = await connection.queryOne(
        `
        SELECT is_active, value
        FROM system_config
        WHERE service = 'payment'
          AND provider = 'cod'
          AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
        LIMIT 1
        `
      );

      const codAdvanceStatus = Number(advanceCfg?.is_active) === 1;
      const codAdvancePercent = Number(advanceCfg?.value) || 0;

      codAdvanceRequired = codAdvanceStatus && codAdvancePercent > 0;
    }

    /* ❌ Block dispatch if COD advance required but unpaid */
    if (
      order.payment_type === "cod" &&
      codAdvanceRequired &&
      order.payment_status === "unpaid"
    ) {
      throw new errors.BAD_REQUEST(
        "COD advance payment is required before dispatch"
      );
    }




    /* -------------------- 3️⃣ Load courier configs (GROUPED) -------------------- */
    const cfgRows = await getConfig(connection, true, "courier");

    const configs = {};
    for (const row of cfgRows) {
      if (!row.provider) continue;
      if (!configs[row.provider]) configs[row.provider] = {};
      configs[row.provider][row.key_name] = row.value;
    }

    /* -------------------- 4️⃣ Dispatch -------------------- */
    if (!configs[courier_provider] || Object.keys(configs[courier_provider]).length === 0) {
      throw new errors.BAD_REQUEST(`Courier ${courier_provider} configuration is missing � set credentials in Admin � Settings � Couriers.`);
    }
    const dispatchResult = await dispatchToCourier(
      courier_provider,
      order,
      configs,
      weight
    );

    /* -------------------- 5️⃣ Save courier info -------------------- */
    const safeWeight = (weight != null && Number.isFinite(Number(weight))) ? Number(weight) : null;
    const safeRaw    = JSON.stringify(dispatchResult.raw || {});
    const courierParams = [
      1,
      courier_provider,
      dispatchResult.tracking_number ?? null,
      dispatchResult.memo != null ? String(dispatchResult.memo) : null,
      safeWeight,
      dispatchResult.reference_id != null ? String(dispatchResult.reference_id) : null,
      safeRaw,
      orderId
    ];

    try {
      await connection.query(
        `
  UPDATE order_couriers
  SET
    is_auto_available = ?,
    type = 'auto',
    courier_provider = ?,
    tracking_number = COALESCE(?, tracking_number),
    memo = COALESCE(?, memo),
    weight = COALESCE(?, weight),
    reference_id = COALESCE(?, reference_id),
    raw_response = COALESCE(?, raw_response)
  WHERE order_id = ?
  `,
        courierParams
      );
    } catch (dbErr) {
      console.error('[dispatch] order_couriers UPDATE failed:', dbErr.message);
      console.error('[dispatch] params:', JSON.stringify({
        courier_provider, tracking: dispatchResult.tracking_number,
        memo: dispatchResult.memo, weight: safeWeight,
        reference_id: dispatchResult.reference_id, order_id: orderId
      }));
      throw dbErr;
    }

    console.log(`[dispatch] order_couriers updated for order=${orderId} weight_saved=${safeWeight}`);

    /* -------------------- 6️⃣ Update order status -------------------- */
    await connection.query(
      `
      UPDATE orders
      SET order_status = 'processing' 
      WHERE id = ?
      `,
      [orderId]
    );



    /** 6️⃣ Insert status history */
    await connection.query(
      `
        INSERT INTO order_status_history
        (
          order_id,
          old_status,
          new_status, 
          changed_by_admin,
          note
        )
        VALUES (?, ?, ?,  ?, ?)
        `,
      [
        orderId,
        order.order_status,
        "processing",            // aligns with orders.order_status update above
        adminInfo.id,      // ✅ admin FK
        null
      ]
    );

    /** 7️⃣ Admin audit log */
    await connection.query(
      `
        INSERT INTO admin_audit_logs
        (admin_id, action, resource, resource_id, meta)
        VALUES (?, 'DISPATCH_ORDER', 'order', ?, ?)
        `,
      [
        adminInfo.id,
        orderId,
        JSON.stringify(req.typed)
      ]
    );

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order dispatched successfully",
      courier: courier_provider,
      tracking_number: dispatchResult.tracking_number,
      response: dispatchResult
    };
  })
);






exports.manualDispatchOrder = api(
  {
    params: {
      orderId: { type: "int", required: true }
    },
    body: {
      courier_provider: { type: "string", required: true }, // steadfast | redx | pathao | paperfly | others
      tracking_number: { type: "string", required: false },
      reference_id: { type: "string", required: false },
      memo: { type: "string", required: false },
      weight: { type: "number", required: false } // kg
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { orderId } = req.typed.params;

    const {
      courier_provider,
      tracking_number = null,
      reference_id = null,
      memo = null,
      weight = null
    } = req.typed.body;

    /* -------------------- 1️⃣ Authorization -------------------- */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }



    const courierActive = await connection.queryOne(
      `
  SELECT 1
  FROM system_config
  WHERE service = 'courier'
    AND provider = ?
    AND is_active = 1
  LIMIT 1
  `,
      [courier_provider]
    );

    if (!courierActive) {
      throw new errors.BAD_REQUEST(
        `Courier provider "${courier_provider}" is not active`
      );
    }



    /* -------------------- 2️⃣ Load order -------------------- */
    const order = await connection.queryOne(
      `
      SELECT *
      FROM orders
      WHERE id = ? AND deleted_at IS NULL
      `,
      [orderId]
    );

    if (!order) throw new errors.NOT_FOUND("Order not found");

    /* -------------------- 3️⃣ Status validation -------------------- */
    const status = order.order_status;

    const ALLOWED_STATUS = ["approved", "packaging"];

    const ALREADY_DISPATCHED = [
      "processing",
      "packaging",
      "shipped",
      "out_for_delivery",
      "delivered"
    ];

    const TERMINAL_STATUS = [
      "returned",
      "cancelled",
      "trash"
    ];

    const BLOCKED_STATUS = [
      "new",
      "on_hold"
    ];

    if (ALLOWED_STATUS.includes(status)) {
      // ok
    } else if (ALREADY_DISPATCHED.includes(status)) {
      throw new errors.BAD_REQUEST(
        `Order is already ${status.replace(/_/g, " ")}`
      );
    } else if (TERMINAL_STATUS.includes(status)) {
      throw new errors.BAD_REQUEST(
        `Order is ${status.replace(/_/g, " ")} and cannot be dispatched`
      );
    } else if (BLOCKED_STATUS.includes(status)) {
      throw new errors.BAD_REQUEST(
        "Order must be approved before dispatch"
      );
    } else {
      throw new errors.BAD_REQUEST(
        `Order is in invalid state: ${status}`
      );
    }

    /* -------------------- 4️⃣ COD Advance Enforcement -------------------- */
    let codAdvanceRequired = false;

    if (order.payment_type === "cod") {
      const advanceCfg = await connection.queryOne(
        `
        SELECT is_active, value
        FROM system_config
        WHERE service = 'payment'
          AND provider = 'cod'
          AND key_name = 'MIN_ADVANCE_PAYMENT_PERCENTAGE'
        LIMIT 1
        `
      );

      const codAdvanceStatus = Number(advanceCfg?.is_active) === 1;
      const codAdvancePercent = Number(advanceCfg?.value) || 0;

      codAdvanceRequired = codAdvanceStatus && codAdvancePercent > 0;
    }

    if (
      order.payment_type === "cod" &&
      codAdvanceRequired &&
      order.payment_status === "unpaid"
    ) {
      throw new errors.BAD_REQUEST(
        "COD advance payment is required before dispatch"
      );
    }

    /* -------------------- 5️⃣ Ensure courier row exists -------------------- */
    const courierRow = await connection.queryOne(
      `SELECT id FROM order_couriers WHERE order_id = ?`,
      [orderId]
    );

    if (!courierRow) {
      throw new errors.BAD_REQUEST(
        "Courier record does not exist for this order"
      );
    }

    /* -------------------- 6️⃣ UPDATE courier (NO INSERT) -------------------- */
    await connection.query(
      `
  UPDATE order_couriers
  SET
    is_auto_available = 0,
    type = 'manual',
    courier_provider = ?,              
    tracking_number = COALESCE(?, tracking_number),
    memo = COALESCE(?, memo),
    reference_id = COALESCE(?, reference_id),
    weight = COALESCE(?, weight),
    raw_response = NULL 
  WHERE order_id = ?
  `,
      [
        courier_provider,
        tracking_number,
        memo,
        reference_id,
        weight,
        orderId
      ]
    );


    /* -------------------- 7️⃣ Update order status -------------------- */
    await connection.query(
      `
      UPDATE orders
      SET
        order_status = 'processing' 
      WHERE id = ?
      `,
      [orderId]
    );

    /* -------------------- 8️⃣ Status history -------------------- */
    await connection.query(
      `
      INSERT INTO order_status_history
      (
        order_id,
        old_status,
        new_status,
        changed_by_admin,
        note
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        orderId,
        order.order_status,
        "processing",
        adminInfo.id,
        "Manual dispatch"
      ]
    );

    /* -------------------- 9️⃣ Admin audit log -------------------- */
    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (
        admin_id,
        action,
        resource,
        resource_id,
        meta
      )
      VALUES (?, 'MANUAL_DISPATCH_ORDER', 'order', ?, ?)
      `,
      [
        adminInfo.id,
        orderId,
        JSON.stringify(req.typed)
      ]
    );

    return {
      success: true,
      message: "Order manually dispatched successfully",
      courier: courier_provider,
      tracking_number,
      reference_id,
      memo,
      weight
    };
  })
);

exports.getCourierBalance = api(
  {
    params: { provider: { type: "string", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    /* -------------------- 1️⃣ Authorization -------------------- */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }
    const { provider } = req.typed.params;
    const rows = await getConfig(connection, false, "courier");

    // Map database rows to a clean config object for the specific provider
    const providerConfig = {};
    let isActive = false;
    for (const row of rows) {
      if (row.provider?.toLowerCase() === provider.toLowerCase()) {
        providerConfig[row.key_name] = row.value;
        // If any record for this provider is active, we treat the provider as active
        if (Boolean(row.is_active)) isActive = true;
      }
    }

    if (Object.keys(providerConfig).length === 0) {
      throw new errors.BAD_REQUEST(`Provider '${provider}' not found in configuration.`);
    }

    if (!isActive) {
      throw new errors.BAD_REQUEST(`Provider '${provider}' is disabled.`);
    }
    let result;
    switch (provider.toLowerCase()) {
      case "steadfast":
        result = await getSteadfastBalance(providerConfig);
        break;
      case "redx":
        result = await getRedxBalance(providerConfig);
        break;
      case "pathao":
        result = await getPathaoBalance(providerConfig);
        break;
      case "paperfly":
        result = await getPaperflyBalance(providerConfig);
        break;
      default:
        throw new errors.BAD_REQUEST(`Balance API not implemented for ${provider}`);
    }

    return {
      provider,
      balance: result.balance,
      currency: "BDT",
      timestamp: new Date()
    };
  })
);



exports.trackOrderCourier = api(
  {
    params: {
      order_id: { type: "number", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { order_id } = req.typed.params;


    /* -------------------- 1️⃣ Authorization -------------------- */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }
    // 1. Get Order & Courier details
    const [orderCourier] = await connection.query(
      `SELECT oc.*, o.order_status, o.customer_name 
             FROM order_couriers oc
             JOIN orders o ON oc.order_id = o.id
             WHERE oc.order_id = ? LIMIT 1`,
      [order_id]
    );

    if (!orderCourier) throw new errors.NOT_FOUND("Courier record not found for this order.");
    if (!orderCourier.tracking_number) throw new errors.BAD_REQUEST("Tracking number not assigned yet.");

    const provider = orderCourier.courier_provider;

    // 2. Fetch Provider Config
    const rows = await getConfig(connection, false, "courier");
    const providerConfig = {};
    for (const row of rows) {
      if (row.provider?.toLowerCase() === provider.toLowerCase()) {
        providerConfig[row.key_name] = row.value;
      }
    }

    // 3. Call External API based on provider
    let trackingResult;
    const trackingNo = orderCourier.tracking_number;

    // Inside exports.trackOrderCourier switch statement:

    switch (provider.toLowerCase()) {
      case "steadfast":
        trackingResult = await getSteadfastStatus(providerConfig, trackingNo);
        break;
      case "redx":
        trackingResult = await getRedxStatus(providerConfig, trackingNo);
        break;
      case "pathao":
        trackingResult = await getPathaoStatus(providerConfig, trackingNo);
        break;
      case "paperfly":
        trackingResult = await getPaperflyStatus(providerConfig, trackingNo);
        break;
      default:
        throw new errors.BAD_REQUEST(`Tracking not yet implemented for ${provider}`);
    }

    // 4. Return unified response
    return {
      order_id: order_id,
      customer: orderCourier.customer_name,
      provider: provider,
      tracking_number: trackingNo,
      current_internal_status: orderCourier.order_status,
      courier_live_status: trackingResult.raw_status,
      last_updated: trackingResult.updated_at,
      raw_response: trackingResult
    };
  })
);


// ─── Sync Courier Status (on-demand, updates DB) ──────────────────────────────
// Called from admin order editor when admin clicks "Sync Status from Courier".
// Unlike trackOrderCourier (read-only), this actually updates order_status + history.
exports.syncCourierStatus = api(
  {
    params: {
      orderId: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const { orderId } = req.typed.params;

    // 1. Load order + courier row
    const courierRow = await connection.queryOne(
      `SELECT oc.*, o.order_status, o.customer_name
       FROM order_couriers oc
       JOIN orders o ON oc.order_id = o.id
       WHERE oc.order_id = ? LIMIT 1`,
      [orderId]
    );

    if (!courierRow) throw new errors.NOT_FOUND("Courier record not found.");
    if (!courierRow.tracking_number) throw new errors.BAD_REQUEST("No tracking number assigned yet.");

    const provider = (courierRow.courier_provider || "").toLowerCase();
    const trackingNo = courierRow.tracking_number;
    const currentStatus = courierRow.order_status;

    // Skip if already in a terminal state
    const TERMINAL = ["delivered", "returned", "cancelled", "trash"];
    if (TERMINAL.includes(currentStatus)) {
      return {
        success: true,
        updated: false,
        message: `Order is already in terminal state: ${currentStatus}`,
        current_status: currentStatus
      };
    }

    // 2. Load provider config
    const configRows = await getConfig(connection, false, "courier");
    const providerConfig = {};
    for (const row of configRows) {
      if (row.provider?.toLowerCase() === provider) {
        providerConfig[row.key_name] = row.value;
      }
    }

    // 3. Fetch live status from courier
    let trackingResult;
    switch (provider) {
      case "steadfast":  trackingResult = await getSteadfastStatus(providerConfig, trackingNo);  break;
      case "redx":       trackingResult = await getRedxStatus(providerConfig, trackingNo);       break;
      case "pathao":     trackingResult = await getPathaoStatus(providerConfig, trackingNo);     break;
      case "paperfly":   trackingResult = await getPaperflyStatus(providerConfig, trackingNo);   break;
      default:
        throw new errors.BAD_REQUEST(`Sync not supported for provider: ${provider}`);
    }

    const rawStatus = (trackingResult.raw_status || "").toLowerCase();

    // 4. Map courier status → internal status (same as webhook mappings)
    function mapStatus(s) {
      if (["delivered", "partial_delivered"].includes(s)) return "delivered";
      if (s === "returned")            return "returned";
      if (s === "cancelled")           return "cancelled";
      if (s === "out_for_delivery")    return "out_for_delivery";
      if (["in_transit", "sorting", "picked_up", "pickup_in_progress",
           "at_sorting_hub", "received_at_hub", "pickup.done"].includes(s)) return "shipped";
      return null;
    }

    const mappedStatus = mapStatus(rawStatus);

    // 5. Update DB if status changed
    let updated = false;
    if (mappedStatus && mappedStatus !== currentStatus && !TERMINAL.includes(currentStatus)) {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE orders SET order_status = ? WHERE id = ?`,
        [mappedStatus, orderId]
      );
      await connection.query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_admin, note, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [orderId, currentStatus, mappedStatus, adminInfo.id, `[manual-sync:${provider}] raw=${rawStatus}`]
      );
      await connection.commit();
      updated = true;
    }

    if (updated) bumpOrderEventVersion();
    return {
      success: true,
      updated,
      courier_raw_status: rawStatus,
      previous_status: currentStatus,
      new_status: updated ? mappedStatus : currentStatus,
      message: updated
        ? `Status updated: ${currentStatus} → ${mappedStatus}`
        : `No change — courier says "${rawStatus}", internal already "${currentStatus}"`
    };
  })
);



// ─── Bulk Sync All Courier Statuses ──────────────────────────────────────────
// Called from admin orders list "Sync All" button.
// Optimized: single DB read, concurrent API calls (pool of 10), single bulk UPDATE.
exports.bulkSyncCourierStatus = api(
  {},
  auth(async (_req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const TERMINAL = ["delivered", "returned", "cancelled", "trash"];
    const ACTIVE_STATUSES = ["shipped", "out_for_delivery", "processing"];
    const MAX_ORDERS = 100;
    const CONCURRENCY = 10;

    // 1. Single query: all active orders with a tracking number
    const orders = await connection.query(
      `SELECT oc.order_id, oc.tracking_number, oc.courier_provider, o.order_status
       FROM order_couriers oc
       JOIN orders o ON oc.order_id = o.id
       WHERE o.order_status IN (?)
         AND oc.tracking_number IS NOT NULL
         AND oc.tracking_number != ''
         AND o.deleted_at IS NULL
       LIMIT ?`,
      [ACTIVE_STATUSES, MAX_ORDERS]
    );

    if (!orders.length) {
      return { success: true, checked: 0, updated: 0, errors: 0, message: "No active orders to sync" };
    }

    // 2. Load all courier configs in one query
    const configRows = await getConfig(connection, false, "courier");
    const providerConfigs = {};
    for (const row of configRows) {
      if (!row.provider) continue;
      if (!providerConfigs[row.provider.toLowerCase()]) providerConfigs[row.provider.toLowerCase()] = {};
      providerConfigs[row.provider.toLowerCase()][row.key_name] = row.value;
    }

    // 3. Status mapping (same as webhook)
    function mapStatus(s) {
      const e = (s || "").toLowerCase().trim();
      if (["delivered", "partial_delivered"].includes(e)) return "delivered";
      if (e === "returned")          return "returned";
      if (e === "cancelled")         return "cancelled";
      if (e === "out_for_delivery")  return "out_for_delivery";
      if (["in_transit", "sorting", "picked_up", "pickup_in_progress",
           "at_sorting_hub", "received_at_hub", "pickup.done"].includes(e)) return "shipped";
      return null;
    }

    // 4. Concurrency-limited pool
    async function runPool(tasks, limit) {
      const results = [];
      let idx = 0;
      async function next() {
        if (idx >= tasks.length) return;
        const i = idx++;
        results[i] = await tasks[i]().catch(err => ({ __error: err.message }));
        return next();
      }
      await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, next));
      return results;
    }

    // 5. Build fetch tasks per order
    const tasks = orders.map(order => async () => {
      const provider = (order.courier_provider || "").toLowerCase();
      const cfg = providerConfigs[provider];
      if (!cfg) return { orderId: order.order_id, skip: true, reason: "no config" };

      try {
        let result;
        if (provider === "steadfast")  result = await getSteadfastStatus(cfg, order.tracking_number);
        else if (provider === "redx")  result = await getRedxStatus(cfg, order.tracking_number);
        else if (provider === "pathao") result = await getPathaoStatus(cfg, order.tracking_number);
        else if (provider === "paperfly") result = await getPaperflyStatus(cfg, order.tracking_number);
        else return { orderId: order.order_id, skip: true, reason: `unsupported:${provider}` };

        return {
          orderId: order.order_id,
          currentStatus: order.order_status,
          rawStatus: result.raw_status,
          mappedStatus: mapStatus(result.raw_status)
        };
      } catch (err) {
        return { orderId: order.order_id, __error: err.message };
      }
    });

    const rawResults = await runPool(tasks, CONCURRENCY);

    // 6. Collect changes
    const changes = rawResults.filter(r =>
      r &&
      !r.__error &&
      !r.skip &&
      r.mappedStatus &&
      r.mappedStatus !== r.currentStatus &&
      !TERMINAL.includes(r.currentStatus)
    );

    const errCount = rawResults.filter(r => r?.__error).length;

    if (!changes.length) {
      return {
        success: true,
        checked: orders.length,
        updated: 0,
        errors: errCount,
        message: `Checked ${orders.length} orders — all statuses already up to date`
      };
    }

    // 7. Single bulk UPDATE with CASE WHEN (one query for all changes)
    const caseWhen = changes.map(() => `WHEN ? THEN ?`).join(" ");
    const caseParams = changes.flatMap(c => [c.orderId, c.mappedStatus]);
    const orderIds = changes.map(c => c.orderId);

    await connection.beginTransaction();
    await connection.query(
      `UPDATE orders SET order_status = CASE id ${caseWhen} END WHERE id IN (?)`,
      [...caseParams, orderIds]
    );

    // 8. Bulk history insert
    const historyRows = changes.map(c => [
      c.orderId,
      c.currentStatus,
      c.mappedStatus,
      adminInfo.id,
      `[bulk-sync] ${c.rawStatus}`
    ]);
    await connection.query(
      `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_admin, note) VALUES ?`,
      [historyRows]
    );
    await connection.commit();

    if (changes.length > 0) bumpOrderEventVersion();
    return {
      success: true,
      checked: orders.length,
      updated: changes.length,
      errors: errCount,
      message: `Updated ${changes.length} of ${orders.length} orders`
    };
  })
);


exports.getOrderStatusHistory = api(
  {
    query: {
      orderId: { type: "int", required: false },
      adminId: { type: "int", required: false },
      status: { type: "string", required: false },
      startDate: { type: "string", required: false },
      endDate: { type: "string", required: false },
      limit: { type: "int", required: false, default: 20 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /** 1️⃣ RBAC Check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "SUPPORT"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) {
      throw new errors.UNAUTHORIZED();
    }

    const { orderId, adminId, status, startDate, endDate } = req.typed.query;

    /** 2️⃣ Strict Validation & Synthesis */
    const ALLOWED_STATUSES = [
      'new', 'approved', 'processing', 'packaging',
      'shipped', 'out_for_delivery', 'delivered',
      'returned', 'cancelled', 'on_hold', 'trash'
    ];

    // Validate Status
    if (status && !ALLOWED_STATUSES.includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED(`Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }

    // Validate Dates
    if (startDate && !validator.isISO8601(startDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid start date format (YYYY-MM-DD).");
    }
    if (endDate && !validator.isISO8601(endDate)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid end date format (YYYY-MM-DD).");
    }

    // Synthesize Pagination (Ensure they are valid positive integers)
    const limit = Math.max(1, parseInt(req.typed.query.limit) || 20);
    const offset = Math.max(0, parseInt(req.typed.query.offset) || 0);

    let params = [];
    let conditions = ["1=1"];

    /** 3️⃣ Build Dynamic Filters */
    if (orderId) {
      conditions.push("osh.order_id = ?");
      params.push(orderId);
    }
    if (adminId) {
      conditions.push("osh.changed_by_admin = ?");
      params.push(adminId);
    }
    if (status) {
      conditions.push("osh.new_status = ?");
      params.push(status);
    }
    if (startDate) {
      conditions.push("osh.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      conditions.push("osh.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.join(" AND ");

    /** 4️⃣ Data Retrieval */
    const { total_count } = await connection.queryOne(`
      SELECT COUNT(*) as total_count 
      FROM order_status_history osh 
      WHERE ${whereClause}
    `, params);

    const history = await connection.query(`
      SELECT 
        osh.id, osh.order_id, osh.old_status, osh.new_status, osh.note, osh.created_at,
        osh.changed_by_admin, a.first_name, a.last_name, a.email as admin_email
      FROM order_status_history osh
      LEFT JOIN admins a ON osh.changed_by_admin = a.id
      WHERE ${whereClause}
      ORDER BY osh.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      success: true,
      meta: {
        total_count: Number(total_count) || 0,
        limit,
        offset
      },
      data: history.map(row => ({
        id: row.id,
        order_id: row.order_id,
        status_change: { from: row.old_status, to: row.new_status },
        note: row.note,
        created_at: row.created_at,
        admin: row.changed_by_admin ? {
          id: row.changed_by_admin,
          name: `${row.first_name} ${row.last_name}`.trim(),
          email: row.admin_email
        } : null
      }))
    };
  })
);
exports.getMyOrdersUser = api(
  {
    query: {
      order_status: { type: "string", required: false },
      payment_status: { type: "string", required: false },
      payment_type: { type: "string", required: false },
      min_total: { type: "int", required: false },
      max_total: { type: "int", required: false },
      date_from: { type: "string", required: false },
      date_to: { type: "string", required: false },
      limit: { type: "int", default: 20, required: false },
      offset: { type: "int", default: 0, required: false }
    }
  },
  userAuth(async (req, connection, userInfo) => {
    /** 2️⃣ Validate inputs */
    if (req.typed.date_from && !validator.isDate(req.typed.date_from))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date_from");

    if (req.typed.date_to && !validator.isDate(req.typed.date_to))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date_to");

    if (
      req.typed.order_status &&
      !['new', 'approved', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered', 'returned', 'cancelled'].includes(req.typed.order_status)
    ) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid order status");
    }

    if (
      req.typed.payment_status &&
      !['unpaid', 'partial_paid', 'paid'].includes(req.typed.payment_status)
    ) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment status");
    }

    if (
      req.typed.payment_type &&
      !['gateway', 'cod', 'mixed'].includes(req.typed.payment_type)
    ) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment type");
    }

    let { limit, offset, ...q } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    /** 3️⃣ WHERE builder */
    const where = ["o.customer_id = ?"];
    const params = [userInfo.id];

    if (q.order_status) { where.push("o.order_status = ?"); params.push(q.order_status); }
    if (q.payment_status) { where.push("o.payment_status = ?"); params.push(q.payment_status); }
    if (q.payment_type) { where.push("o.payment_type = ?"); params.push(q.payment_type); }
    if (q.min_total) { where.push("o.grand_total >= ?"); params.push(q.min_total); }
    if (q.max_total) { where.push("o.grand_total <= ?"); params.push(q.max_total); }
    if (q.date_from) { where.push("o.created_at >= ?"); params.push(q.date_from); }
    if (q.date_to) { where.push("o.created_at <= ?"); params.push(q.date_to); }

    const whereSQL = `WHERE ${where.join(" AND ")}`;

    /** 4️⃣ Total count */
    const [countResult] = await connection.query(`
      SELECT COUNT(DISTINCT o.id) AS total
      FROM orders o
      ${whereSQL}
    `, params);

    const total = countResult?.total || 0;

    /** 5️⃣ Orders */
    const orders = await connection.query(`
      SELECT
        o.id,
        o.customer_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.order_type,
        o.payment_type,
        o.payment_status,
        o.subtotal,
        o.discount_total,
        o.delivery_charge,
        o.weight_kg_total,
        o.weight_extra_charge,
        o.grand_total,
        o.paid_amount,
        o.due_amount,
        o.order_status,
        o.note,
        o.created_at,
        oa.full_address,
        oa.city,
        oa.zip_code
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      ${whereSQL}
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    if (!orders.length) {
      return {
        success: true,
        data: [],
        pagination: { limit, offset, total }
      };
    }

    const orderIds = orders.map(o => o.id);

    /** 6️⃣ Items */
    const items = await connection.query(`
      SELECT
        oi.*,
        ps.sku,
        c.name AS color_name,
        c.hex AS color_hex,
        a.name AS attribute_name,
        v.name AS variant_name,
        b.name AS brand_name
      FROM order_items oi
      JOIN product_skus ps ON ps.id = oi.product_sku_id
      LEFT JOIN colors c ON c.id = oi.color_id
      LEFT JOIN attributes a ON a.id = oi.attribute_id
      LEFT JOIN variants v ON v.id = oi.variant_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE oi.order_id IN (?) 
      ORDER BY oi.id ASC
    `, [orderIds]);

    /** 7️⃣ Product first images */
    const productIds = [...new Set(items.map(i => i.product_id))];

    const images = productIds.length
      ? await connection.query(`
          SELECT product_id, img_path
          FROM product_images
          WHERE id IN (
            SELECT MIN(id)
            FROM product_images
            WHERE product_id IN (?)
            GROUP BY product_id
          )
        `, [productIds])
      : [];

    const imageMap = {};
    images.forEach(i => imageMap[i.product_id] = i.img_path);

    /** 8️⃣ Payments, couriers, coupons */
    const payments = await connection.query(
      `SELECT * FROM order_payments WHERE order_id IN (?) ORDER BY id ASC`,
      [orderIds]
    );

    const couriers = await connection.query(
      `SELECT * FROM order_couriers WHERE order_id IN (?) ORDER BY id ASC`,
      [orderIds]
    );

    const coupons = await connection.query(
      `SELECT * FROM order_coupons WHERE order_id IN (?) ORDER BY id ASC`,
      [orderIds]
    );

    /** 9️⃣ Grouping and sanitizing data for user-facing response */
    const map = {};
    const sortedOrders = [];

    // Sort orders by ID in DESC order (newest first based on ID)
    orders.sort((a, b) => b.id - a.id);

    orders.forEach(o => {
      // Sanitize order data
      const sanitizedOrder = {
        id: o.id,
        customer_id: o.customer_id,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        order_type: o.order_type,
        payment_type: o.payment_type,
        payment_status: o.payment_status,
        subtotal: o.subtotal,
        bulk_discount_total: Number(o.bulk_discount_total ?? 0),
        combo_discount_total: Number(o.combo_discount_total ?? 0),
        cart_wide_discount: Number(o.cart_wide_discount ?? 0),
        discount_total: o.discount_total,
        delivery_charge: o.delivery_charge,
        weight_kg_total: o.weight_kg_total,
        weight_extra_charge: o.weight_extra_charge,
        grand_total: o.grand_total,
        paid_amount: o.paid_amount,
        due_amount: o.due_amount,
        order_status: o.order_status,
        note: o.note,
        created_at: o.created_at,
        full_address: o.full_address,
        city: o.city,
        zip_code: o.zip_code,
        items: [],
        payments: [],
        couriers: [],
        coupons: []
      };

      map[o.id] = sanitizedOrder;
      sortedOrders.push(sanitizedOrder);
    });

    // Group items by order_id and sort by ID ASC
    const itemsByOrder = {};
    items.forEach(i => {
      if (!itemsByOrder[i.order_id]) {
        itemsByOrder[i.order_id] = [];
      }
      itemsByOrder[i.order_id].push(i);
    });

    // Sort items within each order by ID ASC
    Object.keys(itemsByOrder).forEach(orderId => {
      const sortedItems = itemsByOrder[orderId]
        .sort((a, b) => a.id - b.id)
        .map(i => ({
          id: i.id,
          order_id: i.order_id,
          product_id: i.product_id,
          product_sku_id: i.product_sku_id,
          product_name: i.product_name,
          product_image: imageMap[i.product_id] || null,
          color_id: i.color_id,
          color_name: i.color_name,
          color_hex: i.color_hex,
          attribute_id: i.attribute_id,
          attribute_name: i.attribute_name,
          variant_id: i.variant_id,
          variant_name: i.variant_name,
          quantity: i.quantity,
          selling_price: i.selling_price,
          discount: i.discount,
          discount_type: i.discount_type,
          coupon_code: i.coupon_code,
          coupon_discount: i.coupon_discount,
          final_unit_price: i.final_unit_price,
          line_total: i.line_total,
          created_at: i.created_at,
          sku: i.sku,
          brand_name: i.brand_name
        }));

      map[orderId].items = sortedItems;
    });

    // Process and sort payments by ID ASC
    payments.sort((a, b) => a.id - b.id).forEach(p => {
      const sanitizedPayment = {
        id: p.id,
        order_id: p.order_id,
        provider: p.provider,
        transaction_ref: p.transaction_ref,
        amount: p.amount,
        status: p.status,
        paid_at: p.paid_at
      };
      map[p.order_id].payments.push(sanitizedPayment);
    });

    // Sort payments within each order by ID ASC (already sorted, but just in case)
    Object.keys(map).forEach(orderId => {
      map[orderId].payments.sort((a, b) => a.id - b.id);
    });

    // Process and sort couriers by ID ASC
    couriers.sort((a, b) => a.id - b.id).forEach(c => {
      const sanitizedCourier = {
        id: c.id,
        courier_provider: c.courier_provider,
        delivery_charge_id: c.delivery_charge_id,
        delivery_title: c.delivery_title,
        tracking_number: c.tracking_number,
        reference_id: c.reference_id ?? null,
        memo: c.memo,
        weight: c.weight != null ? Number(c.weight) : null,
        type: c.type ?? null
      };
      map[c.order_id].couriers.push(sanitizedCourier);
    });

    // Sort couriers within each order by ID ASC
    Object.keys(map).forEach(orderId => {
      map[orderId].couriers.sort((a, b) => a.id - b.id);
    });

    // Process and sort coupons by ID ASC
    coupons.sort((a, b) => a.id - b.id).forEach(c => {
      const sanitizedCoupon = {
        coupon_id: c.coupon_id,
        coupon_code: c.coupon_code,
        coupon_title: c.coupon_title,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        discount_amount: c.discount_amount
      };
      map[c.order_id].coupons.push(sanitizedCoupon);
    });

    // Sort coupons within each order by ID ASC (using coupon_id since we hid the id)
    Object.keys(map).forEach(orderId => {
      map[orderId].coupons.sort((a, b) => a.coupon_id - b.coupon_id);
    });

    return {
      success: true,
      data: sortedOrders,
      pagination: { limit, offset, total }
    };
  })
);


// exports.getMySingleOrder = api(
//   {
//     params: {
//       order_id: { type: "int", required: true }
//     }
//   },
//   userAuth(async (req, connection, userInfo) => {
//     const orderId = req.typed.params.order_id;

//     /** 1️⃣ Get order with address */
//     const order = await connection.queryOne(`
//       SELECT
//         o.id,
//         o.customer_id,
//         o.customer_name,
//         o.customer_email,
//         o.customer_phone,
//         o.order_type,
//         o.guest_order_uuid,
//         o.payment_type,
//         o.payment_status,
//         o.subtotal,
//         o.discount_total,
//         o.delivery_charge,
//         o.grand_total,
//         o.paid_amount,
//         o.due_amount,
//         o.order_status,
//         o.note,
//         o.placed_at,
//         o.paid_at,
//         o.shipped_at,
//         o.delivered_at,
//         o.cancelled_at,
//         o.created_at,
//         o.updated_at,

//         oa.full_address,
//         oa.city,
//         oa.zip_code,
//         oa.address_type
//       FROM orders o
//       LEFT JOIN order_addresses oa ON oa.order_id = o.id
//       WHERE o.id = ? AND o.customer_id = ?
//     `, [orderId, userInfo.id]);

//     if (!order) {
//       throw new errors.NOT_FOUND("Order not found or you don't have permission to view it");
//     }

//     /** 2️⃣ Get order items */
//     const items = await connection.query(`
//       SELECT
//         oi.*,
//         ps.sku,
//         c.name AS color_name,
//         c.hex AS color_hex,
//         a.name AS attribute_name,
//         v.name AS variant_name,
//         b.name AS brand_name,
//         p.slug AS product_slug,
//         p.short_description AS product_short_description,
//         mc.name AS main_category_name,
//         sc.name AS sub_category_name,
//         cc.name AS child_category_name
//       FROM order_items oi
//       JOIN product_skus ps ON ps.id = oi.product_sku_id
//       JOIN products p ON p.id = oi.product_id
//       LEFT JOIN colors c ON c.id = oi.color_id
//       LEFT JOIN attributes a ON a.id = oi.attribute_id
//       LEFT JOIN variants v ON v.id = oi.variant_id
//       LEFT JOIN brands b ON b.id = p.brand_id
//       LEFT JOIN main_categories mc ON mc.id = p.main_category_id
//       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
//       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
//       WHERE oi.order_id = ?
//       ORDER BY oi.id ASC
//     `, [orderId]);

//     /** 3️⃣ Get product images */
//     const productIds = [...new Set(items.map(i => i.product_id))];
//     let productImagesMap = {};

//     if (productIds.length > 0) {
//       const images = await connection.query(`
//         SELECT product_id, img_path
//         FROM product_images
//         WHERE id IN (
//           SELECT MIN(id)
//           FROM product_images
//           WHERE product_id IN (?)
//           GROUP BY product_id
//         )
//       `, [productIds]);

//       images.forEach(i => productImagesMap[i.product_id] = i.img_path);
//     }

//     /** 4️⃣ Get payments */
//     const payments = await connection.query(
//       `SELECT * FROM order_payments WHERE order_id = ? ORDER BY id ASC`,
//       [orderId]
//     );

//     /** 5️⃣ Get couriers */
//     const couriers = await connection.query(
//       `SELECT * FROM order_couriers WHERE order_id = ? ORDER BY id ASC`,
//       [orderId]
//     );

//     /** 6️⃣ Get coupons */
//     const coupons = await connection.query(
//       `SELECT * FROM order_coupons WHERE order_id = ? ORDER BY id ASC`,
//       [orderId]
//     );

//     /** 7️⃣ Get status history */
//     const statusHistory = await connection.query(`
//       SELECT 
//         osh.*,
//         a.first_name AS admin_first_name,
//         a.last_name AS admin_last_name,
//         a.email AS admin_email
//       FROM order_status_history osh
//       LEFT JOIN admins a ON a.id = osh.changed_by_admin
//       WHERE osh.order_id = ?
//       ORDER BY osh.created_at DESC, osh.id DESC
//     `, [orderId]);

//     /** 8️⃣ Format response */
//     // Sanitize order data
//     const sanitizedOrder = {
//       id: order.id,
//       customer_id: order.customer_id,
//       customer_name: order.customer_name,
//       customer_email: order.customer_email,
//       customer_phone: order.customer_phone,
//       order_type: order.order_type,
//       guest_order_uuid: order.guest_order_uuid,
//       payment_type: order.payment_type,
//       payment_status: order.payment_status,
//       subtotal: order.subtotal,
//       discount_total: order.discount_total,
//       delivery_charge: order.delivery_charge,
//       grand_total: order.grand_total,
//       paid_amount: order.paid_amount,
//       due_amount: order.due_amount,
//       order_status: order.order_status,
//       note: order.note,
//       placed_at: order.placed_at,
//       paid_at: order.paid_at,
//       shipped_at: order.shipped_at,
//       delivered_at: order.delivered_at,
//       cancelled_at: order.cancelled_at,
//       created_at: order.created_at,
//       updated_at: order.updated_at,
//       is_fraud: order.is_fraud,
//       fraud_note: order.fraud_note,
//       address: {
//         full_address: order.full_address,
//         city: order.city,
//         zip_code: order.zip_code,
//         address_type: order.address_type
//       }
//     };

//     // Sanitize items
//     const sanitizedItems = items.map(i => ({
//       id: i.id,
//       order_id: i.order_id,
//       product_id: i.product_id,
//       product_sku_id: i.product_sku_id,
//       product_name: i.product_name,
//       product_image: productImagesMap[i.product_id] || null,
//       product_slug: i.product_slug,
//       product_short_description: i.product_short_description,
//       color_id: i.color_id,
//       color_name: i.color_name,
//       color_hex: i.color_hex,
//       attribute_id: i.attribute_id,
//       attribute_name: i.attribute_name,
//       variant_id: i.variant_id,
//       variant_name: i.variant_name,
//       quantity: i.quantity,
//       selling_price: i.selling_price,
//       discount: i.discount,
//       discount_type: i.discount_type,
//       coupon_code: i.coupon_code,
//       coupon_discount: i.coupon_discount,
//       final_unit_price: i.final_unit_price,
//       line_total: i.line_total,
//       created_at: i.created_at,
//       sku: i.sku,
//       brand_name: i.brand_name,
//       categories: {
//         main: i.main_category_name,
//         sub: i.sub_category_name,
//         child: i.child_category_name
//       }
//     }));

//     // Sanitize payments
//     const sanitizedPayments = payments.map(p => ({
//       id: p.id,
//       order_id: p.order_id,
//       provider: p.provider,
//       transaction_ref: p.transaction_ref,
//       amount: p.amount,
//       status: p.status,
//       paid_at: p.paid_at
//     }));

//     // Sanitize couriers
//     const sanitizedCouriers = couriers.map(c => ({
//       id: c.id,
//       courier_provider: c.courier_provider,
//       delivery_charge_id: c.delivery_charge_id,
//       delivery_title: c.delivery_title,
//       tracking_number: c.tracking_number,
//       memo: c.memo,
//       weight: c.weight,
//       type: c.type,
//       is_auto_available: c.is_auto_available,
//       reference_id: c.reference_id,
//       created_at: c.created_at
//     }));

//     // Sanitize coupons
//     const sanitizedCoupons = coupons.map(c => ({
//       coupon_id: c.coupon_id,
//       coupon_code: c.coupon_code,
//       coupon_title: c.coupon_title,
//       discount_type: c.discount_type,
//       discount_value: c.discount_value,
//       discount_amount: c.discount_amount,
//       applied_on: c.applied_on
//     }));

//     // Sanitize status history
//     const sanitizedStatusHistory = statusHistory.map(sh => ({
//       id: sh.id,
//       order_id: sh.order_id,
//       old_status: sh.old_status,
//       new_status: sh.new_status,
//       note: sh.note,
//       created_at: sh.created_at,
//       changed_by: sh.changed_by_admin ? {
//         admin_id: sh.changed_by_admin,
//         name: `${sh.admin_first_name || ''} ${sh.admin_last_name || ''}`.trim(),
//         email: sh.admin_email
//       } : null
//     }));

//     /** 9️⃣ Calculate totals breakdown */
//     const totalsBreakdown = {
//       subtotal: order.subtotal,
//       discount_total: order.discount_total,
//       delivery_charge: order.delivery_charge,
//       grand_total: order.grand_total,
//       paid_amount: order.paid_amount,
//       due_amount: order.due_amount
//     };

//     /** 🔟 Check if order has any issues */
//     const orderIssues = [];
//     if (order.is_fraud) {
//       orderIssues.push({
//         type: "fraud",
//         message: "This order has been flagged for review",
//         note: order.fraud_note
//       });
//     }

//     if (order.order_status === 'cancelled' && order.paid_amount > 0) {
//       orderIssues.push({
//         type: "refund_pending",
//         message: "Order cancelled but payment was made. Refund may be pending."
//       });
//     }

//     return {
//       success: true,
//       data: {
//         order: sanitizedOrder,
//         items: sanitizedItems,
//         payments: sanitizedPayments,
//         couriers: sanitizedCouriers,
//         coupons: sanitizedCoupons,
//         status_history: sanitizedStatusHistory,
//         totals: totalsBreakdown,
//         summary: {
//           item_count: items.length,
//           unique_products: new Set(items.map(i => i.product_id)).size,
//           total_quantity: items.reduce((sum, item) => sum + item.quantity, 0)
//         },
//         issues: orderIssues.length > 0 ? orderIssues : null,
//         actions: {
//           can_cancel: ['new', 'approved', 'processing'].includes(order.order_status),
//           can_return: order.order_status === 'delivered',
//           can_contact_support: true,
//           can_view_invoice: order.order_status !== 'new'
//         }
//       }
//     };
//   })
// );



exports.getMySingleOrder = api(
  {
    params: {
      order_id: { type: "int", required: true }
    }
  },
  async (req, connection) => {
    const orderId = req.typed.params.order_id;

    /** 1️⃣ Get order with address and user profile data */
    const order = await connection.queryOne(`
      SELECT
        o.*,
        oa.full_address,
        oa.city,
        oa.zip_code,
        oa.address_type,
        u.img_path AS customer_profile_img,
        u.first_name AS reg_first_name,
        u.last_name AS reg_last_name
      FROM orders o
      LEFT JOIN order_addresses oa ON oa.order_id = o.id
      LEFT JOIN users u ON u.id = o.customer_id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      throw new errors.NOT_FOUND("Order not found");
    }

    /** 2️⃣ Get order items */
    const items = await connection.query(`
      SELECT
        oi.*,
        ps.sku,
        c.name AS color_name,
        c.hex AS color_hex,
        a.name AS attribute_name,
        v.name AS variant_name,
        b.name AS brand_name,
        p.slug AS product_slug,
        p.short_description AS product_short_description,
        mc.name AS main_category_name,
        sc.name AS sub_category_name,
        cc.name AS child_category_name
      FROM order_items oi
      JOIN product_skus ps ON ps.id = oi.product_sku_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN colors c ON c.id = oi.color_id
      LEFT JOIN attributes a ON a.id = oi.attribute_id
      LEFT JOIN variants v ON v.id = oi.variant_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN main_categories mc ON mc.id = p.main_category_id
      LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
      LEFT JOIN child_categories cc ON cc.id = p.child_category_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `, [orderId]);

    /** 3️⃣ Get product images */
    const productIds = [...new Set(items.map(i => i.product_id))];
    let productImagesMap = {};

    if (productIds.length > 0) {
      const images = await connection.query(`
        SELECT product_id, img_path
        FROM product_images
        WHERE id IN (
          SELECT MIN(id)
          FROM product_images
          WHERE product_id IN (?)
          GROUP BY product_id
        )
      `, [productIds]);

      images.forEach(i => productImagesMap[i.product_id] = i.img_path);
    }

    /** 4️⃣ Get payments */
    const payments = await connection.query(
      `SELECT * FROM order_payments WHERE order_id = ? ORDER BY id ASC`,
      [orderId]
    );

    /** 5️⃣ Get couriers */
    const couriers = await connection.query(
      `SELECT * FROM order_couriers WHERE order_id = ? ORDER BY id ASC`,
      [orderId]
    );

    /** 6️⃣ Get coupons */
    const coupons = await connection.query(
      `SELECT * FROM order_coupons WHERE order_id = ? ORDER BY id ASC`,
      [orderId]
    );

    /** 7️⃣ Get status history */
    const statusHistory = await connection.query(`
      SELECT 
        osh.*,
        a.first_name AS admin_first_name,
        a.last_name AS admin_last_name,
        a.email AS admin_email
      FROM order_status_history osh
      LEFT JOIN admins a ON a.id = osh.changed_by_admin
      WHERE osh.order_id = ?
      ORDER BY osh.created_at DESC, osh.id DESC
    `, [orderId]);

    /** 8️⃣ Format response */
    const sanitizedOrder = {
      id: order.id,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      customer_profile_img: order.customer_profile_img, // From joined user table
      order_type: order.order_type,
      guest_order_uuid: order.guest_order_uuid,
      payment_type: order.payment_type,
      payment_status: order.payment_status,
      subtotal: order.subtotal,
      discount_total: order.discount_total,
      delivery_charge: order.delivery_charge,
      grand_total: order.grand_total,
      paid_amount: order.paid_amount,
      due_amount: order.due_amount,
      order_status: order.order_status,
      note: order.note,
      placed_at: order.placed_at,
      paid_at: order.paid_at,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      cancelled_at: order.cancelled_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
      is_fraud: order.is_fraud,
      fraud_note: order.fraud_note,
      address: {
        full_address: order.full_address,
        city: order.city,
        zip_code: order.zip_code,
        address_type: order.address_type
      }
    };

    const sanitizedItems = items.map(i => ({
      id: i.id,
      order_id: i.order_id,
      product_id: i.product_id,
      product_sku_id: i.product_sku_id,
      product_name: i.product_name,
      product_image: productImagesMap[i.product_id] || null,
      product_slug: i.product_slug,
      product_short_description: i.product_short_description,
      color_id: i.color_id,
      color_name: i.color_name,
      color_hex: i.color_hex,
      attribute_id: i.attribute_id,
      attribute_name: i.attribute_name,
      variant_id: i.variant_id,
      variant_name: i.variant_name,
      quantity: i.quantity,
      selling_price: i.selling_price,
      discount: i.discount,
      discount_type: i.discount_type,
      coupon_code: i.coupon_code,
      coupon_discount: i.coupon_discount,
      final_unit_price: i.final_unit_price,
      line_total: i.line_total,
      created_at: i.created_at,
      sku: i.sku,
      brand_name: i.brand_name,
      categories: {
        main: i.main_category_name,
        sub: i.sub_category_name,
        child: i.child_category_name
      }
    }));

    const sanitizedPayments = payments.map(p => ({
      id: p.id,
      order_id: p.order_id,
      provider: p.provider,
      transaction_ref: p.transaction_ref,
      amount: p.amount,
      status: p.status,
      paid_at: p.paid_at
    }));

    const sanitizedCouriers = couriers.map(c => ({
      id: c.id,
      courier_provider: c.courier_provider,
      delivery_charge_id: c.delivery_charge_id,
      delivery_title: c.delivery_title,
      tracking_number: c.tracking_number,
      memo: c.memo,
      weight: c.weight,
      type: c.type,
      is_auto_available: c.is_auto_available,
      reference_id: c.reference_id,
      created_at: c.created_at
    }));

    const sanitizedCoupons = coupons.map(c => ({
      coupon_id: c.coupon_id,
      coupon_code: c.coupon_code,
      coupon_title: c.coupon_title,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      discount_amount: c.discount_amount,
      applied_on: c.applied_on
    }));

    const sanitizedStatusHistory = statusHistory.map(sh => ({
      id: sh.id,
      order_id: sh.order_id,
      old_status: sh.old_status,
      new_status: sh.new_status,
      note: sh.note,
      created_at: sh.created_at,
      changed_by_admin: sh.changed_by_admin || null,
      admin_first_name: sh.admin_first_name || null,
      admin_last_name: sh.admin_last_name || null,
      admin_email: sh.admin_email || null
    }));

    const totalsBreakdown = {
      subtotal: order.subtotal,
      sku_discount_total: Number(order.sku_discount_total ?? 0),
      bulk_discount_total: Number(order.bulk_discount_total ?? 0),
      combo_discount_total: Number(order.combo_discount_total ?? 0),
      cart_wide_discount: Number(order.cart_wide_discount ?? 0),
      coupon_discount: Math.max(0, Number(order.discount_total ?? 0) - Number(order.sku_discount_total ?? 0)),
      discount_total: order.discount_total,
      delivery_charge: order.delivery_charge,
      weight_kg_total: Number(order.weight_kg_total ?? 0),
      weight_extra_charge: Number(order.weight_extra_charge ?? 0),
      grand_total: order.grand_total,
      paid_amount: order.paid_amount,
      due_amount: order.due_amount
    };

    const orderIssues = [];
    if (order.is_fraud) {
      orderIssues.push({
        type: "fraud",
        message: "This order has been flagged for review",
        note: order.fraud_note
      });
    }

    if (order.order_status === 'cancelled' && order.paid_amount > 0) {
      orderIssues.push({
        type: "refund_pending",
        message: "Order cancelled but payment was made. Refund may be pending."
      });
    }

    return {
      success: true,
      data: {
        order: sanitizedOrder,
        items: sanitizedItems,
        payments: sanitizedPayments,
        couriers: sanitizedCouriers,
        coupons: sanitizedCoupons,
        status_history: sanitizedStatusHistory,
        totals: totalsBreakdown,
        summary: {
          item_count: items.length,
          unique_products: new Set(items.map(i => i.product_id)).size,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0)
        },
        issues: orderIssues.length > 0 ? orderIssues : null,
        actions: {
          can_cancel: ['new', 'approved', 'processing'].includes(order.order_status),
          can_return: order.order_status === 'delivered',
          can_contact_support: true,
          can_view_invoice: order.order_status !== 'new'
        }
      }
    };
  }
);


exports.updateOrderInfo = api(
  {
    body: {
      customer_name: { type: "string", required: true },
      customer_phone: { type: "string", required: true },
      customer_email: { type: "string", required: false },
      payment_type: { type: "string", required: true },
      note: { type: "string", required: false },
      full_address: { type: "string", required: true },
      city: { type: "string", required: true },
      zip_code: { type: "string", required: true },
      location_mapping_id: { type: "int", required: false }
    }
  },
  auth(async (req, connection, admin) => {
    const orderId = req.params.id;
    const {
      customer_name,
      customer_phone,
      customer_email,
      payment_type,
      note,
      full_address,
      city,
      zip_code,
      location_mapping_id
    } = req.typed.body;

    // Check if order exists
    const order = await connection.queryOne('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (!order) throw new errors.NOT_FOUND("Order not found");

    await connection.beginTransaction();

    // 1. Update basic info in orders table
    await connection.query(
      `UPDATE orders SET 
        customer_name = ?, 
        customer_phone = ?, 
        customer_email = ?, 
        payment_type = ?, 
        note = ?
       WHERE id = ?`,
      [
        customer_name,
        customer_phone,
        customer_email || null,
        payment_type,
        note || null,
        orderId
      ]
    );

    // 2. Update address in order_addresses table
    await connection.query(
      `UPDATE order_addresses SET
        full_address = ?,
        city = ?,
        zip_code = ?,
        location_mapping_id = COALESCE(?, location_mapping_id)
       WHERE order_id = ?`,
      [
        full_address,
        city,
        zip_code,
        location_mapping_id || null,
        orderId
      ]
    );

    // 3. Add to admin audit logs
    const actionKey = 'UPDATE_ORDER_INFO';
    const auditQuery = `INSERT INTO audit_logs 
          (admin_id, action_id, entity_type, entity_id, prev_values, new_values, ip_address, created_at)
        VALUES (
          ?, 
          (SELECT id FROM audit_actions WHERE action_key = ? LIMIT 1),
          'orders', 
          ?, 
          NULL, 
          ?, 
          ?, 
          NOW()
        )`;
    const newValuesJson = JSON.stringify({ 
      customer_name, customer_phone, customer_email, payment_type, note, full_address, city, zip_code
    });
    const ipObject = null; // ip address typically set if requested, skip to avoid complex varbinary insert

    // Add safe audit try-catch just in case the action_key is missing
    try {
      await connection.query(auditQuery, [admin.id, actionKey, orderId, newValuesJson, ipObject]);
    } catch(e) {
      console.error('Audit log failed for UPDATE_ORDER_INFO', e);
    }
    
    await connection.commit();

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order information updated successfully"
    };
  })
);


/**
 * PATCH /api/v1/admin/order/items/:id
 * Update order line items (quantity, discount, sku) and order-level charges.
 * Body: { items: [ { order_item_id, product_sku_id, quantity, discount } ], delivery_charge?, discount_total? }
 *
 * Guards:
 *  - Blocks editing if order is in a locked status (delivered, cancelled, returned, trash)
 *  - Warns (but allows) if order is in a dispatched status (shipped, out_for_delivery)
 * Post-save:
 *  - Auto-recalculates payment_status based on paid_amount vs new grand_total
 *  - Notifies the customer via SMS/email if the total changed (respects order_status_notification_user permissions)
 *  - Auto-creates a 'pending' order_refunds row if the order was overpaid relative to the new total
 */
exports.updateOrderItems = api(
  {
    body: {
      items: { type: "array", required: true },
      delivery_charge: { type: "number", required: false },
      discount_total: { type: "number", required: false }
    }
  },
  auth(async (req, connection, admin) => {
    const orderId = req.params.id;
    const { items, delivery_charge, discount_total } = req.typed.body;

    // ── 1. Load order ─────────────────────────────────────────────────────────
    const order = await connection.queryOne(
      `SELECT id, order_status, payment_status, paid_amount, grand_total,
              customer_phone, customer_email, customer_name
       FROM orders WHERE id = ?`,
      [orderId]
    );
    if (!order) throw new errors.NOT_FOUND("Order not found");

    // ── 2. Status guards ──────────────────────────────────────────────────────
    const LOCKED_STATUSES = ['delivered', 'cancelled', 'returned', 'trash'];
    const WARN_STATUSES   = ['shipped', 'out_for_delivery'];

    if (LOCKED_STATUSES.includes(order.order_status)) {
      throw new errors.BAD_REQUEST(
        `Cannot edit a '${order.order_status}' order. The order is closed.`
      );
    }

    const isDispatchedOrder = WARN_STATUSES.includes(order.order_status);

    if (!Array.isArray(items) || items.length === 0) {
      throw new errors.BAD_REQUEST("items array is required and must not be empty");
    }

    const prevGrandTotal = Number(order.grand_total ?? 0);
    const paidAmount     = Number(order.paid_amount  ?? 0);

    await connection.beginTransaction();

    let newGrandTotal;

    try {
      // ── 3. Update each order item ─────────────────────────────────────────
      for (const item of items) {
        const { order_item_id, product_sku_id, quantity, discount } = item;
        if (!order_item_id) continue;

        await connection.query(
          `UPDATE order_items SET
             product_sku_id = COALESCE(?, product_sku_id),
             quantity       = COALESCE(?, quantity),
             discount       = COALESCE(?, discount)
           WHERE id = ? AND order_id = ?`,
          [
            product_sku_id ?? null,
            quantity != null ? Number(quantity) : null,
            discount != null ? Number(discount) : null,
            order_item_id,
            orderId
          ]
        );
      }

      // ── 4. Update order-level charge fields ───────────────────────────────
      const patchFields = [];
      const patchValues = [];
      if (delivery_charge != null) {
        patchFields.push('delivery_charge = ?');
        patchValues.push(Number(delivery_charge));
      }
      if (discount_total != null) {
        patchFields.push('discount_total = ?');
        patchValues.push(Number(discount_total));
      }
      if (patchFields.length > 0) {
        await connection.query(
          `UPDATE orders SET ${patchFields.join(', ')} WHERE id = ?`,
          [...patchValues, orderId]
        );
      }

      // ── 5. Recalculate grand_total + weight_extra_charge ─────────────────
      const itemRows = await connection.query(
        `SELECT oi.quantity, oi.selling_price, oi.discount, ps.weight_kg
         FROM order_items oi
         JOIN product_skus ps ON ps.id = oi.product_sku_id
         WHERE oi.order_id = ?`,
        [orderId]
      );

      let subtotal = 0;
      let newWeightKgTotal = 0;
      itemRows.forEach(row => {
        const unitPrice = Number(row.selling_price) - Number(row.discount || 0);
        subtotal += unitPrice * Number(row.quantity);
        newWeightKgTotal += Number(row.weight_kg || 0) * Number(row.quantity);
      });

      const updatedOrderRow = await connection.queryOne(
        `SELECT o.delivery_charge, o.discount_total,
                o.sku_discount_total, o.bulk_discount_total,
                o.combo_discount_total, o.cart_wide_discount,
                dc.default_weight_kg, dc.extra_charge_per_kg
         FROM orders o
         LEFT JOIN delivery_charges dc ON dc.id = (
           SELECT oc.delivery_charge_id
           FROM order_couriers oc WHERE oc.order_id = o.id LIMIT 1
         )
         WHERE o.id = ?`,
        [orderId]
      );
      const dc = Number(updatedOrderRow?.delivery_charge ?? 0);
      const freeKg   = Number(updatedOrderRow?.default_weight_kg  ?? 0);
      const perKg    = Number(updatedOrderRow?.extra_charge_per_kg ?? 0);
      const excessKg = Math.max(0, newWeightKgTotal - freeKg);
      const newWeightExtraCharge = Number((excessKg * perKg).toFixed(2));

      // Correctly recalculate grand_total:
      //   `subtotal` above = SUM((selling_price - sku_discount) × qty), i.e. NET of SKU discounts.
      //   `discount_total` in the orders table = sku_discount + coupon_discount.
      //   To avoid double-subtracting sku_discount, only subtract the coupon portion.
      //   Bulk, combo, and cart-wide discounts must also be subtracted.
      const skuDiscountStored  = Number(updatedOrderRow?.sku_discount_total  ?? 0);
      const couponDiscount     = Number(updatedOrderRow?.discount_total ?? 0) - skuDiscountStored;
      const bulkDiscountStored = Number(updatedOrderRow?.bulk_discount_total  ?? 0);
      const comboDiscountStored = Number(updatedOrderRow?.combo_discount_total ?? 0);
      const cartWideDiscStored = Number(updatedOrderRow?.cart_wide_discount   ?? 0);

      newGrandTotal = Number(
        (subtotal - couponDiscount - bulkDiscountStored - comboDiscountStored - cartWideDiscStored + dc + newWeightExtraCharge).toFixed(2)
      );

      // ── 6. Auto-recalculate payment_status ────────────────────────────────
      let newPaymentStatus;
      if (paidAmount >= newGrandTotal && newGrandTotal > 0) {
        newPaymentStatus = 'paid';
      } else if (paidAmount > 0) {
        newPaymentStatus = 'partial_paid';
      } else {
        newPaymentStatus = 'unpaid';
      }

      await connection.query(
        `UPDATE orders SET grand_total = ?, due_amount = ?, payment_status = ?,
         weight_kg_total = ?, weight_extra_charge = ?
         WHERE id = ?`,
        [newGrandTotal, Math.max(0, newGrandTotal - paidAmount), newPaymentStatus,
         Number(newWeightKgTotal.toFixed(3)), newWeightExtraCharge,
         orderId]
      );

      // ── 7. Auto-create pending refund if overpaid ─────────────────────────
      if (paidAmount > newGrandTotal && newGrandTotal > 0) {
        const overpaidAmt = paidAmount - newGrandTotal;
        await connection.query(
          `INSERT INTO order_refunds
             (order_id, refund_method, refund_amount, note, refunded_by_admin, status, created_at)
           VALUES (?, 'cash', ?, ?, ?, 'pending', NOW())`,
          [
            orderId,
            overpaidAmt,
            `Auto-created: order total reduced from ${prevGrandTotal} to ${newGrandTotal} by admin edit (order #${orderId}).`,
            admin.id
          ]
        );
      }

      // ── 8. Audit log ──────────────────────────────────────────────────────
      try {
        await connection.query(
          `INSERT INTO audit_logs (admin_id, action_id, entity_type, entity_id, prev_values, new_values, ip_address, created_at)
           VALUES (?,
                   (SELECT id FROM audit_actions WHERE action_key = 'UPDATE_ORDER_ITEMS' LIMIT 1),
                   'orders', ?, ?, ?, NULL, NOW())`,
          [
            admin.id,
            orderId,
            JSON.stringify({ grand_total: prevGrandTotal, payment_status: order.payment_status }),
            JSON.stringify({ grand_total: newGrandTotal, payment_status: newPaymentStatus, dispatched_order: isDispatchedOrder })
          ]
        );

        // Extra audit entry when admin explicitly waives delivery charge
        if (delivery_charge != null && Number(delivery_charge) === 0) {
          await connection.query(
            `INSERT INTO audit_logs (admin_id, action_id, entity_type, entity_id, prev_values, new_values, ip_address, created_at)
             VALUES (?,
                     (SELECT id FROM audit_actions WHERE action_key = 'ORDER_FREE_DELIVERY' LIMIT 1),
                     'orders', ?, ?, ?, NULL, NOW())`,
            [
              admin.id,
              orderId,
              JSON.stringify({ delivery_charge: prevGrandTotal - (subtotal - dt + newWeightExtraCharge) }),
              JSON.stringify({ delivery_charge: 0, waived_by_admin: admin.id })
            ]
          );
        }
      } catch (e) {
        console.error('Audit log failed for UPDATE_ORDER_ITEMS', e);
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    }

    // ── 9. Customer notification if total changed ─────────────────────────────
    // (done AFTER commit so DB is consistent)
    if (newGrandTotal !== undefined && prevGrandTotal !== newGrandTotal) {
      try {
        const permRows = await getPermissionConfig(connection, false, 'order_status_notification_user');
        const emailEnabled = permRows.find(r => r.key_name === 'email')?.value === 'true';
        const smsEnabled   = permRows.find(r => r.key_name === 'sms')?.value   === 'true';

        const totalDiff = newGrandTotal - prevGrandTotal;
        const direction = totalDiff > 0 ? 'increased' : 'reduced';
        const msg = `Dear ${order.customer_name || 'Customer'}, your order #${orderId} total has been ${direction} from BDT ${prevGrandTotal} to BDT ${newGrandTotal}. Please contact us for any queries.`;

        if (smsEnabled && order.customer_phone) {
          sendSMS(connection, order.customer_phone, msg).catch(e =>
            console.error('[updateOrderItems] SMS notification failed:', e.message)
          );
        }

        if (emailEnabled && order.customer_email) {
          // Use sendPaymentMail or a generic nodemailer call
          try {
            await sendPaymentMail({
              to: order.customer_email,
              subject: `Order #${orderId} — Total Updated`,
              html: `<p>${msg}</p>`
            });
          } catch (e) {
            console.error('[updateOrderItems] Email notification failed:', e.message);
          }
        }
      } catch (e) {
        console.error('[updateOrderItems] Notification step failed:', e.message);
      }
    }

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Order items updated successfully",
      data: {
        new_grand_total: newGrandTotal,
        total_changed: prevGrandTotal !== newGrandTotal
      }
    };
  })
);




const { dispatchBulkSteadfast, dispatchBulkPathao } = require('../helpers/courier');

// Schema
const bulkDispatchSchema = {
  body: {
    order_ids: { type: "array", required: true },
    courier_provider: { type: "string", required: true },
  }
};

exports.dispatchBulkOrders = api(
  { body: bulkDispatchSchema.body },
  auth(async (req, connection, adminInfo) => {
    const { order_ids, courier_provider } = req.typed.body;

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      throw new errors.BAD_REQUEST("order_ids array is required and cannot be empty.");
    }
    
    if (order_ids.length > 100) {
        throw new errors.BAD_REQUEST("Cannot dispatch more than 100 orders at once.");
    }

    if (!["steadfast", "pathao"].includes(courier_provider)) {
      throw new errors.BAD_REQUEST("Only steadfast and pathao support bulk dispatch API.");
    }

    const autoStatus = await getAvailableAutoCouriers(connection, true);
    const providerStatus = autoStatus.available_providers.find(
      p => p.provider === courier_provider
    );

    if (!providerStatus || providerStatus.is_auto_available !== 1) {
      throw new errors.BAD_REQUEST(
        `Courier ${courier_provider} is not available for auto dispatch`
      );
    }

    /* -------------------- 2️⃣ Load configs -------------------- */
    const cfgRows = await connection.query(`SELECT provider, key_name, value FROM system_config WHERE service = 'courier'`);
    const configs = {};
    for (const row of cfgRows) {
      if (!row.provider) continue;
      if (!configs[row.provider]) configs[row.provider] = {};
      configs[row.provider][row.key_name] = row.value;
    }

    const paymentCfgRows = await connection.query(`SELECT provider, key_name, is_active, value FROM system_config WHERE service = 'payment' AND provider = 'cod'`);
    let codActive = false;
    let advanceCfg = null;
    for (const row of paymentCfgRows) {
      if (row.key_name === "CASH_ON_DELIVERY") codActive = Boolean(row.is_active);
      if (row.key_name === "MIN_ADVANCE_PAYMENT_PERCENTAGE") advanceCfg = { is_active: Boolean(row.is_active), value: Number(row.value) || 0 };
    }
    const advanceRequired = codActive && Boolean(advanceCfg?.is_active && advanceCfg?.value > 0);

    /* -------------------- 3️⃣ Fetch Orders -------------------- */
    // Using string interpolation for IN clause safely because we format with connection.escape or passing array.
    const orders = await connection.query(
      `SELECT o.*, oa.full_address, oa.city, oa.location_mapping_id,
             lm.pathao_city_id, lm.pathao_zone_id, lm.pathao_area_id,
             lm.steadfast_id
       FROM orders o
       JOIN order_addresses oa ON oa.order_id = o.id
       LEFT JOIN location_mappings lm ON lm.id = COALESCE(
         oa.location_mapping_id,
         (SELECT lm2.id FROM location_mappings lm2
          WHERE (lm2.area_name = oa.city OR lm2.city_name = oa.city)
          LIMIT 1)
       )
       WHERE o.id IN (?) AND o.deleted_at IS NULL`,
      [order_ids]
    );

    if (orders.length === 0) {
      throw new errors.BAD_REQUEST("No valid orders found.");
    }

    /* -------------------- 4️⃣ Filter & Validate -------------------- */
    const validOrdersToDispatch = [];
    const skippedOrders = [];
    const ALLOWED_STATUS = ["approved", "packaging"];
    const ALREADY_DISPATCHED = ["processing", "shipped", "out_for_delivery", "delivered"];

    for (const order of orders) {
      const status = order.order_status;
      let skipReason = null;

      if (!ALLOWED_STATUS.includes(status)) {
        if (ALREADY_DISPATCHED.includes(status)) skipReason = `Order is already ${status}`;
        else skipReason = "Order must be approved before dispatch";
      } else if (order.payment_type === "cod" && advanceRequired && order.payment_status === "unpaid") {
        skipReason = "COD advance payment is required before dispatch";
      } else if (courier_provider === "pathao" && (!order.pathao_city_id || !order.pathao_zone_id || !order.pathao_area_id)) {
        skipReason = "Missing Pathao location IDs";
      }

      if (skipReason) {
        skippedOrders.push({ id: order.id, reason: skipReason });
      } else {
        validOrdersToDispatch.push(order);
      }
    }

    if (validOrdersToDispatch.length === 0) {
      return {
        success: false,
        message: "No orders were eligible for dispatch.",
        skipped: skippedOrders
      };
    }

    /* -------------------- 5️⃣ API Dispatch -------------------- */
    let apiResponse = null;
    try {
      if (courier_provider === "steadfast") {
        apiResponse = await dispatchBulkSteadfast(validOrdersToDispatch, configs.steadfast);
      } else if (courier_provider === "pathao") {
        apiResponse = await dispatchBulkPathao(validOrdersToDispatch, configs.pathao);
      }
    } catch (err) {
      console.error("Bulk dispatch error:", err.message);
      throw new errors.SERVICE_UNAVAILABLE(`Bulk courier API failed: ${err.message}`);
    }

    /* -------------------- 6️⃣ Save Outcomes -------------------- */
    // Note: Due to varying structures from providers, we may need to match response tracking codes to initial order IDs.
    // Steadfast bulk resp: { status: 200, data: [ { invoice: 123, tracking_code: "12X", status: "pending", ... } ] }
    // Pathao bulk resp: { type: "success", data: { data: [ { merchant_order_id: "INV-123", consignment_id: "PAX" } ] } }
    
    let dispatchSuccessMap = {};
    
    if (courier_provider === "steadfast" && apiResponse?.data) {
        const respList = Array.isArray(apiResponse.data) ? apiResponse.data : [];
        for (const item of respList) {
            if (item.tracking_code) {
                dispatchSuccessMap[item.invoice] = { tracking_number: item.tracking_code, raw: item };
            }
        }
    }
    
    if (courier_provider === "pathao" && apiResponse?.data?.data) {
        const respList = Array.isArray(apiResponse.data.data) ? apiResponse.data.data : [];
        for (const item of respList) {
            if (item.consignment_id) {
                const oId = String(item.merchant_order_id).replace("INV-", "");
                dispatchSuccessMap[oId] = { tracking_number: item.consignment_id, raw: item };
            }
        }
    }

    const dispatchedOrderIds = [];
    const failedDispatchDb = [];

    await connection.beginTransaction();
    try {
      for (const order of validOrdersToDispatch) {
        const resultItem = dispatchSuccessMap[order.id.toString()];
        
        if (resultItem) {
          dispatchedOrderIds.push(order.id);
          
          await connection.query(
            `UPDATE order_couriers
             SET is_auto_available = 1, type = 'auto', courier_provider = ?, 
                 tracking_number = ?, raw_response = ?, weight = ?
             WHERE order_id = ?`,
            [courier_provider, resultItem.tracking_number, JSON.stringify(resultItem.raw), order.weight_kg_total || 1.0, order.id]
          );

          await connection.query(
            `UPDATE orders SET order_status = 'shipped' WHERE id = ?`,
            [order.id]
          );

          await connection.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, note, created_at)
             VALUES (?, ?, 'shipped', ?, NOW())`,
            [order.id, order.order_status, `Bulk Dispatched via ${courier_provider} API`]
          );
        } else {
          failedDispatchDb.push({ id: order.id, reason: "Courier API did not return tracking ID" });
        }
      }
      
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    }

    if (dispatchedOrderIds.length > 0) bumpOrderEventVersion();
    return {
      success: true,
      message: `Successfully bulk dispatched ${dispatchedOrderIds.length} orders.`,
      data: {
        dispatched_count: dispatchedOrderIds.length,
        dispatched_ids: dispatchedOrderIds,
        failed: [...skippedOrders, ...failedDispatchDb],
        api_response: apiResponse
      }
    };
  })
);
