/**
 * single_page_order.js
 *
 * Controller for the dedicated "Single Product Page" no-login checkout flow.
 * 7 endpoints:
 *   1. createSinglePageSession  — POST
 *   2. sendSinglePagePhoneOtp   — POST, rate limited
 *   3. verifySinglePagePhoneOtp — POST, rate limited
 *   4. sendSinglePageEmailOtp   — POST, rate limited
 *   5. verifySinglePageEmailOtp — POST, rate limited
 *   6. getSinglePageOrderPermissions — GET
 *   7. placeSinglePageOrder     — POST
 */

const { api } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require('validator');
const crypto = require('crypto');

const { getConfig } = require('../config/ApplicationSettingsDB');
const { getPermissionConfig } = require('../config/PermissionSettingsDB');
const { BRAND_NAME } = require('../config/ApplicationSettings');
const { sendSMS } = require('../helpers/sms');
const { sendEmailVerification } = require('../mail-templates/emailverify');
const { getFraudTestResults } = require('../helpers/courier');
const { autoAssignOrder } = require('./order_assignment');
const { sendAdminOrderNotification } = require('../helpers/notify');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');
const { calculateBulkComboDiscounts } = require('./user_discount');
const { handleSSLCommerz, handleBkash, handleNagad, handleShurjopay, handleRocket } = require('../service/payment');

// ── Validation helpers (mirrored from guest_order.js) ─────────────────────
function validateName(name) {
  if (!name || name.trim().length === 0) throw new errors.INVALID_FIELDS_PROVIDED('Name is required');
  if (name.length < 2 || name.length > 100) throw new errors.INVALID_FIELDS_PROVIDED('Name must be between 2 and 100 characters');
  return name.trim();
}

function validatePhone(phone) {
  if (!phone) throw new errors.INVALID_FIELDS_PROVIDED('Phone number is required');
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) throw new errors.INVALID_FIELDS_PROVIDED('Phone number must be between 10 and 15 digits');
  if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) throw new errors.INVALID_FIELDS_PROVIDED('Invalid phone number format');
  return phone.trim();
}

function validateAddress(address) {
  if (!address || address.trim().length === 0) throw new errors.INVALID_FIELDS_PROVIDED('Address is required');
  if (address.length < 10 || address.length > 500) throw new errors.INVALID_FIELDS_PROVIDED('Address must be between 10 and 500 characters');
  return address.trim();
}

// ── COD advance check (mirrored from guest_order.js) ──────────────────────
async function checkCODAdvanceRequired(connection) {
  const rows = await getConfig(connection, false, 'payment');
  let codActive = false;
  let advanceCfg = null;
  for (const row of rows) {
    if (row.provider !== 'cod') continue;
    if (row.key_name === 'CASH_ON_DELIVERY') codActive = Boolean(row.is_active);
    if (row.key_name === 'MIN_ADVANCE_PAYMENT_PERCENTAGE') {
      advanceCfg = { is_active: Boolean(row.is_active), value: Number(row.value) || 0 };
    }
  }
  if (!codActive) throw new errors.BAD_REQUEST('Cash on Delivery is currently unavailable');
  return Boolean(advanceCfg && advanceCfg.is_active && advanceCfg.value > 0);
}

// ── Helper: get or create session ─────────────────────────────────────────
async function getSession(connection, sessionId) {
  if (!sessionId) throw new errors.BAD_REQUEST('Session ID is required');
  const session = await connection.queryOne(
    'SELECT * FROM single_page_sessions WHERE id = ?',
    [sessionId]
  );
  if (!session) throw new errors.NOT_FOUND('Session not found. Please start a new session.');
  return session;
}

function createSessionId() {
  return crypto.randomUUID();
}

// ===========================================================================
// 0. POST /single-page/session
// Create/update a checkout session without sending OTP. Used when admin
// permissions do not require phone verification, or when email verification
// needs a session before the email OTP is sent.
// ===========================================================================
exports.createSinglePageSession = api(
  {
    body: {
      session_id: { type: 'string', required: false },
      phone: { type: 'string', required: true },
      email: { type: 'string', required: false }
    }
  },
  async (req, connection) => {
    const { phone, email } = req.typed.body;
    let { session_id } = req.typed.body;

    validatePhone(phone);
    if (email && !validator.isEmail(email)) throw new errors.INVALID_FIELDS_PROVIDED('Invalid email');

    if (session_id) {
      const session = await getSession(connection, session_id);
      await connection.query(
        `UPDATE single_page_sessions
         SET phone = ?, email = ?
         WHERE id = ?`,
        [phone, email || null, session.id]
      );
    } else {
      session_id = createSessionId();
      await connection.query(
        `INSERT INTO single_page_sessions (id, phone, email)
         VALUES (?, ?, ?)`,
        [session_id, phone, email || null]
      );
    }

    return { success: true, session_id };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. POST /single-page/send-phone-otp
// ═══════════════════════════════════════════════════════════════════════════
exports.sendSinglePagePhoneOtp = api(
  {
    body: {
      session_id: { type: 'string', required: false },
      phone: { type: 'string', required: true }
    }
  },
  async (req, connection) => {
    const { phone } = req.typed.body;
    let { session_id } = req.typed.body;
    validatePhone(phone);

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    if (session_id) {
      // Update existing session
      const session = await getSession(connection, session_id);
      await connection.query(
        `UPDATE single_page_sessions
         SET phone = ?, phone_otp = ?, phone_otp_exp = ?, is_phone_verified = 0
         WHERE id = ?`,
        [phone, otp, otpExp, session.id]
      );
    } else {
      // Create new session
      session_id = createSessionId();
      await connection.query(
        `INSERT INTO single_page_sessions (id, phone, phone_otp, phone_otp_exp)
         VALUES (?, ?, ?, ?)`,
        [session_id, phone, otp, otpExp]
      );
    }

    const message = `Your ${BRAND_NAME} verification OTP is ${otp}`;
    await sendSMS(connection, phone, message);

    return { success: true, session_id, message: 'OTP sent to your phone' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. POST /single-page/verify-phone-otp
// ═══════════════════════════════════════════════════════════════════════════
exports.verifySinglePagePhoneOtp = api(
  {
    body: {
      session_id: { type: 'string', required: true },
      otp: { type: 'string', required: true }
    }
  },
  async (req, connection) => {
    const { session_id, otp } = req.typed.body;
    if (otp.length !== 6) throw new errors.INVALID_FIELDS_PROVIDED('OTP must be exactly 6 digits');

    const session = await getSession(connection, session_id);

    if (session.is_phone_verified) return { success: true, message: 'Phone already verified' };
    if (!session.phone_otp || !session.phone_otp_exp) throw new errors.BAD_REQUEST('No OTP found. Please request a new one.');
    if (new Date() > new Date(session.phone_otp_exp)) throw new errors.BAD_REQUEST('OTP has expired. Please request a new one.');
    if (String(otp).trim() !== String(session.phone_otp).trim()) throw new errors.INVALID_FIELDS_PROVIDED('Invalid OTP');

    await connection.query(
      `UPDATE single_page_sessions
       SET is_phone_verified = 1, phone_otp = NULL, phone_otp_exp = NULL
       WHERE id = ?`,
      [session_id]
    );

    return { success: true, message: 'Phone verified successfully' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. POST /single-page/send-email-otp
// ═══════════════════════════════════════════════════════════════════════════
exports.sendSinglePageEmailOtp = api(
  {
    body: {
      session_id: { type: 'string', required: true },
      email: { type: 'string', required: true }
    }
  },
  async (req, connection) => {
    const { session_id, email } = req.typed.body;
    if (!validator.isEmail(email)) throw new errors.INVALID_FIELDS_PROVIDED('Invalid email format');

    const session = await getSession(connection, session_id);

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    await connection.query(
      `UPDATE single_page_sessions
       SET email = ?, email_otp = ?, email_otp_exp = ?, is_email_verified = 0
       WHERE id = ?`,
      [email, otp, otpExp, session.id]
    );

    await sendEmailVerification(connection, { name: 'Customer', email, otp });

    return { success: true, message: 'Verification OTP sent to your email' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 4. POST /single-page/verify-email-otp
// ═══════════════════════════════════════════════════════════════════════════
exports.verifySinglePageEmailOtp = api(
  {
    body: {
      session_id: { type: 'string', required: true },
      otp: { type: 'string', required: true }
    }
  },
  async (req, connection) => {
    const { session_id, otp } = req.typed.body;
    if (otp.length !== 6) throw new errors.INVALID_FIELDS_PROVIDED('OTP must be exactly 6 digits');

    const session = await getSession(connection, session_id);

    if (session.is_email_verified) return { success: true, message: 'Email already verified' };
    if (!session.email_otp || !session.email_otp_exp) throw new errors.BAD_REQUEST('No OTP found. Please request a new one.');
    if (new Date() > new Date(session.email_otp_exp)) throw new errors.BAD_REQUEST('OTP has expired. Please request a new one.');
    if (String(otp).trim() !== String(session.email_otp).trim()) throw new errors.INVALID_FIELDS_PROVIDED('Invalid OTP');

    await connection.query(
      `UPDATE single_page_sessions
       SET is_email_verified = 1, email_otp = NULL, email_otp_exp = NULL
       WHERE id = ?`,
      [session_id]
    );

    return { success: true, message: 'Email verified successfully' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 5. GET /single-page/order-permissions
// ═══════════════════════════════════════════════════════════════════════════
exports.getSinglePageOrderPermissions = api(
  {},
  async (req, connection) => {
    const rows = await getPermissionConfig(connection, false, 'order_place_permission');

    const cfg = {};
    for (const row of rows) {
      if (row.section !== 'order_place_permission' || row.scope !== 'single_page') continue;
      if (row.value_type === 'bool') cfg[row.key_name] = String(row.value) === 'true';
      else if (row.value_type === 'number') cfg[row.key_name] = parseFloat(row.value) || 0;
      else cfg[row.key_name] = row.value;
    }

    return {
      success: true,
      email_required: cfg.is_email_required !== false,
      email_verification_required: cfg.email_verified === true,
      phone_verification_required: cfg.phone_verified === true,
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 6. POST /single-page/place-order
// ═══════════════════════════════════════════════════════════════════════════
exports.placeSinglePageOrder = api(
  {
    body: {
      session_id: { type: 'string', required: true },
      product_id: { type: 'int', required: true },
      product_sku_id: { type: 'int', required: false },
      quantity: { type: 'int', required: false },
      items: { type: 'array', required: false },
      name: { type: 'string', required: true },
      phone: { type: 'string', required: true },
      email: { type: 'string', required: false },
      address_type: { type: 'string', required: false },
      full_address: { type: 'string', required: true },
      city: { type: 'string', required: false },
      zip_code: { type: 'string', required: false },
      delivery_charge_id: { type: 'int', required: true },
      location_mapping_id: { type: 'int', required: false },
      payment_type: { type: 'string', required: true },
      note: { type: 'string', required: false },
      fbp: { type: 'string', required: false },
      fbc: { type: 'string', required: false },
      capi_event_id: { type: 'string', required: false },
    }
  },
  async (req, connection) => {
    const b = req.typed.body;

    // ── 1. Input validation ───────────────────────────────────────────
    validateName(b.name);
    validatePhone(b.phone);
    validateAddress(b.full_address);
    if (b.email && !validator.isEmail(b.email)) throw new errors.INVALID_FIELDS_PROVIDED('Invalid email');
    if (!['gateway', 'cod', 'mixed'].includes(b.payment_type)) throw new errors.INVALID_FIELDS_PROVIDED('Invalid payment type');
    if (b.note && b.note.length > 1000) throw new errors.INVALID_FIELDS_PROVIDED('Note must be less than 1000 characters');

    // ── 1b. Normalize items array ────────────────────────────────────
    let orderItems;
    if (Array.isArray(b.items) && b.items.length > 0) {
      orderItems = b.items.map(it => ({
        product_sku_id: Number(it.product_sku_id),
        quantity: Number(it.quantity),
      }));
    } else if (b.product_sku_id && b.quantity) {
      orderItems = [{ product_sku_id: b.product_sku_id, quantity: b.quantity }];
    } else {
      throw new errors.INVALID_FIELDS_PROVIDED('Either items array or product_sku_id + quantity is required');
    }
    for (const item of orderItems) {
      if (!Number.isFinite(item.product_sku_id) || item.product_sku_id <= 0) throw new errors.INVALID_FIELDS_PROVIDED('Invalid product_sku_id in items');
      if (!Number.isFinite(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new errors.INVALID_FIELDS_PROVIDED('Quantity must be 1-100 per item');
    }

    // ── 2. Verify product has single page enabled ─────────────────────
    const product = await connection.queryOne(
      `SELECT p.id, p.name, p.free_delivery, p.has_single_product_page
       FROM products p
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
       LEFT JOIN child_categories cc ON cc.id = p.child_category_id
       WHERE p.id = ? AND p.status = 1 AND p.has_single_product_page = 1
         AND mc.status = 1
         AND (p.sub_category_id IS NULL OR sc.status = 1)
         AND (p.child_category_id IS NULL OR cc.status = 1)`,
      [b.product_id]
    );
    if (!product) throw new errors.NOT_FOUND('Product not found or single page is not enabled.');

    // ── 3. Verify SKUs ────────────────────────────────────────────────
    const resolvedItems = [];
    for (const item of orderItems) {
      const sku = await connection.queryOne(
        `SELECT s.*, p.name AS product_name,
                COALESCE(s.free_delivery, p.free_delivery) AS effective_free_delivery,
                c.name AS color_name, c.hex AS color_hex,
                v.name AS variant_name, v.attribute_id,
                a.name AS attribute_name,
                (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1) AS product_image
         FROM product_skus s
         JOIN products p ON p.id = s.product_id
         LEFT JOIN colors c ON c.id = s.color_id
         LEFT JOIN variants v ON v.id = s.variant_id
         LEFT JOIN attributes a ON a.id = v.attribute_id
         WHERE s.id = ? AND s.product_id = ? AND s.status = 1`,
        [item.product_sku_id, b.product_id]
      );
      if (!sku) throw new errors.BAD_REQUEST(`Invalid or inactive product variation (SKU ${item.product_sku_id}).`);
      if (sku.stock < item.quantity) {
        throw new errors.BAD_REQUEST(`Insufficient stock for SKU ${sku.sku}. Available: ${sku.stock}, Requested: ${item.quantity}`);
      }
      resolvedItems.push({ ...item, sku });
    }

    // ── 4. Validate delivery charge ───────────────────────────────────
    const deliveryCharge = await connection.queryOne(
      'SELECT * FROM delivery_charges WHERE id = ? AND status = 1',
      [b.delivery_charge_id]
    );
    if (!deliveryCharge) throw new errors.BAD_REQUEST('Invalid delivery charge');

    // ── 5. Verify OTP session ─────────────────────────────────────────
    const session = await getSession(connection, b.session_id);

    // ── 6. Enforce permissions ────────────────────────────────────────
    const permRows = await getPermissionConfig(connection, false, 'order_place_permission');
    const cfg = {};
    for (const row of permRows) {
      if (row.section !== 'order_place_permission' || row.scope !== 'single_page') continue;
      if (row.value_type === 'bool') cfg[row.key_name] = String(row.value) === 'true';
      else cfg[row.key_name] = row.value;
    }

    if (cfg.phone_verified === true && !session.is_phone_verified) {
      throw new errors.PHONE_NOT_VERIFIED('Phone must be verified before placing an order.');
    }
    if (cfg.email_verified === true && !session.is_email_verified) {
      throw new errors.BAD_REQUEST('Email must be verified before placing an order.');
    }
    if (cfg.is_email_required !== false && !b.email) {
      throw new errors.BAD_REQUEST('Email is required to place an order.');
    }

    // ── 7. Calculate pricing (per-item + bulk) ────────────────────────
    const cartItemsForDiscount = resolvedItems.map(ri => {
      const sp = Number(ri.sku.selling_price);
      const disc = ri.sku.discount_type === 1 ? sp * (Number(ri.sku.discount) / 100) : Number(ri.sku.discount);
      return {
        product_sku_id: ri.sku.id,
        quantity: ri.quantity,
        final_unit_price: sp - disc,
        selling_price: sp,
      };
    });
    const discountResult = await calculateBulkComboDiscounts(connection, cartItemsForDiscount);
    const bulkDiscountTotal = discountResult.bulkDiscountTotal;
    const comboDiscountTotal = 0;
    const cartWideDiscount = 0;

    let subtotal = 0;
    let skuDiscountTotal = 0;
    let totalWeightKg = 0;
    const enrichedItems = [];

    // Track per-item effective free delivery (matches guest order logic)
    const freeDeliverySkuSet = new Set();

    for (let idx = 0; idx < resolvedItems.length; idx++) {
      const ri = resolvedItems[idx];
      const sku = ri.sku;
      const sp = Number(sku.selling_price);
      const disc = sku.discount_type === 1 ? sp * (Number(sku.discount) / 100) : Number(sku.discount);
      const finalUP = sp - disc;
      const lineTotal = finalUP * ri.quantity;
      subtotal += sp * ri.quantity;
      skuDiscountTotal += disc * ri.quantity;
      totalWeightKg += Number(sku.weight_kg || 0) * ri.quantity;

      const bulkItem = discountResult.enrichedItems[idx];
      // Mark SKU as effectively free if SKU flag or bulk rule grants free delivery
      if (sku.effective_free_delivery) freeDeliverySkuSet.add(sku.id);
      if (bulkItem?.effective_free_delivery) freeDeliverySkuSet.add(sku.id);

      enrichedItems.push({ ri, sku, finalUP, lineTotal, bulkItem });
    }

    // Per-item free delivery logic (aligned with guest order):
    //   allFree  → waive delivery + weight surcharge entirely
    //   mixed    → charge delivery, but exclude free-delivery items from weight surcharge
    //   noneFree → normal delivery + full weight surcharge
    const allFreeDelivery = enrichedItems.length > 0 && enrichedItems.every(ei => freeDeliverySkuSet.has(ei.sku.id));
    const paidWeightKg = enrichedItems
      .filter(ei => !freeDeliverySkuSet.has(ei.sku.id))
      .reduce((sum, ei) => sum + Number(ei.sku.weight_kg || 0) * ei.ri.quantity, 0);

    const effectiveDeliveryAmount = allFreeDelivery ? 0 : Number(deliveryCharge.customer_charge || 0);
    const freeWeightKg = Number(deliveryCharge.default_weight_kg || 0);
    const extraPerKg = Number(deliveryCharge.extra_charge_per_kg || 0);
    const excessKg = allFreeDelivery ? 0 : Math.max(0, paidWeightKg - freeWeightKg);
    const weightExtraCharge = allFreeDelivery ? 0 : Number((excessKg * extraPerKg).toFixed(2));

    const discountTotal = skuDiscountTotal;
    const grandTotal = Number((subtotal - discountTotal - bulkDiscountTotal + effectiveDeliveryAmount + weightExtraCharge).toFixed(2));

    // ── 8. COD advance check ──────────────────────────────────────────
    let codAdvanceRequired = false;
    if (b.payment_type === 'cod') {
      codAdvanceRequired = await checkCODAdvanceRequired(connection);
    }

    // ── 9. Fraud check ────────────────────────────────────────────────
    const fraudResults = await getFraudTestResults(b.phone);

    // ── 10. Find existing user ────────────────────────────────────────
    // SECURITY: Only link to an existing user account if the customer's
    // identity was verified via OTP during this checkout session.
    // Without verification, anyone could type any email/phone and
    // pollute a registered user's address book or link phone numbers.
    let existingUserId = null;
    let existingUser = null;

    const identityVerified = session.is_phone_verified || session.is_email_verified;

    if (identityVerified) {
      const userByPhone = await connection.queryOne(
        `SELECT u.*
         FROM users u JOIN user_phones up ON u.id = up.user_id
         WHERE up.phone_number = ? AND up.is_verified = 1 AND u.deleted_at IS NULL
         LIMIT 1`,
        [b.phone]
      );

      if (userByPhone) {
        existingUserId = userByPhone.id;
        existingUser = userByPhone;
      } else if (b.email) {
        const userByEmail = await connection.queryOne(
          'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
          [b.email]
        );
        if (userByEmail) {
          existingUserId = userByEmail.id;
          existingUser = userByEmail;
          // Link phone to user (safe — identity was verified)
          await connection.query(
            `INSERT INTO user_phones (user_id, phone_number, is_verified, created_at)
             VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE is_verified = 1`,
            [existingUserId, b.phone]
          );
        }
      }
    }

    // ── 11. INSERT orders ─────────────────────────────────────────────
    const orderResult = await connection.query(
      `INSERT INTO orders (
        customer_id, order_type, guest_order_uuid,
        customer_name, customer_email, customer_phone,
        payment_type, payment_status,
        subtotal, discount_total, sku_discount_total,
        bulk_discount_total, combo_discount_total, cart_wide_discount,
        delivery_charge, weight_kg_total, weight_extra_charge,
        grand_total, paid_amount, due_amount,
        order_status, note, placed_at, fraud_test_results,
        origin, ip_address, fbp, fbc, capi_event_id
      ) VALUES (
        ?, 'single_page', NULL,
        ?, ?, ?,
        ?, 'unpaid',
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, 0, ?,
        'new', ?, NOW(), ?,
        'Single product page', INET6_ATON(?), ?, ?, ?
      )`,
      [
        existingUserId,
        b.name, b.email || null, b.phone,
        b.payment_type,
        subtotal, discountTotal, skuDiscountTotal,
        bulkDiscountTotal, comboDiscountTotal, cartWideDiscount,
        effectiveDeliveryAmount, Number((allFreeDelivery ? 0 : paidWeightKg).toFixed(3)), weightExtraCharge,
        grandTotal, grandTotal,
        b.note || null,
        JSON.stringify(fraudResults),
        req.ip || '127.0.0.1',
        b.fbp || null, b.fbc || null, b.capi_event_id || null
      ]
    );

    const orderId = orderResult.insertId;

    // ── 12. INSERT order_items ─────────────────────────────────────────
    let totalQtyForSellCount = 0;
    for (const ei of enrichedItems) {
      const { ri, sku, finalUP, lineTotal, bulkItem } = ei;
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_sku_id, product_name, product_image,
          color_id, color_name, color_hex, attribute_id, variant_id, variant_name,
          quantity, buying_price, selling_price, discount, discount_type,
          coupon_code, coupon_discount,
          bulk_rule_id, bulk_discount_applied,
          combo_rule_id, combo_discount_applied,
          final_unit_price, line_total, weight_kg
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, NULL, 0, ?, ?, ?)`,
        [
          orderId, b.product_id, sku.id, sku.product_name, sku.product_image,
          sku.color_id, sku.color_name, sku.color_hex,
          sku.attribute_id, sku.variant_id, sku.variant_name,
          ri.quantity, sku.buying_price, sku.selling_price,
          sku.discount, sku.discount_type,
          bulkItem?.bulk_rule_id || null, bulkItem?.bulk_discount_applied || 0,
          finalUP, lineTotal,
          Number(sku.weight_kg || 0)
        ]
      );
      totalQtyForSellCount += ri.quantity;
    }

    // ── 13. INSERT order_addresses ─────────────────────────────────────
    let addressId = null;
    if (existingUserId) {
      const existingAddr = await connection.queryOne(
        `SELECT id FROM user_addresses
         WHERE user_id = ? AND full_address = ?
         AND (city = ? OR (? IS NULL AND city IS NULL))
         LIMIT 1`,
        [existingUserId, b.full_address, b.city || null, b.city]
      );
      if (existingAddr) {
        addressId = existingAddr.id;
      } else {
        const addrResult = await connection.query(
          `INSERT INTO user_addresses (user_id, name, phone_id, address_type, full_address, city, zip_code, created_at)
           VALUES (?, ?, NULL, ?, ?, ?, ?, NOW())`,
          [existingUserId, b.name, b.address_type || 'n/a', b.full_address, b.city || null, b.zip_code || null]
        );
        addressId = addrResult.insertId;
      }
    }

    await connection.query(
      `INSERT INTO order_addresses (order_id, address_id, address_type, full_address, city, zip_code, location_mapping_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, addressId, b.address_type || 'n/a', b.full_address, b.city || null, b.zip_code || null, b.location_mapping_id || null]
    );

    // ── 14. INSERT order_couriers ─────────────────────────────────────
    await connection.query(
      `INSERT INTO order_couriers (order_id, delivery_charge_id, delivery_title, customer_charge, our_charge, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [orderId, deliveryCharge.id, deliveryCharge.title, effectiveDeliveryAmount, deliveryCharge.our_charge || 0]
    );

    // ── 15. Stock deduction ───────────────────────────────────────────
    for (const ei of enrichedItems) {
      await connection.query(
        'UPDATE product_skus SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [ei.ri.quantity, ei.sku.id, ei.ri.quantity]
      );
    }
    await connection.query(
      'UPDATE products SET sell_count = sell_count + ? WHERE id = ?',
      [totalQtyForSellCount, b.product_id]
    );

    // ── 16. Audit log (if linked user) ────────────────────────────────
    if (existingUserId) {
      await connection.query(
        `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
         VALUES (?, 'PLACE_SINGLE_PAGE_ORDER', ?, ?)`,
        [existingUserId, null, JSON.stringify({ order_id: orderId, grand_total: grandTotal, product_id: b.product_id })]
      );
    }

    // ── 17. Auto-assign ───────────────────────────────────────────────
    try { await autoAssignOrder(connection, orderId); }
    catch (err) { console.error(`[AutoAssign] Failed for order #${orderId}:`, err.message); }

    // ── 18. Admin notification (fire-and-forget) ──────────────────────
    sendAdminOrderNotification(connection, orderId, 'new_order');

    // ── 19. Bump event version ────────────────────────────────────────
    bumpOrderEventVersion();

    // ── 20. Return response ───────────────────────────────────────────
    return {
      success: true,
      message: 'Order placed successfully! Your order ID is: ' + orderId,
      order_id: orderId,
      customer_linked: existingUserId ? {
        user_id: existingUserId,
        name: existingUser?.first_name ? `${existingUser.first_name} ${existingUser.last_name || ''}`.trim() : b.name,
      } : null,
      totals: {
        subtotal,
        sku_discount: skuDiscountTotal,
        bulk_discount: bulkDiscountTotal,
        discount_total: discountTotal + bulkDiscountTotal,
        delivery: effectiveDeliveryAmount,
        weight_extra: weightExtraCharge,
        grand_total: grandTotal,
      },
      delivery_info: {
        free_delivery: allFreeDelivery,
        message: allFreeDelivery ? 'Free delivery applied' : 'Standard delivery',
      },
      payment: {
        type: b.payment_type,
        advance_required: codAdvanceRequired,
        needs_initiation: (b.payment_type === 'gateway' || b.payment_type === 'mixed' || (b.payment_type === 'cod' && codAdvanceRequired)),
      },
    };
  }
);

// ── 7. Initiate Payment for Single-Page Order ─────────────────────────────
exports.initiateSinglePagePayment = api(
  {
    params: {
      orderId: { type: 'int', required: true },
    },
    body: {
      session_id: { type: 'string', required: true },
      payment_method: { type: 'string', required: true },
    },
  },
  async (req, connection) => {
    const { orderId } = req.typed.params;
    const { session_id, payment_method } = req.typed.body;

    // Validate payment method
    if (!['sslcommerz', 'bkash', 'nagad', 'shurjopay', 'rocket'].includes(payment_method)) {
      throw new errors.INVALID_FIELDS_PROVIDED('Invalid payment method');
    }

    // Validate session
    const session = await connection.queryOne(
      `SELECT * FROM single_page_sessions WHERE id = ?`,
      [session_id]
    );
    if (!session) throw new errors.NOT_FOUND('Session not found');

    // Fetch order
    const order = await connection.queryOne(
      `SELECT
         o.id, o.customer_name, o.customer_email, o.customer_phone,
         o.payment_type, o.payment_status, o.paid_amount, o.due_amount,
         o.order_status, o.grand_total,
         oa.full_address, oa.city, oa.zip_code
       FROM orders o
       LEFT JOIN order_addresses oa ON o.id = oa.order_id
       WHERE o.id = ? AND o.order_type = 'single_page'`,
      [orderId]
    );
    if (!order) throw new errors.NOT_FOUND('Order not found');

    // Block statuses
    const BLOCKED = { cancelled: 'Order is cancelled', returned: 'Order is returned', on_hold: 'Order is on hold' };
    if (BLOCKED[order.order_status]) throw new errors.BAD_REQUEST(BLOCKED[order.order_status]);
    if (order.payment_status === 'paid') throw new errors.BAD_REQUEST('Order is already paid');

    // Fetch payment config & validate provider
    const paymentConfigs = await getConfig(connection, false, 'payment');
    const providerRows = paymentConfigs.filter(r => r.provider === payment_method);
    if (!providerRows.length || !providerRows[0].is_active) {
      throw new errors.BAD_REQUEST(`Payment method ${payment_method} is currently unavailable.`);
    }
    const paymentConfig = {};
    providerRows.forEach(r => (paymentConfig[r.key_name] = r.value));

    // COD advance check
    let codAdvanceRequired = false;
    let codAdvancePercent = 0;
    if (order.payment_type === 'cod') {
      codAdvanceRequired = await checkCODAdvanceRequired(connection);
      if (codAdvanceRequired) {
        for (const row of paymentConfigs) {
          if (row.provider === 'cod' && row.key_name === 'MIN_ADVANCE_PAYMENT_PERCENTAGE') {
            codAdvancePercent = Number(row.value) || 0;
            break;
          }
        }
      }
    }

    // Payable amount
    let payableAmount = order.due_amount;
    if (order.payment_type === 'cod' && codAdvanceRequired) {
      payableAmount = Number(((order.due_amount * codAdvancePercent) / 100).toFixed(2));
    }

    // Check existing pending payment
    const existingPayment = await connection.queryOne(
      `SELECT * FROM order_payments WHERE order_id = ? AND provider = ? AND status = 'pending' ORDER BY id DESC LIMIT 1`,
      [order.id, payment_method]
    );

    let paymentRow = null;
    if (existingPayment && Number(existingPayment.amount) === payableAmount) {
      paymentRow = existingPayment;
    } else {
      const insertResult = await connection.query(
        `INSERT INTO order_payments (order_id, provider, amount, status, created_at) VALUES (?, ?, ?, 'pending', NOW())`,
        [order.id, payment_method, payableAmount]
      );
      paymentRow = { id: insertResult.insertId, amount: payableAmount };
    }

    // Prepare order data for payment handler (flat shape matching handleSSLCommerz)
    const orderData = {
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email || '',
      customer_phone: order.customer_phone,
      payment_type: order.payment_type,
      payment_status: order.payment_status,
      paid_amount: order.paid_amount,
      due_amount: order.due_amount,
      order_status: order.order_status,
      grand_total: order.grand_total,
      full_address: order.full_address || '',
      city: order.city || '',
      post_code: order.zip_code || '',
    };

    // Route to payment handler
    try {
      switch (payment_method) {
        case 'sslcommerz': return await handleSSLCommerz(orderData, paymentConfig, paymentRow);
        case 'bkash':      return await handleBkash(orderData, paymentConfig, paymentRow);
        case 'nagad':       return await handleNagad(orderData, paymentConfig, paymentRow);
        case 'shurjopay':   return await handleShurjopay(orderData, paymentConfig, paymentRow);
        case 'rocket':      return await handleRocket(orderData, paymentConfig, paymentRow);
        default: throw new errors.BAD_REQUEST('Automated payment is not supported for this method');
      }
    } catch (err) {
      console.error('[initiateSinglePagePayment] Payment handler error:', err.message, err.stack);
      throw err;
    }
  }
);
