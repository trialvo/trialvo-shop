const { api } = require('../helpers/common');
const errors = require('../helpers/errors');

/**
 * V2-COMPARE: Dedicated Compare & Budget Plan Controller
 *
 * GET  /api/v1/user/compare?ids=1,2&ip=x.x.x.x        — batch product detail + bulk rules
 *                                                          Logs view counts + user audit (if authenticated)
 * POST /api/v1/user/budget-plan                         — server-side budget calculator
 */

// ══════════════════════════════════════════
// Shared helpers
// ══════════════════════════════════════════

/** Try to decode bearer token; returns userId or null (never throws) */
async function tryGetUserId(req, connection, { verifyJwt, jwtSecret }) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwt(token, jwtSecret);
    if (!decoded?.uid) return null;
    const user = await connection.queryOne(
      `SELECT id, status, is_email_verified, token_version
       FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
      [decoded.uid]
    );
    if (user && user.is_email_verified && decoded.ev === true && decoded.tv === user.token_version) {
      return user.id;
    }
  } catch (_) {}
  return null;
}

async function loadProductDetail(connection, productId) {
  const product = await connection.queryOne(
    `SELECT p.*,
            b.name AS brand_name,
            mc.name AS main_category_name, mc.id AS main_category_id,
            sc.name AS sub_category_name,  sc.id AS sub_category_id,
            cc.name AS child_category_name, cc.id AS child_category_id
     FROM products p
     LEFT JOIN brands b  ON b.id = p.brand_id
     LEFT JOIN main_categories mc ON mc.id = p.main_category_id
     LEFT JOIN sub_categories  sc ON sc.id = p.sub_category_id
     LEFT JOIN child_categories cc ON cc.id = p.child_category_id
     WHERE p.id = ? AND p.status = 1 AND mc.status = 1
       AND (p.sub_category_id IS NULL OR sc.status = 1)
       AND (p.child_category_id IS NULL OR cc.status = 1)`,
    [productId]
  );
  if (!product) return null;

  const images = await connection.query(
    `SELECT pi.id, pi.img_path AS path, pi.serial
     FROM product_images pi
     WHERE pi.product_id = ?
     ORDER BY pi.serial ASC`,
    [productId]
  );

  const skus = await connection.query(
    `SELECT ps.*,
            c.name AS color_name, c.name_bd AS color_name_bd, c.hex AS color_hex,
            v.name AS variant_name, v.name_bd AS variant_name_bd
     FROM product_skus ps
     LEFT JOIN colors  c ON c.id = ps.color_id
     LEFT JOIN variants v ON v.id = ps.variant_id
     WHERE ps.product_id = ? AND ps.status = 1
     ORDER BY ps.id ASC`,
    [productId]
  );

  const skuIds = skus.map(s => s.id);
  let bulkRulesMap = {};
  if (skuIds.length > 0) {
    const bulkRules = await connection.query(
      `SELECT * FROM sku_bulk_discount_rules
       WHERE product_sku_id IN (?) AND status = 1
       ORDER BY product_sku_id, min_qty ASC`,
      [skuIds]
    );
    for (const rule of bulkRules) {
      if (!bulkRulesMap[rule.product_sku_id]) bulkRulesMap[rule.product_sku_id] = [];
      bulkRulesMap[rule.product_sku_id].push(rule);
    }
  }

  const variations = skus.map(sku => {
    const sellingPrice = Number(sku.selling_price);
    const discount     = Number(sku.discount || 0);
    const itemDiscount = sku.discount_type === 1 ? (sellingPrice * discount) / 100 : discount;
    const finalPrice   = Math.max(0, sellingPrice - itemDiscount);

    const rules = (bulkRulesMap[sku.id] || []).map(r => {
      const bd = r.discount_type === 1 ? (finalPrice * r.discount_value) / 100 : Number(r.discount_value);
      return {
        min_qty:          r.min_qty,
        discount_value:   Number(r.discount_value),
        discount_type:    r.discount_type,
        discount_label:   r.discount_type === 1 ? `${r.discount_value}% off` : `BDT ${r.discount_value} off`,
        effective_price:  +Math.max(0, finalPrice - bd).toFixed(2)
      };
    });

    return {
      id: sku.id, sku: sku.sku,
      color:    { id: sku.color_id,   name: sku.color_name,   name_bd: sku.color_name_bd,   hex: sku.color_hex },
      variant:  { id: sku.variant_id, name: sku.variant_name, name_bd: sku.variant_name_bd },
      selling_price:        sellingPrice,
      discount:             discount,
      discount_type:        sku.discount_type,
      final_price:          +finalPrice.toFixed(2),
      item_discount_amount: +itemDiscount.toFixed(2),
      stock:                Number(sku.stock),
      in_stock:             sku.stock > 0,
      weight_kg:            sku.weight_kg ? Number(sku.weight_kg) : null,
      bulk_rules:           rules,
    };
  });

  const finalPrices = variations.map(v => v.final_price);
  const summary = {
    total_variations: variations.length,
    total_in_stock:   variations.filter(v => v.in_stock).length,
    total_stock:      variations.reduce((s, v) => s + v.stock, 0),
    min_price:        finalPrices.length ? Math.min(...finalPrices) : null,
    max_price:        finalPrices.length ? Math.max(...finalPrices) : null,
  };

  return {
    id: product.id, name: product.name, name_bd: product.name_bd, slug: product.slug,
    short_description: product.short_description, description: product.description,
    brand:          product.brand_name ? { id: product.brand_id, name: product.brand_name } : null,
    main_category:  { id: product.main_category_id, name: product.main_category_name },
    sub_category:   product.sub_category_id  ? { id: product.sub_category_id,  name: product.sub_category_name }  : null,
    child_category: product.child_category_id ? { id: product.child_category_id, name: product.child_category_name } : null,
    free_delivery: !!product.free_delivery, featured: !!product.featured, best_deal: !!product.best_deal,
    sell_count: Number(product.sell_count || 0), view_count: Number(product.view_count || 0),
    images, variations, summary,
  };
}

// ══════════════════════════════════════════
// Record product view (IP dedup) — fire-and-forget
// ══════════════════════════════════════════
async function recordProductView(connection, productId, ip) {
  if (!ip) return;
  try {
    const log = await connection.query(
      `INSERT IGNORE INTO product_view_logs (product_id, ip_address)
       VALUES (?, INET6_ATON(?))`,
      [productId, ip]
    );
    if (log?.affectedRows > 0) {
      await connection.query(
        `UPDATE products SET view_count = view_count + 1 WHERE id = ?`,
        [productId]
      );
    }
  } catch (_) {}
}

// ══════════════════════════════════════════
// GET /user/compare?ids=1,2&ip=x.x.x.x
// ══════════════════════════════════════════

// Lazy-load JWT utils to avoid circular deps
let _verifyJwt, _jwtSecret;
function getJwtDeps() {
  if (!_verifyJwt) {
    const { verifyJwt } = require('../helpers/common');
    const { jwtSecret }  = require('../config');
    _verifyJwt  = verifyJwt;
    _jwtSecret  = jwtSecret;
  }
  return { verifyJwt: _verifyJwt, jwtSecret: _jwtSecret };
}

exports.compareProducts = api(
  {
    query: {
      ids: { type: "string", required: true },
      ip:  { type: "string", required: false },
    }
  },
  async (req, connection) => {
    const rawIds = (req.typed.query.ids || "")
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0);

    if (rawIds.length < 1 || rawIds.length > 2) {
      throw new errors.INVALID_FIELDS_PROVIDED("Provide 1 or 2 product IDs via ?ids=1,2");
    }

    const userIp = req.typed.query.ip || req.ip || null;

    // Fetch all products in parallel
    const results = await Promise.all(rawIds.map(id => loadProductDetail(connection, id)));
    const products = results.map((p, i) => {
      if (!p) throw new errors.NOT_FOUND(`Product with id ${rawIds[i]} not found or inactive.`);
      return p;
    });

    // ── View count tracking (unique IP per product) ────────────────
    // Fire-and-forget — do not await to avoid slowing down response
    for (const p of products) {
      recordProductView(connection, p.id, userIp).catch(() => {});
    }

    // ── User audit log (optional auth) ────────────────────────────
    try {
      const jwtDeps      = getJwtDeps();
      const userId       = await tryGetUserId(req, connection, jwtDeps);
      const productNames = products.map(p => p.name).join(' vs ');
      const productIds   = products.map(p => p.id);

      if (userId) {
        // Authenticated compare
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
           VALUES (?, 'COMPARE_PRODUCTS', ?, ?)`,
          [
            userId,
            req.ip || null,
            JSON.stringify({ product_ids: productIds, product_names: productNames })
          ]
        );
      } else {
        // Guest compare — log with user_id = NULL
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
           VALUES (NULL, 'GUEST_COMPARE_PRODUCTS', ?, ?)`,
          [
            req.ip || null,
            JSON.stringify({ product_ids: productIds, product_names: productNames, ip: userIp })
          ]
        );
      }
    } catch (_) { /* Audit failure must never break the response */ }

    return { success: true, data: products, count: products.length };
  }
);

// ══════════════════════════════════════════
// POST /user/budget-plan
// ══════════════════════════════════════════

/**
 * Compute the best price for a SKU at a given qty, considering bulk tiers + coupon.
 * Returns { pricePerUnit, bulkRule } where bulkRule is null if no tier applied.
 */
function computeBestPrice(sku, qty) {
  let bestPrice = sku.effective_price;
  let bestRule  = null;

  for (const rule of sku.bulk_rules) {
    const priceAtTier = Math.max(0, rule.effective_price - sku.coupon_discount_per_unit);
    if (priceAtTier <= 0) continue;
    if (qty >= rule.min_qty && priceAtTier < bestPrice) {
      bestPrice = priceAtTier;
      bestRule  = rule;
    }
  }

  return { pricePerUnit: +bestPrice.toFixed(2), bulkRule: bestRule };
}

/**
 * Build the standard result object for a single SKU with affordability computed
 * against a given budget.
 */
function buildSkuResult(sku, budget) {
  if (sku.effective_price <= 0) return null;

  let bestQty          = Math.floor(budget / sku.effective_price);
  let bestPricePerUnit = sku.effective_price;
  let bestBulkRule     = null;

  for (const rule of sku.bulk_rules) {
    const priceAtTier = Math.max(0, rule.effective_price - sku.coupon_discount_per_unit);
    if (priceAtTier <= 0) continue;
    const qtyAtTier = Math.floor(budget / priceAtTier);
    if (qtyAtTier >= rule.min_qty && priceAtTier < bestPricePerUnit) {
      bestPricePerUnit = priceAtTier;
      bestQty          = qtyAtTier;
      bestBulkRule     = rule;
    }
  }

  if (bestQty <= 0) return null;

  return {
    product_id: sku.product_id, product_name: sku.product_name, product_slug: sku.product_slug,
    sku_id: sku.sku_id, sku: sku.sku, thumbnail: sku.thumbnail,
    color_name: sku.color_name, color_hex: sku.color_hex, variant_name: sku.variant_name,
    category_name: sku.category_name, free_delivery: sku.free_delivery, stock: sku.stock,
    child_category_id: sku.child_category_id,
    pricing: {
      original_price:             sku.selling_price,
      item_discount:              sku.item_discount,
      price_after_item_discount:  sku.price_after_item_discount,
      coupon_discount_per_unit:   sku.coupon_discount_per_unit,
      bulk_discount_applied:      bestBulkRule ? { min_qty: bestBulkRule.min_qty, discount_label: bestBulkRule.discount_label } : null,
      effective_price_per_unit:   +bestPricePerUnit.toFixed(2),
    },
    bulk_rules: sku.bulk_rules,
    affordability: {
      qty_affordable: bestQty,
      total_spend:    +(bestQty * bestPricePerUnit).toFixed(2),
      total_saved:    +((sku.selling_price - bestPricePerUnit) * bestQty).toFixed(2),
      change:         +(budget - (bestQty * bestPricePerUnit)).toFixed(2),
    }
  };
}

/**
 * Merge SKU-level results into product-level results.
 * Groups by product_id, keeps the cheapest variation as the representative,
 * attaches merged_variants summary with all available colors, sizes, and price range.
 */
function mergeByProduct(results) {
  const groups = new Map(); // product_id → { best, allColors, allSizes, prices }

  for (const item of results) {
    const pid = item.product_id;
    if (!groups.has(pid)) {
      groups.set(pid, {
        best: item,
        colors: new Set(),
        sizes: new Set(),
        prices: [],
        totalStock: 0,
        count: 0,
      });
    }
    const g = groups.get(pid);
    g.count++;
    if (item.color_name) g.colors.add(item.color_name);
    if (item.variant_name) g.sizes.add(item.variant_name);
    g.prices.push(item.pricing.effective_price_per_unit);
    g.totalStock += item.stock;

    // Keep the one with cheapest effective price
    if (item.pricing.effective_price_per_unit < g.best.pricing.effective_price_per_unit) {
      g.best = item;
    }
  }

  const merged = [];
  for (const g of groups.values()) {
    const minP = Math.min(...g.prices);
    const maxP = Math.max(...g.prices);
    merged.push({
      ...g.best,
      stock: g.totalStock,
      merged_variants: {
        total_variants: g.count,
        colors: [...g.colors],
        sizes: [...g.sizes],
        price_range: { min: +minP.toFixed(2), max: +maxP.toFixed(2) },
      }
    });
  }

  // Re-sort: most affordable first, then cheapest price
  merged.sort((a, b) => {
    const qd = b.affordability.qty_affordable - a.affordability.qty_affordable;
    return qd !== 0 ? qd : a.pricing.effective_price_per_unit - b.pricing.effective_price_per_unit;
  });

  return merged;
}


exports.budgetPlan = api(
  {
    body: {
      budget:                { type: "float",  required: true },
      coupon:                { type: "string", required: false },
      search:                { type: "string", required: false },
      main_category_id:      { type: "int",    required: false },
      sub_category_id:       { type: "int",    required: false },
      child_category_id:     { type: "int",    required: false },
      limit:                 { type: "int",    required: false, default: 40 },
      customer_id:           { type: "int",    required: false },
      merge_skus:            { type: "boolean", required: false, default: true },
      category_allocations:  { type: "any",    required: false }
    }
  },
  async (req, connection) => {
    const { budget, coupon: couponCode, search, main_category_id, sub_category_id,
            child_category_id, customer_id } = req.typed.body;
    let { limit } = req.typed.body;
    limit = Math.min(Math.max(limit, 1), 100);

    const mergeSkus = req.typed.body.merge_skus !== false;

    // Parse category_allocations — array of { child_category_id, qty }
    let categoryAllocations = null;
    const rawAllocations = req.body?.category_allocations;
    if (Array.isArray(rawAllocations) && rawAllocations.length > 0) {
      categoryAllocations = rawAllocations
        .filter(a => a && Number.isFinite(Number(a.child_category_id)) && Number.isFinite(Number(a.qty)) && Number(a.qty) > 0)
        .map(a => ({ child_category_id: Number(a.child_category_id), qty: Number(a.qty) }));
      if (categoryAllocations.length === 0) categoryAllocations = null;
    }

    if (budget <= 0) throw new errors.INVALID_FIELDS_PROVIDED("Budget must be positive.");

    // ── 1. Load matching in-stock SKUs ────────────────────────────
    // When allocations are provided, load ALL child categories referenced (no single-category filter)
    const filters = [
      "p.status = 1", "mc.status = 1",
      "(p.sub_category_id IS NULL OR sc.status = 1)",
      "(p.child_category_id IS NULL OR cc.status = 1)",
      "ps.status = 1", "ps.stock > 0"
    ];
    const values = [];

    if (search) {
      filters.push("(CONVERT(p.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR p.name_bd COLLATE utf8mb4_unicode_ci LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    if (categoryAllocations) {
      // Filter to only the child categories referenced in allocations
      const allocChildIds = categoryAllocations.map(a => a.child_category_id);
      filters.push("p.child_category_id IN (?)");
      values.push(allocChildIds);
    } else {
      if (main_category_id)  { filters.push("p.main_category_id = ?");  values.push(main_category_id);  }
      if (sub_category_id)   { filters.push("p.sub_category_id = ?");   values.push(sub_category_id);   }
      if (child_category_id) { filters.push("p.child_category_id = ?"); values.push(child_category_id); }
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    const skuRows = await connection.query(
      `SELECT ps.id AS sku_id, ps.sku, ps.selling_price, ps.discount, ps.discount_type,
              ps.stock, ps.weight_kg,
              p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.free_delivery,
              p.child_category_id,
              pi.img_path AS thumbnail,
              c.name AS color_name, c.hex AS color_hex,
              v.name AS variant_name,
              mc.name AS main_category_name, sc.name AS sub_category_name,
              cc.name AS child_category_name
       FROM products p
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       LEFT JOIN  sub_categories  sc ON sc.id = p.sub_category_id
       LEFT JOIN  child_categories cc ON cc.id = p.child_category_id
       INNER JOIN product_skus ps ON ps.product_id = p.id
       LEFT JOIN  colors  c ON c.id = ps.color_id
       LEFT JOIN  variants v ON v.id = ps.variant_id
       LEFT JOIN  (SELECT product_id, MIN(id) AS min_img_id FROM product_images GROUP BY product_id) first_img ON first_img.product_id = p.id
       LEFT JOIN product_images pi ON pi.id = first_img.min_img_id
       ${where}
       ORDER BY p.id, ps.selling_price ASC`,
      values
    );

    const emptyMeta = { budget, coupon_applied: false, coupon_title: null, coupon_error: null, total_matches: 0, returned: 0 };

    if (!skuRows.length) {
      if (categoryAllocations) {
        // Return empty allocations structure
        const emptyAllocs = categoryAllocations.map(a => ({
          child_category_id: a.child_category_id,
          child_category_name: null,
          requested_qty: a.qty,
          suggestions: []
        }));
        return {
          success: true,
          data: { allocations: emptyAllocs, plan_summary: { budget, total_planned_spend: 0, remaining_budget: budget, total_items: 0, coupon_applied: false } },
          meta: emptyMeta
        };
      }
      return { success: true, data: [], meta: emptyMeta };
    }

    // ── 2. Compute item discount per SKU ──────────────────────────
    const skuMap = new Map();
    for (const row of skuRows) {
      if (skuMap.has(row.sku_id)) continue;
      const sellingPrice = Number(row.selling_price);
      const discount     = Number(row.discount || 0);
      const itemDiscount = row.discount_type === 1 ? (sellingPrice * discount) / 100 : discount;
      const finalPrice   = Math.max(0, sellingPrice - itemDiscount);

      skuMap.set(row.sku_id, {
        sku_id: row.sku_id, sku: row.sku,
        product_id: row.product_id, product_name: row.product_name, product_slug: row.product_slug,
        free_delivery: !!row.free_delivery, thumbnail: row.thumbnail,
        color_name: row.color_name, color_hex: row.color_hex, variant_name: row.variant_name,
        category_name: row.sub_category_name || row.main_category_name,
        child_category_id: row.child_category_id,
        child_category_name: row.child_category_name,
        stock: Number(row.stock), weight_kg: row.weight_kg ? Number(row.weight_kg) : null,
        selling_price: sellingPrice,
        item_discount: +itemDiscount.toFixed(2),
        price_after_item_discount: +finalPrice.toFixed(2),
        bulk_rules: [],
        coupon_discount_per_unit: 0,
        effective_price: +finalPrice.toFixed(2),
      });
    }

    // ── 3. Attach bulk rules ───────────────────────────────────────
    const allSkuIds = [...skuMap.keys()];
    if (allSkuIds.length > 0) {
      const bulkRules = await connection.query(
        `SELECT * FROM sku_bulk_discount_rules WHERE product_sku_id IN (?) AND status = 1 ORDER BY product_sku_id, min_qty ASC`,
        [allSkuIds]
      );
      for (const rule of bulkRules) {
        const sku = skuMap.get(rule.product_sku_id);
        if (!sku) continue;
        const bd = rule.discount_type === 1 ? (sku.price_after_item_discount * rule.discount_value) / 100 : Number(rule.discount_value);
        sku.bulk_rules.push({
          min_qty: rule.min_qty,
          discount_value: Number(rule.discount_value),
          discount_type: rule.discount_type,
          discount_label: rule.discount_type === 1 ? `${rule.discount_value}% off` : `BDT ${rule.discount_value} off`,
          effective_price: +Math.max(0, sku.price_after_item_discount - bd).toFixed(2)
        });
      }
    }

    // ── 4. Apply coupon ────────────────────────────────────────────
    let couponApplied = false, couponTitle = null, couponError = null;

    if (couponCode?.trim()) {
      try {
        const coupon = await connection.queryOne(
          `SELECT * FROM coupons WHERE code = ? AND status = 1 AND DATE(start_date) <= DATE(CONVERT_TZ(NOW(), '+00:00', '+06:00')) AND DATE(expire_date) >= DATE(CONVERT_TZ(NOW(), '+00:00', '+06:00')) AND deleted_at IS NULL`,
          [couponCode.trim().toUpperCase()]
        );

        if (!coupon) {
          couponError = "Invalid or expired coupon.";
        } else {
          if (coupon.limit_per_user > 0 && customer_id) {
            const usage = await connection.queryOne(`SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND customer_id = ?`, [coupon.id, customer_id]);
            if (usage.cnt >= coupon.limit_per_user) couponError = `Coupon usage limit reached (${coupon.limit_per_user} uses).`;
          }

          if (!couponError) {
            let targetSkuIds = null;
            if (coupon.product_scope !== "all") {
              const targets = await connection.query(`SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`, [coupon.id]);
              targetSkuIds = new Set(targets.map(t => t.product_sku_id));
            }

            const skuList = [...skuMap.values()];
            const totalAftItem = skuList.reduce((s, k) => s + k.price_after_item_discount, 0);

            let totalRawDiscount = coupon.discount_type === 0 ? coupon.discount : (totalAftItem * coupon.discount) / 100;
            const capApplied = coupon.max_discount_amount != null && totalRawDiscount > coupon.max_discount_amount;
            const capFactor  = capApplied ? coupon.max_discount_amount / totalRawDiscount : 1;

            for (const sku of skuList) {
              const eligible = coupon.product_scope === "all" || (targetSkuIds && targetSkuIds.has(sku.sku_id));
              if (!eligible) continue;

              let rawDisc;
              if (coupon.product_scope === "all") {
                const w = totalAftItem > 0 ? sku.price_after_item_discount / totalAftItem : 0;
                rawDisc = totalRawDiscount * w * capFactor;
              } else {
                rawDisc = (coupon.discount_type === 0 ? coupon.discount : (sku.price_after_item_discount * coupon.discount) / 100) * capFactor;
              }

              sku.coupon_discount_per_unit = +rawDisc.toFixed(2);
              sku.effective_price = +Math.max(0, sku.price_after_item_discount - rawDisc).toFixed(2);
            }

            couponApplied = true;
            couponTitle   = coupon.title;
          }
        }
      } catch (_) { couponError = "Failed to validate coupon."; }
    }

    // ═══════════════════════════════════════════════════════════════
    // BRANCH: Category Allocations mode
    // ═══════════════════════════════════════════════════════════════
    if (categoryAllocations) {
      const SUGGESTIONS_PER_CATEGORY = 5;
      const allocations = [];

      for (const alloc of categoryAllocations) {
        // Filter SKUs belonging to this child category
        const catSkus = [...skuMap.values()].filter(s => s.child_category_id === alloc.child_category_id);

        // Build result entries (affordability at requested qty, not against budget)
        const suggestions = [];
        for (const sku of catSkus) {
          if (sku.effective_price <= 0) continue;

          const { pricePerUnit, bulkRule } = computeBestPrice(sku, alloc.qty);
          const totalForQty = +(pricePerUnit * alloc.qty).toFixed(2);

          // Only suggest if affordable within the total budget
          if (totalForQty > budget) continue;

          suggestions.push({
            product_id: sku.product_id, product_name: sku.product_name, product_slug: sku.product_slug,
            sku_id: sku.sku_id, sku: sku.sku, thumbnail: sku.thumbnail,
            color_name: sku.color_name, color_hex: sku.color_hex, variant_name: sku.variant_name,
            category_name: sku.category_name, free_delivery: sku.free_delivery, stock: sku.stock,
            child_category_id: sku.child_category_id,
            pricing: {
              original_price:             sku.selling_price,
              item_discount:              sku.item_discount,
              price_after_item_discount:  sku.price_after_item_discount,
              coupon_discount_per_unit:   sku.coupon_discount_per_unit,
              bulk_discount_applied:      bulkRule ? { min_qty: bulkRule.min_qty, discount_label: bulkRule.discount_label } : null,
              effective_price_per_unit:   pricePerUnit,
            },
            bulk_rules: sku.bulk_rules,
            total_for_qty: totalForQty,
          });
        }

        // Sort by cheapest total, then merge by product
        suggestions.sort((a, b) => a.total_for_qty - b.total_for_qty);

        // Merge variations of same product
        const merged = [];
        const seen = new Map(); // product_id → index in merged
        for (const s of suggestions) {
          if (seen.has(s.product_id)) {
            const existing = merged[seen.get(s.product_id)];
            existing.merged_variants.total_variants++;
            if (s.color_name) existing.merged_variants.colors.add(s.color_name);
            if (s.variant_name) existing.merged_variants.sizes.add(s.variant_name);
            const p = s.pricing.effective_price_per_unit;
            if (p < existing.merged_variants._minP) existing.merged_variants._minP = p;
            if (p > existing.merged_variants._maxP) existing.merged_variants._maxP = p;
          } else {
            seen.set(s.product_id, merged.length);
            merged.push({
              ...s,
              merged_variants: {
                total_variants: 1,
                colors: new Set(s.color_name ? [s.color_name] : []),
                sizes: new Set(s.variant_name ? [s.variant_name] : []),
                _minP: s.pricing.effective_price_per_unit,
                _maxP: s.pricing.effective_price_per_unit,
              }
            });
          }
        }

        // Finalize merged_variants — convert Sets to arrays
        const finalSuggestions = merged.slice(0, SUGGESTIONS_PER_CATEGORY).map(s => ({
          ...s,
          merged_variants: {
            total_variants: s.merged_variants.total_variants,
            colors: [...s.merged_variants.colors],
            sizes: [...s.merged_variants.sizes],
            price_range: { min: +s.merged_variants._minP.toFixed(2), max: +s.merged_variants._maxP.toFixed(2) },
          }
        }));

        const catName = catSkus.length > 0 ? catSkus[0].child_category_name : null;
        allocations.push({
          child_category_id: alloc.child_category_id,
          child_category_name: catName,
          requested_qty: alloc.qty,
          suggestions: finalSuggestions,
        });
      }

      return {
        success: true,
        data: { allocations },
        meta: {
          budget, coupon_applied: couponApplied, coupon_title: couponTitle,
          coupon_error: couponError,
          total_allocations: allocations.length,
          total_items: categoryAllocations.reduce((s, a) => s + a.qty, 0),
        }
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // BRANCH: Simple (flat) mode — original behavior + optional merge
    // ═══════════════════════════════════════════════════════════════

    // ── 5. Compute affordability ───────────────────────────────────
    const results = [];
    for (const sku of skuMap.values()) {
      const result = buildSkuResult(sku, budget);
      if (result) results.push(result);
    }

    results.sort((a, b) => {
      const qd = b.affordability.qty_affordable - a.affordability.qty_affordable;
      return qd !== 0 ? qd : a.pricing.effective_price_per_unit - b.pricing.effective_price_per_unit;
    });

    // ── 6. Merge by product (if requested) ─────────────────────────
    const finalResults = mergeSkus ? mergeByProduct(results) : results;

    return {
      success: true,
      data: finalResults.slice(0, limit),
      meta: {
        budget, coupon_applied: couponApplied, coupon_title: couponTitle,
        coupon_error: couponError, total_matches: finalResults.length,
        returned: Math.min(finalResults.length, limit),
        merged: mergeSkus,
      }
    };
  }
);
