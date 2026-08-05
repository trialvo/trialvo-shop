// guestOrderController.js
const { api, auth, validateAndCast } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require("validator");
const { getConfig } = require('../config/ApplicationSettingsDB');
const { getPermissionConfig } = require('../config/PermissionSettingsDB');
const { BRAND_NAME } = require('../config/ApplicationSettings');
const { sendSMS } = require('../helpers/sms');
const crypto = require('crypto');
const { sendEmailVerification } = require('../mail-templates/emailverify');

// Payment handlers (reused from regular order controller)
const { handleSSLCommerz, handleBkash, handleNagad, handleShurjopay, handleRocket } = require('../service/payment');
const {getFraudTestResults}= require('../helpers/courier');

// V2-017: auto-assign hook (lazy require to avoid circular deps)
const { autoAssignOrder } = require('./order_assignment');
// V2-034: admin notification hook
const { sendAdminOrderNotification } = require('../helpers/notify');
// V2: configurable order placement permissions
const { validateGuestOrderPermission } = require('../helpers/orderPermission');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');


// Schema definitions
const orderItemSchema = {
  body: {
    product_sku_id: { type: "int", required: true },
    quantity: { type: "int", required: true }
  }
};

const updateItemSchema = {
  body: {
    item_id: { type: "int", required: true },
    quantity: { type: "int", required: true }
  }
};

// Validation helper functions
function validateName(name, fieldName = "Name") {
  if (!name || name.trim().length === 0) {
    throw new errors.INVALID_FIELDS_PROVIDED(`${fieldName} is required`);
  }

  if (name.length < 2 || name.length > 100) {
    throw new errors.INVALID_FIELDS_PROVIDED(
      `${fieldName} must be between 2 and 100 characters`
    );
  }

  if (!/^[a-zA-Z\s\-'.]+$/.test(name)) {
    throw new errors.INVALID_FIELDS_PROVIDED(
      `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
    );
  }

  return name.trim();
}

function validateEmail(email) {
  if (email) {
    if (!validator.isEmail(email)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");
    }

    if (email.length > 255) {
      throw new errors.INVALID_FIELDS_PROVIDED("Email must be less than 255 characters");
    }
  }
  return email;
}

function validatePhone(phone) {
  if (!phone) {
    throw new errors.INVALID_FIELDS_PROVIDED("Phone number is required");
  }

  const cleanedPhone = phone.replace(/\D/g, '');

  if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
    throw new errors.INVALID_FIELDS_PROVIDED(
      "Phone number must be between 10 and 15 digits"
    );
  }

  if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
  }

  return phone.trim();
}

function validateAddress(address, fieldName = "Address") {
  if (!address || address.trim().length === 0) {
    throw new errors.INVALID_FIELDS_PROVIDED(`${fieldName} is required`);
  }

  if (address.length < 10 || address.length > 500) {
    throw new errors.INVALID_FIELDS_PROVIDED(
      `${fieldName} must be between 10 and 500 characters`
    );
  }

  return address.trim();
}

function validateCity(city) {
  if (city) {
    if (city.length < 2 || city.length > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "City must be between 2 and 100 characters"
      );
    }

    // if (!/^[a-zA-Z\s\-'.]+$/.test(city)) {
    //   throw new errors.INVALID_FIELDS_PROVIDED(
    //     "City can only contain letters, spaces, hyphens, and apostrophes"
    //   );
    // }
  }
  return city ? city.trim() : city;
}

function validateZipCode(zipCode) {
  if (zipCode) {
    if (!/^[a-zA-Z0-9\-\s]+$/.test(zipCode)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Zip code can only contain letters, numbers, hyphens, and spaces"
      );
    }

    if (zipCode.length > 20) {
      throw new errors.INVALID_FIELDS_PROVIDED("Zip code must be less than 20 characters");
    }
  }
  return zipCode ? zipCode.trim() : zipCode;
}

function validateStatus(status) {
  const validStatuses = ['pending', 'complete', 'cancelled'];

  if (!validStatuses.includes(status)) {
    throw new errors.INVALID_FIELDS_PROVIDED(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    );
  }

  return status;
}

function validateNote(note) {
  if (note && note.length > 1000) {
    throw new errors.INVALID_FIELDS_PROVIDED("Note must be less than 1000 characters");
  }
  return note ? note.trim() : note;
}

function validateCouponCode(couponCode) {
  if (couponCode) {
    if (couponCode.length < 3 || couponCode.length > 50) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Coupon code must be between 3 and 50 characters"
      );
    }

    if (!/^[a-zA-Z0-9\-_]+$/.test(couponCode)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Coupon code can only contain letters, numbers, hyphens, and underscores"
      );
    }
  }
  return couponCode ? couponCode.trim().toUpperCase() : couponCode;
}

function validatePaymentType(paymentType) {
  const validPaymentTypes = ['gateway', 'cod', 'mixed'];

  if (!validPaymentTypes.includes(paymentType)) {
    throw new errors.INVALID_FIELDS_PROVIDED(
      `Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`
    );
  }

  return paymentType;
}

function validateDeliveryChargeId(deliveryChargeId) {
  if (!deliveryChargeId || isNaN(deliveryChargeId) || deliveryChargeId < 1) {
    throw new errors.INVALID_FIELDS_PROVIDED("Valid delivery charge ID is required");
  }
  return parseInt(deliveryChargeId);
}

async function calculateGuestOrderTotals(connection, guestOrderId) {
  const items = await connection.query(
    `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
    [guestOrderId]
  );

  let subtotal = 0;
  let skuDiscountTotal = 0;
  let grandTotal = 0;

  items.forEach(item => {
    const lineSubtotal = Number(item.selling_price) * item.quantity;
    const lineDiscount = Number(item.discount) * item.quantity;
    const lineTotal = Number(item.final_unit_price) * item.quantity;

    subtotal += lineSubtotal;
    skuDiscountTotal += lineDiscount;
    grandTotal += lineTotal;
  });

  // Get coupon code and delivery charge from guest order
  const guestOrder = await connection.queryOne(
    `SELECT coupon_code, delivery_charge_id FROM guest_orders WHERE id = ?`,
    [guestOrderId]
  );

  let couponDiscountTotal = 0;
  let couponDetails = null;
  let applicableItems = [];

  // Calculate coupon discount if applicable
  if (guestOrder.coupon_code && items.length > 0) {
    const coupon = await connection.queryOne(
      `SELECT * FROM coupons
       WHERE code = ?
         AND status = 1
         AND start_date <= NOW()
         AND expire_date >= NOW()
         AND customer_scope = 'all'`,
      [guestOrder.coupon_code]
    );

    if (coupon) {
      const discountBase = subtotal - skuDiscountTotal;

      if (discountBase >= coupon.min_purchase_amount) {
        let discountAmount = 0;

        if (coupon.product_scope === "all") {
          discountAmount = coupon.discount_type === 0
            ? Number(coupon.discount)
            : (discountBase * coupon.discount) / 100;

          applicableItems = items;
        } else {
          const targets = await connection.query(
            `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
            [coupon.id]
          );
          const targetIds = targets.map(t => t.product_sku_id);

          applicableItems = items.filter(item =>
            targetIds.includes(item.product_sku_id)
          );

          if (applicableItems.length > 0) {
            applicableItems.forEach(item => {
              const itemTotal = Number(item.final_unit_price) * item.quantity;

              if (coupon.discount_type === 0) {
                discountAmount += Number(coupon.discount);
              } else {
                discountAmount += (itemTotal * coupon.discount) / 100;
              }
            });
          }
        }

        if (coupon.max_discount_amount != null) {
          discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
        }

        couponDiscountTotal = Number(discountAmount.toFixed(2));
        grandTotal -= couponDiscountTotal;

        couponDetails = {
          code: coupon.code,
          title: coupon.title,
          discount_amount: couponDiscountTotal,
          min_purchase_amount: coupon.min_purchase_amount,
          max_discount_amount: coupon.max_discount_amount,
          product_scope: coupon.product_scope,
          applicable_items_count: applicableItems.length,
          discount_type: coupon.discount_type === 0 ? 'fixed' : 'percentage',
          discount_value: coupon.discount
        };
      }
    }
  }

  // Calculate delivery charge
  let deliveryCharge = 0;
  if (guestOrder.delivery_charge_id) {
    const deliveryInfo = await connection.queryOne(
      `SELECT customer_charge FROM delivery_charges WHERE id = ? AND status = 1`,
      [guestOrder.delivery_charge_id]
    );
    if (deliveryInfo) {
      deliveryCharge = Number(deliveryInfo.customer_charge || 0);
      grandTotal += deliveryCharge;
    }
  }

  const discountTotal = skuDiscountTotal + couponDiscountTotal;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    sku_discount: Number(skuDiscountTotal.toFixed(2)),
    coupon_discount: couponDiscountTotal,
    discount_total: Number(discountTotal.toFixed(2)),
    delivery_charge: Number(deliveryCharge.toFixed(2)),
    grand_total: Number(grandTotal.toFixed(2)),
    items,
    coupon: couponDetails,
    applicable_items: applicableItems.map(item => ({
      product_sku_id: item.product_sku_id,
      product_name: item.product_name,
      quantity: item.quantity
    }))
  };
}

async function calculateGuestOrderTotalsUser(connection, guestOrderId) {
  const items = await connection.query(
    `SELECT 
   id,
   product_id,
   product_sku_id as product_variation_id,
   product_name,
   product_image,
   color_id,
   color_name,
   color_hex,
   attribute_id,
   variant_id,
   variant_name,
   quantity,
   selling_price,
   discount,
   discount_type,
   final_unit_price,
   line_total,
   created_at
    FROM guest_order_items WHERE guest_order_id = ?`,
    [guestOrderId]
  );

  let subtotal = 0;
  let skuDiscountTotal = 0;
  let grandTotal = 0;

  items.forEach(item => {
    const lineSubtotal = Number(item.selling_price) * item.quantity;
    const lineDiscount = Number(item.discount) * item.quantity;
    const lineTotal = Number(item.final_unit_price) * item.quantity;

    subtotal += lineSubtotal;
    skuDiscountTotal += lineDiscount;
    grandTotal += lineTotal;
  });

  // Get coupon code and delivery charge from guest order
  const guestOrder = await connection.queryOne(
    `SELECT coupon_code, delivery_charge_id FROM guest_orders WHERE id = ?`,
    [guestOrderId]
  );

  let couponDiscountTotal = 0;
  let couponDetails = null;
  let applicableItems = [];

  // Calculate coupon discount if applicable
  if (guestOrder.coupon_code && items.length > 0) {
    const coupon = await connection.queryOne(
      `SELECT * FROM coupons
       WHERE code = ?
         AND status = 1
         AND start_date <= NOW()
         AND expire_date >= NOW()
         AND customer_scope = 'all'`,
      [guestOrder.coupon_code]
    );

    if (coupon) {
      const discountBase = subtotal - skuDiscountTotal;

      if (discountBase >= coupon.min_purchase_amount) {
        let discountAmount = 0;

        if (coupon.product_scope === "all") {
          discountAmount = coupon.discount_type === 0
            ? Number(coupon.discount)
            : (discountBase * coupon.discount) / 100;

          applicableItems = items;
        } else {
          const targets = await connection.query(
            `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
            [coupon.id]
          );
          const targetIds = targets.map(t => t.product_sku_id);

          applicableItems = items.filter(item =>
            targetIds.includes(item.product_sku_id)
          );

          if (applicableItems.length > 0) {
            applicableItems.forEach(item => {
              const itemTotal = Number(item.final_unit_price) * item.quantity;

              if (coupon.discount_type === 0) {
                discountAmount += Number(coupon.discount);
              } else {
                discountAmount += (itemTotal * coupon.discount) / 100;
              }
            });
          }
        }

        if (coupon.max_discount_amount != null) {
          discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
        }

        couponDiscountTotal = Number(discountAmount.toFixed(2));
        grandTotal -= couponDiscountTotal;

        couponDetails = {
          code: coupon.code,
          title: coupon.title,
          discount_amount: couponDiscountTotal,
          min_purchase_amount: coupon.min_purchase_amount,
          max_discount_amount: coupon.max_discount_amount,
          product_scope: coupon.product_scope,
          applicable_items_count: applicableItems.length,
          discount_type: coupon.discount_type === 0 ? 'fixed' : 'percentage',
          discount_value: coupon.discount
        };
      }
    }
  }

  // Calculate delivery charge
  let deliveryCharge = 0;
  if (guestOrder.delivery_charge_id) {
    const deliveryInfo = await connection.queryOne(
      `SELECT customer_charge FROM delivery_charges WHERE id = ? AND status = 1`,
      [guestOrder.delivery_charge_id]
    );
    if (deliveryInfo) {
      deliveryCharge = Number(deliveryInfo.customer_charge || 0);
      grandTotal += deliveryCharge;
    }
  }

  const discountTotal = skuDiscountTotal + couponDiscountTotal;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    sku_discount: Number(skuDiscountTotal.toFixed(2)),
    coupon_discount: couponDiscountTotal,
    discount_total: Number(discountTotal.toFixed(2)),
    delivery_charge: Number(deliveryCharge.toFixed(2)),
    grand_total: Number(grandTotal.toFixed(2)),
    items,
    coupon: couponDetails,
    applicable_items: applicableItems.map(item => ({
      product_sku_id: item.product_sku_id,
      product_name: item.product_name,
      quantity: item.quantity
    }))
  };
}

// ===========================================
// ADDED: checkCODAdvanceRequired function
// ===========================================
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
// ===========================================

async function createActualOrderFromGuest(connection, guestOrderId, guestData, guestItems) {
  // Validate guest data before processing
  if (guestData.name) validateName(guestData.name);
  if (guestData.email) validateEmail(guestData.email);
  if (guestData.phone) validatePhone(guestData.phone);
  if (guestData.full_address) validateAddress(guestData.full_address);
  if (guestData.city) validateCity(guestData.city);
  if (guestData.zip_code) validateZipCode(guestData.zip_code);
  if (guestData.note) validateNote(guestData.note);

  // Validate payment type and delivery charge
  if (!guestData.payment_type) {
    throw new errors.BAD_REQUEST("Payment type is required");
  }
  validatePaymentType(guestData.payment_type);

  if (!guestData.delivery_charge_id) {
    throw new errors.BAD_REQUEST("Delivery charge ID is required");
  }
  validateDeliveryChargeId(guestData.delivery_charge_id);
//<cutter>
  // Check if phone is verified
  // if (!guestData.is_phone_verified) {
  //   throw new errors.BAD_REQUEST("Phone must be verified before placing order");
  // }
   //</cutter>

  // Get delivery charge
  const deliveryCharge = await connection.queryOne(
    `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
    [guestData.delivery_charge_id]
  );

  if (!deliveryCharge) {
    throw new errors.BAD_REQUEST("Invalid delivery charge");
  }

  // Check for existing user with verified phone
  // SECURITY: Only link to an existing user account if the guest's
  // identity was verified via OTP. Without verification, anyone could
  // type any email/phone and pollute a registered user's address book.
  let existingUserId = null;
  let existingUser = null;

  const identityVerified = guestData.is_phone_verified || guestData.is_email_verified;

  if (identityVerified) {
    // First, try to find user by phone number
    const userByPhone = await connection.queryOne(
      `SELECT u.* 
       FROM users u
       JOIN user_phones up ON u.id = up.user_id
       WHERE up.phone_number = ? AND up.is_verified = 1
       AND u.deleted_at IS NULL
       LIMIT 1`,
      [guestData.phone]
    );

    if (userByPhone) {
      existingUserId = userByPhone.id;
      existingUser = userByPhone;
    } else {
      // If no verified phone match, check by email (if provided)
      if (guestData.email) {
        const userByEmail = await connection.queryOne(
          `SELECT * FROM users 
           WHERE email = ? AND deleted_at IS NULL
           LIMIT 1`,
          [guestData.email]
        );

        if (userByEmail) {
          existingUserId = userByEmail.id;
          existingUser = userByEmail;

          // Add this phone number to the user's verified phones (safe — identity was verified)
          await connection.query(
            `INSERT INTO user_phones (user_id, phone_number, is_verified, created_at)
             VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE is_verified = 1`,
            [existingUserId, guestData.phone]
          );
        }
      }
    }
  }

  // ===========================================
  // ADDED: Check free_delivery consistency
  // ===========================================
  // Get product variations with free_delivery info and category status check
  const productSkuIds = [...new Set(guestItems.map(item => item.product_sku_id))];

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
    [productSkuIds]
  );

  if (variations.length !== productSkuIds.length) {
    throw new errors.BAD_REQUEST("Some product variations are invalid or inactive");
  }

  const variationMap = {};
  variations.forEach(v => {
    variationMap[v.id] = v;
  });

  // Check free_delivery consistency
  const freeDeliveryProducts = [];
  const paidDeliveryProducts = [];

  // Group items by product_sku_id and sum quantities
  const itemGroups = {};
  guestItems.forEach(item => {
    const skuId = item.product_sku_id;
    if (!itemGroups[skuId]) {
      itemGroups[skuId] = {
        ...item,
        totalQuantity: 0
      };
    }
    itemGroups[skuId].totalQuantity += item.quantity;
  });

  const groupedItems = Object.values(itemGroups);

  for (const groupedItem of groupedItems) {
    const variation = variationMap[groupedItem.product_sku_id];
    if (!variation) {
      throw new errors.BAD_REQUEST(`Invalid product variation ${groupedItem.product_sku_id}`);
    }

    // Check stock availability
    if (variation.stock < groupedItem.totalQuantity) {
      throw new errors.BAD_REQUEST(
        `Insufficient stock for product ${variation.sku || variation.id}. Available: ${variation.stock}, Requested: ${groupedItem.totalQuantity}`
      );
    }

    // Categorize products by free delivery status
    if (variation.free_delivery === 1) {
      freeDeliveryProducts.push({
        product_sku_id: variation.id,
        product_name: variation.product_name,
        quantity: groupedItem.totalQuantity
      });
    } else {
      paidDeliveryProducts.push({
        product_sku_id: variation.id,
        product_name: variation.product_name,
        quantity: groupedItem.totalQuantity
      });
    }
  }

  // Mixed delivery carts are allowed — free + paid items can coexist.
  // hasFreeDelivery = true only when ALL items are free delivery (delivery charge is waived)
  const hasFreeDelivery = freeDeliveryProducts.length === groupedItems.length;
  // ===========================================

  // Calculate totals
  let subtotal = 0;
  let skuDiscountTotal = 0;

  const enrichedItems = groupedItems.map(groupedItem => {
    const variation = variationMap[groupedItem.product_sku_id];

    const lineSubtotal = Number(groupedItem.selling_price) * groupedItem.totalQuantity;
    const lineDiscount = Number(groupedItem.discount) * groupedItem.totalQuantity;
    const lineTotal = Number(groupedItem.final_unit_price) * groupedItem.totalQuantity;

    subtotal += lineSubtotal;
    skuDiscountTotal += lineDiscount;

    return {
      ...groupedItem,
      quantity: groupedItem.totalQuantity,
      variation,
      lineSubtotal,
      lineDiscount,
      lineTotal
    };
  });

  // Handle coupon validation
  let couponDiscountTotal = 0;
  let appliedCoupon = null;

  if (guestData.coupon_code) {
    const coupon = await connection.queryOne(
      `SELECT * FROM coupons
       WHERE code = ?
         AND status = 1
         AND start_date <= NOW()
         AND expire_date >= NOW() and deleted_at is null`,
      [guestData.coupon_code]
    );

    if (!coupon) {
      throw new errors.BAD_REQUEST("Invalid coupon");
    }

    // Check coupon usage limit for existing user
    if (existingUserId && coupon.customer_scope === "specified") {
      const usageCount = await connection.queryOne(
        `SELECT COUNT(*) AS cnt
         FROM coupon_usages
         WHERE coupon_id = ? AND customer_id = ?`,
        [coupon.id, existingUserId]
      );

      if (usageCount.cnt >= coupon.limit_per_user) {
        throw new errors.BAD_REQUEST(
          "This coupon has already been used the maximum allowed times"
        );
      }
    } else if (coupon.customer_scope !== 'all') {
      throw new errors.BAD_REQUEST("This coupon is not available for guest orders");
    }

    const discountBase = subtotal - skuDiscountTotal;
    if (discountBase < coupon.min_purchase_amount) {
      throw new errors.BAD_REQUEST(
        `Minimum purchase amount is ${coupon.min_purchase_amount}`
      );
    }

    let discountAmount = 0;
    let applicableItems = [];

    if (coupon.product_scope === "all") {
      discountAmount =
        coupon.discount_type === 0
          ? Number(coupon.discount)
          : (discountBase * coupon.discount) / 100;

      applicableItems = enrichedItems;
    } else {
      const targets = await connection.query(
        `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
        [coupon.id]
      );

      if (targets.length === 0) {
        throw new errors.BAD_REQUEST("This coupon doesn't apply to any products in your cart");
      }

      const targetIds = targets.map(t => t.product_sku_id);

      applicableItems = enrichedItems.filter(item =>
        targetIds.includes(item.product_sku_id)
      );

      if (applicableItems.length === 0) {
        throw new errors.BAD_REQUEST("This coupon doesn't apply to any products in your cart");
      }

      applicableItems.forEach(item => {
        if (coupon.discount_type === 0) {
          discountAmount += Number(coupon.discount);
        } else {
          discountAmount += (item.lineTotal * coupon.discount) / 100;
        }
      });
    }

    if (coupon.discount_type === 1 && coupon.max_discount_amount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
    }

    couponDiscountTotal = Number(discountAmount.toFixed(2));
    appliedCoupon = coupon;
  }

  const discountTotal = Number((skuDiscountTotal + couponDiscountTotal).toFixed(2));

  // ===========================================
  // MODIFIED: Apply free delivery logic
  // ===========================================
  const deliveryAmount = hasFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);
  // ===========================================

  // ─── Weight Surcharge ─────────────────────────────────────────────────
  // Only count weight of PAID-delivery items; free-delivery items are excluded
  const paidWeightKgTotal = hasFreeDelivery ? 0 : enrichedItems
    .filter(item => !item.variation?.free_delivery)  // falsy = paid (0, false, null, undefined)
    .reduce((sum, item) => sum + Number(item.variation?.weight_kg || 0) * item.quantity, 0);
  const weightKgTotal = paidWeightKgTotal; // recorded weight is chargeable weight only
  const freeWeightKg    = Number(deliveryCharge.default_weight_kg || 0);
  const extraPerKg      = Number(deliveryCharge.extra_charge_per_kg || 0);
  const excessKg        = Math.max(0, weightKgTotal - freeWeightKg);
  const weightExtraCharge = hasFreeDelivery ? 0 : Number((excessKg * extraPerKg).toFixed(2));
  // ─────────────────────────────────────────────────────────────────────

  /* ── Bulk / Combo / Cart-Wide Discounts ── */
  const { calculateBulkComboDiscounts } = require('./user_discount');
  const cartItemsForDiscount = enrichedItems.map(i => ({
    product_sku_id: i.product_sku_id,
    quantity: i.quantity,
    final_unit_price: i.final_unit_price,
    selling_price: i.selling_price,
  }));
  const discountResult = await calculateBulkComboDiscounts(connection, cartItemsForDiscount);
  const bulkDiscountTotal = discountResult.bulkDiscountTotal;
  const comboDiscountTotal = discountResult.comboDiscountTotal;
  const cartWideDiscount = discountResult.cartWideDiscount;
  // Merge bulk/combo back onto enrichedItems and inherit effective_free_delivery
  for (const enriched of enrichedItems) {
    const match = discountResult.enrichedItems.find(x => x.product_sku_id === enriched.product_sku_id);
    if (match) {
      enriched.bulk_rule_id = match.bulk_rule_id;
      enriched.bulk_discount_applied = match.bulk_discount_applied;
      enriched.combo_rule_id = match.combo_rule_id;
      enriched.combo_discount_applied = match.combo_discount_applied;
      if (match.effective_free_delivery) enriched.effective_free_delivery = true;
    }
  }

  // Effective free delivery per item: per-SKU OR rule-granted
  const isEffFreeGuest = (item) => !!(item.variation?.free_delivery || item.effective_free_delivery);
  const allEffFreeGuest = enrichedItems.length > 0 && enrichedItems.every(isEffFreeGuest);

  const effectiveDeliveryAmount = allEffFreeGuest ? 0 : deliveryAmount;
  const paidWeightKgEff = allEffFreeGuest ? 0 : enrichedItems
    .filter(i => !isEffFreeGuest(i))
    .reduce((sum, i) => sum + Number(i.variation?.weight_kg || 0) * i.quantity, 0);
  const excessKgEff = Math.max(0, paidWeightKgEff - freeWeightKg);
  const effectiveWeightExtraCharge = allEffFreeGuest ? 0 : Number((excessKgEff * extraPerKg).toFixed(2));

  const grandTotal = Number((subtotal - discountTotal - bulkDiscountTotal - comboDiscountTotal - cartWideDiscount + effectiveDeliveryAmount + effectiveWeightExtraCharge).toFixed(2));

  // Determine initial payment status
  let initialPaymentStatus = 'unpaid';
  let paidAmount = 0;
  let dueAmount = grandTotal;

  // ===========================================
  // UPDATED: Use checkCODAdvanceRequired function for COD advance check
  // ===========================================
  let codAdvanceRequired = false;
  if (guestData.payment_type === 'cod') {
    codAdvanceRequired = await checkCODAdvanceRequired(connection);
  }
  // ===========================================


// 🛡️ Perform the fraud check
const fraudResults = await getFraudTestResults(guestData.phone);

  // Create actual order with customer_id if user exists
  const orderResult = await connection.query(
    `INSERT INTO orders (
      customer_id, order_type, guest_order_uuid,
      customer_name, customer_email, customer_phone,
      payment_type, payment_status,
      subtotal, discount_total, sku_discount_total,
      bulk_discount_total, combo_discount_total, cart_wide_discount,
      delivery_charge,
      weight_kg_total, weight_extra_charge,
      grand_total, paid_amount, due_amount,
      order_status, note, placed_at, fraud_test_results,
      origin, ip_address, fbp, fbc, capi_event_id
    ) VALUES (
      ?, 'guest', ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?,
      ?, ?,
      ?, ?, ?,
      'new', ?, NOW(), ?,
      'Own platform', INET6_ATON(?), ?, ?, ?
    )`,
    [
      existingUserId,                       // customer_id
      guestOrderId,                         // guest_order_uuid
      guestData.name,                       // customer_name
      guestData.email || null,              // customer_email
      guestData.phone,                      // customer_phone
      guestData.payment_type,               // payment_type
      initialPaymentStatus,                 // payment_status
      subtotal,                             // subtotal
      discountTotal,                        // discount_total
      skuDiscountTotal,                     // sku_discount_total
      bulkDiscountTotal,                    // bulk_discount_total
      comboDiscountTotal,                   // combo_discount_total
      cartWideDiscount,                     // cart_wide_discount
      effectiveDeliveryAmount,               // delivery_charge
      Number(paidWeightKgEff.toFixed(3)),   // weight_kg_total — effective value (post-bulk/combo free-delivery)
      effectiveWeightExtraCharge,            // weight_extra_charge
      grandTotal,                           // grand_total
      paidAmount,                           // paid_amount
      dueAmount,                            // due_amount
      guestData.note || null,               // note
      JSON.stringify(fraudResults),         // fraud_test_results
      guestData._reqIp || '127.0.0.1',     // ip_address
      guestData.fbp || null,               // fbp
      guestData.fbc || null,               // fbc
      guestData.capi_event_id || null      // capi_event_id
    ]
  );

  const orderId = orderResult.insertId;

  // Insert order items
  for (const item of enrichedItems) {
    let itemCouponDiscount = 0;
    if (appliedCoupon && appliedCoupon.product_scope === 'specified') {
      const targets = await connection.query(
        `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
        [appliedCoupon.id]
      );
      const targetIds = targets.map(t => t.product_sku_id);

      if (targetIds.includes(item.product_sku_id)) {
        if (appliedCoupon.discount_type === 0) {
          itemCouponDiscount = Number(appliedCoupon.discount);
        } else {
          itemCouponDiscount = (item.lineTotal * appliedCoupon.discount) / 100;
        }
      }
    }

    const finalLineTotal = item.lineTotal - itemCouponDiscount;
    const finalUnitPrice = finalLineTotal / item.quantity;

    await connection.query(
      `INSERT INTO order_items (
        order_id, product_id, product_sku_id, product_name, product_image,
        color_id, color_name, color_hex, attribute_id, variant_id, variant_name,
        quantity, buying_price, selling_price, discount, discount_type,
        coupon_code, coupon_discount, bulk_rule_id, bulk_discount_applied,
        combo_rule_id, combo_discount_applied, final_unit_price, line_total, weight_kg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.product_id,
        item.product_sku_id,
        item.product_name,
        item.product_image,
        item.color_id,
        item.color_name,
        item.color_hex,
        item.attribute_id,
        item.variant_id,
        item.variant_name,
        item.quantity,
        item.buying_price,
        item.selling_price,
        item.discount,
        item.discount_type,
        appliedCoupon?.code || null,
        itemCouponDiscount,
        item.bulk_rule_id || null,
        item.bulk_discount_applied || 0,
        item.combo_rule_id || null,
        item.combo_discount_applied || 0,
        finalUnitPrice,
        finalLineTotal,
        Number(item.variation.weight_kg || 0)
      ]
    );
  }

  // Insert order address
  // If existing user has addresses, try to match or create new one
  let addressId = null;

  if (existingUserId) {
    // Check if user already has this address
    const existingAddress = await connection.queryOne(
      `SELECT id FROM user_addresses 
       WHERE user_id = ? AND full_address = ? 
       AND (city = ? OR (? IS NULL AND city IS NULL))
       LIMIT 1`,
      [
        existingUserId,
        guestData.full_address,
        guestData.city || null,
        guestData.city
      ]
    );

    if (existingAddress) {
      addressId = existingAddress.id;
    } else {
      // Create new address for user
      const addressResult = await connection.query(
        `INSERT INTO user_addresses (
          user_id, name, phone_id, address_type,
          full_address, city, zip_code, created_at
        ) VALUES (?, ?, NULL, 'n/a', ?, ?, ?, NOW())`,
        [
          existingUserId,
          guestData.name || 'Guest Address',
          guestData.full_address,
          guestData.city || null,
          guestData.zip_code || null
        ]
      );
      addressId = addressResult.insertId;
    }
  }

  await connection.query(
    `INSERT INTO order_addresses (
      order_id, address_id, address_type, full_address, city, zip_code, location_mapping_id
    ) VALUES (?, ?, 'n/a', ?, ?, ?, ?)`,
    [
      orderId,
      addressId, // NULL if no existing user
      guestData.full_address,
      guestData.city || null,
      guestData.zip_code || null,
      guestData.location_mapping_id || null
    ]
  );

  // Insert delivery charge snapshot - FIXED to handle free delivery
  if (deliveryCharge) {
    await connection.query(
      `
      INSERT INTO order_couriers (
        order_id,
        delivery_charge_id,
        delivery_title,
        customer_charge,
        our_charge,
        created_at
      ) VALUES (?, ?, ?, ?, ? , NOW())
      `,
      [
        orderId,
        deliveryCharge.id,
        deliveryCharge.title,
        hasFreeDelivery ? 0 : deliveryCharge.customer_charge || 0, // Only change customer_charge to 0 if free delivery
        deliveryCharge.our_charge || 0
      ]
    );
  }

  // Handle coupon usage with customer_id if user exists
  if (appliedCoupon) {
    await connection.query(
      `INSERT INTO coupon_usages
       (coupon_id, order_id, customer_id, used_at)
       VALUES (?, ?, ?, NOW())`,
      [appliedCoupon.id, orderId, existingUserId]
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
        appliedCoupon.id,
        appliedCoupon.code,
        appliedCoupon.title,
        appliedCoupon.discount_type,
        appliedCoupon.discount,
        couponDiscountTotal,
        appliedCoupon.product_scope === "all" ? "order" : "sku"
      ]
    );
  }

  // Update guest order status
  // await connection.query(
  //   `UPDATE guest_orders 
  //    SET status = 'complete', coupon_code = ?, delivery_charge_id = ?, order_id = ?, updated_at = NOW()
  //    WHERE id = ?`,
  //   [appliedCoupon?.code || null, deliveryCharge?.id || null, orderId, guestOrderId]
  // );



  const updates = [
  "status = 'complete'",
  "order_id = ?",
  "updated_at = NOW()"
];

const params = [orderId];

if (appliedCoupon?.code) {
  updates.push("coupon_code = ?");
  params.push(appliedCoupon.code);
}

if (deliveryCharge?.id) {
  updates.push("delivery_charge_id = ?");
  params.push(deliveryCharge.id);
}

params.push(guestOrderId);

await connection.query(
  `UPDATE guest_orders
   SET ${updates.join(", ")}
   WHERE id = ?`,
  params
);


  // If user was found, update user's total_spent when payment is made
  // This will be handled by payment callbacks

  // Determine if payment URL is needed
  let payment_url = null;

  if (
    guestData.payment_type === "gateway" ||
    guestData.payment_type === "mixed" ||
    (guestData.payment_type === "cod" && codAdvanceRequired)
  ) {
    payment_url = `/api/v1/guest/order/${guestOrderId}/initiate-payment`;
  }

  // ─── User Audit Log (linked account only) ────────────────────────
  if (existingUserId) {
    await connection.query(
      `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
       VALUES (?, 'PLACE_GUEST_ORDER', ?, ?)`,
      [
        existingUserId,
        null, // IP not available in this helper context
        JSON.stringify({
          order_id:     orderId,
          grand_total:  grandTotal,
          payment_type: guestData.payment_type,
          item_count:   enrichedItems.length,
          coupon_used:  appliedCoupon ? appliedCoupon.code : null,
          guest_order_id: guestOrderId
        })
      ]
    );
  }

  // ─── V2-017: Auto-assign on order creation ──────────────────────────────
  // MUST be awaited — it uses the handler's `connection` which the api() wrapper
  // commits + releases immediately after this handler returns.
  try {
    await autoAssignOrder(connection, orderId);
  } catch (err) {
    console.error(`[AutoAssign] Failed for order #${orderId}:`, err.message);
  }
  // ─── V2-034: Notify all admins about new guest order (non-blocking) ──────
  // This opens its own DB connection, so fire-and-forget is safe.
  sendAdminOrderNotification(connection, orderId, 'new_order');
  // ─────────────────────────────────────────────────────────────────────────


  bumpOrderEventVersion();
  return {
    success: true,
    message: "Order placed successfully! Your order ID is: " + orderId,
    order_id: orderId,
    customer_linked: existingUserId ? {
      user_id: existingUserId,
      email: existingUser?.email,
      name: existingUser?.first_name && existingUser?.last_name
        ? `${existingUser.first_name} ${existingUser.last_name}`
        : existingUser?.first_name || guestData.name,
      note: existingUser ? "Order linked to existing account" : "New guest order created"
    } : null,
    totals: {
      subtotal,
      sku_discount: Number(skuDiscountTotal.toFixed(2)),
      coupon_discount: couponDiscountTotal,
      discount_total: discountTotal,
      delivery: deliveryAmount,
      grand_total: grandTotal
    },
    delivery_info: {
      free_delivery: hasFreeDelivery,
      message: hasFreeDelivery ? "Free delivery applied" : "Standard delivery"
    },
    order_details: {
      name: guestData.name,
      phone: guestData.phone,
      address: guestData.full_address,
      items_count: enrichedItems.length,
      payment_type: guestData.payment_type,
      delivery_charge: deliveryAmount,
      customer_id: existingUserId
    },
    coupon_applied: appliedCoupon ? {
      code: appliedCoupon.code,
      title: appliedCoupon.title,
      discount_amount: couponDiscountTotal,
      product_scope: appliedCoupon.product_scope
    } : null,
    payment: {
      type: guestData.payment_type,
      advance_required: codAdvanceRequired,
      url: payment_url
    },
    next_steps: payment_url
      ? "Your order has been received. Please proceed with payment."
      : "Your order has been received. You will be contacted soon for confirmation."
  };
}

// Helper function to add items to guest order (reusable)
async function addItemsToGuestOrder(connection, guestOrderId, order_items, guestOrder) {
  // Get unique SKU IDs
  const uniqueSkuIds = [...new Set(order_items.map(item => item.product_variation_id || item.product_sku_id))];
  
  const variations = await connection.query(
    `SELECT s.*, p.name AS product_name,
            COALESCE(s.free_delivery, p.free_delivery) AS free_delivery,
            c.name AS color_name, c.hex AS color_hex,
            v.name AS variant_name, a.name AS attribute_name
     FROM product_skus s
     JOIN products p ON p.id = s.product_id
     INNER JOIN main_categories mc ON mc.id = p.main_category_id
     LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
     LEFT JOIN child_categories cc ON cc.id = p.child_category_id
     LEFT JOIN colors c ON c.id = s.color_id
     LEFT JOIN variants v ON v.id = s.variant_id
     LEFT JOIN attributes a ON a.id = v.attribute_id
     WHERE s.id IN (?) AND s.status = 1
       AND mc.status = 1
       AND (p.sub_category_id IS NULL OR sc.status = 1)
       AND (p.child_category_id IS NULL OR cc.status = 1)`,
    [uniqueSkuIds]
  );

  if (variations.length !== uniqueSkuIds.length) {
    const foundIds = variations.map(v => v.id);
    // const missingIds = uniqueSkuIds.filter(id => !foundIds.includes(id));
    throw new errors.BAD_REQUEST(
      `Some product variations are invalid or inactive `
    );
  }

  const variationMap = new Map();
  variations.forEach(v => variationMap.set(v.id, v));

  // Check free_delivery consistency for existing items
  const existingItems = await connection.query(
    `SELECT gi.*, p.free_delivery 
     FROM guest_order_items gi
     JOIN product_skus ps ON ps.id = gi.product_sku_id
     JOIN products p ON p.id = ps.product_id
     WHERE gi.guest_order_id = ?`,
    [guestOrderId]
  );

  // Mixed delivery carts are allowed — free + paid items can coexist.

  // Get existing items map
  const existingItemsMap = new Map();
  existingItems.forEach(item => existingItemsMap.set(item.product_sku_id, item));

  // Calculate total quantities needed per SKU
  const totalQuantitiesBySku = new Map();
  order_items.forEach(item => {
    const skuId = item.product_variation_id || item.product_sku_id;
    const current = totalQuantitiesBySku.get(skuId) || 0;
    totalQuantitiesBySku.set(skuId, current + item.quantity);
  });

  // Validate stock considering existing quantities
  for (const [skuId, totalQuantity] of totalQuantitiesBySku) {
    const variation = variationMap.get(skuId);
    const existingItem = existingItemsMap.get(skuId);
    const existingQuantity = existingItem ? existingItem.quantity : 0;

    if (variation.stock < (existingQuantity + totalQuantity)) {
      throw new errors.BAD_REQUEST(
        `Insufficient stock for product ${variation.sku || skuId}. ` +
        `Available: ${variation.stock}, Current in cart: ${existingQuantity}, Requested additional: ${totalQuantity}`
      );
    }
  }

  // Get product images
  const productIds = [...new Set(variations.map(v => v.product_id))];
  const productImages = await connection.query(
    `SELECT product_id, img_path 
     FROM product_images 
     WHERE product_id IN (?)
     ORDER BY serial ASC, id ASC`,
    [productIds]
  );

  const imageMap = new Map();
  productImages.forEach(img => {
    if (!imageMap.has(img.product_id)) {
      imageMap.set(img.product_id, img.img_path);
    }
  });

  // Group items by SKU and sum quantities
  const itemsBySku = new Map();
  order_items.forEach(item => {
    const skuId = item.product_variation_id || item.product_sku_id;
    const current = itemsBySku.get(skuId) || 0;
    itemsBySku.set(skuId, current + item.quantity);
  });

  // Update existing items or insert new ones
  for (const [skuId, additionalQuantity] of itemsBySku) {
    const variation = variationMap.get(skuId);
    const existingItem = existingItemsMap.get(skuId);

    const rawUnitPrice = Number(variation.selling_price);
    const skuDiscount = variation.discount_type === 1
      ? (rawUnitPrice * variation.discount) / 100
      : Number(variation.discount || 0);
    const finalUnitPrice = rawUnitPrice - skuDiscount;

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + additionalQuantity;
      const lineTotal = finalUnitPrice * newQuantity;

      await connection.query(
        `UPDATE guest_order_items 
         SET quantity = ?, final_unit_price = ?, line_total = ? 
         WHERE id = ?`,
        [newQuantity, finalUnitPrice, lineTotal, existingItem.id]
      );
    } else {
      // Insert new item
      const lineTotal = finalUnitPrice * additionalQuantity;

      await connection.query(
        `INSERT INTO guest_order_items (
          guest_order_id, product_id, product_sku_id, product_name,
          product_image, color_id, color_name, color_hex,
          attribute_id, variant_id, variant_name, quantity,
          buying_price, selling_price, discount, discount_type,
          final_unit_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          guestOrderId,
          variation.product_id,
          variation.id,
          variation.product_name,
          imageMap.get(variation.product_id) || null,
          variation.color_id,
          variation.color_name || null,
          variation.color_hex || null,
          variation.attribute_id || null,
          variation.variant_id || null,
          variation.variant_name || null,
          additionalQuantity,
          variation.buying_price,
          rawUnitPrice,
          variation.discount || 0,
          variation.discount_type || 0,
          finalUnitPrice,
          lineTotal
        ]
      );
    }
  }
}







// exports.createGuestOrder = api( 
//   {
//     body: {
//       id: { type: "string", required: true },
//       name: { type: "string", required: false },
//       email: { type: "string", required: false },
//       phone: { type: "string", required: false },
//       full_address: { type: "string", required: false },
//       city: { type: "string", required: false },
//       zip_code: { type: "string", required: false },
//       coupon_code: { type: "string", required: false },
//       delivery_charge_id: { type: "int", required: false },
//       payment_type: { type: "string", required: false }, 
//     }
//   },
//   async (req, connection) => {
//     const {
//       id,
//       name,
//       email,
//       phone,
//       full_address,
//       city,
//       zip_code,
//       coupon_code,
//       delivery_charge_id,
//       payment_type,
      
//     } = req.typed.body;

//     const {items}=req.body;

//     // Validate items if provided
//     let order_items = [];
//     if (items && Array.isArray(items) && items.length > 0) {
//       order_items = items.map((item, index) => {
//         try {
//           return validateAndCast({ body: item }, orderItemSchema).body;
//         } catch (err) {
//           throw new errors.INVALID_FIELDS_PROVIDED(
//             `Item at index ${index}: ${err.message}`
//           );
//         }
//       });

//       // Validate quantities
//       order_items.forEach((item, index) => {
//         if (!Number.isInteger(item.quantity) || item.quantity < 1) {
//           throw new errors.INVALID_FIELDS_PROVIDED(
//             `Item at index ${index}: Quantity must be a positive integer`
//           );
//         }
//       });
//     }

//     // Check if order already exists (active)
//     const existingOrder = await connection.queryOne(
//       `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
//       [id]
//     );

//     if (existingOrder) {
//       // ===========================================
//       // ADDED: Validate coupon code if provided for existing order
//       // ===========================================
//       if (coupon_code !== undefined) {
//         if (coupon_code === '') {
//           // Clear coupon code
//         } else if (coupon_code) {
//           const coupon = await connection.queryOne(
//             `SELECT * FROM coupons
//              WHERE code = ?
//                AND status = 1
//                AND start_date <= NOW()
//                AND expire_date >= NOW() and deleted_at is null`,
//             [coupon_code]
//           );

//           if (!coupon) {
//             throw new errors.BAD_REQUEST("Invalid coupon");
//           }

//           if (coupon.customer_scope !== 'all') {
//             throw new errors.BAD_REQUEST("This coupon is not available for guest orders");
//           }

//           const orderItems = await connection.query(
//             `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
//             [existingOrder.id]
//           );

//           if (orderItems.length === 0) {
//             throw new errors.BAD_REQUEST("Cannot apply coupon to empty cart");
//           }

//           let subtotal = 0;
//           let skuDiscountTotal = 0;

//           orderItems.forEach(item => {
//             const lineSubtotal = Number(item.selling_price) * item.quantity;
//             const lineDiscount = Number(item.discount) * item.quantity;

//             subtotal += lineSubtotal;
//             skuDiscountTotal += lineDiscount;
//           });

//           const discountBase = subtotal - skuDiscountTotal;

//           if (discountBase < coupon.min_purchase_amount) {
//             throw new errors.BAD_REQUEST(
//               `Minimum purchase amount for this coupon is ${coupon.min_purchase_amount}`
//             );
//           }

//           if (coupon.product_scope === 'specified') {
//             const targets = await connection.query(
//               `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
//               [coupon.id]
//             );

//             if (targets.length === 0) {
//               throw new errors.BAD_REQUEST("This coupon doesn't apply to any products");
//             }

//             const targetIds = targets.map(t => t.product_sku_id);
//             const cartSkuIds = orderItems.map(item => item.product_sku_id);

//             const hasMatchingProduct = cartSkuIds.some(skuId => targetIds.includes(skuId));

//             if (!hasMatchingProduct) {
//               throw new errors.BAD_REQUEST("This coupon doesn't apply to any products in your cart");
//             }
//           }
//         }
//       }
//       // ===========================================

//       // If items are provided, add them to existing order
//       if (order_items.length > 0) {
//         // Check if order status allows adding items
//         if (existingOrder.status !== 'pending') {
//           throw new errors.BAD_REQUEST("Cannot add items to a completed or cancelled order");
//         }

//         // Add items to existing order
//         await addItemsToGuestOrder(connection, id, order_items, existingOrder);
//       }

//       // Update coupon code if provided
//       if (coupon_code !== undefined) {
//         let updateQuery = `UPDATE guest_orders SET updated_at = NOW()`;
//         const updateValues = [];
        
//         if (coupon_code === '') {
//           updateQuery += `, coupon_code = NULL`;
//         } else if (coupon_code) {
//           updateQuery += `, coupon_code = ?`;
//           updateValues.push(coupon_code);
//         }
        
//         updateQuery += ` WHERE id = ?`;
//         updateValues.push(id);
        
//         if (updateValues.length > 0) {
//           await connection.query(updateQuery, updateValues);
//         }
//       }

//       return {
//         success: true,
//         message: `Guest order already exists${order_items && order_items.length > 0 ? ` and ${order_items.length} items were added` : ""}`,
//       };
//     }

//     // Check if soft deleted and restore with updates
//     const deletedOrder = await connection.queryOne(
//       `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NOT NULL`,
//       [id]
//     );

//     if (deletedOrder) {
//       // Prepare update fields if provided
//       const updateFields = [];
//       const updateValues = [];
//       const updates = {};

//       // Validate and prepare updates
//       if (name !== undefined) {
//         updates.name = validateName(name);
//         updateFields.push('name = ?');
//         updateValues.push(updates.name);
//       }

//       if (email !== undefined) {
//         updates.email = validateEmail(email);
//         updateFields.push('email = ?');
//         updateValues.push(updates.email);
//       }

//       if (phone !== undefined) {
//         updates.phone = validatePhone(phone);
//         updateFields.push('phone = ?');
//         updateValues.push(updates.phone);
//       }

//       if (full_address !== undefined) {
//         updates.full_address = validateAddress(full_address, "Full address");
//         updateFields.push('full_address = ?');
//         updateValues.push(updates.full_address);
//       }

//       if (city !== undefined) {
//         updates.city = validateCity(city);
//         updateFields.push('city = ?');
//         updateValues.push(updates.city);
//       }

//       if (zip_code !== undefined) {
//         updates.zip_code = validateZipCode(zip_code);
//         updateFields.push('zip_code = ?');
//         updateValues.push(updates.zip_code);
//       }

//       // ===========================================
//       // ADDED: Validate coupon code before applying for restored order
//       // ===========================================
//       if (coupon_code !== undefined) {
//         if (coupon_code === '') {
//           updateFields.push('coupon_code = NULL');
//         } else if (coupon_code) {
//           // Validate coupon before applying
//           const coupon = await connection.queryOne(
//             `SELECT * FROM coupons
//              WHERE code = ?
//                AND status = 1
//                AND start_date <= NOW()
//                AND expire_date >= NOW() and deleted_at is null`,
//             [coupon_code]
//           );

//           if (!coupon) {
//             throw new errors.BAD_REQUEST("Invalid coupon");
//           }

//           if (coupon.customer_scope !== 'all') {
//             throw new errors.BAD_REQUEST("This coupon is not available for guest orders");
//           }

//           // For restored order, we need to check if there will be items after restore
//           // Since we're restoring and possibly adding items, we'll check after items are added
//           updates.coupon_code = coupon_code;
//           updateFields.push('coupon_code = ?');
//           updateValues.push(updates.coupon_code);
//         }
//       }
//       // ===========================================

//       if (delivery_charge_id !== undefined) {
//         updates.delivery_charge_id = validateDeliveryChargeId(delivery_charge_id);
//         updateFields.push('delivery_charge_id = ?');
//         updateValues.push(updates.delivery_charge_id);
//       }

//       if (payment_type !== undefined) {
//         updates.payment_type = validatePaymentType(payment_type);
//         updateFields.push('payment_type = ?');
//         updateValues.push(updates.payment_type);
//       }

//       // Build the restore query with updates
//       let restoreQuery = `UPDATE guest_orders SET deleted_at = NULL, status = 'pending', updated_at = NOW()`;

//       if (updateFields.length > 0) {
//         restoreQuery += `, ${updateFields.join(', ')}`;
//       }

//       restoreQuery += ` WHERE id = ?`;

//       updateValues.push(id);

//       await connection.query(restoreQuery, updateValues);

//       // Get the restored order
//       const restoredOrder = await connection.queryOne(
//         `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
//         [id]
//       );

//       // Add items if provided to restored order
//       if (order_items.length > 0) {
//         await addItemsToGuestOrder(connection, id, order_items, restoredOrder);
//       }

//       // ===========================================
//       // ADDED: Validate coupon applicability after items are added for restored order
//       // ===========================================
//       if (coupon_code && coupon_code !== '') {
//         const orderItems = await connection.query(
//           `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
//           [id]
//         );

//         if (orderItems.length === 0) {
//           throw new errors.BAD_REQUEST("Cannot apply coupon to empty cart");
//         }

//         let subtotal = 0;
//         let skuDiscountTotal = 0;

//         orderItems.forEach(item => {
//           const lineSubtotal = Number(item.selling_price) * item.quantity;
//           const lineDiscount = Number(item.discount) * item.quantity;

//           subtotal += lineSubtotal;
//           skuDiscountTotal += lineDiscount;
//         });

//         const discountBase = subtotal - skuDiscountTotal;
        
//         const coupon = await connection.queryOne(
//           `SELECT * FROM coupons
//            WHERE code = ?
//              AND status = 1
//              AND start_date <= NOW()
//              AND expire_date >= NOW() and deleted_at is null`,
//           [coupon_code]
//         );

//         if (discountBase < coupon.min_purchase_amount) {
//           // Remove coupon since minimum purchase not met
//           await connection.query(
//             `UPDATE guest_orders SET coupon_code = NULL, updated_at = NOW() WHERE id = ?`,
//             [id]
//           );
          
//           throw new errors.BAD_REQUEST(
//             `Minimum purchase amount for this coupon is ${coupon.min_purchase_amount}`
//           );
//         }

//         if (coupon.product_scope === 'specified') {
//           const targets = await connection.query(
//             `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
//             [coupon.id]
//           );

//           if (targets.length === 0) {
//             // Remove coupon since no target products
//             await connection.query(
//               `UPDATE guest_orders SET coupon_code = NULL, updated_at = NOW() WHERE id = ?`,
//               [id]
//             );
            
//             throw new errors.BAD_REQUEST("This coupon doesn't apply to any products");
//           }

//           const targetIds = targets.map(t => t.product_sku_id);
//           const cartSkuIds = orderItems.map(item => item.product_sku_id);

//           const hasMatchingProduct = cartSkuIds.some(skuId => targetIds.includes(skuId));

//           if (!hasMatchingProduct) {
//             // Remove coupon since no matching products in cart
//             await connection.query(
//               `UPDATE guest_orders SET coupon_code = NULL, updated_at = NOW() WHERE id = ?`,
//               [id]
//             );
            
//             throw new errors.BAD_REQUEST("This coupon doesn't apply to any products in your cart");
//           }
//         }
//       }
//       // ===========================================

//       return {
//         success: true,
//         message: `Guest order restored successfully${items && items.length > 0 ? ` and ${items.length} items were added` : ""}`,
//       };
//     }

//     // Validate fields for new order creation
//     const validatedFields = {};

//     if (name !== undefined) {
//       validatedFields.name = validateName(name);
//     }

//     if (email !== undefined) {
//       validatedFields.email = validateEmail(email);
//     }

//     if (phone !== undefined) {
//       validatedFields.phone = validatePhone(phone);
//     }

//     if (full_address !== undefined) {
//       validatedFields.full_address = validateAddress(full_address, "Full address");
//     }

//     if (city !== undefined) {
//       validatedFields.city = validateCity(city);
//     }

//     if (zip_code !== undefined) {
//       validatedFields.zip_code = validateZipCode(zip_code);
//     }

//     // ===========================================
//     // ADDED: Validate coupon code if provided for new order
//     // ===========================================
//     if (coupon_code !== undefined && coupon_code !== '') {
//       // Validate coupon before applying
//       const coupon = await connection.queryOne(
//         `SELECT * FROM coupons
//          WHERE code = ?
//            AND status = 1
//            AND start_date <= NOW()
//            AND expire_date >= NOW() and deleted_at is null`,
//         [coupon_code]
//       );

//       if (!coupon) {
//         throw new errors.BAD_REQUEST("Invalid coupon");
//       }

//       if (coupon.customer_scope !== 'all') {
//         throw new errors.BAD_REQUEST("This coupon is not available for guest orders");
//       }

//       // For new order, we'll check applicability after items are added
//       validatedFields.coupon_code = coupon_code;
//     }
//     // ===========================================

//     if (delivery_charge_id !== undefined) {
//       validatedFields.delivery_charge_id = validateDeliveryChargeId(delivery_charge_id);

//       const deliveryCharge = await connection.queryOne(
//         `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
//         [validatedFields.delivery_charge_id]
//       );
//       if (!deliveryCharge) {
//         throw new errors.BAD_REQUEST("Invalid delivery charge");
//       }
//     }

//     if (payment_type !== undefined) {
//       validatedFields.payment_type = validatePaymentType(payment_type);
//     }

//     // Build insert query
//     const insertFields = ['id', 'status'];
//     const insertPlaceholders = ['?', '?'];
//     const insertValues = [id, 'pending'];

//     Object.keys(validatedFields).forEach(field => {
//       insertFields.push(field);
//       insertPlaceholders.push('?');
//       insertValues.push(validatedFields[field]);
//     });

//     await connection.query(
//       `INSERT INTO guest_orders (${insertFields.join(', ')}, created_at) 
//        VALUES (${insertPlaceholders.join(', ')}, NOW())`,
//       insertValues
//     );

//     // Get the newly created order
//     const newOrder = await connection.queryOne(
//       `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
//       [id]
//     );

//     // Add items if provided to new order
//     if (order_items.length > 0) {
//       await addItemsToGuestOrder(connection, id, order_items, newOrder);
//     }

//     // ===========================================
//     // ADDED: Validate coupon applicability after items are added for new order
//     // ===========================================
//     if (coupon_code && coupon_code !== '') {
//       const orderItems = await connection.query(
//         `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
//         [id]
//       );

//       if (orderItems.length === 0) {
//         throw new errors.BAD_REQUEST("Cannot apply coupon to empty cart");
//       }

//       let subtotal = 0;
//       let skuDiscountTotal = 0;

//       orderItems.forEach(item => {
//         const lineSubtotal = Number(item.selling_price) * item.quantity;
//         const lineDiscount = Number(item.discount) * item.quantity;

//         subtotal += lineSubtotal;
//         skuDiscountTotal += lineDiscount;
//       });

//       const discountBase = subtotal - skuDiscountTotal;
      
//       const coupon = await connection.queryOne(
//         `SELECT * FROM coupons
//          WHERE code = ?
//            AND status = 1
//            AND start_date <= NOW()
//            AND expire_date >= NOW() and deleted_at is null`,
//         [coupon_code]
//       );

//       if (discountBase < coupon.min_purchase_amount) {
//         // Remove coupon since minimum purchase not met
//         await connection.query(
//           `UPDATE guest_orders SET coupon_code = NULL, updated_at = NOW() WHERE id = ?`,
//           [id]
//         );
        
//         throw new errors.BAD_REQUEST(
//           `Minimum purchase amount for this coupon is ${coupon.min_purchase_amount}`
//         );
//       }

//       if (coupon.product_scope === 'specified') {
//         const targets = await connection.query(
//           `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
//           [coupon.id]
//         );

//         if (targets.length === 0) {
//           // Remove coupon since no target products
//           await connection.query(
//             `UPDATE guest_orders SET coupon_code = NULL, updated_at = NOW() WHERE id = ?`,
//             [id]
//           );
          
//           throw new errors.BAD_REQUEST("This coupon doesn't apply to any products");
//         }

//         const targetIds = targets.map(t => t.product_sku_id);
//         const cartSkuIds = orderItems.map(item => item.product_sku_id);

//         const hasMatchingProduct = cartSkuIds.some(skuId => targetIds.includes(skuId));

//         if (!hasMatchingProduct) {
//           // Remove coupon since no matching products in cart
//           await connection.query(
//             `UPDATE guest_orders SET coupon_code = NULL, updated_at = NOW() WHERE id = ?`,
//             [id]
//           );
          
//           throw new errors.BAD_REQUEST("This coupon doesn't apply to any products in your cart");
//         }
//       }
//     }
//     // ===========================================

//     return {
//       success: true,
//       message: `Guest order created successfully with ${order_items.length} items `,
//     };
//   }
// );






exports.createGuestOrder = api( 
  {
    body: {
      id: { type: "string", required: true },
      name: { type: "string", required: false },
      email: { type: "string", required: false },
      phone: { type: "string", required: false },
      full_address: { type: "string", required: false },
      city: { type: "string", required: false },
      zip_code: { type: "string", required: false },
      coupon_code: { type: "string", required: false },
      delivery_charge_id: { type: "int", required: false },
      payment_type: { type: "string", required: false },
      // Analytics / CAPI cookie handoff (optional)
      fbp: { type: "string", required: false },
      fbc: { type: "string", required: false },
      capi_event_id: { type: "string", required: false }
    }
  },
  async (req, connection) => {
    const {
      id,
      name,
      email,
      phone,
      full_address,
      city,
      zip_code,
      coupon_code,
      delivery_charge_id,
      payment_type,
      fbp,
      fbc,
      capi_event_id,
    } = req.typed.body;

    const {items}=req.body;

    // Validate items if provided
    let order_items = [];
    if (items && Array.isArray(items) && items.length > 0) {
      order_items = items.map((item, index) => {
        try {
          return validateAndCast({ body: item }, orderItemSchema).body;
        } catch (err) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            `Item at index ${index}: ${err.message}`
          );
        }
      });

      // Validate quantities
      order_items.forEach((item, index) => {
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            `Item at index ${index}: Quantity must be a positive integer`
          );
        }
      });
    }

    // Check if order already exists (active)
    const existingOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (existingOrder) {
      // If items are provided, add them to existing order
      if (order_items.length > 0) {
        // Check if order status allows adding items
        if (existingOrder.status !== 'pending') {
          throw new errors.BAD_REQUEST("Cannot add items to a completed or cancelled order");
        }

        // Add items to existing order
        await addItemsToGuestOrder(connection, id, order_items, existingOrder);
      }

      return {
        success: true,
        message: `Guest order already exists${order_items && order_items.length > 0 ? ` and ${order_items.length} items were added` : ""}`,
      };
    }

    // Check if soft deleted and restore with updates
    const deletedOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NOT NULL`,
      [id]
    );

    if (deletedOrder) {
      // Prepare update fields if provided
      const updateFields = [];
      const updateValues = [];
      const updates = {};

      // Validate and prepare updates
      if (name !== undefined) {
        updates.name = validateName(name);
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }

      if (email !== undefined) {
        updates.email = validateEmail(email);
        updateFields.push('email = ?');
        updateValues.push(updates.email);
      }

      if (phone !== undefined) {
        updates.phone = validatePhone(phone);
        updateFields.push('phone = ?');
        updateValues.push(updates.phone);
      }

      if (full_address !== undefined) {
        updates.full_address = validateAddress(full_address, "Full address");
        updateFields.push('full_address = ?');
        updateValues.push(updates.full_address);
      }

      if (city !== undefined) {
        updates.city = validateCity(city);
        updateFields.push('city = ?');
        updateValues.push(updates.city);
      }

      if (zip_code !== undefined) {
        updates.zip_code = validateZipCode(zip_code);
        updateFields.push('zip_code = ?');
        updateValues.push(updates.zip_code);
      }

      if (coupon_code !== undefined) {


        if (coupon_code !== '') {
          updates.coupon_code = coupon_code;
          updateFields.push('coupon_code = ?');
          updateValues.push(updates.coupon_code);
        } else {
          updateFields.push('coupon_code = NULL');
        }
      }

      if (delivery_charge_id !== undefined) {
        updates.delivery_charge_id = validateDeliveryChargeId(delivery_charge_id);
        updateFields.push('delivery_charge_id = ?');
        updateValues.push(updates.delivery_charge_id);
      }

      if (payment_type !== undefined) {
        updates.payment_type = validatePaymentType(payment_type);
        updateFields.push('payment_type = ?');
        updateValues.push(updates.payment_type);
      }

      // Build the restore query with updates
      let restoreQuery = `UPDATE guest_orders SET deleted_at = NULL, status = 'pending', updated_at = NOW()`;

      if (updateFields.length > 0) {
        restoreQuery += `, ${updateFields.join(', ')}`;
      }

      restoreQuery += ` WHERE id = ?`;

      updateValues.push(id);

      await connection.query(restoreQuery, updateValues);

      // Get the restored order
      const restoredOrder = await connection.queryOne(
        `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      // Add items if provided to restored order
      if (order_items.length > 0) {
        await addItemsToGuestOrder(connection, id, order_items, restoredOrder);
      }

      return {
        success: true,
        message: `Guest order restored successfully${items && items.length > 0 ? ` and ${items.length} items were added` : ""}`,
      };
    }

    // Validate fields for new order creation
    const validatedFields = {};

    if (name !== undefined) {
      validatedFields.name = validateName(name);
    }

    if (email !== undefined) {
      validatedFields.email = validateEmail(email);
    }

    if (phone !== undefined) {
      validatedFields.phone = validatePhone(phone);
    }

    if (full_address !== undefined) {
      validatedFields.full_address = validateAddress(full_address, "Full address");
    }

    if (city !== undefined) {
      validatedFields.city = validateCity(city);
    }

    if (zip_code !== undefined) {
      validatedFields.zip_code = validateZipCode(zip_code);
    }

    if (coupon_code !== undefined && coupon_code !== '') {
      validatedFields.coupon_code = coupon_code;
    }

    if (delivery_charge_id !== undefined) {
      validatedFields.delivery_charge_id = validateDeliveryChargeId(delivery_charge_id);

      const deliveryCharge = await connection.queryOne(
        `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
        [validatedFields.delivery_charge_id]
      );
      if (!deliveryCharge) {
        throw new errors.BAD_REQUEST("Invalid delivery charge");
      }
    }

    if (payment_type !== undefined) {
      validatedFields.payment_type = validatePaymentType(payment_type);
    }

    // Add analytics cookie IDs if provided (for CAPI deduplication)
    if (fbp != null && fbp !== '') validatedFields.fbp = fbp;
    if (fbc != null && fbc !== '') validatedFields.fbc = fbc;
    if (capi_event_id != null && capi_event_id !== '') validatedFields.capi_event_id = capi_event_id;

    // Build insert query
    const insertFields = ['id', 'status'];
    const insertPlaceholders = ['?', '?'];
    const insertValues = [id, 'pending'];

    Object.keys(validatedFields).forEach(field => {
      insertFields.push(field);
      insertPlaceholders.push('?');
      insertValues.push(validatedFields[field]);
    });

    // Add IP address capture
    insertFields.push('ip_address');
    insertPlaceholders.push('INET6_ATON(?)');
    insertValues.push(req.ip || '127.0.0.1');

    await connection.query(
      `INSERT INTO guest_orders (${insertFields.join(', ')}, created_at) 
       VALUES (${insertPlaceholders.join(', ')}, NOW())`,
      insertValues
    );

    // Get the newly created order
    const newOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    // Add items if provided to new order
    if (order_items.length > 0) {
      await addItemsToGuestOrder(connection, id, order_items, newOrder);
    }

    return {
      success: true,
      message: `Guest order created successfully with ${order_items.length} items `,
    };
  }
);

// 2. Get Guest Order Details (with payment info)
exports.getGuestOrder = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;

    const guestOrder = await connection.queryOne(
      `SELECT
        id,
        order_id,
        status,
        name,
        email,
        phone,
        is_phone_verified,
        profile_img,
        full_address,
        city,
        zip_code,
        coupon_code,
        delivery_charge_id,
        payment_type,
        created_at,
        updated_at
       FROM guest_orders
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    /** 1️⃣ Calculate totals */
    const totals = await calculateGuestOrderTotalsUser(connection, id);

    /** 2️⃣ If order not completed → default payment info */
    if (guestOrder.status !== 'complete' || !guestOrder.order_id) {
      return {
        success: true,
        guest_order: {
          ...guestOrder,
          ...totals,
          payment_status: 'unpaid',
          paid_amount: 0,
          due_amount: totals.grand_total || 0
        }
      };
    }

    /** 3️⃣ If completed → fetch real order payment info */
    const orderPayment = await connection.queryOne(
      `SELECT
        payment_status,
        COALESCE(paid_amount, 0) AS paid_amount,
        COALESCE(due_amount, 0) AS due_amount
       FROM orders
       WHERE id = ?`,
      [guestOrder.order_id]
    );

    const paymentInfo = orderPayment || {
      payment_status: 'unpaid',
      paid_amount: 0,
      due_amount: totals.grand_total || 0
    };

    return {
      success: true,
      guest_order: {
          ...paymentInfo,
        ...guestOrder,
      
        ...totals
      }
    };
  }
);

// Get Multiple Guest Orders by IDs (with payment info — FIXED)
exports.getGuestOrdersByIds = api(
  {},
  async (req, connection) => {
    const { ids } = req.body;

    /** 1️⃣ Manual validation */
    if (!ids || !Array.isArray(ids)) {
      throw new errors.BAD_REQUEST("Request body must contain 'ids' as an array");
    }

    if (ids.length === 0) {
      throw new errors.BAD_REQUEST("No order IDs provided");
    }

    if (ids.length > 100) {
      throw new errors.BAD_REQUEST("Maximum 100 orders can be requested at once");
    }

    const invalidIds = ids.filter(id => typeof id !== 'string' || id.trim() === '');
    if (invalidIds.length > 0) {
      throw new errors.BAD_REQUEST(
        `Invalid order IDs: ${invalidIds.join(', ')}`
      );
    }

    // Clean & deduplicate
    const cleanIds = [...new Set(ids.map(id => id.trim()))];
    const placeholders = cleanIds.map(() => '?').join(',');

    /** 2️⃣ Fetch guest orders */
    const guestOrders = await connection.query(
      `SELECT
        id,
        order_id,
        status,
        name,
        email,
        phone,
        is_phone_verified,
        profile_img,
        full_address,
        city,
        zip_code,
        coupon_code,
        delivery_charge_id,
        payment_type,
        created_at,
        updated_at
       FROM guest_orders
       WHERE id IN (${placeholders})
       AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      cleanIds
    );

    if (guestOrders.length === 0) {
      throw new errors.NOT_FOUND("No guest orders found");
    }

    /** 3️⃣ Fetch totals (ONE query) */
    const totalsRows = await connection.query(
      `SELECT
        guest_order_id,
        COALESCE(SUM(line_total), 0) AS grand_total
       FROM guest_order_items
       WHERE guest_order_id IN (${placeholders})
       GROUP BY guest_order_id`,
      cleanIds
    );

    const totalsMap = {};
    totalsRows.forEach(r => {
      totalsMap[r.guest_order_id] = r.grand_total;
    });

    /** 4️⃣ Fetch payment info for completed orders */
    const completedOrderIds = guestOrders
      .filter(o => o.status === 'complete' && o.order_id)
      .map(o => o.order_id);

    const paymentMap = {};

    if (completedOrderIds.length > 0) {
      const paymentRows = await connection.query(
        `SELECT
          id AS order_id,
          payment_status,
          COALESCE(paid_amount, 0) AS paid_amount,
          COALESCE(due_amount, 0) AS due_amount
         FROM orders
         WHERE id IN (${completedOrderIds.map(() => '?').join(',')})`,
        completedOrderIds
      );

      paymentRows.forEach(p => {
        paymentMap[p.order_id] = p;
      });
    }

    /** 5️⃣ Merge safely (NO FIELD OVERRIDE) */
    const enrichedOrders = guestOrders.map(order => {
      const grandTotal = totalsMap[order.id] || 0;

      // Incomplete orders
      if (order.status !== 'complete' || !order.order_id) {
        return {
          ...order,
          grand_total: grandTotal,
          payment_status: 'unpaid',
          paid_amount: 0,
          due_amount: grandTotal
        };
      }

      // Completed orders
      const payment = paymentMap[order.order_id] || {
        payment_status: 'unpaid',
        paid_amount: 0,
        due_amount: grandTotal
      };

      return {
        ...order,
        grand_total: grandTotal,
        payment_status: payment.payment_status,
        paid_amount: payment.paid_amount,
        due_amount: payment.due_amount
      };
    });

    /** 6️⃣ Meta info */
    const foundIds = guestOrders.map(o => o.id);
    const missingIds = cleanIds.filter(id => !foundIds.includes(id));

    return {
      success: true,
      guest_orders: enrichedOrders,
      meta: {
        total_requested: cleanIds.length,
        total_found: enrichedOrders.length,
        ...(missingIds.length > 0 && { missing_ids: missingIds })
      }
    };
  }
);

// 4. Update Guest Order
exports.updateGuestOrder = api(
  {
    params: {
      id: { type: "string", required: true }
    },
    body: {
      name: { type: "string", required: false },
      email: { type: "string", required: false },
      phone: { type: "string", required: false },
      full_address: { type: "string", required: false },
      city: { type: "string", required: false },
      zip_code: { type: "string", required: false },
      coupon_code: { type: "string", required: false },
      delivery_charge_id: { type: "int", required: false },
      payment_type: { type: "string", required: false },
      location_mapping_id: { type: "int", required: false },
      note: { type: "string", required: false }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const updates = req.typed.body;

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status === 'complete') {
      throw new errors.BAD_REQUEST("Cannot update a completed order");
    }

    if (guestOrder.status === 'cancelled') {
      throw new errors.BAD_REQUEST("Cannot update a cancelled order");
    }

    // Validate input fields
    if (updates.name !== undefined) {
      updates.name = validateName(updates.name);
    }

    if (updates.email !== undefined) {
      updates.email = validateEmail(updates.email);
    }

    if (updates.phone !== undefined) {
      updates.phone = validatePhone(updates.phone);
    }

    if (updates.full_address !== undefined) {
      updates.full_address = validateAddress(updates.full_address, "Full address");
    }

    if (updates.city !== undefined) {
      updates.city = validateCity(updates.city);
    }

    if (updates.zip_code !== undefined) {
      updates.zip_code = validateZipCode(updates.zip_code);
    }

    if (updates.delivery_charge_id !== undefined) {
      updates.delivery_charge_id = validateDeliveryChargeId(updates.delivery_charge_id);
    }

    if (updates.payment_type !== undefined) {
      updates.payment_type = validatePaymentType(updates.payment_type);
    }

    // Handle phone update with OTP
    // if (updates.phone && updates.phone !== guestOrder.phone) {
    //   const otp = crypto.randomInt(100000, 999999).toString();
    //   const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    //   updates.otp = otp;
    //   updates.otp_exp = otpExp;
    //   updates.is_phone_verified = 0;

    //   const message = `Your ${BRAND_NAME} verification OTP is ${otp}`;
    //   await sendSMS(connection, updates.phone, message);
    // }

    // Handle delivery charge validation
    if (updates.delivery_charge_id !== undefined) {
      const deliveryCharge = await connection.queryOne(
        `SELECT * FROM delivery_charges WHERE id = ? AND status = 1`,
        [updates.delivery_charge_id]
      );
      if (!deliveryCharge) {
        throw new errors.BAD_REQUEST("Invalid delivery charge");
      }
    }

    // Handle coupon validation
    if (updates.coupon_code !== undefined) {
      if (updates.coupon_code === '') {
        updates.coupon_code = null;
      } else if (updates.coupon_code) {
        const coupon = await connection.queryOne(
          `SELECT * FROM coupons
           WHERE code = ?
             AND status = 1
             AND start_date <= NOW()
             AND expire_date >= NOW() and deleted_at is null`,
          [updates.coupon_code]
        );

        if (!coupon) {
          throw new errors.BAD_REQUEST("Invalid coupon");
        }

        if (coupon.customer_scope !== 'all') {
          throw new errors.BAD_REQUEST("This coupon is not available for guest orders");
        }

        const orderItems = await connection.query(
          `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
          [id]
        );

        if (orderItems.length === 0) {
          throw new errors.BAD_REQUEST("Cannot apply coupon to empty cart");
        }

        let subtotal = 0;
        let skuDiscountTotal = 0;

        orderItems.forEach(item => {
          const lineSubtotal = Number(item.selling_price) * item.quantity;
          const lineDiscount = Number(item.discount) * item.quantity;

          subtotal += lineSubtotal;
          skuDiscountTotal += lineDiscount;
        });

        const discountBase = subtotal - skuDiscountTotal;

        if (discountBase < coupon.min_purchase_amount) {
          throw new errors.BAD_REQUEST(
            `Minimum purchase amount for this coupon is ${coupon.min_purchase_amount}`
          );
        }

        if (coupon.product_scope === 'specified') {
          const targets = await connection.query(
            `SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`,
            [coupon.id]
          );

          if (targets.length === 0) {
            throw new errors.BAD_REQUEST("This coupon doesn't apply to any products");
          }

          const targetIds = targets.map(t => t.product_sku_id);
          const cartSkuIds = orderItems.map(item => item.product_sku_id);

          const hasMatchingProduct = cartSkuIds.some(skuId => targetIds.includes(skuId));

          if (!hasMatchingProduct) {
            throw new errors.BAD_REQUEST("This coupon doesn't apply to any products in your cart");
          }
        }
      }
    }

    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length > 0) {
      updateValues.push(id);

      await connection.query(
        `UPDATE guest_orders 
         SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        updateValues
      );
    }

    const updatedOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    const totals = await calculateGuestOrderTotalsUser(connection, id);

    return {
      success: true,
      message: "Guest order updated successfully",
      guest_order: {
        ...updatedOrder,
        ...totals
      }
    };
  }
);

// 5. Place Guest Order
exports.placeGuestOrder = api(
  {
    params: {
      id: { type: "string", required: true }
    },
    body: {
      name: { type: "string", required: false },
      email: { type: "string", required: false },
      phone: { type: "string", required: false },
      full_address: { type: "string", required: false },
      city: { type: "string", required: false },
      zip_code: { type: "string", required: false },
      note: { type: "string", required: false },
      coupon_code: { type: "string", required: false },
      delivery_charge_id: { type: "int", required: true },
      payment_type: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const updates = req.typed.body;

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) throw new errors.NOT_FOUND("Guest order not found");
    if (guestOrder.status === 'complete') throw new errors.BAD_REQUEST("Order is already completed");
    if (guestOrder.status === 'cancelled') throw new errors.BAD_REQUEST("Order is cancelled");

    // Validate inputs
    validatePaymentType(updates.payment_type);
    validateDeliveryChargeId(updates.delivery_charge_id);

    const validatedUpdates = {};
    if (updates.name !== undefined) validatedUpdates.name = validateName(updates.name);
    if (updates.email !== undefined) validatedUpdates.email = validateEmail(updates.email);
    if (updates.phone !== undefined) validatedUpdates.phone = validatePhone(updates.phone);
    if (updates.full_address !== undefined) validatedUpdates.full_address = validateAddress(updates.full_address, "Full address");
    if (updates.city !== undefined) validatedUpdates.city = validateCity(updates.city);
    if (updates.zip_code !== undefined) validatedUpdates.zip_code = validateZipCode(updates.zip_code);
    if (updates.note !== undefined) validatedUpdates.note = validateNote(updates.note);
    if (updates.coupon_code !== undefined) validatedUpdates.coupon_code = validateCouponCode(updates.coupon_code);
    


    validatedUpdates.delivery_charge_id = updates.delivery_charge_id;
    validatedUpdates.payment_type = updates.payment_type;

    const updatedGuestData = { ...guestOrder, ...validatedUpdates };

    // Basic requirements
    if (!updatedGuestData.name) throw new errors.BAD_REQUEST("Name is required");
    if (!updatedGuestData.phone) throw new errors.BAD_REQUEST("Phone is required");
    if (!updatedGuestData.full_address) throw new errors.BAD_REQUEST("Full address is required");

    // 🔐 V2: Enforce configurable guest order placement permissions (reads from DB)
    await validateGuestOrderPermission(connection, updatedGuestData);
    const orderItems = await connection.query(
      `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
      [id]
    );

    if (!orderItems.length) throw new errors.BAD_REQUEST("At least one order item is required");

    /* -------------------- 1️⃣ SKU & Category Status Validation -------------------- */
    const productSkuIds = [...new Set(orderItems.map(item => item.product_sku_id))];
    const variations = await connection.query(
      `SELECT s.*, p.name AS product_name, p.free_delivery
       FROM product_skus s
       JOIN products p ON p.id = s.product_id
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       WHERE s.id IN (?) AND s.status = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [productSkuIds]
    );

    if (variations.length !== productSkuIds.length) {
      throw new errors.BAD_REQUEST("Some items are no longer available or belong to an inactive category");
    }

    const variationMap = {};
    variations.forEach(v => { variationMap[v.id] = v; });

    // Check delivery consistency & Stock
    let freeDeliveryCount = 0;
    orderItems.forEach(item => {
      if (variationMap[item.product_sku_id].stock < item.quantity) {
        throw new errors.BAD_REQUEST(`Insufficient stock for ${variationMap[item.product_sku_id].product_name}`);
      }
      if (variationMap[item.product_sku_id].free_delivery === 1) freeDeliveryCount++;
    });

    // Mixed delivery carts are allowed — free + paid items can be ordered together.

    /* -------------------- 2️⃣ Link Existing User & Check Coupon Usage -------------------- */
    // Look for a user linked via the verified phone number provided in guest checkout
    const existingUser = await connection.queryOne(
      `SELECT u.id 
       FROM users u
       JOIN user_phones up ON u.id = up.user_id
       WHERE up.phone_number = ? AND up.is_verified = 1 AND u.deleted_at IS NULL
       LIMIT 1`,
      [updatedGuestData.phone]
    );

    if (existingUser && updatedGuestData.coupon_code) {
      const coupon = await connection.queryOne(
        `SELECT id, limit_per_user FROM coupons WHERE code = ? AND status = 1 `,
        [updatedGuestData.coupon_code]
      );

      if (coupon && coupon.limit_per_user !== null) {
        const usageCount = await connection.queryOne(
          `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND customer_id = ?`,
          [coupon.id, existingUser.id]
        );

        if (usageCount.cnt >= coupon.limit_per_user) {
          throw new errors.BAD_REQUEST(
            `Coupon usage limit reached for "${updatedGuestData.coupon_code}". This user account has already used this coupon ${usageCount.cnt} time(s).`
          );
        }


      }
    }

    /* -------------------- 3️⃣ Convert to Actual Order -------------------- */
    return await createActualOrderFromGuest(connection, id, { ...updatedGuestData, _reqIp: req.ip }, orderItems);
  }
);

// 6. Verify Phone OTP
exports.verifyGuestPhone = api(
  {
    params: {
      id: { type: "string", required: true }
    },
    body: {
      otp: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const { otp } = req.typed.body;

    if (otp.length != 6) {
      throw new errors.INVALID_FIELDS_PROVIDED("OTP must be exactly 6 digits");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (!guestOrder.phone) {
      throw new errors.BAD_REQUEST("No phone number associated with this order");
    }

    if (guestOrder.is_phone_verified) {
      throw new errors.BAD_REQUEST("Phone is already verified");
    }

    if (!guestOrder.otp || !guestOrder.otp_exp) {
      throw new errors.BAD_REQUEST("OTP not generated");
    }

    if (new Date() > new Date(guestOrder.otp_exp)) {
      throw new errors.BAD_REQUEST("OTP has expired");
    }

    if (guestOrder.otp !== otp) {
      throw new errors.BAD_REQUEST("Invalid OTP");
    }

    await connection.query(
      `UPDATE guest_orders 
       SET is_phone_verified = 1, otp = NULL, otp_exp = NULL, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    return {
      success: true,
      message: "Phone verified successfully"
    };
  }
);

// 7. Add Single Item to Guest Order (UPDATED for deduplication)
exports.addGuestOrderItem = api(
  {
    params: {
      id: { type: "string", required: true }
    },
    body: orderItemSchema.body
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const { product_sku_id, quantity } = req.typed.body;

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new errors.INVALID_FIELDS_PROVIDED("Quantity must be a positive integer");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'pending') {
      throw new errors.BAD_REQUEST("Cannot add items to a completed or cancelled order");
    }

    const variation = await connection.queryOne(
      `SELECT s.*, p.name AS product_name, p.free_delivery,
              c.name AS color_name, c.hex AS color_hex,
              v.name AS variant_name, a.name AS attribute_name
       FROM product_skus s
       JOIN products p ON p.id = s.product_id
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       LEFT JOIN colors c ON c.id = s.color_id
       LEFT JOIN variants v ON v.id = s.variant_id
       LEFT JOIN attributes a ON a.id = v.attribute_id
       WHERE s.id = ? AND s.status = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [product_sku_id]
    );

    if (!variation) {
      throw new errors.NOT_FOUND("Product variation not found");
    }

    // ===========================================
    // ADDED: Check free_delivery consistency when adding item
    // ===========================================
    const existingItems = await connection.query(
      `SELECT gi.*, p.free_delivery 
       FROM guest_order_items gi
       JOIN product_skus ps ON ps.id = gi.product_sku_id
       JOIN products p ON p.id = ps.product_id
       WHERE gi.guest_order_id = ?`,
      [id]
    );

    // Mixed delivery carts are allowed — free + paid items can coexist.

    // Check if item already exists in guest order
    const existingItem = await connection.queryOne(
      `SELECT * FROM guest_order_items 
       WHERE guest_order_id = ? AND product_sku_id = ?`,
      [id, product_sku_id]
    );

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;

      if (variation.stock < newQuantity) {
        throw new errors.BAD_REQUEST(
          `Insufficient stock. Available: ${variation.stock}, Current in cart: ${existingItem.quantity}, Requested additional: ${quantity}`
        );
      }

      const rawUnitPrice = Number(variation.selling_price);
      const skuDiscount = variation.discount_type === 1
        ? (rawUnitPrice * variation.discount) / 100
        : Number(variation.discount || 0);
      const finalUnitPrice = rawUnitPrice - skuDiscount;
      const lineTotal = finalUnitPrice * newQuantity;

      await connection.query(
        `UPDATE guest_order_items 
         SET quantity = ?, final_unit_price = ?, line_total = ? 
         WHERE id = ?`,
        [newQuantity, finalUnitPrice, lineTotal, existingItem.id]
      );

      const totals = await calculateGuestOrderTotals(connection, id);

      return {
        success: true,
        message: "Item quantity updated in guest order",
        updated_quantity: newQuantity,
        ...totals
      };
    }

    // Add new item
    if (variation.stock < quantity) {
      throw new errors.BAD_REQUEST(`Insufficient stock. Available: ${variation.stock}`);
    }

    const rawUnitPrice = Number(variation.selling_price);
    const skuDiscount = variation.discount_type === 1
      ? (rawUnitPrice * variation.discount) / 100
      : Number(variation.discount || 0);
    const finalUnitPrice = rawUnitPrice - skuDiscount;
    const lineTotal = finalUnitPrice * quantity;

    const productImage = await connection.queryOne(
      `SELECT img_path FROM product_images 
       WHERE product_id = ? 
       ORDER BY priority LIMIT 1`,
      [variation.product_id]
    );

    await connection.query(
      `INSERT INTO guest_order_items (
        guest_order_id, product_id, product_sku_id, product_name,
        product_image, color_id, color_name, color_hex,
        attribute_id, variant_id, variant_name, quantity,
        buying_price, selling_price, discount, discount_type,
        final_unit_price, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        variation.product_id,
        variation.id,
        variation.product_name,
        productImage?.img_path || null,
        variation.color_id,
        variation.color_name || null,
        variation.color_hex || null,
        variation.attribute_id || null,
        variation.variant_id || null,
        variation.variant_name || null,
        quantity,
        variation.buying_price,
        rawUnitPrice,
        variation.discount || 0,
        variation.discount_type || 0,
        finalUnitPrice,
        lineTotal
      ]
    );

    const totals = await calculateGuestOrderTotals(connection, id);

    return {
      success: true,
      message: "Item added to guest order",
      ...totals
    };
  }
);

// 8. Remove Single Item from Guest Order
exports.removeGuestOrderItem = api(
  {
    params: {
      id: { type: "string", required: true },
      itemId: { type: "int", required: true }
    }
  },
  async (req, connection) => {
    const { id, itemId } = req.typed.params;

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'pending') {
      throw new errors.BAD_REQUEST("Cannot remove items from a completed or cancelled order");
    }

    const result = await connection.query(
      `DELETE FROM guest_order_items WHERE id = ? AND guest_order_id = ?`,
      [itemId, id]
    );

    if (result.affectedRows === 0) {
      throw new errors.NOT_FOUND("Order item not found");
    }

    const totals = await calculateGuestOrderTotals(connection, id);

    return {
      success: true,
      message: "Item removed from guest order",
      ...totals
    };
  }
);

// 9. Bulk Add Items to Guest Order (UPDATED for deduplication)
exports.bulkAddGuestOrderItems = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const orderItemsInput = req.body.items;

    if (!Array.isArray(orderItemsInput) || !orderItemsInput.length) {
      throw new errors.BAD_REQUEST("items must be a non-empty array");
    }

    const order_items = orderItemsInput.map((item, index) => {
      try {
        return validateAndCast({ body: item }, orderItemSchema).body;
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Item at index ${index}: ${err.message}`
        );
      }
    });

    // Validate quantities
    order_items.forEach((item, index) => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Item at index ${index}: Quantity must be a positive integer`
        );
      }
    });

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'pending') {
      throw new errors.BAD_REQUEST("Cannot add items to a completed or cancelled order");
    }

    // Get unique SKU IDs
    const uniqueSkuIds = [...new Set(order_items.map(item => item.product_sku_id))];
    const variations = await connection.query(
      `SELECT s.*, p.name AS product_name, p.free_delivery,
              c.name AS color_name, c.hex AS color_hex,
              v.name AS variant_name, a.name AS attribute_name
       FROM product_skus s
       JOIN products p ON p.id = s.product_id
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       LEFT JOIN colors c ON c.id = s.color_id
       LEFT JOIN variants v ON v.id = s.variant_id
       LEFT JOIN attributes a ON a.id = v.attribute_id
       WHERE s.id IN (?) AND s.status = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [uniqueSkuIds]
    );

    if (variations.length !== uniqueSkuIds.length) {
      const foundIds = variations.map(v => v.id);
      const missingIds = uniqueSkuIds.filter(id => !foundIds.includes(id));
      throw new errors.BAD_REQUEST(
        `Some product variations are invalid or belong to an inactive category: ${missingIds.join(', ')}`
      );
    }

    const variationMap = new Map();
    variations.forEach(v => variationMap.set(v.id, v));

    // ===========================================
    // ADDED: Check free_delivery consistency for bulk add
    // ===========================================
    const existingItems = await connection.query(
      `SELECT gi.*, p.free_delivery 
       FROM guest_order_items gi
       JOIN product_skus ps ON ps.id = gi.product_sku_id
       JOIN products p ON p.id = ps.product_id
       WHERE gi.guest_order_id = ?`,
      [id]
    );

    // Mixed delivery carts are allowed — free + paid items can coexist.
    // ===========================================

    // Get existing items in the guest order
    const existingItemsMap = new Map();
    existingItems.forEach(item => existingItemsMap.set(item.product_sku_id, item));

    // Calculate total quantities needed per SKU
    const totalQuantitiesBySku = new Map();
    order_items.forEach(item => {
      const current = totalQuantitiesBySku.get(item.product_sku_id) || 0;
      totalQuantitiesBySku.set(item.product_sku_id, current + item.quantity);
    });

    // Validate stock considering existing quantities
    for (const [skuId, totalQuantity] of totalQuantitiesBySku) {
      const variation = variationMap.get(skuId);
      const existingItem = existingItemsMap.get(skuId);
      const existingQuantity = existingItem ? existingItem.quantity : 0;

      if (variation.stock < (existingQuantity + totalQuantity)) {
        throw new errors.BAD_REQUEST(
          `Insufficient stock for product ${skuId}. ` +
          `Available: ${variation.stock}, Current in cart: ${existingQuantity}, Requested additional: ${totalQuantity}`
        );
      }
    }

    // Get product images
    const productIds = [...new Set(variations.map(v => v.product_id))];
    const productImages = await connection.query(
      `SELECT product_id, img_path 
       FROM product_images 
       WHERE product_id IN (?)
       ORDER BY priority`,
      [productIds]
    );

    const imageMap = new Map();
    productImages.forEach(img => {
      if (!imageMap.has(img.product_id)) {
        imageMap.set(img.product_id, img.img_path);
      }
    });

    // Group items by SKU and sum quantities
    const itemsBySku = new Map();
    order_items.forEach(item => {
      const current = itemsBySku.get(item.product_sku_id) || 0;
      itemsBySku.set(item.product_sku_id, current + item.quantity);
    });

    // Update existing items or insert new ones
    for (const [skuId, additionalQuantity] of itemsBySku) {
      const variation = variationMap.get(skuId);
      const existingItem = existingItemsMap.get(skuId);

      const rawUnitPrice = Number(variation.selling_price);
      const skuDiscount = variation.discount_type === 1
        ? (rawUnitPrice * variation.discount) / 100
        : Number(variation.discount || 0);
      const finalUnitPrice = rawUnitPrice - skuDiscount;

      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + additionalQuantity;
        const lineTotal = finalUnitPrice * newQuantity;

        await connection.query(
          `UPDATE guest_order_items 
           SET quantity = ?, final_unit_price = ?, line_total = ? 
           WHERE id = ?`,
          [newQuantity, finalUnitPrice, lineTotal, existingItem.id]
        );
      } else {
        // Insert new item
        const lineTotal = finalUnitPrice * additionalQuantity;

        await connection.query(
          `INSERT INTO guest_order_items (
            guest_order_id, product_id, product_sku_id, product_name,
            product_image, color_id, color_name, color_hex,
            attribute_id, variant_id, variant_name, quantity,
            buying_price, selling_price, discount, discount_type,
            final_unit_price, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            variation.product_id,
            variation.id,
            variation.product_name,
            imageMap.get(variation.product_id) || null,
            variation.color_id,
            variation.color_name || null,
            variation.color_hex || null,
            variation.attribute_id || null,
            variation.variant_id || null,
            variation.variant_name || null,
            additionalQuantity,
            variation.buying_price,
            rawUnitPrice,
            variation.discount || 0,
            variation.discount_type || 0,
            finalUnitPrice,
            lineTotal
          ]
        );
      }
    }

    const totals = await calculateGuestOrderTotals(connection, id);

    return {
      success: true,
      message: "Items processed in guest order",
      count: order_items.length,
      ...totals
    };
  }
);

// 10. Bulk Remove Items by IDs
exports.bulkRemoveGuestOrderItems = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const itemIdsInput = req.body.item_ids;

    if (!Array.isArray(itemIdsInput) || !itemIdsInput.length) {
      throw new errors.BAD_REQUEST("item_ids must be a non-empty array");
    }

    const itemIds = itemIdsInput.map((itemId, index) => {
      const num = parseInt(itemId);
      if (isNaN(num) || num < 1) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Item ID at index ${index} must be a valid positive number`
        );
      }
      return num;
    });

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'pending') {
      throw new errors.BAD_REQUEST("Cannot remove items from a completed or cancelled order");
    }

    const existingItems = await connection.query(
      `SELECT id FROM guest_order_items 
       WHERE id IN (?) AND guest_order_id = ?`,
      [itemIds, id]
    );

    const existingItemIds = existingItems.map(item => item.id);

    if (existingItemIds.length === 0) {
      throw new errors.NOT_FOUND("No matching items found to remove");
    }

    const result = await connection.query(
      `DELETE FROM guest_order_items 
       WHERE id IN (?) AND guest_order_id = ?`,
      [existingItemIds, id]
    );

    const totals = await calculateGuestOrderTotals(connection, id);

    return {
      success: true,
      message: `${result.affectedRows} item(s) removed from guest order`,
      removed_count: result.affectedRows,
      ...totals
    };
  }
);

// 11. Bulk Update Item Quantities
exports.bulkUpdateGuestOrderItems = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const updatesInput = req.body.updates;

    if (!Array.isArray(updatesInput) || !updatesInput.length) {
      throw new errors.BAD_REQUEST("updates must be a non-empty array");
    }

    const updates = updatesInput.map((update, index) => {
      try {
        return validateAndCast({ body: update }, updateItemSchema).body;
      } catch (err) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Update at index ${index}: ${err.message}`
        );
      }
    });

    // Validate quantities
    updates.forEach((update, index) => {
      if (!Number.isInteger(update.quantity) || update.quantity < 1) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          `Update at index ${index}: Quantity must be a positive integer`
        );
      }
    });

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'pending') {
      throw new errors.BAD_REQUEST("Cannot update items in a completed or cancelled order");
    }

    const itemIds = updates.map(update => update.item_id);

    const existingItems = await connection.query(
      `SELECT goi.*, ps.stock, ps.selling_price, ps.discount, ps.discount_type
       FROM guest_order_items goi
       JOIN product_skus ps ON ps.id = goi.product_sku_id
       WHERE goi.id IN (?) AND goi.guest_order_id = ?`,
      [itemIds, id]
    );

    if (existingItems.length !== updates.length) {
      throw new errors.BAD_REQUEST("Some items not found or don't belong to this guest order");
    }

    const existingItemMap = new Map();
    existingItems.forEach(item => existingItemMap.set(item.id, item));

    const validUpdates = [];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      const existingItem = existingItemMap.get(update.item_id);

      if (!existingItem) {
        throw new errors.BAD_REQUEST(`Item ${update.item_id} not found`);
      }

      if (existingItem.stock < update.quantity) {
        throw new errors.BAD_REQUEST(
          `Item ${update.item_id}: Insufficient stock. Available: ${existingItem.stock}, Requested: ${update.quantity}`
        );
      }

      validUpdates.push({
        item_id: update.item_id,
        quantity: update.quantity,
        existingItem
      });
    }

    for (const update of validUpdates) {
      const rawUnitPrice = Number(update.existingItem.selling_price);
      const skuDiscount = update.existingItem.discount_type === 1
        ? (rawUnitPrice * update.existingItem.discount) / 100
        : Number(update.existingItem.discount || 0);
      const finalUnitPrice = rawUnitPrice - skuDiscount;
      const lineTotal = finalUnitPrice * update.quantity;

      await connection.query(
        `UPDATE guest_order_items 
         SET quantity = ?, final_unit_price = ?, line_total = ?,
             discount = ?, discount_type = ?, selling_price = ?
         WHERE id = ? AND guest_order_id = ?`,
        [
          update.quantity,
          finalUnitPrice,
          lineTotal,
          update.existingItem.discount || 0,
          update.existingItem.discount_type || 0,
          rawUnitPrice,
          update.item_id,
          id
        ]
      );
    }

    const totals = await calculateGuestOrderTotals(connection, id);

    return {
      success: true,
      message: `${updates.length} item(s) updated`,
      updated_count: updates.length,
      ...totals
    };
  }
);

// 12. Replace All Items (Clear and Add)
exports.replaceGuestOrderItems = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;
    const orderItemsInput = req.body.items;

    if (!Array.isArray(orderItemsInput)) {
      throw new errors.BAD_REQUEST("items must be an array");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'pending') {
      throw new errors.BAD_REQUEST("Cannot modify items in a completed or cancelled order");
    }

    // Clear all existing items
    await connection.query(
      `DELETE FROM guest_order_items WHERE guest_order_id = ?`,
      [id]
    );

    // If new items are provided, add them (with deduplication)
    if (orderItemsInput.length > 0) {
      const order_items = orderItemsInput.map((item, index) => {
        try {
          return validateAndCast({ body: item }, orderItemSchema).body;
        } catch (err) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            `Item at index ${index}: ${err.message}`
          );
        }
      });

      // Validate quantities
      order_items.forEach((item, index) => {
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new errors.INVALID_FIELDS_PROVIDED(
            `Item at index ${index}: Quantity must be a positive integer`
          );
        }
      });

      // Get unique SKUs with free_delivery info and category status check
      const uniqueSkuIds = [...new Set(order_items.map(item => item.product_sku_id))];
      const variations = await connection.query(
        `SELECT s.*, p.name AS product_name, p.free_delivery 
         FROM product_skus s
         JOIN products p ON p.id = s.product_id
         INNER JOIN main_categories mc ON mc.id = p.main_category_id
         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
         WHERE s.id IN (?) AND s.status = 1
           AND mc.status = 1
           AND (p.sub_category_id IS NULL OR sc.status = 1)
           AND (p.child_category_id IS NULL OR cc.status = 1)`,
        [uniqueSkuIds]
      );

      if (variations.length !== uniqueSkuIds.length) {
        throw new errors.BAD_REQUEST("Some product variations are invalid or inactive");
      }

      const variationMap = new Map();
      variations.forEach(v => variationMap.set(v.id, v));

      // Calculate total quantities per SKU
      const itemsBySku = new Map();
      order_items.forEach(item => {
        const current = itemsBySku.get(item.product_sku_id) || 0;
        itemsBySku.set(item.product_sku_id, current + item.quantity);
      });

      // ===========================================
      // Mixed delivery carts are allowed — free + paid items can coexist.
      // ===========================================

      // Validate stock
      for (const [skuId, totalQuantity] of itemsBySku) {
        const variation = variationMap.get(skuId);

        if (variation.stock < totalQuantity) {
          throw new errors.BAD_REQUEST(
            `Insufficient stock for product ${skuId}. Available: ${variation.stock}, Requested: ${totalQuantity}`
          );
        }
      }

      // Get product images
      const productIds = [...new Set(variations.map(v => v.product_id))];
      const productImages = await connection.query(
        `SELECT product_id, img_path 
         FROM product_images 
         WHERE product_id IN (?)
         ORDER BY priority`,
        [productIds]
      );

      const imageMap = new Map();
      productImages.forEach(img => {
        if (!imageMap.has(img.product_id)) {
          imageMap.set(img.product_id, img.img_path);
        }
      });

      // Insert deduplicated items
      for (const [skuId, totalQuantity] of itemsBySku) {
        const variation = variationMap.get(skuId);

        const rawUnitPrice = Number(variation.selling_price);
        const skuDiscount = variation.discount_type === 1
          ? (rawUnitPrice * variation.discount) / 100
          : Number(variation.discount || 0);
        const finalUnitPrice = rawUnitPrice - skuDiscount;
        const lineTotal = finalUnitPrice * totalQuantity;

        await connection.query(
          `INSERT INTO guest_order_items (
            guest_order_id, product_id, product_sku_id, product_name,
            product_image, color_id, color_name, color_hex,
            attribute_id, variant_id, variant_name, quantity,
            buying_price, selling_price, discount, discount_type,
            final_unit_price, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            variation.product_id,
            variation.id,
            variation.product_name,
            imageMap.get(variation.product_id) || null,
            variation.color_id || null,
            variation.color_name || null,
            variation.color_hex || null,
            variation.attribute_id || null,
            variation.variant_id || null,
            variation.variant_name || null,
            totalQuantity,
            variation.buying_price,
            rawUnitPrice,
            variation.discount || 0,
            variation.discount_type || 0,
            finalUnitPrice,
            lineTotal
          ]
        );
      }
    }

    const totals = await calculateGuestOrderTotals(connection, id);

    return {
      success: true,
      message: orderItemsInput.length > 0
        ? `Replaced with ${orderItemsInput.length} item(s)`
        : "Cleared all items",
      count: totals.items.length,
      ...totals
    };
  }
);

// 13. Cancel Guest Order
exports.cancelGuestOrder = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;

    /** 1️⃣ Fetch guest order */
    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    /** 2️⃣ Already cancelled */
    if (guestOrder.status === 'cancelled') {
      throw new errors.BAD_REQUEST("Order is already cancelled");
    }

    /**
     * 3️⃣ If guest order is COMPLETE,
     *     we must check the real order table
     */
    if (guestOrder.status === 'complete') {
      const order = await connection.queryOne(
        `SELECT order_status, payment_status
         FROM orders
         WHERE guest_order_uuid = ?`,
        [guestOrder.id]
      );

      if (!order) {
        throw new errors.ERROR_IN_EXECUTION(
          "Order record missing for completed guest order"
        );
      }

      // Strict cancel rule (same as user cancel)
      if (
        order.order_status !== 'new' ||
        order.payment_status !== 'unpaid'
      ) {
        throw new errors.BAD_REQUEST(
          "Order cannot be cancelled after processing or payment"
        );
      }

      /** Cancel BOTH order & guest order */
      await connection.query(
        `UPDATE orders
         SET order_status = 'cancelled',
             cancelled_at = NOW()
         WHERE guest_order_uuid = ?`,
        [guestOrder.id]
      );
    }

    /** 4️⃣ Cancel guest order */
    await connection.query(
      `UPDATE guest_orders
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    return {
      success: true,
      message: "Guest order cancelled successfully"
    };
  }
);

// 14. Resend OTP
exports.resendGuestOTP = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { id } = req.typed.params;

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (!guestOrder.phone) {
      throw new errors.BAD_REQUEST("No phone number associated with this order");
    }

    if (guestOrder.is_phone_verified) {
      throw new errors.BAD_REQUEST("Phone is already verified");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    await connection.query(
      `UPDATE guest_orders 
       SET otp = ?, otp_exp = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [otp, otpExp, id]
    );

    const message = `Your ${BRAND_NAME} verification OTP is ${otp}`;
    await sendSMS(connection, guestOrder.phone, message);

    return {
      success: true,
      message: "OTP resent successfully"
    };
  }
);

// 15. Admin API to delete guest order (soft delete)
exports.adminDeleteGuestOrder = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { id } = req.typed.params;


    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ?`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.deleted_at) {
      throw new errors.BAD_REQUEST("Guest order is already deleted");
    }

    if (guestOrder.status === 'complete') {
      throw new errors.BAD_REQUEST("Cannot delete a completed order");
    }

    await connection.query(
      `UPDATE guest_orders 
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Guest order deleted successfully",
      guest_order_id: id
    };
  })
);

// 16. Admin API to restore deleted guest order
exports.adminRestoreGuestOrder = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { id } = req.typed.params;

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ?`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (!guestOrder.deleted_at) {
      throw new errors.BAD_REQUEST("Guest order is not deleted");
    }

    await connection.query(
      `UPDATE guest_orders 
       SET deleted_at = NULL, updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    bumpOrderEventVersion();
    return {
      success: true,
      message: "Guest order restored successfully",
      guest_order_id: id
    };
  })
);

// 17. Admin API to get all guest orders (clean & optimized)
exports.adminGetGuestOrders = api(
  {
    query: {
      is_deleted: { type: "bool", required: false },
      status: { type: "string", required: false },
      search: { type: "string", required: false },
      sort_by: { type: "string", required: false, default: "created_at" },
      sort_order: { type: "string", required: false, default: "desc" },
      limit: { type: "int", required: false, default: 20 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {

    const {
      is_deleted,
      status,
      search,
      sort_by,
      sort_order,
      limit,
      offset
    } = req.typed.query;

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    /** 2️⃣ Validation */
    const validSortColumns = [
      'created_at', 'updated_at', 'grand_total',
      'name', 'phone', 'email'
    ];

    if (!validSortColumns.includes(sort_by)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        `sort_by must be one of: ${validSortColumns.join(', ')}`
      );
    }

    if (!['asc', 'desc'].includes(sort_order.toLowerCase())) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "sort_order must be either 'asc' or 'desc'"
      );
    }

    if (status) {
      validateStatus(status);
    }

    if (search && (search.length < 2 || search.length > 100)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Search term must be between 2 and 100 characters"
      );
    }

    if (limit < 1 || limit > 100) {
      throw new errors.INVALID_FIELDS_PROVIDED("Limit must be between 1 and 100");
    }

    if (offset < 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("Offset must be >= 0");
    }

    /** 3️⃣ WHERE clause */
    const where = [];
    const params = [];

    if (is_deleted == true) {
      where.push('go.deleted_at IS NOT NULL');
    } else {
      where.push('go.deleted_at IS NULL');
    }

    if (status) {
      where.push('go.status = ?');
      params.push(status);
    }

    if (search) {
      where.push(`(
        go.name LIKE ? OR
        go.phone LIKE ? OR
        go.email LIKE ? OR
        go.full_address LIKE ? OR
        go.id LIKE ?
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    /** 4️⃣ ORDER BY */
    const orderByClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;

    /** 5️⃣ Count */
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM guest_orders go
      ${whereClause}
    `;

    const { total } = await connection.queryOne(countQuery, params);

    /** 6️⃣ Data query (CLEAN PAYMENT LOGIC) */
    const dataQuery = `
      SELECT
        go.*,
        gt.grand_total,

        CASE
          WHEN go.status != 'complete' OR go.order_id IS NULL
            THEN 'unpaid'
          ELSE COALESCE(o.payment_status, 'unpaid')
        END AS payment_status,

        CASE
          WHEN go.status != 'complete' OR go.order_id IS NULL
            THEN 0
          ELSE COALESCE(o.paid_amount, 0)
        END AS paid_amount,

        CASE
          WHEN go.status != 'complete' OR go.order_id IS NULL
            THEN gt.grand_total
          ELSE COALESCE(o.due_amount, 0)
        END AS due_amount

      FROM guest_orders go

      LEFT JOIN (
        SELECT
          guest_order_id,
          COALESCE(SUM(line_total), 0) AS grand_total
        FROM guest_order_items
        GROUP BY guest_order_id
      ) gt ON gt.guest_order_id = go.id

      LEFT JOIN orders o ON o.id = go.order_id

      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const guestOrders = await connection.query(
      dataQuery,
      [...params, limit, offset]
    );

    /** 8️⃣ Response */
    return {
      success: true,
      guest_orders: guestOrders,
       
        total,
        limit,
        offset 
      
      // counts: statusCounts
    };
  })
);

// 18. Admin API to update guest order status
exports.adminUpdateGuestOrderStatus = api(
  {
    params: {
      id: { type: "string", required: true }
    },
    body: {
      status: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { id } = req.typed.params;
    const { status } = req.typed.body;

    // Validate status
    validateStatus(status);

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ?`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.deleted_at) {
      throw new errors.BAD_REQUEST("Cannot update status of a deleted order");
    }

    if (guestOrder.status === 'complete' && status === 'pending') {
      throw new errors.BAD_REQUEST("Cannot change a completed order back to pending");
    }

    if (guestOrder.status === 'complete' && status === 'cancelled') {
      throw new errors.BAD_REQUEST("Cannot change a completed order back to cancelled from here, Change it from order dashboard");
    }

    if (status === 'complete') {
      const orderItems = await connection.query(
        `SELECT * FROM guest_order_items WHERE guest_order_id = ?`,
        [id]
      );

      if (!orderItems.length) {
        throw new errors.BAD_REQUEST("Cannot complete an order without items");
      }

      if (!guestOrder.is_phone_verified) {
        throw new errors.BAD_REQUEST("Cannot complete order without verified phone");
      }

      if (!guestOrder.full_address) {
        throw new errors.BAD_REQUEST("Cannot complete order without address");
      }

      if (!guestOrder.name) {
        throw new errors.BAD_REQUEST("Cannot complete order without name");
      }

      // Validate required payment fields
      if (!guestOrder.payment_type) {
        throw new errors.BAD_REQUEST("Payment type is required to complete order");
      }

      if (!guestOrder.delivery_charge_id) {
        throw new errors.BAD_REQUEST("Delivery charge ID is required to complete order");
      }

      // Validate guest data before completing order
      validateName(guestOrder.name);
      validatePhone(guestOrder.phone);
      validateAddress(guestOrder.full_address, "Full address");
      validatePaymentType(guestOrder.payment_type);
      validateDeliveryChargeId(guestOrder.delivery_charge_id);
      if (guestOrder.email) validateEmail(guestOrder.email);
      if (guestOrder.city) validateCity(guestOrder.city);
      if (guestOrder.zip_code) validateZipCode(guestOrder.zip_code);
      if (guestOrder.note) validateNote(guestOrder.note);

      return await createActualOrderFromGuest(connection, id, { ...guestOrder, _reqIp: req.ip }, orderItems);
    }

    await connection.query(
      `UPDATE guest_orders 
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, id]
    );

    bumpOrderEventVersion();
    return {
      success: true,
      message: `Guest order status updated to ${status}`,
      guest_order_id: id,
      new_status: status
    };
  })
);

// 19. Admin API to get guest order details (simplified)
exports.adminGetGuestOrderDetails = api(
  {
    params: {
      id: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { id } = req.typed.params;

    /** 1️⃣ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Permission denied");
    }

    const guestOrder = await connection.queryOne(
      `SELECT * FROM guest_orders WHERE id = ?`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    const totals = await calculateGuestOrderTotals(connection, id);

    // For incomplete orders, use default payment info
    if (guestOrder.status !== 'complete' || !guestOrder.order_id) {
      return {
        success: true,
        guest_order: {
          ...guestOrder,
          ...{
          payment_status: 'unpaid',
          paid_amount: 0,
          due_amount: totals.grand_total || 0
        },
          ...totals
        },
        
      };
    }

    // For complete orders, try to get actual order data
    const orderData = await connection.queryOne(
      `SELECT 
        payment_status,
        COALESCE(paid_amount, 0) as paid_amount,
        COALESCE(due_amount, 0) as due_amount
       FROM orders 
       WHERE id = ?`,
      [guestOrder.order_id]
    );

    const actualOrderInfo = orderData || {
      payment_status: 'unpaid',
      paid_amount: 0,
      due_amount: totals.grand_total || 0
    };

    return {
      success: true,
      guest_order: {
        ...guestOrder,
        ...actualOrderInfo,
        ...totals
      }, 
      
    };
  }
));

// 20. Guest Order Payment Initiation - FIXED to reuse existing pending payments
exports.initiateGuestPayment = api(
  {
    params: {
      guestOrderId: { type: "string", required: true }
    },
    body: {
      payment_method: { type: "string", required: true } // sslcommerz, bkash, nagad, shurjopay, rocket
    }
  },
  async (req, connection) => {
    const { guestOrderId } = req.typed.params;
    const { payment_method } = req.typed.body;

    // Validate payment method
    if (!["sslcommerz", "bkash", "nagad", "shurjopay", "rocket"].includes(payment_method)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid payment method");
    }

    // Get guest order with associated actual order
    const guestOrder = await connection.queryOne(
      `SELECT 
         go.*,
         o.id as actual_order_id,
         o.customer_id,
         o.payment_type,
         o.payment_status,
         o.paid_amount,
         o.due_amount,
         o.order_status,
         o.grand_total,
         oa.full_address,
         oa.city,
         oa.zip_code
       FROM guest_orders go
       LEFT JOIN orders o ON o.guest_order_uuid = go.id
       LEFT JOIN order_addresses oa ON oa.order_id = o.id
       WHERE go.id = ? AND go.deleted_at IS NULL`,
      [guestOrderId]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (guestOrder.status !== 'complete') {
      throw new errors.BAD_REQUEST("Guest order must be completed before payment");
    }

    if (!guestOrder.actual_order_id) {
      throw new errors.BAD_REQUEST("No actual order found for this guest order");
    }

    // Check Order Status
    const BLOCKED_ORDER_STATUSES = {
      cancelled: "Order is cancelled",
      returned: "Order is returned",
      on_hold: "Order is on hold",
    };

    if (BLOCKED_ORDER_STATUSES[guestOrder.order_status]) {
      throw new errors.BAD_REQUEST(BLOCKED_ORDER_STATUSES[guestOrder.order_status]);
    }

    // Check Payment Status
    if (guestOrder.payment_status === "paid") {
      throw new errors.BAD_REQUEST("Order is already paid");
    }

    // Fetch payment config & validate provider
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

    // ===========================================
    // UPDATED: Use checkCODAdvanceRequired function for COD advance check
    // ===========================================
    let codAdvanceRequired = false;
    let codAdvancePercent = 0;

    if (guestOrder.payment_type === "cod") {
      codAdvanceRequired = await checkCODAdvanceRequired(connection);
      
      // Get the percentage value for calculation
      if (codAdvanceRequired) {
        for (const row of paymentConfigs) {
          if (row.provider === 'cod' && row.key_name === "MIN_ADVANCE_PAYMENT_PERCENTAGE") {
            codAdvancePercent = Number(row.value) || 0;
            break;
          }
        }
      }
    }
    // ===========================================

    // Check existing pending payment - FIXED: Now checking if payment amount matches
    let paymentRow = null;

    const existingPayment = await connection.queryOne(
      `SELECT *
       FROM order_payments
       WHERE order_id = ?
         AND provider = ?
         AND status = 'pending'
       ORDER BY id DESC
       LIMIT 1`,
      [guestOrder.actual_order_id, payment_method]
    );

    // Calculate payable amount to check if existing payment can be reused
    let payableAmount = guestOrder.due_amount;

    if (guestOrder.payment_type === "cod" && codAdvanceRequired) {
      payableAmount = Number(
        ((guestOrder.due_amount * codAdvancePercent) / 100).toFixed(2)
      );
    }

    if (guestOrder.payment_type === "mixed") {
      payableAmount = guestOrder.due_amount;
    }

    // Determine if we should reuse the existing payment
    const shouldReusePayment = existingPayment && (
      (guestOrder.payment_type === "gateway" &&
        guestOrder.payment_status === "unpaid") ||

      (guestOrder.payment_type === "cod" &&
        guestOrder.payment_status === "unpaid" &&
        codAdvanceRequired) ||

      (guestOrder.payment_type === "mixed" &&
        guestOrder.payment_status === "unpaid")
    );

    if (shouldReusePayment) {
      // Check if the amount matches - if not, we need a new payment row
      if (Number(existingPayment.amount) === payableAmount) {
        paymentRow = existingPayment;
      } else {
        // Amount has changed, create new payment row
        const insertResult = await connection.query(
          `INSERT INTO order_payments (
            order_id,
            provider,
            amount,
            status,
            created_at
          ) VALUES (?, ?, ?, 'pending', NOW())`,
          [guestOrder.actual_order_id, payment_method, payableAmount]
        );

        paymentRow = {
          id: insertResult.insertId,
          amount: payableAmount
        };
      }
    } else {
      // Insert new payment row
      const insertResult = await connection.query(
        `INSERT INTO order_payments (
          order_id,
          provider,
          amount,
          status,
          created_at
        ) VALUES (?, ?, ?, 'pending', NOW())`,
        [guestOrder.actual_order_id, payment_method, payableAmount]
      );

      paymentRow = {
        id: insertResult.insertId,
        amount: payableAmount
      };
    }

    // Prepare order data for payment handler
    const orderData = {
      id: guestOrder.actual_order_id,
      customer_id: guestOrder.customer_id,
      customer_name: guestOrder.name,
      customer_email: guestOrder.email || '',
      customer_phone: guestOrder.phone,
      payment_type: guestOrder.payment_type,
      payment_status: guestOrder.payment_status,
      paid_amount: guestOrder.paid_amount,
      due_amount: guestOrder.due_amount,
      order_status: guestOrder.order_status,
      grand_total: guestOrder.grand_total,
      address: {
        full_address: guestOrder.full_address,
        city: guestOrder.city,
        zip_code: guestOrder.zip_code
      }
    };

    // Route to payment handlers
    switch (payment_method) {
      case "sslcommerz":
        return await handleSSLCommerz(orderData, paymentConfig, paymentRow);

      case "bkash":
        return await handleBkash(orderData, paymentConfig, paymentRow);

      case "nagad":
        return await handleNagad(orderData, paymentConfig, paymentRow);

      case "shurjopay":
        return await handleShurjopay(orderData, paymentConfig, paymentRow);

      case "rocket":
        return await handleRocket(orderData, paymentConfig, paymentRow);

      default:
        throw new errors.BAD_REQUEST(
          "Automated payment is not supported for this method"
        );
    }
  }
);

// 21. Guest Order Payment Status Check
exports.checkGuestPaymentStatus = api(
  {
    params: {
      guestOrderId: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { guestOrderId } = req.typed.params;

    // Get guest order with associated actual order
    const guestOrder = await connection.queryOne(
      `SELECT 
         go.*,
         o.id as actual_order_id,
         o.payment_type,
         o.payment_status,
         o.paid_amount,
         o.due_amount,
         o.order_status,
         o.grand_total
       FROM guest_orders go
       LEFT JOIN orders o ON o.guest_order_uuid = go.id
       WHERE go.id = ? AND go.deleted_at IS NULL`,
      [guestOrderId]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND("Guest order not found");
    }

    if (!guestOrder.actual_order_id) {
      throw new errors.BAD_REQUEST("No actual order found for this guest order");
    }

    // Get payment history
    const payments = await connection.query(
      `SELECT * FROM order_payments 
       WHERE order_id = ? 
       ORDER BY created_at DESC`,
      [guestOrder.actual_order_id]
    );

    return {
      success: true,
      guest_order_id: guestOrderId,
      actual_order_id: guestOrder.actual_order_id,
      payment_status: guestOrder.payment_status,
      paid_amount: guestOrder.paid_amount,
      due_amount: guestOrder.due_amount,
      grand_total: guestOrder.grand_total,
      payment_history: payments,
      order_status: guestOrder.order_status
    };
  }
);


// ── 22. GET /api/v1/guest/orderPermissions ────────────────────────────────────
// Public endpoint: returns guest order placement requirement flags so the shop
// frontend can adapt its UI (email required label, verification steps, etc.).
// ─────────────────────────────────────────────────────────────────────────────
exports.getGuestOrderPermissions = api(
  {},
  async (req, connection) => {
    const rows = await getPermissionConfig(connection, false, 'order_place_permission');

    // extract guest scope into a flat map
    const cfg = {};
    for (const row of rows) {
      if (row.section !== 'order_place_permission' || row.scope !== 'guest') continue;
      if (row.value_type === 'bool') {
        cfg[row.key_name] = String(row.value) === 'true';
      } else if (row.value_type === 'number') {
        cfg[row.key_name] = parseFloat(row.value) || 0;
      } else {
        cfg[row.key_name] = row.value;
      }
    }

    return {
      success: true,
      email_required:              cfg.is_email_required              !== false, // default true
      email_verification_required: cfg.is_email_verification_required === true,  // default false
      phone_verification_required: cfg.is_phone_verification_required !== false,  // default true
    };
  }
);


// ── 23. POST /api/v1/guest/order/:id/send-email-otp ──────────────────────────
// Sends a 6-digit OTP to the email stored on a pending guest order.
// Rate limited by the global otpSendLimiter in index.js.
// ─────────────────────────────────────────────────────────────────────────────
exports.sendGuestEmailOtp = api(
  {
    params: { id: { type: 'string', required: true } }
  },
  async (req, connection) => {
    const { id } = req.typed.params;

    const guestOrder = await connection.queryOne(
      `SELECT id, email, name, is_email_verified FROM guest_orders WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND('Guest order not found');
    }
    if (!guestOrder.email) {
      throw new errors.BAD_REQUEST('No email address associated with this order');
    }
    if (guestOrder.is_email_verified) {
      throw new errors.BAD_REQUEST('Email is already verified');
    }

    // Generate 6-digit OTP, valid 10 minutes
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    await connection.query(
      `UPDATE guest_orders SET email_otp = ?, email_otp_exp = ?, updated_at = NOW() WHERE id = ?`,
      [otp, otpExp, id]
    );

    // Send via the shared email verification template
    await sendEmailVerification(connection, {
      name:  guestOrder.name || 'Guest',
      email: guestOrder.email,
      otp,
    });

    return {
      success: true,
      message: 'Verification OTP sent to your email',
    };
  }
);


// ── 24. POST /api/v1/guest/order/:id/verify-email-otp ────────────────────────
// Validates the email OTP and marks is_email_verified = 1 on the guest order.
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyGuestEmailOtp = api(
  {
    params: { id: { type: 'string', required: true } },
    body:   { otp: { type: 'string', required: true } }
  },
  async (req, connection) => {
    const { id }  = req.typed.params;
    const { otp } = req.typed.body;

    const guestOrder = await connection.queryOne(
      `SELECT id, email, email_otp, email_otp_exp, is_email_verified
       FROM guest_orders
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (!guestOrder) {
      throw new errors.NOT_FOUND('Guest order not found');
    }
    if (guestOrder.is_email_verified) {
      return { success: true, message: 'Email already verified' };
    }
    if (!guestOrder.email_otp || !guestOrder.email_otp_exp) {
      throw new errors.BAD_REQUEST('No OTP found. Please request a new one.');
    }
    if (new Date() > new Date(guestOrder.email_otp_exp)) {
      throw new errors.BAD_REQUEST('OTP has expired. Please request a new one.');
    }
    if (String(otp).trim() !== String(guestOrder.email_otp).trim()) {
      throw new errors.INVALID_FIELDS_PROVIDED('Invalid OTP');
    }

    // Mark email as verified, clear OTP
    await connection.query(
      `UPDATE guest_orders
       SET is_email_verified = 1, email_otp = NULL, email_otp_exp = NULL, updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
);
