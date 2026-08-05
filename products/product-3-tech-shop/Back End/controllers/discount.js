const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

/**
 * V2-011: Discount Controller
 * CRUD for sku_bulk_discount_rules and combo_discount_rules/tiers/items
 */

// ═══════════════ SKU SEARCH (autocomplete) ═══════════════

exports.searchSkus = api(
  {
    query: {
      q: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const q = (req.typed.query.q || "").trim();
    const like = `%${q}%`;

    const rows = await connection.query(
      `SELECT
         ps.id,
         ps.sku,
         ps.selling_price,
         ps.stock,
         p.name  AS product_name,
         c.name  AS color_name,
         v.name  AS variant_name
       FROM product_skus ps
       JOIN products p ON p.id = ps.product_id
       LEFT JOIN colors c ON c.id = ps.color_id
       LEFT JOIN variants v ON v.id = ps.variant_id
       WHERE ps.sku LIKE ? OR p.name LIKE ?
       ORDER BY ps.sku ASC
       LIMIT 30`,
      [like, like]
    );

    return { success: true, data: rows };
  })
);

// ═══════════════ SKU BULK DISCOUNT RULES ═══════════════

exports.getSkuBulkRules = api(
  {
    query: {
      product_sku_id: { type: "int",  required: false },
      status:         { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { product_sku_id, status } = req.typed.query;
    const conditions = [];
    const values = [];

    if (product_sku_id) {
      conditions.push("r.product_sku_id = ?");
      values.push(product_sku_id);
    }
    if (status !== undefined) {
      conditions.push("r.status = ?");
      values.push(status ? 1 : 0);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rules = await connection.query(
      `SELECT r.*, ps.sku, ps.selling_price
       FROM sku_bulk_discount_rules r
       JOIN product_skus ps ON ps.id = r.product_sku_id
       ${where}
       ORDER BY r.product_sku_id, r.min_qty ASC`,
      values
    );

    return { success: true, data: rules };
  })
);

exports.createSkuBulkRule = api(
  {
    body: {
      name:           { type: "string", required: false },
      product_sku_id: { type: "int",    required: true },
      min_qty:        { type: "int",    required: true },
      discount_value: { type: "float",  required: true },
      discount_type:  { type: "int",    required: false, default: 0 },
      status:         { type: "bool",   required: false, default: true },
      free_delivery:  { type: "int",    required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { name, product_sku_id, min_qty, discount_value, discount_type, status, free_delivery } = req.typed.body;

    if (min_qty < 1) throw new errors.INVALID_FIELDS_PROVIDED("min_qty must be >= 1.");
    if (discount_value < 0) throw new errors.INVALID_FIELDS_PROVIDED("discount_value cannot be negative.");
    if (![0, 1].includes(discount_type)) throw new errors.INVALID_FIELDS_PROVIDED("discount_type must be 0 (flat) or 1 (percentage).");

    // Verify SKU exists
    const sku = await connection.queryOne("SELECT id FROM product_skus WHERE id = ?", [product_sku_id]);
    if (!sku) throw new errors.NOT_FOUND("Product SKU not found.");

    let result;
    try {
      result = await connection.query(
        `INSERT INTO sku_bulk_discount_rules (name, product_sku_id, min_qty, discount_value, discount_type, status, free_delivery)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name || null, product_sku_id, min_qty, discount_value, discount_type, status ? 1 : 0, free_delivery ? 1 : 0]
      );
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        throw new errors.CONFLICT(`A bulk discount rule for this SKU at min quantity ${min_qty} already exists.`);
      }
      throw dbErr;
    }

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'CREATE_BULK_DISCOUNT_RULE', 'sku_bulk_discount_rules', ?, ?)`,
      [adminInfo.id, result.insertId, JSON.stringify({ name, product_sku_id, min_qty, discount_value, discount_type, status, free_delivery })]
    );

    return {
      success: true,
      message: "Bulk discount rule created.",
      data: { id: result.insertId }
    };
  })
);

exports.editSkuBulkRule = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      min_qty:        { type: "int",   required: false },
      discount_value: { type: "float", required: false },
      discount_type:  { type: "int",   required: false },
      status:         { type: "bool",  required: false },
      free_delivery:  { type: "int",   required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const ruleId = req.typed.params.id;
    const { min_qty, discount_value, discount_type, status, free_delivery } = req.typed.body;

    const existing = await connection.queryOne("SELECT id FROM sku_bulk_discount_rules WHERE id = ?", [ruleId]);
    if (!existing) throw new errors.NOT_FOUND("Rule not found.");

    const updates = [];
    const values = [];

    if (min_qty !== undefined) {
      if (min_qty < 1) throw new errors.INVALID_FIELDS_PROVIDED("min_qty must be >= 1.");
      updates.push("min_qty = ?"); values.push(min_qty);
    }
    if (discount_value !== undefined) {
      if (discount_value < 0) throw new errors.INVALID_FIELDS_PROVIDED("discount_value cannot be negative.");
      updates.push("discount_value = ?"); values.push(discount_value);
    }
    if (discount_type !== undefined) {
      if (![0, 1].includes(discount_type)) throw new errors.INVALID_FIELDS_PROVIDED("discount_type must be 0 or 1.");
      updates.push("discount_type = ?"); values.push(discount_type);
    }
    if (status !== undefined) {
      updates.push("status = ?"); values.push(status ? 1 : 0);
    }
    if (free_delivery !== undefined) {
      updates.push("free_delivery = ?"); values.push(free_delivery ? 1 : 0);
    }

    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED("No changes provided.");

    values.push(ruleId);
    await connection.query(
      `UPDATE sku_bulk_discount_rules SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'EDIT_BULK_DISCOUNT_RULE', 'sku_bulk_discount_rules', ?, ?)`,
      [adminInfo.id, ruleId, JSON.stringify({ min_qty, discount_value, discount_type, status })]
    );

    return { success: true, message: "Bulk discount rule updated." };
  })
);

exports.deleteSkuBulkRule = api(
  {
    params: { id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const ruleId = req.typed.params.id;
    const result = await connection.query(
      "DELETE FROM sku_bulk_discount_rules WHERE id = ?",
      [ruleId]
    );

    if (result.affectedRows === 0) throw new errors.NOT_FOUND("Rule not found.");

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_BULK_DISCOUNT_RULE', 'sku_bulk_discount_rules', ?)`,
      [adminInfo.id, ruleId]
    );

    return { success: true, message: "Bulk discount rule deleted." };
  })
);


// ═══════════════ COMBO DISCOUNT RULES ═══════════════

exports.getComboRules = api(
  {
    query: {
      status: { type: "int", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { status } = req.typed.query;
    const conditions = [];
    const values = [];

    if (status !== undefined) { conditions.push("r.status = ?"); values.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rules = await connection.query(
      `SELECT r.* FROM combo_discount_rules r ${where} ORDER BY r.created_at DESC`,
      values
    );

    // Fetch tiers and items for each rule
    for (const rule of rules) {
      rule.tiers = await connection.query(
        `SELECT t.* FROM combo_discount_rule_tiers t
         WHERE t.combo_rule_id = ?
         ORDER BY t.serial ASC`,
        [rule.id]
      );

      for (const tier of rule.tiers) {
        tier.items = await connection.query(
          `SELECT ti.* FROM combo_discount_tier_items ti WHERE ti.combo_tier_id = ?`,
          [tier.id]
        );
      }
    }

    return { success: true, data: rules };
  })
);

exports.createComboRule = api(
  {
    body: {
      name:           { type: "string", required: true },
      description:    { type: "string", required: false },
      discount_type:  { type: "int",    required: false, default: 0 },
      discount_value: { type: "float",  required: false, default: 0 },
      status:         { type: "bool",   required: false, default: true },
      free_delivery:  { type: "int",    required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { name, description, discount_type, discount_value, status, free_delivery } = req.typed.body;
    const { tiers, items } = req.body;

    if (name.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");

    const result = await connection.query(
      `INSERT INTO combo_discount_rules (name, description, status, free_delivery) VALUES (?, ?, ?, ?)`,
      [name, description || null, status ? 1 : 0, free_delivery ? 1 : 0]
    );

    const ruleId = result.insertId;

    // Handle flat items list (FE sends items: [{ product_sku_id }])
    // Store them in a single auto-created tier
    const itemList = Array.isArray(items) ? items : [];
    if (itemList.length > 0) {
      const tierResult = await connection.query(
        `INSERT INTO combo_discount_rule_tiers (combo_rule_id, serial, discount_value, discount_type) VALUES (?, 1, ?, ?)`,
        [ruleId, discount_value ?? 0, discount_type ?? 0]
      );
      const tierId = tierResult.insertId;
      for (const item of itemList) {
        await connection.query(
          `INSERT INTO combo_discount_tier_items (combo_tier_id, product_sku_id, required_qty) VALUES (?, ?, ?)`,
          [tierId, item.product_sku_id, item.required_qty ?? 1]
        );
      }
    }

    // Insert tiers if provided
    if (tiers && Array.isArray(tiers)) {
      for (const tier of tiers) {
        if (tier.discount_value < 0) throw new errors.INVALID_FIELDS_PROVIDED("Tier discount_value cannot be negative.");

        const tierResult = await connection.query(
          `INSERT INTO combo_discount_rule_tiers (combo_rule_id, serial, discount_value, discount_type)
           VALUES (?, ?, ?, ?)`,
          [ruleId, tier.serial || 0, tier.discount_value || 0, tier.discount_type || 0]
        );

        const tierId = tierResult.insertId;

        // Insert items for this tier
        if (tier.items && Array.isArray(tier.items)) {
          for (const item of tier.items) {
            await connection.query(
              `INSERT INTO combo_discount_tier_items (combo_tier_id, product_sku_id, min_qty)
               VALUES (?, ?, ?)`,
              [tierId, item.product_sku_id, item.min_qty || 1]
            );
          }
        }
      }
    }

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'CREATE_COMBO_DISCOUNT_RULE', 'combo_discount_rules', ?, ?)`,
      [adminInfo.id, ruleId, JSON.stringify({ name, description, status, tier_count: tiers ? tiers.length : 0 })]
    );

    return {
      success: true,
      message: "Combo discount rule created.",
      data: { id: ruleId }
    };
  })
);

exports.editComboRule = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      name:           { type: "string", required: false },
      description:    { type: "string", required: false },
      discount_type:  { type: "int",    required: false },
      discount_value: { type: "float",  required: false },
      status:         { type: "bool",   required: false },
      free_delivery:  { type: "int",    required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const ruleId = req.typed.params.id;
    const { name, description, discount_type, discount_value, status, free_delivery } = req.typed.body;
    const { tiers, items } = req.body;

    const existing = await connection.queryOne(
      "SELECT id FROM combo_discount_rules WHERE id = ?",
      [ruleId]
    );
    if (!existing) throw new errors.NOT_FOUND("Combo rule not found.");

    // Update rule fields
    const updates = [];
    const values = [];
    if (name           !== undefined) { updates.push("name = ?");         values.push(name); }
    if (description    !== undefined) { updates.push("description = ?");  values.push(description); }
    if (status         !== undefined) { updates.push("status = ?");       values.push(status ? 1 : 0); }
    if (free_delivery  !== undefined) { updates.push("free_delivery = ?"); values.push(free_delivery ? 1 : 0); }

    if (updates.length) {
      values.push(ruleId);
      await connection.query(
        `UPDATE combo_discount_rules SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
        values
      );
    }

    // Replace flat items list if provided (FE sends items: [{ product_sku_id, required_qty }])
    if (Array.isArray(items) && items.length > 0) {
      // 1. Fetch existing tier discount values BEFORE deleting (use body values if provided)
      let tierDiscount = discount_value;
      let tierType     = discount_type;
      if (tierDiscount === undefined || tierType === undefined) {
        const existingTiers = await connection.query(
          `SELECT discount_value, discount_type FROM combo_discount_rule_tiers WHERE combo_rule_id = ? ORDER BY serial ASC LIMIT 1`,
          [ruleId]
        );
        tierDiscount = tierDiscount ?? (existingTiers[0]?.discount_value ?? 0);
        tierType     = tierType     ?? (existingTiers[0]?.discount_type  ?? 0);
      }

      // 2. Delete existing tiers (CASCADE removes tier_items)
      await connection.query("DELETE FROM combo_discount_rule_tiers WHERE combo_rule_id = ?", [ruleId]);

      // 3. Re-create single tier
      const tierResult = await connection.query(
        `INSERT INTO combo_discount_rule_tiers (combo_rule_id, serial, discount_value, discount_type) VALUES (?, 1, ?, ?)`,
        [ruleId, tierDiscount, tierType]
      );
      const tierId = tierResult.insertId;

      // 4. Insert items with required_qty
      for (const item of items) {
        await connection.query(
          `INSERT INTO combo_discount_tier_items (combo_tier_id, product_sku_id, required_qty) VALUES (?, ?, ?)`,
          [tierId, item.product_sku_id, item.required_qty ?? 1]
        );
      }
    }

    // Replace tiers if provided (advanced path)
    if (tiers && Array.isArray(tiers)) {
      // Delete existing tiers (cascade deletes tier_items)
      await connection.query("DELETE FROM combo_discount_rule_tiers WHERE combo_rule_id = ?", [ruleId]);

      for (const tier of tiers) {
        const tierResult = await connection.query(
          `INSERT INTO combo_discount_rule_tiers (combo_rule_id, serial, discount_value, discount_type)
           VALUES (?, ?, ?, ?)`,
          [ruleId, tier.serial || 0, tier.discount_value || 0, tier.discount_type || 0]
        );

        const tierId = tierResult.insertId;

        if (tier.items && Array.isArray(tier.items)) {
          for (const item of tier.items) {
            await connection.query(
              `INSERT INTO combo_discount_tier_items (combo_tier_id, product_sku_id, required_qty)
               VALUES (?, ?, ?)`,
              [tierId, item.product_sku_id, item.min_qty || 1]
            );
          }
        }
      }
    }

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'EDIT_COMBO_DISCOUNT_RULE', 'combo_discount_rules', ?, ?)`,
      [adminInfo.id, ruleId, JSON.stringify({ name, description, status, tiers_replaced: !!(tiers && Array.isArray(tiers)) })]
    );

    return { success: true, message: "Combo discount rule updated." };
  })
);

exports.deleteComboRule = api(
  {
    params: { id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const comboRuleId = req.typed.params.id;
    const result = await connection.query(
      "UPDATE combo_discount_rules SET status = 0 WHERE id = ? AND status = 1",
      [comboRuleId]
    );

    if (result.affectedRows === 0) throw new errors.NOT_FOUND("Combo rule not found.");

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_COMBO_DISCOUNT_RULE', 'combo_discount_rules', ?)`,
      [adminInfo.id, comboRuleId]
    );

    return { success: true, message: "Combo discount rule deleted." };
  })
);
