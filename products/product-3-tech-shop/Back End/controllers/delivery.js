const { optionalUploadApi, saveImage, deleteFileIfExists } = require('../helpers/img'); // Adjust paths as needed
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');


exports.createDeliveryCharge = optionalUploadApi(
  "delivery_img", // image field name
  {
    body: {
      title: { type: "string", required: true },
      type: { type: "string", required: false, default: "Free Delivery" },
      customer_charge: { type: "float", required: true, default: 0 },
      our_charge: { type: "float", required: true, default: 0 },
      default_weight_kg: { type: "float", required: false, default: 0 },
      extra_charge_per_kg: { type: "float", required: false, default: 0 },
      status: { type: "bool", required: false, default: true }
    }
  },
  auth(async (req, connection, adminInfo) => {

    /* ─────────────── AUTHORIZATION ─────────────── */

    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    const hasPermission = adminInfo.roles.some(role =>
      ALLOWED_ROLES.includes(role)
    );

    if (!hasPermission) {
      throw new errors.UNAUTHORIZED(
        "You do not have permission to create delivery charges"
      );
    }

    /* ─────────────── INPUT ─────────────── */

    const {
      title,
      type,
      customer_charge,
      our_charge,
      default_weight_kg,
      extra_charge_per_kg,
      status
    } = req.typed.body;

    /* ─────────────── VALIDATION ─────────────── */

    if (title.length < 2 || title.length > 255) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Title must be between 2 and 255 characters"
      );
    }

    if (type.length < 2 || type.length > 255) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Type must be between 2 and 255 characters"
      );
    }

    if (customer_charge < 0 || our_charge < 0) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Charges cannot be negative"
      );
    }

    if (default_weight_kg < 0 || extra_charge_per_kg < 0) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Weight and extra charge values cannot be negative"
      );
    }

    /* ─────────────── DUPLICATE CHECK ─────────────── */
    // Prevent same title + type duplication (soft rule)
    const existing = await connection.queryOne(
      `
      SELECT id
      FROM delivery_charges
      WHERE title = ?
        AND type = ?
        AND deleted_at IS NULL
      `,
      [title, type]
    );

    if (existing) {
      throw new errors.ALREADY_EXIST(
        "A delivery charge with this title and type already exists"
      );
    }

    /* ─────────────── IMAGE UPLOAD ─────────────── */

    let imgPath = null;
    if (req.files && req.files.delivery_img) {
      imgPath = await saveImage(
        req.files.delivery_img[0].path,
        "delivery/charges"
      );
    }

    /* ─────────────── INSERT ─────────────── */

    const result = await connection.query(
      `
      INSERT INTO delivery_charges (
        title,
        type,
        customer_charge,
        our_charge,
        default_weight_kg,
        extra_charge_per_kg,
        status,
        img_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        type,
        customer_charge,
        our_charge,
        default_weight_kg,
        extra_charge_per_kg,
        status ? 1 : 0,
        imgPath
      ]
    );

    const deliveryChargeId = result.insertId;

    /* ─────────────── AUDIT LOG ─────────────── */

    await connection.query(
      `
      INSERT INTO admin_audit_logs
        (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'CREATE_DELIVERY_CHARGE', 'delivery_charge', ?, ?)
      `,
      [
        adminInfo.id,
        deliveryChargeId,
        JSON.stringify({
          title,
          type,
          customer_charge,
          our_charge
        })
      ]
    );

    /* ─────────────── RESPONSE ─────────────── */

    return {
      success: true,
      message: "Delivery charge created successfully",
      data: {
        id: deliveryChargeId,
        title,
        type,
        customer_charge,
        our_charge,
        default_weight_kg,
        extra_charge_per_kg,
        status: !!status,
        img_path: imgPath
      }
    };
  })
);




exports.editDeliveryCharge = optionalUploadApi(
  "delivery_img", // image field name
  {
    params: {
      id: { type: "int", required: true }
    },
    body: {
      title: { type: "string", required: false },
      type: { type: "string", required: false },
      customer_charge: { type: "decimal", required: false },
      our_charge: { type: "decimal", required: false },
      default_weight_kg: { type: "float", required: false },
      extra_charge_per_kg: { type: "float", required: false },
      status: { type: "bool", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    // ─────────────── AUTHORIZATION ───────────────
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    const hasPermission = adminInfo.roles.some(role =>
      ALLOWED_ROLES.includes(role)
    );

    if (!hasPermission) {
      throw new errors.UNAUTHORIZED("You do not have permission to edit delivery charges.");
    }

    const deliveryChargeId = req.typed.params.id;
    const {
      title,
      type,
      customer_charge,
      our_charge,
      default_weight_kg,
      extra_charge_per_kg,
      status
    } = req.typed.body;

    // ─────────────── EXISTENCE CHECK ───────────────
    const existing = await connection.queryOne(
      `SELECT * FROM delivery_charges 
       WHERE id = ? AND deleted_at IS NULL`,
      [deliveryChargeId]
    );

    if (!existing) {
      throw new errors.NOT_FOUND("Delivery charge not found.");
    }

    // ─────────────── DYNAMIC UPDATE BUILD ───────────────
    const fields = [];
    const values = [];

    if (title !== undefined) {
      if (title.length > 255)
        throw new errors.INVALID_FIELDS_PROVIDED("Title cannot exceed 255 characters.");
      fields.push("title = ?");
      values.push(title);
    }

    if (type !== undefined) {
      if (type.length < 2 || type.length > 255) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "Type must be between 2 and 255 characters"
        );
      }
      fields.push("type = ?");
      values.push(type);
    }

    if (customer_charge !== undefined) {
      if (customer_charge < 0)
        throw new errors.INVALID_FIELDS_PROVIDED("Customer charge cannot be negative.");
      fields.push("customer_charge = ?");
      values.push(customer_charge);
    }

    if (our_charge !== undefined) {
      if (our_charge < 0)
        throw new errors.INVALID_FIELDS_PROVIDED("Our charge cannot be negative.");
      fields.push("our_charge = ?");
      values.push(our_charge);
    }

    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (default_weight_kg !== undefined) {
      if (default_weight_kg < 0)
        throw new errors.INVALID_FIELDS_PROVIDED("Default weight cannot be negative.");
      fields.push("default_weight_kg = ?");
      values.push(default_weight_kg);
    }

    if (extra_charge_per_kg !== undefined) {
      if (extra_charge_per_kg < 0)
        throw new errors.INVALID_FIELDS_PROVIDED("Extra charge per kg cannot be negative.");
      fields.push("extra_charge_per_kg = ?");
      values.push(extra_charge_per_kg);
    }

    // ─────────────── IMAGE REPLACEMENT ───────────────
    let imgPath = existing.img_path;

    if (req.files && req.files.delivery_img) {
      if (existing.img_path) {
        deleteFileIfExists(existing.img_path);
      }

      imgPath = await saveImage(
        req.files.delivery_img[0].path,
        `delivery/charges/${deliveryChargeId}`
      );

      fields.push("img_path = ?");
      values.push(imgPath);
    }

    if (!fields.length) {
      throw new errors.INVALID_FIELDS_PROVIDED("No fields provided to update.");
    }

    // ─────────────── UPDATE QUERY ───────────────
    await connection.query(
      `UPDATE delivery_charges 
       SET ${fields.join(", ")} 
       WHERE id = ?`,
      [...values, deliveryChargeId]
    );

    // ─────────────── AUDIT LOG ───────────────
    await connection.query(
      `INSERT INTO admin_audit_logs 
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'EDIT_DELIVERY_CHARGE', 'delivery_charge', ?, ?)`,
      [
        adminInfo.id,
        deliveryChargeId,
        JSON.stringify({
          updated_fields: fields.map(f => f.split(" = ")[0])
        })
      ]
    );

    // ─────────────── RESPONSE ───────────────
    return {
      success: true,
      message: "Delivery charge updated successfully."
    };
  })
);


exports.getDeliveryCharges = api(
  {
    query: {
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 },
      status: { type: "bool", required: false },
      type: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {

    // ─────────────── AUTHORIZATION ───────────────
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    const hasPermission = adminInfo.roles.some(role =>
      ALLOWED_ROLES.includes(role)
    );

    if (!hasPermission) {
      throw new errors.UNAUTHORIZED("You do not have permission to view delivery charges.");
    }

    let { limit, offset, status, type } = req.typed.query;

    // ─────────────── PAGINATION SAFETY ───────────────
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    // ─────────────── FILTER BUILD ───────────────
    const conditions = ["deleted_at IS NULL"];
    const values = [];

    if (status !== undefined) {

      conditions.push("status = ?");
      values.push(status);
    }

    if (type) {
      if (type.length < 2 || type.length > 255) {
        throw new errors.INVALID_FIELDS_PROVIDED(
          "Type must be between 2 and 255 characters"
        );
      }

      conditions.push("type = ?");
      values.push(type);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // ─────────────── DATA QUERY ───────────────
    const rawData = await connection.query(
      `
      SELECT 
        id,
        title,
        type,
        customer_charge,
        our_charge,
        default_weight_kg,
        extra_charge_per_kg,
        status,
        img_path,
        created_at,
        updated_at
      FROM delivery_charges
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    // Convert status from 0/1 to false/true
    const data = rawData.map(row => ({
      ...row,
      status: !!row.status // This converts 1 to true and 0 to false
    }));

    // ─────────────── COUNT QUERY ───────────────
    const totalRow = await connection.queryOne(
      `
      SELECT COUNT(*) as total
      FROM delivery_charges
      ${whereClause}
      `,
      values
    );

    // ─────────────── RESPONSE ───────────────
    return {
      success: true,
      data,
      pagination: {
        total: totalRow.total,
        limit,
        offset
      }
    };
  })
);


exports.getDeliveryChargeById = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {

    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("You do not have permission.");
    }

    const deliveryCharge = await connection.queryOne(
      `
      SELECT *
      FROM delivery_charges
      WHERE id = ? AND deleted_at IS NULL
      `,
      [req.typed.params.id]
    );

    // If the record exists, convert status to boolean
    if (deliveryCharge) {
      deliveryCharge.status = !!deliveryCharge.status;
    }

    if (!deliveryCharge) {
      throw new errors.NOT_FOUND("Delivery charge not found.");
    }

    return deliveryCharge;
  })
);
exports.deleteDeliveryCharge = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {

    // ─────────────── AUTHORIZATION ───────────────
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "LOGISTICS_MANAGER"];
    const hasPermission = adminInfo.roles.some(role =>
      ALLOWED_ROLES.includes(role)
    );

    if (!hasPermission) {
      throw new errors.UNAUTHORIZED("You do not have permission to delete delivery charges.");
    }

    const deliveryChargeId = req.typed.params.id;

    // ─────────────── FETCH EXISTING ───────────────
    const existing = await connection.queryOne(
      `
      SELECT id, img_path
      FROM delivery_charges
      WHERE id = ? AND deleted_at IS NULL
      `,
      [deliveryChargeId]
    );

    if (!existing) {
      throw new errors.NOT_FOUND("Delivery charge not found or already deleted.");
    }

    // ─────────────── IMAGE CLEANUP ───────────────
    if (existing.img_path) {
      try {
        deleteFileIfExists(existing.img_path);
      } catch (err) {
        console.warn("Failed to delete delivery charge image:", err.message);
      }
    }

    // ─────────────── SOFT DELETE ───────────────
    await connection.query(
      `
      UPDATE delivery_charges
      SET deleted_at = NOW(), status = 0
      WHERE id = ?
      `,
      [deliveryChargeId]
    );

    // ─────────────── AUDIT LOG ───────────────
    await connection.query(
      `
      INSERT INTO admin_audit_logs
        (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'DELETE_DELIVERY_CHARGE', 'delivery_charge', ?, ?)
      `,
      [
        adminInfo.id,
        deliveryChargeId,
        JSON.stringify({ by: adminInfo.id })
      ]
    );

    // ─────────────── RESPONSE ───────────────
    return {
      success: true,
      message: "Delivery charge deleted successfully."
    };
  })
);



// 23. Guest Order Delivery Charges
exports.getGuestDeliveryChargesUser = api(
  {},
  async (req, connection) => {
    const deliveryCharges = await connection.query(
      `SELECT id,title,type,customer_charge,default_weight_kg,extra_charge_per_kg,img_path
       FROM delivery_charges
       WHERE status = 1
         AND deleted_at IS NULL
       ORDER BY customer_charge ASC`
    );

    return {
      success: true,
      delivery_charges: deliveryCharges
    };
  }
);

