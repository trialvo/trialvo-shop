const { api } = require('../helpers/common');

/**
 * V2-029: User-Facing Bulk & Combo Discount API
 *
 * Public (no auth required) endpoints to let the shop panel
 * display active bulk/combo rules and calculate discount previews.
 *
 * Also exports the shared `calculateBulkComboDiscounts` helper
 * consumed by order.js, guest_order.js, and admin_order.js.
 */

// ────────────────────────────────────────────────
// GET /user/bulk-rules
// Returns all active bulk discount rules with product & SKU info.
// ────────────────────────────────────────────────
exports.getBulkRulesUser = api(
  { query: { product_sku_id: { type: 'int', required: false } } },
  async (req, connection) => {
    const { product_sku_id } = req.typed?.query ?? {};

    const conditions = ['r.status = 1'];
    const values = [];

    if (product_sku_id) {
      conditions.push('r.product_sku_id = ?');
      values.push(product_sku_id);
    }

    const where = conditions.join(' AND ');

    const rules = await connection.query(
      `SELECT
         r.id,
         r.name,
         r.product_sku_id,
         r.min_qty,
         r.discount_type,
         r.discount_value,
         r.free_delivery,
         ps.sku,
         ps.selling_price,
         ps.discount               AS sku_discount,
         ps.discount_type          AS sku_discount_type,
         ps.stock,
         ps.color_id,
         ps.variant_id,
         p.id        AS product_id,
         p.name      AS product_name,
         p.slug      AS product_slug,
         c.name      AS color_name,
         c.hex       AS color_hex,
         v.name      AS variant_name,
         (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1) AS product_image
       FROM sku_bulk_discount_rules r
       JOIN product_skus ps ON ps.id = r.product_sku_id
       JOIN products p      ON p.id  = ps.product_id AND p.status = 1
       LEFT JOIN colors c   ON c.id  = ps.color_id
       LEFT JOIN variants v ON v.id  = ps.variant_id
       WHERE ${where}
       ORDER BY p.name ASC, r.min_qty ASC`,
      values
    );

    return { success: true, data: rules };
  }
);

// ────────────────────────────────────────────────
// GET /user/combo-rules
// Returns all active combo rules with tiers and required SKU info.
// ────────────────────────────────────────────────
exports.getComboRulesUser = api(
  {},
  async (req, connection) => {
    const rules = await connection.query(
      `SELECT r.id, r.name, r.description, r.free_delivery
       FROM combo_discount_rules r
       WHERE r.status = 1
       ORDER BY r.created_at DESC`
    );

    for (const rule of rules) {
      rule.tiers = await connection.query(
        `SELECT t.id, t.serial, t.discount_type, t.discount_value
         FROM combo_discount_rule_tiers t
         WHERE t.combo_rule_id = ? AND t.status = 1
         ORDER BY t.serial ASC`,
        [rule.id]
      );

      for (const tier of rule.tiers) {
        tier.items = await connection.query(
          `SELECT
             ti.product_sku_id,
             ti.required_qty,
             ps.sku,
             ps.selling_price,
             ps.discount               AS sku_discount,
             ps.discount_type          AS sku_discount_type,
             ps.stock,
             ps.color_id,
             ps.variant_id,
             p.id        AS product_id,
             p.name      AS product_name,
             p.slug      AS product_slug,
             c.name      AS color_name,
             v.name      AS variant_name,
             (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1) AS product_image
           FROM combo_discount_tier_items ti
           JOIN product_skus ps ON ps.id = ti.product_sku_id
           JOIN products p      ON p.id  = ps.product_id
           LEFT JOIN colors c   ON c.id  = ps.color_id
           LEFT JOIN variants v ON v.id  = ps.variant_id
           WHERE ti.combo_tier_id = ?`,
          [tier.id]
        );
      }
    }

    return { success: true, data: rules };
  }
);

// ────────────────────────────────────────────────
// SHARED HELPER: calculateBulkComboDiscounts
//
// Called from order.js, guest_order.js, admin_order.js
// after cart items are resolved.
//
// @param connection - DB connection
// @param cartItems  - Array of { product_sku_id, quantity, final_unit_price, line_total, ... }
// @param overallCartDiscountConfig - object with overall_cart_discount permission keys (optional)
//
// Returns:
//   bulkDiscountTotal  : total flat BDT saved by bulk rules
//   comboDiscountTotal : total flat BDT saved by combo rules
//   cartWideDiscount   : total flat BDT from cart-wide discount (if enabled)
//   enrichedItems      : cartItems with bulk_rule_id, bulk_discount_applied,
//                        combo_rule_id, combo_discount_applied added
// ────────────────────────────────────────────────
async function calculateBulkComboDiscounts(connection, cartItems, overallCartDiscountConfig = null) {
  const enrichedItems = cartItems.map(i => ({
    ...i,
    bulk_rule_id: null,
    bulk_discount_applied: 0,
    combo_rule_id: null,
    combo_discount_applied: 0,
  }));

  let bulkDiscountTotal = 0;
  let comboDiscountTotal = 0;

  // ─── BULK DISCOUNT ───────────────────────────────────────────
  const skuIds = [...new Set(enrichedItems.map(i => i.product_sku_id).filter(Boolean))];

  if (skuIds.length > 0) {
    const placeholders = skuIds.map(() => '?').join(',');
    const bulkRules = await connection.query(
      `SELECT id, product_sku_id, min_qty, discount_type, discount_value, free_delivery
       FROM sku_bulk_discount_rules
       WHERE product_sku_id IN (${placeholders}) AND status = 1
       ORDER BY product_sku_id ASC, min_qty DESC`,
      skuIds
    );

    // Group rules by sku_id, already sorted desc so first match is the best tier
    const rulesBySkuId = {};
    for (const rule of bulkRules) {
      const key = rule.product_sku_id;
      if (!rulesBySkuId[key]) rulesBySkuId[key] = [];
      rulesBySkuId[key].push(rule);
    }

    for (const item of enrichedItems) {
      const rules = rulesBySkuId[item.product_sku_id];
      if (!rules) continue;

      // Find best applicable rule (highest min_qty ≤ ordered qty)
      const applicable = rules.find(r => r.min_qty <= item.quantity);
      if (!applicable) continue;

      const lineTotal = Number(item.final_unit_price ?? item.selling_price ?? 0) * item.quantity;
      let saved = 0;
      if (Number(applicable.discount_type) === 1) {
        // percentage
        saved = Math.round((lineTotal * Number(applicable.discount_value)) / 100);
      } else {
        // flat per unit
        saved = Math.round(Number(applicable.discount_value) * item.quantity);
      }

      item.bulk_rule_id = applicable.id;
      item.bulk_discount_applied = saved;
      item.bulk_free_delivery = !!applicable.free_delivery;  // track per-item
      if (applicable.free_delivery) item.effective_free_delivery = true;  // marks item as effectively free-delivery
      bulkDiscountTotal += saved;
    }
  }

  let bulkFreeDelivery = enrichedItems.some(i => i.bulk_free_delivery);

  // ─── COMBO DISCOUNT ──────────────────────────────────────────
  let comboFreeDelivery = false;
  const comboRules = await connection.query(
    `SELECT r.id, r.name, r.free_delivery,
            t.id AS tier_id, t.discount_type, t.discount_value
     FROM combo_discount_rules r
     JOIN combo_discount_rule_tiers t ON t.combo_rule_id = r.id AND t.status = 1
     WHERE r.status = 1
     ORDER BY r.id ASC, t.serial ASC`
  );

  // Build cart qty map: { product_sku_id -> quantity }
  const cartQtyMap = {};
  for (const item of enrichedItems) {
    const key = item.product_sku_id;
    cartQtyMap[key] = (cartQtyMap[key] || 0) + item.quantity;
  }

  for (const tier of comboRules) {
    const items = await connection.query(
      `SELECT product_sku_id, required_qty
       FROM combo_discount_tier_items
       WHERE combo_tier_id = ?`,
      [tier.tier_id]
    );

    if (items.length === 0) continue;

    // Check if cart satisfies all required_qty for every item in this tier
    const satisfied = items.every(
      req => (cartQtyMap[req.product_sku_id] || 0) >= req.required_qty
    );
    if (!satisfied) continue;

    // Calculate discount amount for this combo tier
    // Apply to the combined subtotal of matching items
    const matchingSubtotal = items.reduce((sum, req) => {
      const cartItem = enrichedItems.find(i => i.product_sku_id === req.product_sku_id);
      if (!cartItem) return sum;
      const unitPrice = Number(cartItem.final_unit_price ?? cartItem.selling_price ?? 0);
      return sum + unitPrice * req.required_qty;
    }, 0);

    let comboSaved = 0;
    if (Number(tier.discount_type) === 1) {
      comboSaved = Math.round((matchingSubtotal * Number(tier.discount_value)) / 100);
    } else {
      comboSaved = Number(tier.discount_value);
    }

    // Mark each matching item with the combo rule
    for (const req of items) {
      const cartItem = enrichedItems.find(i => i.product_sku_id === req.product_sku_id);
      if (cartItem && cartItem.combo_rule_id === null) {
        cartItem.combo_rule_id = tier.id; // tier_id as reference
        // Distribute combo savings proportionally to items
        const unitPrice = Number(cartItem.final_unit_price ?? cartItem.selling_price ?? 0);
        const ratio = (unitPrice * req.required_qty) / (matchingSubtotal || 1);
        cartItem.combo_discount_applied = Math.round(comboSaved * ratio * 100) / 100;
      }
    }

    comboDiscountTotal += comboSaved;
    if (tier.free_delivery) {
      // Mark each item in this combo tier as effectively free delivery
      for (const req of items) {
        const cartItem = enrichedItems.find(i => i.product_sku_id === req.product_sku_id);
        if (cartItem) cartItem.effective_free_delivery = true;
      }
    }
  }

  // ─── CART-WIDE DISCOUNT ──────────────────────────────────────
  let cartWideDiscount = 0;

  let config = overallCartDiscountConfig;
  if (!config) {
    // Fetch from DB if not provided
    const rows = await connection.query(
      `SELECT key_name, value, value_type
       FROM permission_config
       WHERE section = 'overall_cart_discount' AND scope = 'default' AND is_active = 1`
    );
    config = {};
    for (const row of rows) {
      if (row.value_type === 'bool') {
        config[row.key_name] = row.value === 'true' || row.value === '1';
      } else if (row.value_type === 'number') {
        config[row.key_name] = Number(row.value);
      } else {
        config[row.key_name] = row.value;
      }
    }
  }

  const cartWideEnabled = config.enabled === true || config.is_enabled === true;
  const applyWithBulkCombo = config.apply_with_bulk_combo === true;

  if (cartWideEnabled) {
    // Only apply cart-wide if apply_with_bulk_combo=true OR no bulk/combo discounts applied
    const hasBulkOrCombo = bulkDiscountTotal > 0 || comboDiscountTotal > 0;
    const shouldApply = !hasBulkOrCombo || applyWithBulkCombo;

    if (shouldApply) {
      // Calculate subtotal after SKU discounts (before bulk/combo)
      const netSubtotal = enrichedItems.reduce((sum, i) => {
        const lineTotal = Number(i.final_unit_price ?? i.selling_price ?? 0) * i.quantity;
        return sum + lineTotal;
      }, 0);

      // Check eligibility
      const basis = config.basis || 'item_count';
      let eligible = true;
      if (basis === 'item_count') {
        const totalQty = enrichedItems.reduce((s, i) => s + i.quantity, 0);
        eligible = totalQty >= Number(config.min_item_count || 0);
      } else if (basis === 'total_selling_price') {
        eligible = netSubtotal >= Number(config.min_total_selling_price || 0);
      }

      if (eligible) {
        const discountType = config.discount_type || 'flat';
        const discountValue = Number(config.discount_value || 0);
        if (discountType === 'percentage') {
          cartWideDiscount = Math.round((netSubtotal * discountValue) / 100);
        } else {
          cartWideDiscount = discountValue;
        }
      }
    }
  }

  return {
    bulkDiscountTotal,
    comboDiscountTotal,
    cartWideDiscount,
    enrichedItems,
    // freeDeliveryFromRule removed — per-item effective_free_delivery is now set on enrichedItems instead
  };
}

exports.calculateBulkComboDiscounts = calculateBulkComboDiscounts;

// ────────────────────────────────────────────────
// GET /user/cart-discount-config
// Returns the overall_cart_discount permission config
// so the shop panel can compute the cart-wide discount live at checkout.
// Public (no auth required).
// ────────────────────────────────────────────────
exports.getCartDiscountConfigUser = api(
  {},
  async (req, connection) => {
    const rows = await connection.query(
      `SELECT key_name, value, value_type
       FROM permission_config
       WHERE section = 'overall_cart_discount' AND scope = 'default' AND is_active = 1`
    );

    const config = {
      is_enabled: false,
      basis: 'item_count',
      min_item_count: 0,
      min_total_selling_price: 0,
      discount_type: 'flat',
      discount_value: 0,
      apply_with_bulk_combo: true,
    };

    for (const row of rows) {
      if (row.value_type === 'bool') {
        config[row.key_name] = row.value === 'true' || row.value === '1';
      } else if (row.value_type === 'number') {
        config[row.key_name] = Number(row.value);
      } else {
        config[row.key_name] = row.value;
      }
    }

    return { success: true, data: config };
  }
);
