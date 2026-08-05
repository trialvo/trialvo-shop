const { api, auth } = require("../helpers/common");
const errors = require("../helpers/errors");

// ─── Helpers ──────────────────────────────────────────────────────────────── //

const toPositiveInt = (val, fallback, min = 0) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  const safe = Math.trunc(n);
  return safe < min ? min : safe;
};

/**
 * Parse an incoming datetime string to MySQL format (YYYY-MM-DD HH:mm:ss).
 * Accepts: "YYYY-MM-DDTHH:mm", "YYYY-MM-DD HH:mm:ss", ISO strings, etc.
 * All values are treated as Bangladesh time (UTC+6) for storage in MySQL.
 */
const parseDateTimeParam = (val) => {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  // If it's already in "YYYY-MM-DDTHH:mm" format (from datetime-local input), just convert T to space
  const simple = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (simple) {
    const [, y, m, d, h, mi, s] = simple;
    return `${y}-${m}-${d} ${h}:${mi}:${s || "00"}`;
  }
  // Fallback: parse with Date and extract in BD timezone
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;
  // Format in Asia/Dhaka
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const g = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}:${g("second")}`;
};

/**
 * Format a MySQL datetime for API output.
 * Returns an ISO-like string with +06:00 (Bangladesh time).
 *
 * mysql2 pool uses timezone: '+00:00', so DATETIME values are stored
 * in the Date object's UTC slots. Since we store Bangladesh time in MySQL,
 * getUTC*() gives us the original BD values back.
 */
const formatDateTimeOut = (val) => {
  if (!val) return null;
  // For Date objects from mysql2: extract UTC components (= original stored values)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const pad = (n) => String(n).padStart(2, "0");
    return `${val.getUTCFullYear()}-${pad(val.getUTCMonth() + 1)}-${pad(val.getUTCDate())}T${pad(val.getUTCHours())}:${pad(val.getUTCMinutes())}:${pad(val.getUTCSeconds())}+06:00`;
  }
  // For strings: extract date/time portion directly
  const str = String(val);
  const match = str.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  if (match) return `${match[1]}T${match[2]}+06:00`;
  return null;
};

// ─── Admin: Get Mega Sale Settings ────────────────────────────────────────── //

exports.getMegaSaleSettings = api(
  {},
  auth(async (_req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const [settings] = await connection.query(
      `SELECT is_active, campaign_end_at, updated_by_admin, updated_at
       FROM mega_sale_settings WHERE id = 1`
    );

    // Enrolled products with their variations count
    const products = await connection.query(
      `SELECT
         msp.id,
         msp.product_id,
         msp.is_active,
         msp.end_at,
         msp.serial,
         msp.created_at,
         p.name AS product_name,
         p.name_bd AS product_name_bd,
         p.slug AS product_slug,
         p.status AS product_status,
         (SELECT pi2.img_path FROM product_images pi2
          WHERE pi2.product_id = p.id
          ORDER BY pi2.serial ASC, pi2.id ASC LIMIT 1) AS thumbnail,
         (SELECT COUNT(*) FROM product_skus psk WHERE psk.product_id = p.id) AS variation_count,
         (SELECT SUM(psk.stock) FROM product_skus psk WHERE psk.product_id = p.id) AS total_stock,
         (SELECT MIN(psk.selling_price) FROM product_skus psk WHERE psk.product_id = p.id) AS min_price,
         (SELECT MAX(psk.selling_price) FROM product_skus psk WHERE psk.product_id = p.id) AS max_price,
         (SELECT COUNT(*) FROM mega_sale_sku_overrides mso
          WHERE mso.mega_sale_product_id = msp.id AND mso.is_excluded = 1) AS excluded_sku_count
       FROM mega_sale_products msp
       JOIN products p ON p.id = msp.product_id
       ORDER BY msp.serial ASC, msp.id ASC`
    );

    return {
      success: true,
      data: {
        settings: {
          is_active: Boolean(settings?.is_active),
          campaign_end_at: formatDateTimeOut(settings?.campaign_end_at),
          updated_at: formatDateTimeOut(settings?.updated_at),
        },
        products: products.map((row) => ({
          id: row.id,
          product_id: row.product_id,
          is_active: Boolean(row.is_active),
          end_at: formatDateTimeOut(row.end_at),
          serial: row.serial,
          product_name: row.product_name,
          product_name_bd: row.product_name_bd,
          product_slug: row.product_slug,
          product_status: Boolean(row.product_status),
          thumbnail: row.thumbnail || null,
          variation_count: Number(row.variation_count) || 0,
          total_stock: Number(row.total_stock) || 0,
          min_price: Number(row.min_price) || 0,
          max_price: Number(row.max_price) || 0,
          excluded_sku_count: Number(row.excluded_sku_count) || 0,
          created_at: formatDateTimeOut(row.created_at),
        })),
      },
    };
  })
);

// ─── Admin: Update Mega Sale Settings ─────────────────────────────────────── //

exports.updateMegaSaleSettings = api(
  {
    body: {
      is_active: { type: "bool", required: false },
      campaign_end_at: { type: "string", required: false },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const updates = [];
    const params = [];

    if (typeof req.typed.body.is_active === "boolean") {
      updates.push("`is_active` = ?");
      params.push(req.typed.body.is_active ? 1 : 0);
    }

    if (req.body.campaign_end_at !== undefined) {
      const dt = req.body.campaign_end_at === null || req.body.campaign_end_at === ""
        ? null
        : parseDateTimeParam(req.body.campaign_end_at);
      updates.push("`campaign_end_at` = ?");
      params.push(dt);
    }

    if (!updates.length) {
      throw new errors.NO_FIELDS_PROVIDED();
    }

    updates.push("`updated_by_admin` = ?");
    params.push(adminInfo.id);

    await connection.query(
      `UPDATE mega_sale_settings SET ${updates.join(", ")} WHERE id = 1`,
      params
    );

    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPDATE_MEGA_SALE_SETTINGS', 'mega_sale_settings', '1', ?)`,
      [adminInfo.id, JSON.stringify(req.body)]
    );

    return { success: true, message: "Mega Sale settings updated." };
  })
);

// ─── Admin: Add Product to Mega Sale ──────────────────────────────────────── //

exports.addMegaSaleProduct = api(
  {
    body: {
      product_id: { type: "number", required: true },
      end_at: { type: "string", required: false },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const productId = req.typed.body.product_id;

    // Validate product exists
    const [product] = await connection.query(
      `SELECT id, name FROM products WHERE id = ?`, [productId]
    );
    if (!product) {
      throw new errors.INVALID_FIELDS_PROVIDED("Product not found.");
    }

    // Get current max serial
    const [{ maxSerial }] = await connection.query(
      `SELECT COALESCE(MAX(serial), 0) AS maxSerial FROM mega_sale_products`
    );

    const endAt = req.body.end_at ? parseDateTimeParam(req.body.end_at) : null;

    try {
      await connection.query(
        `INSERT INTO mega_sale_products (product_id, serial, is_active, end_at)
         VALUES (?, ?, 1, ?)`,
        [productId, maxSerial + 1, endAt]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return { success: true, message: "Product is already in Mega Sale.", already_exists: true };
      }
      throw err;
    }

    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'ADD_MEGA_SALE_PRODUCT', 'mega_sale_products', ?, ?)`,
      [adminInfo.id, String(productId), JSON.stringify({ product_name: product.name })]
    );

    return { success: true, message: "Product added to Mega Sale." };
  })
);

// ─── Admin: Update Mega Sale Product Entry ────────────────────────────────── //

exports.updateMegaSaleProduct = api(
  {
    params: {
      id: { type: "number", required: true },
    },
    body: {
      is_active: { type: "bool", required: false },
      end_at: { type: "string", required: false },
      serial: { type: "number", required: false },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const entryId = req.typed.params.id;
    const updates = [];
    const params = [];

    if (typeof req.typed.body.is_active === "boolean") {
      updates.push("`is_active` = ?");
      params.push(req.typed.body.is_active ? 1 : 0);
    }

    if (req.body.end_at !== undefined) {
      const dt = req.body.end_at === null || req.body.end_at === ""
        ? null
        : parseDateTimeParam(req.body.end_at);
      updates.push("`end_at` = ?");
      params.push(dt);
    }

    if (req.typed.body.serial !== undefined) {
      updates.push("`serial` = ?");
      params.push(toPositiveInt(req.typed.body.serial, 0, 0));
    }

    if (!updates.length) {
      throw new errors.NO_FIELDS_PROVIDED();
    }

    params.push(entryId);
    const result = await connection.query(
      `UPDATE mega_sale_products SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("Mega Sale product entry not found.");
    }

    return { success: true, message: "Mega Sale product updated." };
  })
);

// ─── Admin: Remove Product from Mega Sale ─────────────────────────────────── //

exports.deleteMegaSaleProduct = api(
  {
    params: {
      id: { type: "number", required: true },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const entryId = req.typed.params.id;

    const result = await connection.query(
      `DELETE FROM mega_sale_products WHERE id = ?`,
      [entryId]
    );

    if (result.affectedRows === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("Mega Sale product entry not found.");
    }

    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'DELETE_MEGA_SALE_PRODUCT', 'mega_sale_products', ?, '{}')`,
      [adminInfo.id, String(entryId)]
    );

    return { success: true, message: "Product removed from Mega Sale." };
  })
);

// ─── Admin: Browsable products list with mega sale enrollment status ──────── //

exports.getMegaSaleProductsList = api(
  {
    query: {
      page: { type: "number", required: false },
      limit: { type: "number", required: false },
      search: { type: "string", required: false },
      enrolled: { type: "string", required: false },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const page = toPositiveInt(req.typed.query.page, 1, 1);
    const limit = Math.min(toPositiveInt(req.typed.query.limit, 20, 1), 50);
    const offset = (page - 1) * limit;

    const whereClauses = ["p.status = 1"];
    const whereParams = [];

    const search = (req.typed.query.search || "").trim();
    if (search) {
      whereClauses.push("(p.name LIKE ? OR p.name_bd LIKE ? OR p.slug LIKE ?)");
      whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Filter: enrolled = "yes" / "no" / undefined (all)
    const enrolled = (req.typed.query.enrolled || "").toLowerCase();
    if (enrolled === "yes") {
      whereClauses.push("msp.id IS NOT NULL");
    } else if (enrolled === "no") {
      whereClauses.push("msp.id IS NULL");
    }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    // Count
    const [{ total }] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM products p
       LEFT JOIN mega_sale_products msp ON msp.product_id = p.id
       ${whereSQL}`,
      whereParams
    );

    // Fetch
    const products = await connection.query(
      `SELECT
         p.id,
         p.name,
         p.name_bd,
         p.slug,
         p.status,
         p.created_at,
         (SELECT pi2.img_path FROM product_images pi2
          WHERE pi2.product_id = p.id
          ORDER BY pi2.serial ASC, pi2.id ASC LIMIT 1) AS thumbnail,
         (SELECT COUNT(*) FROM product_skus psk WHERE psk.product_id = p.id) AS variation_count,
         (SELECT COALESCE(SUM(psk.stock), 0) FROM product_skus psk WHERE psk.product_id = p.id) AS total_stock,
         (SELECT MIN(psk.selling_price) FROM product_skus psk WHERE psk.product_id = p.id) AS min_price,
         (SELECT MAX(psk.selling_price) FROM product_skus psk WHERE psk.product_id = p.id) AS max_price,
         msp.id AS mega_sale_entry_id,
         msp.is_active AS mega_sale_active,
         msp.end_at AS mega_sale_end_at,
         msp.serial AS mega_sale_serial,
         (SELECT COUNT(*) FROM mega_sale_sku_overrides mso
          WHERE mso.mega_sale_product_id = msp.id AND mso.is_excluded = 1) AS excluded_sku_count
       FROM products p
       LEFT JOIN mega_sale_products msp ON msp.product_id = p.id
       ${whereSQL}
       ORDER BY
         CASE WHEN msp.id IS NOT NULL THEN 0 ELSE 1 END,
         msp.serial ASC,
         p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    return {
      success: true,
      data: {
        products: products.map((row) => ({
          id: row.id,
          name: row.name,
          name_bd: row.name_bd,
          slug: row.slug,
          status: Boolean(row.status),
          thumbnail: row.thumbnail || null,
          variation_count: Number(row.variation_count) || 0,
          total_stock: Number(row.total_stock) || 0,
          min_price: Number(row.min_price) || 0,
          max_price: Number(row.max_price) || 0,
          created_at: formatDateTimeOut(row.created_at),
          // Mega sale info (null if not enrolled)
          mega_sale: row.mega_sale_entry_id ? {
            entry_id: row.mega_sale_entry_id,
            is_active: Boolean(row.mega_sale_active),
            end_at: formatDateTimeOut(row.mega_sale_end_at),
            serial: row.mega_sale_serial,
            excluded_sku_count: Number(row.excluded_sku_count) || 0,
          } : null,
        })),
        pagination: {
          page,
          limit,
          total: Number(total) || 0,
          total_pages: Math.ceil((Number(total) || 0) / limit),
        },
      },
    };
  })
);

// ─── Admin: Get SKU overrides for a product ────────────────────────────────── //

exports.getMegaSaleProductSkus = api(
  {
    params: {
      id: { type: "number", required: true },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const megaSaleProductId = req.typed.params.id;

    // Get the mega sale product entry
    const [entry] = await connection.query(
      `SELECT id, product_id, end_at FROM mega_sale_products WHERE id = ?`,
      [megaSaleProductId]
    );
    if (!entry) {
      throw new errors.INVALID_FIELDS_PROVIDED("Mega Sale product entry not found.");
    }

    // Get all SKUs of this product with override status
    const skus = await connection.query(
      `SELECT
         ps.id AS sku_id,
         ps.sku,
         ps.selling_price,
         ps.buying_price,
         ps.discount,
         ps.discount_type,
         ps.stock,
         ps.status AS sku_status,
         c.name AS color_name,
         c.hex AS color_hex,
         v.name AS variant_name,
         mso.id AS override_id,
         mso.is_excluded,
         mso.end_at AS override_end_at
       FROM product_skus ps
       LEFT JOIN colors c ON c.id = ps.color_id
       LEFT JOIN variants v ON v.id = ps.variant_id
       LEFT JOIN mega_sale_sku_overrides mso ON mso.product_sku_id = ps.id
         AND mso.mega_sale_product_id = ?
       WHERE ps.product_id = ?
       ORDER BY ps.id ASC`,
      [megaSaleProductId, entry.product_id]
    );

    return {
      success: true,
      data: {
        mega_sale_product_id: megaSaleProductId,
        product_id: entry.product_id,
        product_end_at: formatDateTimeOut(entry.end_at),
        skus: skus.map((row) => {
          const sellingPrice = Number(row.selling_price) || 0;
          const discount = Number(row.discount) || 0;
          const discountType = Number(row.discount_type) || 0;
          let finalPrice = sellingPrice;
          if (discount > 0) {
            finalPrice = discountType === 1
              ? sellingPrice - (sellingPrice * discount) / 100
              : sellingPrice - discount;
          }
          finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);

          return {
            sku_id: row.sku_id,
            sku: row.sku,
            selling_price: sellingPrice,
            final_price: finalPrice,
            stock: row.stock || 0,
            sku_status: Boolean(row.sku_status),
            color_name: row.color_name,
            color_hex: row.color_hex,
            variant_name: row.variant_name,
            // Override info
            override_id: row.override_id || null,
            is_excluded: row.override_id ? Boolean(row.is_excluded) : false,
            override_end_at: row.override_id ? formatDateTimeOut(row.override_end_at) : null,
            inherits_product: !row.override_id, // true = no override, inherits from product
          };
        }),
      },
    };
  })
);

// ─── Admin: Set/update SKU override ────────────────────────────────────────── //

exports.updateSkuOverride = api(
  {
    params: {
      megaSaleProductId: { type: "number", required: true },
      skuId: { type: "number", required: true },
    },
    body: {
      is_excluded: { type: "bool", required: false },
      end_at: { type: "string", required: false },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    const megaSaleProductId = req.typed.params.megaSaleProductId;
    const skuId = req.typed.params.skuId;

    // Validate the mega sale product entry exists
    const [entry] = await connection.query(
      `SELECT id FROM mega_sale_products WHERE id = ?`, [megaSaleProductId]
    );
    if (!entry) {
      throw new errors.INVALID_FIELDS_PROVIDED("Mega Sale product entry not found.");
    }

    // Validate SKU belongs to this product
    const [sku] = await connection.query(
      `SELECT ps.id FROM product_skus ps
       JOIN mega_sale_products msp ON msp.product_id = ps.product_id
       WHERE ps.id = ? AND msp.id = ?`,
      [skuId, megaSaleProductId]
    );
    if (!sku) {
      throw new errors.INVALID_FIELDS_PROVIDED("SKU does not belong to this mega sale product.");
    }

    const isExcluded = typeof req.typed.body.is_excluded === "boolean"
      ? (req.typed.body.is_excluded ? 1 : 0)
      : 0;

    const endAt = req.body.end_at !== undefined
      ? (req.body.end_at === null || req.body.end_at === "" ? null : parseDateTimeParam(req.body.end_at))
      : null;

    // Upsert
    await connection.query(
      `INSERT INTO mega_sale_sku_overrides
       (mega_sale_product_id, product_sku_id, is_excluded, end_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_excluded = VALUES(is_excluded),
         end_at = VALUES(end_at)`,
      [megaSaleProductId, skuId, isExcluded, endAt]
    );

    return { success: true, message: "SKU override saved." };
  })
);

// ─── Admin: Delete SKU override (reset to inherit) ─────────────────────────── //

exports.deleteSkuOverride = api(
  {
    params: {
      skuId: { type: "number", required: true },
    },
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes("SUPER_ADMIN","ADMIN")) {
      throw new errors.UNAUTHORIZED();
    }

    await connection.query(
      `DELETE FROM mega_sale_sku_overrides WHERE product_sku_id = ?`,
      [req.typed.params.skuId]
    );

    return { success: true, message: "SKU override removed. SKU now inherits from product." };
  })
);

// ─── Public: Get Storefront Visibility (Mega Sale Data) ───────────────────── //

exports.getStorefrontVisibility = api(
  {
    query: {
      page: { type: "number", required: false },
      limit: { type: "number", required: false },
      search: { type: "string", required: false },
      stock_filter: { type: "string", required: false },
      sort_by: { type: "string", required: false },
    },
  },
  async (req, connection) => {
    // 1. Global settings
    const [settings] = await connection.query(
      `SELECT is_active, campaign_end_at
       FROM mega_sale_settings WHERE id = 1`
    );

    const isActive = Boolean(settings?.is_active);

    if (!isActive) {
      return {
        success: true,
        data: {
          show_megasale: false,
          megasale_campaign_end_at: null,
          megasale_product_ids: [],
          megasale_product_limit: 50,
          megasale_product_timers: {},
          products: [],
          filter_counts: { all: 0, in_stock: 0, discounted: 0, new_arrivals: 0 },
          pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
        },
      };
    }

    // 2. Pagination
    const page = toPositiveInt(req.typed.query.page, 1, 1);
    const limit = Math.min(toPositiveInt(req.typed.query.limit, 20, 1), 50);
    const offset = (page - 1) * limit;

    // 3. WHERE clause — product-level enrollment, join to SKUs, exclude overridden SKUs
    const whereClauses = [
      "msp.is_active = 1",
      "p.status = 1",
      "(mso.is_excluded IS NULL OR mso.is_excluded = 0)", // not excluded
    ];
    const whereParams = [];

    const search = (req.typed.query.search || "").trim();
    if (search) {
      whereClauses.push("(p.name LIKE ? OR p.name_bd LIKE ?)");
      whereParams.push(`%${search}%`, `%${search}%`);
    }

    const stockFilter = (req.typed.query.stock_filter || "").toLowerCase();
    if (stockFilter === "in_stock") {
      whereClauses.push("ps.stock > 0");
    } else if (stockFilter === "discounted") {
      whereClauses.push("ps.discount > 0");
    } else if (stockFilter === "new_arrivals") {
      whereClauses.push("p.created_at >= DATE_SUB(NOW(), INTERVAL 21 DAY)");
    }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    // 4. Count
    const [{ total }] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM mega_sale_products msp
       JOIN products p ON p.id = msp.product_id
       JOIN product_skus ps ON ps.product_id = p.id
       LEFT JOIN mega_sale_sku_overrides mso ON mso.product_sku_id = ps.id
         AND mso.mega_sale_product_id = msp.id
       ${whereSQL}`,
      whereParams
    );

    // 5. Sort
    const allowedSorts = {
      serial: "msp.serial ASC, msp.id ASC",
      price_asc: "ps.selling_price ASC",
      price_desc: "ps.selling_price DESC",
      date_desc: "p.created_at DESC",
      date_asc: "p.created_at ASC",
      name_asc: "p.name ASC",
      name_desc: "p.name DESC",
    };
    const sortBy = req.typed.query.sort_by || "serial";
    const orderSQL = `ORDER BY ${allowedSorts[sortBy] || allowedSorts.serial}`;

    // 6. Fetch paginated products
    const products = await connection.query(
      `SELECT
         msp.id AS mega_sale_entry_id,
         msp.end_at AS product_end_at,
         msp.serial,
         ps.id AS product_sku_id,
         ps.sku,
         ps.selling_price,
         ps.buying_price,
         ps.discount,
         ps.discount_type,
         ps.stock,
         ps.product_id,
         p.name,
         p.name_bd,
         p.slug,
         p.created_at,
         p.face_image,
         c.name AS color_name,
         v.name AS variant_name,
         mso.end_at AS sku_override_end_at,
         (SELECT pi2.img_path FROM product_images pi2
          WHERE pi2.product_id = p.id
          ORDER BY pi2.serial ASC, pi2.id ASC LIMIT 1) AS thumbnail
       FROM mega_sale_products msp
       JOIN products p ON p.id = msp.product_id
       JOIN product_skus ps ON ps.product_id = p.id
       LEFT JOIN colors c ON c.id = ps.color_id
       LEFT JOIN variants v ON v.id = ps.variant_id
       LEFT JOIN mega_sale_sku_overrides mso ON mso.product_sku_id = ps.id
         AND mso.mega_sale_product_id = msp.id
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    // 7. Build backward-compatible fields + computed products
    const productTimers = {};
    const productIds = [];

    const computedProducts = products.map((row) => {
      const sellingPrice = Number(row.selling_price) || 0;
      const discount = Number(row.discount) || 0;
      const discountType = Number(row.discount_type) || 0;
      let finalPrice = sellingPrice;
      if (discount > 0) {
        finalPrice = discountType === 1
          ? sellingPrice - (sellingPrice * discount) / 100
          : sellingPrice - discount;
      }
      finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
      const hasDiscount = finalPrice < sellingPrice;

      productIds.push(row.product_id);

      // Timer resolution: SKU override → product end_at → campaign_end_at
      const effectiveEndAt = row.sku_override_end_at || row.product_end_at || null;
      if (effectiveEndAt) {
        productTimers[String(row.product_sku_id)] = formatDateTimeOut(effectiveEndAt);
      }

      return {
        id: row.product_id,
        product_sku_id: row.product_sku_id,
        mega_sale_entry_id: row.mega_sale_entry_id,
        name: row.name,
        name_bd: row.name_bd,
        slug: row.slug,
        thumbnail: row.face_image || row.thumbnail || null,
        selling_price: sellingPrice,
        final_price: finalPrice,
        has_discount: hasDiscount,
        discount_percent: hasDiscount ? Math.round(((sellingPrice - finalPrice) / sellingPrice) * 100) : 0,
        stock: row.stock || 0,
        color_name: row.color_name,
        variant_name: row.variant_name,
        product_end_at: formatDateTimeOut(effectiveEndAt),
        created_at: formatDateTimeOut(row.created_at),
        serial: row.serial,
      };
    });

    // 8. Filter counts
    const baseWhere = `msp.is_active = 1 AND p.status = 1 AND (mso.is_excluded IS NULL OR mso.is_excluded = 0)`;
    const searchWhere = search ? ` AND (p.name LIKE ? OR p.name_bd LIKE ?)` : "";
    const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

    const [filterCounts] = await connection.query(
      `SELECT
         COUNT(*) AS total_all,
         SUM(ps.stock > 0) AS total_in_stock,
         SUM(ps.discount > 0) AS total_discounted,
         SUM(p.created_at >= DATE_SUB(NOW(), INTERVAL 21 DAY)) AS total_new_arrivals
       FROM mega_sale_products msp
       JOIN products p ON p.id = msp.product_id
       JOIN product_skus ps ON ps.product_id = p.id
       LEFT JOIN mega_sale_sku_overrides mso ON mso.product_sku_id = ps.id
         AND mso.mega_sale_product_id = msp.id
       WHERE ${baseWhere}${searchWhere}`,
      searchParams
    );

    return {
      success: true,
      data: {
        show_megasale: true,
        megasale_campaign_end_at: formatDateTimeOut(settings?.campaign_end_at),
        megasale_product_ids: [...new Set(productIds)],
        megasale_product_limit: 50,
        megasale_product_timers: productTimers,

        products: computedProducts,
        filter_counts: {
          all: Number(filterCounts?.total_all) || 0,
          in_stock: Number(filterCounts?.total_in_stock) || 0,
          discounted: Number(filterCounts?.total_discounted) || 0,
          new_arrivals: Number(filterCounts?.total_new_arrivals) || 0,
        },
        pagination: {
          page,
          limit,
          total: Number(total) || 0,
          total_pages: Math.ceil((Number(total) || 0) / limit),
        },
      },
    };
  }
);
