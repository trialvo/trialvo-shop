const { api, auth ,validateAndCast} = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require("validator");

exports.createCoupon = api(
  {
    body: {
      title: { type: "string", required: true },
      code: { type: "string", required: true },
      discount: { type: "int", required: true },
      discount_type: { type: "int", default: 0 },
      min_purchase_amount: { type: "int", default: 0 },
      max_discount_amount: { type: "int", required: false },
      limit_per_user: { type: "int", default: 1 },

      product_scope: { type: "string", default: "all" },
      customer_scope: { type: "string", default: "all" },

      start_date: { type: "string", required: true },
      expire_date: { type: "string", required: true },
      status: { type: "bool", default: true }
    }
  },
  auth(async (req, connection, adminInfo) => {

    /* ========= 1️⃣ Role ========= */
    const ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to create coupons.");
    }

    const body = req.typed.body;
    let { product_variation_ids, customer_ids } = req.body;

    /* ========= 2️⃣ Normalize Arrays ========= */
    product_variation_ids = Array.isArray(product_variation_ids)
      ? [...new Set(product_variation_ids)]
      : [];

    customer_ids = Array.isArray(customer_ids)
      ? [...new Set(customer_ids)]
      : [];

    /* ========= 3️⃣ Validations ========= */
    if (body.title.length > 100)
      throw new errors.INVALID_FIELDS_PROVIDED("Title cannot exceed 100 characters.");

    if (body.code.length > 24)
      throw new errors.INVALID_FIELDS_PROVIDED("Coupon code cannot exceed 24 characters.");

    if (![0, 1].includes(body.discount_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid discount type.");

    if (body.product_scope && body.product_scope != "all" && body.product_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for product");
    if (body.customer_scope && body.customer_scope != "all" && body.customer_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for customer");

    if (body.discount < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Discount amount must be positive number");

    if (body.limit_per_user && body.limit_per_user < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Limit must be positive number");

    if (body.min_purchase_amount && body.min_purchase_amount < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Min purchase amount must be positive number");

    if (body.max_discount_amount && body.max_discount_amount < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Max discount amount must be positive number");

    if (body.discount_type === 1 && !body.max_discount_amount)
      throw new errors.INVALID_FIELDS_PROVIDED("Max discount amount required for percentage coupons.");

    if (!validator.isDate(body.start_date) || !validator.isDate(body.expire_date))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date format.");

    if (new Date(body.start_date) >= new Date(body.expire_date))
      throw new errors.INVALID_FIELDS_PROVIDED("Expire date must be after start date.");

    /* ========= 4️⃣ Scope Enforcement ========= */
    if (body.product_scope === "specified" && !product_variation_ids.length)
      throw new errors.INVALID_FIELDS_PROVIDED("Product variations required.");

    if (body.customer_scope === "specified" && !customer_ids.length)
      throw new errors.INVALID_FIELDS_PROVIDED("Customer IDs required.");

    /* ========= 5️⃣ Code Uniqueness ========= */
    const exists = await connection.queryOne(
      `SELECT id FROM coupons WHERE code = ? and  deleted_at IS  NULL`,
      [body.code]
    );
    if (exists) throw new errors.ALREADY_EXIST("Coupon code already exists.");

    /* ========= 6️⃣ Validate Product Variations ========= */
    if (body.product_scope === "specified") {
      const rows = await connection.query(
        `SELECT id FROM product_skus WHERE id IN (?) AND status = 1`,
        [product_variation_ids]
      );
      if (rows.length !== product_variation_ids.length)
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid product variation detected.");
    }

    /* ========= 7️⃣ Validate Customers ========= */
    if (body.customer_scope === "specified") {
      const rows = await connection.query(
        `SELECT id FROM users WHERE id IN (?) AND status='active' AND deleted_at IS NULL`,
        [customer_ids]
      );
      if (rows.length !== customer_ids.length)
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid customer detected.");
    }

    /* ========= 8️⃣ Insert Coupon ========= */
    const result = await connection.query(
      `INSERT INTO coupons
       (title, code, discount, discount_type, min_purchase_amount,
        max_discount_amount, limit_per_user, product_scope,
        customer_scope, start_date, expire_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.title, body.code, body.discount, body.discount_type,
        body.min_purchase_amount, body.max_discount_amount || null,
        body.limit_per_user, body.product_scope, body.customer_scope,
        body.start_date, body.expire_date, body.status
      ]
    );

    const couponId = result.insertId;

    /* ========= 9️⃣ Insert Targets ========= */
    if (body.product_scope === "specified") {
      await connection.query(
        `INSERT INTO coupon_product_targets (coupon_id, product_sku_id) VALUES ?`,
        [product_variation_ids.map(id => [couponId, id])]
      );
    }

    if (body.customer_scope === "specified") {
      await connection.query(
        `INSERT INTO coupon_customer_targets (coupon_id, customer_id) VALUES ?`,
        [customer_ids.map(id => [couponId, id])]
      );
    }

    /* ========= 🔟 Audit ========= */
    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'CREATE_COUPON', 'coupon', ?, ?)`,
      [adminInfo.id, couponId, JSON.stringify({ code: body.code })]
    );

    return {
      id: couponId,
      ...body,
      product_variation_ids,
      customer_ids
    };
  })
);

 

exports.editCoupon = api(
  {
    params: { id: { type: "int", required: true } },
    body: {
      title: { type: "string", required: false },
      code: { type: "string", required: false },
      discount: { type: "number", required: false },
      discount_type: { type: "int", required: false }, // 0 = flat, 1 = percentage
      min_purchase_amount: { type: "number", required: false },
      max_discount_amount: { type: "number", required: false },
      limit_per_user: { type: "int", required: false },
      product_scope: { type: "string", required: false }, // all | specified
      customer_scope: { type: "string", required: false }, // all | specified
      start_date: { type: "string", required: false },
      expire_date: { type: "string", required: false },
      status: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to edit coupons.");
    }

    const couponId = req.typed.params.id;
    let { product_variation_ids, customer_ids } = req.body;
    const body = { ...req.typed.body, product_variation_ids, customer_ids };

    // ───────────── Check if any fields provided ─────────────
    const UPDATABLE_FIELDS = [
      "title", "code", "discount", "discount_type", "min_purchase_amount",
      "max_discount_amount", "limit_per_user", "product_scope",
      "customer_scope", "start_date", "expire_date", "status"
    ];
    const hasMainFieldUpdate = UPDATABLE_FIELDS.some(key => req.typed.body[key] !== undefined);
    const hasProductTargetUpdate = Array.isArray(req.body.product_variation_ids);
    const hasCustomerTargetUpdate = Array.isArray(req.body.customer_ids);

    if (!hasMainFieldUpdate && !hasProductTargetUpdate && !hasCustomerTargetUpdate) {
      throw new errors.INVALID_FIELDS_PROVIDED("No fields provided to update.");
    }
    if (body.discount && body.discount < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Discount amount must be positive number");
      if (body.limit_per_user && body.limit_per_user < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Limit must be positive number");

    if (body.min_purchase_amount && body.min_purchase_amount < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Min purchase amount must be positive number");

    if (body.max_discount_amount && body.max_discount_amount < 0)
      throw new errors.INVALID_FIELDS_PROVIDED("Max discount amount must be positive number");


    if (body.product_scope && body.product_scope != "all" && body.product_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for product");
    if (body.customer_scope && body.customer_scope != "all" && body.customer_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for customer");
    // ───────────── Load existing coupon ─────────────
    const existing = await connection.queryOne(
      `SELECT * FROM coupons WHERE id = ? AND deleted_at IS NULL`,
      [couponId]
    );
    if (!existing) throw new errors.NOT_FOUND("Coupon not found.");

    // ───────────── Normalize Arrays ─────────────
    body.product_variation_ids = Array.isArray(body.product_variation_ids)
      ? [...new Set(body.product_variation_ids)]
      : undefined;
    body.customer_ids = Array.isArray(body.customer_ids)
      ? [...new Set(body.customer_ids)]
      : undefined;

    const finalProductScope = body.product_scope ?? existing.product_scope;
    const finalCustomerScope = body.customer_scope ?? existing.customer_scope;

    // ───────────── Basic validations ─────────────
    if (body.title && body.title.length > 100)
      throw new errors.INVALID_FIELDS_PROVIDED("Title cannot exceed 100 characters.");
    if (body.code && body.code.length > 24)
      throw new errors.INVALID_FIELDS_PROVIDED("Coupon code cannot exceed 24 characters.");
    if (body.discount_type !== undefined && ![0, 1].includes(body.discount_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid discount type.");

    const finalDiscountType = body.discount_type ?? existing.discount_type;
    const finalMaxDiscount = body.max_discount_amount ?? existing.max_discount_amount;
    if (finalDiscountType === 1 && !finalMaxDiscount)
      throw new errors.INVALID_FIELDS_PROVIDED("Max discount amount is required for percentage coupons.");

    const finalStartDate = body.start_date ?? existing.start_date;
    const finalExpireDate = body.expire_date ?? existing.expire_date;
    if ((body.start_date && !validator.isDate(body.start_date)) ||
      (body.expire_date && !validator.isDate(body.expire_date))) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date format.");
    }
    if (new Date(finalStartDate) >= new Date(finalExpireDate))
      throw new errors.INVALID_FIELDS_PROVIDED("Expire date must be after start date.");

    // ───────────── Code uniqueness ─────────────
    if (body.code) {
      const duplicate = await connection.queryOne(
        `SELECT id FROM coupons WHERE code = ? AND id != ?  `,
        [body.code, couponId]
      );
      if (duplicate) throw new errors.ALREADY_EXIST("Coupon code already exists.");
    }

    // ───────────── Update coupon main table ─────────────
    const updateFields = [];
    const updateValues = [];
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && !["product_variation_ids", "customer_ids"].includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    if (updateFields.length) {
      await connection.query(`UPDATE coupons SET ${updateFields.join(", ")} WHERE id = ?`, [...updateValues, couponId]);
    }

    // ───────────── Product targets ─────────────
    if (finalProductScope === "specified" && body.product_variation_ids?.length) {
      // Always delete old targets first to prevent duplicates
      await connection.query(`DELETE FROM coupon_product_targets WHERE coupon_id = ?`, [couponId]);

      const validSkus = await connection.query(
        `SELECT id FROM product_skus WHERE id IN (?) AND status = 1`,
        [body.product_variation_ids]
      );
      if (validSkus.length !== body.product_variation_ids.length)
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid product variation detected.");

      await connection.query(
        `INSERT INTO coupon_product_targets (coupon_id, product_sku_id) VALUES ?`,
        [body.product_variation_ids.map(id => [couponId, id])]
      );
    }

    // ───────────── Customer targets ─────────────
    if (finalCustomerScope === "specified" && body.customer_ids?.length) {
      // Always delete old targets first to prevent duplicates
      await connection.query(`DELETE FROM coupon_customer_targets WHERE coupon_id = ?`, [couponId]);

      const validCustomers = await connection.query(
        `SELECT id FROM users WHERE id IN (?) AND status='active' AND deleted_at IS NULL`,
        [body.customer_ids]
      );
      if (validCustomers.length !== body.customer_ids.length)
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid customer detected.");

      await connection.query(
        `INSERT INTO coupon_customer_targets (coupon_id, customer_id) VALUES ?`,
        [body.customer_ids.map(id => [couponId, id])]
      );
    }

    // ───────────── Audit log ─────────────
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'EDIT_COUPON', 'coupon', ?, ?)`,
      [adminInfo.id, couponId, JSON.stringify(body)]
    );

    return { success: true };
  })
);


// exports.getCoupons = api(
//   {
//     query: {
//       status: { type: "bool", required: false },
//       product_scope: { type: "string", required: false }, // all | specified
//       customer_scope: { type: "string", required: false }, // all | specified
//       discount_type: { type: "int", required: false }, // 0 | 1
//       search: { type: "string", required: false }, // search on title/code
//       limit: { type: "int", required: false, default: 20 },
//       offset: { type: "int", required: false, default: 0 }
//     }
//   },
//   auth(async (req, connection, adminInfo) => {
//     const { status, product_scope, customer_scope, discount_type, search } = req.typed.query;
//     let { limit, offset } = req.typed.query;

//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);


//   if (product_scope && product_scope != "all" && product_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for product");
//     if (customer_scope && customer_scope != "all" && customer_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for customer");
    

//         if (discount_type   && ![0, 1].includes(discount_type))
//       throw new errors.INVALID_FIELDS_PROVIDED("Invalid discount type.");


//     const filters = [];
//     const values = [];

//     if (status !== undefined) {
//       filters.push("c.status = ?");
//       values.push(status ? 1 : 0);
//     }

//     if (product_scope) {
//       filters.push("c.product_scope = ?");
//       values.push(product_scope);
//     }

//     if (customer_scope) {
//       filters.push("c.customer_scope = ?");
//       values.push(customer_scope);
//     }

//     if (discount_type !== undefined) {
//       filters.push("c.discount_type = ?");
//       values.push(discount_type);
//     }


    
//     if (search) {
//       filters.push("(c.title LIKE ? OR c.code LIKE ?)");
//       values.push(`%${search}%`, `%${search}%`);
//     }
// filters.push("c.deleted_at IS  NULL")

//     const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

//     // ───────────── Total count ─────────────
//     const totalResult = await connection.queryOne(
//       `SELECT COUNT(*) as total FROM coupons c ${whereClause}`,
//       values
//     );
//     const total = totalResult.total;

//     // ───────────── Fetch paginated coupons with counts ─────────────
//     const coupons = await connection.query(
//       `
//       SELECT 
//         c.id, c.title, c.code, c.discount, c.discount_type,
//         c.min_purchase_amount, c.max_discount_amount, c.limit_per_user,
//         c.product_scope, c.customer_scope, c.start_date, c.expire_date,
//         c.status,
//         (SELECT COUNT(*) FROM coupon_product_targets cp WHERE cp.coupon_id = c.id) AS product_count,
//         (SELECT COUNT(*) FROM coupon_customer_targets cc WHERE cc.coupon_id = c.id) AS customer_count
//       FROM coupons c
//       ${whereClause}
//       ORDER BY c.id DESC
//       LIMIT ? OFFSET ?
//       `,
//       [...values, limit, offset]
//     );

//     return { success: true, total, data: coupons };
//   })
// );

exports.getCoupons = api(
  {
    query: {
      status: { type: "bool", required: false },
      product_scope: { type: "string", required: false }, // all | specified
      customer_scope: { type: "string", required: false }, // all | specified
      discount_type: { type: "int", required: false }, // 0 | 1
      is_expired: { type: "bool", required: false }, // Added this
      search: { type: "string", required: false }, // search on title/code
      limit: { type: "int", required: false, default: 20 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { status, product_scope, customer_scope, discount_type, is_expired, search } = req.typed.query;
    let { limit, offset } = req.typed.query;

    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    if (product_scope && product_scope != "all" && product_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for product");
    if (customer_scope && customer_scope != "all" && customer_scope != "specified") throw new errors.INVALID_FIELDS_PROVIDED("Invalid Scope for customer");

    if (discount_type && ![0, 1].includes(discount_type))
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid discount type.");

    const filters = [];
    const values = [];

    if (status !== undefined) {
      filters.push("c.status = ?");
      values.push(status ? 1 : 0);
    }

    if (product_scope) {
      filters.push("c.product_scope = ?");
      values.push(product_scope);
    }

    if (customer_scope) {
      filters.push("c.customer_scope = ?");
      values.push(customer_scope);
    }

    if (discount_type !== undefined) {
      filters.push("c.discount_type = ?");
      values.push(discount_type);
    }

    // --- Added logic for is_expired ---
    if (is_expired !== undefined) {
      if (is_expired) {
        filters.push("c.expire_date < NOW()");
      } else {
        filters.push("c.expire_date >= NOW()");
      }
    }

    if (search) {
      filters.push("(c.title LIKE ? OR c.code LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    filters.push("c.deleted_at IS NULL")

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // ───────────── Total count ─────────────
    const totalResult = await connection.queryOne(
      `SELECT COUNT(*) as total FROM coupons c ${whereClause}`,
      values
    );
    const total = totalResult.total;

    // ───────────── Fetch paginated coupons with counts ─────────────
    const coupons = await connection.query(
      `
      SELECT 
        c.id, c.title, c.code, c.discount, c.discount_type,
        c.min_purchase_amount, c.max_discount_amount, c.limit_per_user,
        c.product_scope, c.customer_scope, c.start_date, c.expire_date,
        c.status,
        (SELECT COUNT(*) FROM coupon_product_targets cp WHERE cp.coupon_id = c.id) AS product_count,
        (SELECT COUNT(*) FROM coupon_customer_targets cc WHERE cc.coupon_id = c.id) AS customer_count
      FROM coupons c
      ${whereClause}
      ORDER BY c.id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    return { success: true, total, data: coupons };
  })
);
exports.getCouponById = api(
  {
    params: { id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const couponId = req.typed.params.id;

    // ───────────── Load coupon ─────────────
    const coupon = await connection.queryOne(
      `SELECT id, title, code, discount, discount_type,
              min_purchase_amount, max_discount_amount, limit_per_user,
              product_scope, customer_scope, start_date, expire_date,
              status
       FROM coupons
       WHERE id = ? AND deleted_at IS NULL`,
      [couponId]
    );
    if (!coupon) throw new errors.NOT_FOUND("Coupon not found.");

    // ───────────── Product Variations ─────────────
    let product_variations = [];
    if (coupon.product_scope === "specified") {
      product_variations = await connection.query(
        `SELECT ps.id as product_variation_id,ps.sku, p.name
         FROM coupon_product_targets cpt
         JOIN product_skus ps ON ps.id = cpt.product_sku_id
         JOIN products p ON p.id = ps.product_id
         WHERE cpt.coupon_id = ?`,
        [couponId]
      );
    }

    // ───────────── Customers ─────────────
    let customers = [];
    if (coupon.customer_scope === "specified") {
      customers = await connection.query(
        `SELECT u.id, u.first_name, u.last_name,
                up.phone_number AS default_phone
         FROM coupon_customer_targets cct
         JOIN users u ON u.id = cct.customer_id
         LEFT JOIN user_phones up ON up.user_id = u.id AND up.is_verified = 1
         WHERE cct.coupon_id = ?`,
        [couponId]
      );
    }

    return {
      success: true,
      data: {
        ...coupon,
        product_variations,
        customers
      }
    };
  })
);


exports.deleteCoupon = api(
  {
    params: { id: { type: "int", required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission to delete coupons.");
    }

    const couponId = req.typed.params.id;

    // ───────────── Load coupon ─────────────
    const coupon = await connection.queryOne(
      `SELECT id FROM coupons WHERE id = ? AND deleted_at IS NULL`,
      [couponId]
    );
    if (!coupon) throw new errors.NOT_FOUND("Coupon not found.");

    // ───────────── Soft delete coupon ─────────────
    await connection.query(
      `UPDATE coupons SET deleted_at = NOW() WHERE id = ?`,
      [couponId]
    );

    // ───────────── Clean up target tables ─────────────
    await connection.query(
      `DELETE FROM coupon_product_targets WHERE coupon_id = ?`,
      [couponId]
    );
    await connection.query(
      `DELETE FROM coupon_customer_targets WHERE coupon_id = ?`,
      [couponId]
    );

    // ───────────── Audit log ─────────────
    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'DELETE_COUPON', 'coupon', ?, ?)`,
      [adminInfo.id, couponId, JSON.stringify({ deleted_at: new Date().toISOString() })]
    );

    return { success: true };
  })
);



 



exports.getUsers = api(
  {
    query: {
      search: { type: "string", required: false },
      phone: { type: "string", required: false },
      status: { type: "string", required: false }, // active, inactive, suspended
      limit: { type: "int", required: false, default: 20 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    let { search, phone, status, limit, offset } = req.typed.query;

    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    const where = ["u.deleted_at IS NULL"];
    const params = [];

    // Status filter
    if (status) {
      where.push(`u.status = ?`);
      params.push(status);
    }

    // Search by name
    if (search) {
      where.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`);
      const searchVal = `%${search}%`;
      params.push(searchVal, searchVal, searchVal);
    }

    // Search by verified phone
    if (phone) {
      where.push(`up.phone_number = ?`);
      params.push(phone);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Fetch users with all verified phones as array
    const users = await connection.query(
      `SELECT 
         u.id, 
         u.first_name, 
         u.last_name, 
         u.email, 
         u.status,
         GROUP_CONCAT(up.phone_number) AS verified_phones
       FROM users u
       LEFT JOIN user_phones up
         ON u.id = up.user_id AND up.is_verified = 1
       ${whereSQL}
       GROUP BY u.id
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Convert comma-separated phones to array
    const result = users.map(u => ({
      ...u,
      verified_phones: u.verified_phones ? u.verified_phones.split(",") : []
    }));

    // Total count
    const countResult = await connection.queryOne(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       LEFT JOIN user_phones up
         ON u.id = up.user_id AND up.is_verified = 1
       ${whereSQL}`,
      params
    );

    return { success: true, data: result, total: countResult.total };
  })
);

exports.getProductVariationscoupon = api(
  {
    query: {
      search: { type: "string", required: false }, // product name or SKU
      product_id: { type: "int", required: false },
      status: { type: "bool", required: false }, // 1 = active, 0 = inactive
      limit: { type: "int", required: false, default: 20 },
      offset: { type: "int", required: false, default: 0 }
    }
  },
  auth(async (req, connection) => {
    let { search, product_id, status, limit, offset } = req.typed.query;

    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    const where = [];
    const params = [];

    // Filter by product
    if (product_id) {
      where.push(`ps.product_id = ?`);
      params.push(product_id);
    }

    // Filter by status
    if (status !== undefined) {
      where.push(`ps.status = ?`);
      params.push(status);
    }

    // Search by product name or SKU
    if (search) {
      where.push(`(p.name LIKE ? OR ps.sku LIKE ?)`);
      const val = `%${search}%`;
      params.push(val, val);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ───────────── Fetch data ─────────────
    const rows = await connection.query(
      `SELECT
         ps.id AS variation_id,
         ps.sku,
         ps.buying_price,
         ps.selling_price,
         ps.discount,
         ps.discount_type,
         ps.stock,
         ps.status,

         p.id AS product_id,
         p.name AS product_name,

         c.name AS color_name,
         v.name AS variant_name
       FROM product_skus ps
       INNER JOIN products p ON p.id = ps.product_id
       LEFT JOIN colors c ON c.id = ps.color_id
       LEFT JOIN variants v ON v.id = ps.variant_id
       ${whereSQL}
       ORDER BY ps.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // ───────────── Count ─────────────
    const count = await connection.queryOne(
      `SELECT COUNT(*) AS total
       FROM product_skus ps
       INNER JOIN products p ON p.id = ps.product_id
       ${whereSQL}`,
      params
    );

    return {
      success: true,
      data: rows,
      total: count.total
    };
  })
);




const orderItemSchema = {
  body: {
    product_variation_id: { type: "int", required: true },
    quantity: { type: "int", required: true }
  }
};

 exports.validateCoupon = api({
    body: {
        customer_id: { type: "int", required: false },
        coupon: { type: "string", required: true },
        order_items: { type: "array", required: true }
    }
}, async (req, connection) => {
   const { customer_id, coupon: coupon_code } = req.typed.body;
    const {  order_items: orderItemsInput} = req.body;
 
    if (!orderItemsInput.length) {
        throw new errors.BAD_REQUEST("order_items cannot be empty");
    }

    /* -------------------- 1️⃣ Validate and Cast order items -------------------- */
    const order_items = orderItemsInput.map((item, index) => {
        try {
            return validateAndCast({ body: item }, orderItemSchema).body;
        } catch (err) {
            throw new errors.INVALID_FIELDS_PROVIDED(`Item at index ${index}: ${err.message}`);
        }
    });

    /* -------------------- 2️⃣ Load Variations & Check Category Status -------------------- */
    const variationIds = [...new Set(order_items.map(i => i.product_variation_id))];
    
    const variations = await connection.query(
        `SELECT s.*, p.name AS product_name
         FROM product_skus s
         JOIN products p ON p.id = s.product_id
         INNER JOIN main_categories mc ON mc.id = p.main_category_id
         LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
         LEFT JOIN child_categories cc ON cc.id = p.child_category_id
         WHERE s.id IN (?) 
           AND s.status = 1
           AND p.status = 1
           AND mc.status = 1
           AND (p.sub_category_id IS NULL OR sc.status = 1)
           AND (p.child_category_id IS NULL OR cc.status = 1)`,
        [variationIds]
    );

    if (variations.length !== variationIds.length) {
        throw new errors.BAD_REQUEST("Some items are no longer available or belong to inactive categories.");
    }

    const variationMap = new Map(variations.map(v => [v.id, v]));

    /* -------------------- 3️⃣ Initial Pricing Calculations -------------------- */
    let totalSellingPrice = 0; 
    let totalSkuDiscount = 0;
    const itemGroups = {};

    order_items.forEach(item => {
        const vid = item.product_variation_id;
        itemGroups[vid] = (itemGroups[vid] || 0) + item.quantity;
    });

    const enrichedItems = [];
    for (const [vid, qty] of Object.entries(itemGroups)) {
        const v = variationMap.get(Number(vid));
        const rawUnitPrice = Number(v.selling_price);
        
        const skuDiscountPerUnit = v.discount_type === 1 
            ? (rawUnitPrice * v.discount) / 100 
            : Number(v.discount || 0);
        
        const lineTotalAfterSkuDiscount = (rawUnitPrice - skuDiscountPerUnit) * qty;

        totalSellingPrice += (rawUnitPrice * qty);
        totalSkuDiscount += (skuDiscountPerUnit * qty);
        
        enrichedItems.push({
            product_variation_id: v.id,
            product_name: v.product_name,
            lineTotal: lineTotalAfterSkuDiscount,
            quantity: qty
        });
    }

    const subtotalAfterSkuDiscount = totalSellingPrice - totalSkuDiscount;

    /* -------------------- 4️⃣ Validate Coupon -------------------- */
    const coupon = await connection.queryOne(
        `SELECT * FROM coupons WHERE code = ? AND status = 1 AND start_date <= NOW() AND expire_date >= NOW() and deleted_at is null`,
        [coupon_code]
    );

    if (!coupon) throw new errors.BAD_REQUEST("Invalid or expired coupon.");

    if (subtotalAfterSkuDiscount < coupon.min_purchase_amount) {
        throw new errors.BAD_REQUEST(`Minimum purchase for this coupon is ${coupon.min_purchase_amount}`);
    }

    // ─── Per-user usage limit check (applies to ALL coupons, any scope) ───
    if (coupon.limit_per_user > 0) {
        if (!customer_id) {
            // Coupon has a per-user limit but no customer id was supplied —
            // cannot verify eligibility, so treat the same as the limit being reached.
            throw new errors.BAD_REQUEST("Please log in to use this coupon.");
        }
        const usageCount = await connection.queryOne(
            `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND customer_id = ?`,
            [coupon.id, customer_id]
        );
        if (usageCount.cnt >= coupon.limit_per_user) {
            throw new errors.BAD_REQUEST(`You have already reached the limit for this coupon (${coupon.limit_per_user} uses allowed)`);
        }
    }

    if (coupon.customer_scope === "specified") {
        if (!customer_id) throw new errors.BAD_REQUEST("This coupon requires login.");
        const isTargeted = await connection.queryOne(
            `SELECT 1 FROM coupon_customer_targets WHERE coupon_id = ? AND customer_id = ? LIMIT 1`,
            [coupon.id, customer_id]
        );
        if (!isTargeted) throw new errors.BAD_REQUEST("This coupon is not available for your account.");
    }

    /* -------------------- 5️⃣ Calculate Applied Coupon Discount Per Item -------------------- */
    let totalCouponDiscount = 0;
    const appliedItems = [];

    // Get targets if scope is specified
    let targetIds = new Set();
    if (coupon.product_scope !== "all") {
        const targets = await connection.query(`SELECT product_sku_id FROM coupon_product_targets WHERE coupon_id = ?`, [coupon.id]);
        targetIds = new Set(targets.map(t => t.product_sku_id));
    }

    enrichedItems.forEach(item => {
        let itemCouponDiscount = 0;
        const isEligible = coupon.product_scope === "all" || targetIds.has(item.product_variation_id);

        if (isEligible) {
            if (coupon.product_scope === "all") {
                // If scope is "all", the discount is usually calculated on the subtotal.
                // We apportion it proportionally to the item's weight in the subtotal for accurate reporting.
                const weight = item.lineTotal / subtotalAfterSkuDiscount;
                const rawDiscount = coupon.discount_type === 0 ? coupon.discount : (subtotalAfterSkuDiscount * coupon.discount) / 100;
                itemCouponDiscount = rawDiscount * weight;
            } else {
                // Specific product discount
                itemCouponDiscount = coupon.discount_type === 0 ? coupon.discount : (item.lineTotal * coupon.discount) / 100;
            }

            totalCouponDiscount += itemCouponDiscount;
            appliedItems.push({
                product_variation_id: item.product_variation_id,
                product_name: item.product_name,
                discount_applied: Number(itemCouponDiscount.toFixed(2))
            });
        }
    });

    if (totalCouponDiscount === 0) {
        throw new errors.BAD_REQUEST("Coupon is not applicable to any items in your cart.");
    }

    // Apply Max Discount Cap
    if (coupon.max_discount_amount != null && totalCouponDiscount > coupon.max_discount_amount) {
        const scalingFactor = coupon.max_discount_amount / totalCouponDiscount;
        totalCouponDiscount = coupon.max_discount_amount;
        // Scale individual items to match the cap
        appliedItems.forEach(item => {
            item.discount_applied = Number((item.discount_applied * scalingFactor).toFixed(2));
        });
    }

    const finalPayableAmount = totalSellingPrice - totalSkuDiscount - totalCouponDiscount;

    return {
        success: true,
        message: "Coupon validated successfully",
        data: {
            coupon_title: coupon.title,
            applied_items: appliedItems, // Now shows which items got the discount
            totals: {
                total_selling_price: Number(totalSellingPrice.toFixed(2)),
                total_sku_discount: Number(totalSkuDiscount.toFixed(2)),
                total_coupon_discount: Number(totalCouponDiscount.toFixed(2)),
                total_discount: Number((totalSkuDiscount + totalCouponDiscount).toFixed(2)),
                final_payable_amount: Number(finalPayableAmount.toFixed(2))
            }
        }
    };
});