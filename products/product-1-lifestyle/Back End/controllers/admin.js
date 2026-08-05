
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const validator = require("validator");
const { api, auth } = require('../helpers/common');
const errors = require("../helpers/errors");
const { jwtSecret, jwtExpiry } = require('../config/ApplicationSettings');
const { validateLogin } = require("../validators/login");

const { saveImage, uploadApi, optionalUploadApi, deleteFileIfExists } = require("../helpers/img"); // our dynamic function
const { getConfig } = require('../config/ApplicationSettingsDB');


exports.adminLogin = api(
  {
    body: {
      email: { type: "string", required: true },
      password: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { email, password } = req.typed.body;

    validateLogin(email, password);

    // 1️⃣ Fetch admin (reject soft-deleted and inactive)
    const admin = await connection.queryOne("SELECT * FROM admins WHERE email=? AND deleted_at IS NULL", [email]);
    if (!admin) throw new errors.NOT_FOUND("Admin not found or deleted.");
    if (!admin.is_active) throw new errors.NOT_FOUND("Admin account is deactivated.");

    // 2️⃣ Verify password
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) throw new errors.INVALID_EMAIL_PASS();

    // 3️⃣ Fetch roles & permissions
    const roles = await connection.query(
      `SELECT r.name FROM admin_roles ar
         JOIN roles r ON ar.role_id=r.id
         WHERE ar.admin_id=?`,
      [admin.id]
    );

    const permissions = await connection.query(
      `SELECT p.key FROM admin_roles ar
         JOIN role_permissions rp ON ar.role_id=rp.role_id
         JOIN permissions p ON rp.permission_id=p.id
         WHERE ar.admin_id=?`,
      [admin.id]
    );

    // 4️⃣ Generate JWT with token_version
    const accessToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        roles: roles.map(r => r.name),
        permissions: permissions.map(p => p.key),
        token_version: admin.token_version
      },
      jwtSecret,
      { expiresIn: `${jwtExpiry}h` }
    );

    // 5️⃣ Update last_login_at
    await connection.query("UPDATE admins SET last_login_at=NOW() WHERE id=?", [admin.id]);

    return {
      accessToken, admin: {
        id: admin.id, email: admin.email,
        first_name: admin.first_name, last_name: admin.last_name,
        phone: admin.phone,
        address: admin.address,
        profile_img_path: admin.profile_img_path,
        roles: roles.map(r => r.name), permissions: permissions.map(p => p.key)
      }
    };
  }
);


exports.getAdmins = api(
  {
    query: {
      role: { type: "string" },
      email: { type: "string" },
      is_active: { type: "bool" },
      limit: { type: "int", default: 20 },
      offset: { type: "int", default: 0 }
    }
  },
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED("You are not allowed to view admins");
    }

    const { role, email, is_active, limit, offset } = req.typed.query;

    const where = [];
    const params = [];

    /* --- V2: Always hide soft-deleted admins --- */
    where.push("a.deleted_at IS NULL");

    /* ---------------- Filters ---------------- */
    if (email) {
      if (!validator.isEmail(email)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format for filter");
      where.push("a.email LIKE ?");
      params.push(`%${email}%`);
    }

    if (is_active !== undefined) {
      where.push("a.is_active = ?");
      params.push(is_active);
    }

    if (role) {
      where.push("r.name = ?");
      params.push(role);
    }
    if (adminInfo.roles.includes("SUPER_ADMIN")) {
      where.push("r.name NOT IN ('SUPER_ADMIN')");
      where.push("a.id != ?");
      params.push(adminInfo.id);
    }
    /* ------------- Role Visibility ------------ */
    if (!adminInfo.roles.includes("SUPER_ADMIN") && adminInfo.roles.includes("ADMIN")) {
      where.push("r.name NOT IN ('SUPER_ADMIN','ADMIN')");
      where.push("a.id != ?");
      params.push(adminInfo.id);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    /* ---------------- Count for Pagination ---------------- */
    const countSql = `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM admins a
      JOIN admin_roles ar ON a.id = ar.admin_id
      JOIN roles r ON ar.role_id = r.id
      ${whereSql}
    `;
    const [{ total }] = await connection.query(countSql, params);

    /* ---------------- Fetch Admins ---------------- */
    const sql = `
      SELECT 
        a.id,
        a.email,
        a.is_active,
        a.created_at,
        a.last_login_at,
        a.profile_img_path,
        a.first_name,
        a.last_name,
        a.phone,
        a.address,
        GROUP_CONCAT(DISTINCT r.name) AS roles
      FROM admins a
      JOIN admin_roles ar ON a.id = ar.admin_id
      JOIN roles r ON ar.role_id = r.id
      ${whereSql}
      GROUP BY a.id
      ORDER BY a.id ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    let admins = await connection.query(sql, params);

    admins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      is_active: Boolean(admin.is_active),
      created_at: admin.created_at,
      last_login_at: admin.last_login_at,
      profile_img_path: admin.profile_img_path,
      first_name: admin.first_name,
      last_name: admin.last_name,
      phone: admin.phone,
      address: admin.address,
      roles: admin.roles ? admin.roles.split(",") : []
    }));

    return { data: admins, limit, offset, total };
  })
);

/**
 * GET /admin/admins/filter-list
 * Lightweight endpoint — any authenticated admin can call this.
 * Returns a minimal admin list (id, name, email, avatar) for use in
 * filter dropdowns. No admin.manage permission required.
 */
exports.getAdminFilterList = api(
  {},
  auth(async (req, connection) => {
    const admins = await connection.query(
      `SELECT
         a.id,
         a.first_name,
         a.last_name,
         a.email,
         a.profile_img_path
       FROM admins a
       WHERE a.deleted_at IS NULL AND a.is_active = 1
       ORDER BY a.first_name ASC, a.email ASC
       LIMIT 200`
    );

    return {
      data: admins.map(a => ({
        id:              a.id,
        first_name:      a.first_name,
        last_name:       a.last_name,
        email:           a.email,
        profile_img_path: a.profile_img_path,
      }))
    };
  })
);

exports.getAdminById = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED("You are not allowed to view admins");
    }

    const { id } = req.typed.params;

    const where = ["a.id = ?", "a.deleted_at IS NULL"];
    const params = [id];

    /* ------------- Role Visibility ------------ */
    if (adminInfo.roles.includes("SUPER_ADMIN")) {
      where.push("r.name NOT IN ('SUPER_ADMIN')");
      where.push("a.id != ?");
      params.push(adminInfo.id);
    }

    if (!adminInfo.roles.includes("SUPER_ADMIN") && adminInfo.roles.includes("ADMIN")) {
      where.push("r.name NOT IN ('SUPER_ADMIN','ADMIN')");
      where.push("a.id != ?");
      params.push(adminInfo.id);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const sql = `
      SELECT 
        a.id,
        a.email,
        a.is_active,
        a.created_at,
        a.last_login_at,
        a.profile_img_path,
        a.first_name,
        a.last_name,
        a.phone,
        a.address,
        GROUP_CONCAT(DISTINCT r.name) AS roles
      FROM admins a
      JOIN admin_roles ar ON a.id = ar.admin_id
      JOIN roles r ON ar.role_id = r.id
      ${whereSql}
      GROUP BY a.id
      LIMIT 1
    `;

    const admin = await connection.queryOne(sql, params);

    if (!admin) {
      throw new errors.NOT_FOUND("Admin not found");
    }



    return {
      id: admin.id,
      email: admin.email,
      is_active: Boolean(admin.is_active),
      created_at: admin.created_at,
      last_login_at: admin.last_login_at,
      profile_img_path: admin.profile_img_path,
      first_name: admin.first_name,
      last_name: admin.last_name,
      phone: admin.phone,
      address: admin.address,
      roles: admin.roles ? admin.roles.split(",") : []
    };
  })
);



exports.getAllRoles = api(
  auth(async (req, connection, adminInfo) => {

    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED();
    }

    let where = "";
    const params = [];
    if (adminInfo.roles.includes("SUPER_ADMIN")) {
      // No restrictions
    } else if (!adminInfo.roles.includes("SUPER_ADMIN") && adminInfo.roles.includes("ADMIN")) {
      where = "WHERE name NOT IN ('SUPER_ADMIN','ADMIN')";
    } else {
      throw new errors.UNAUTHORIZED();
    }


    const roles = await connection.query(
      `
      SELECT 
        id,
        name,
        is_system
      FROM roles
      ${where}
      ORDER BY is_system DESC, id ASC
      `,
      params
    );

    return roles;
  })
);








exports.createAdmin = optionalUploadApi("profile",
  {
    body: {
      email: { type: "string", required: true },
      password: { type: "string", required: true },
      role_id: { type: "int", required: true },
      first_name: { type: "string" },
      last_name: { type: "string" },
      phone: { type: "string" },
      address: { type: "string" },
      is_active: { type: "bool", required: false, default: true },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const {
      email,
      password,
      role_id,
      first_name,
      last_name,
      phone,
      address,
      is_active
    } = req.typed.body;

    /* ---------- Permission Check ---------- */
    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED("You are not allowed to create admins");
    }

    /* ---------- Phone Validation ---------- */
    if (phone && !validator.isMobilePhone(phone)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
    }

    /* ---------- Creator Role Rules ---------- */
    let forbiddenRoles = [];

    if (adminInfo.roles.includes("SUPER_ADMIN")) {
      forbiddenRoles = ["SUPER_ADMIN"];
    } else if (adminInfo.roles.includes("ADMIN")) {
      forbiddenRoles = ["SUPER_ADMIN", "ADMIN"];
    } else {
      throw new errors.UNAUTHORIZED();
    }

    /* ---------- Fetch Role ---------- */
    const role = await connection.queryOne(
      `SELECT id, name FROM roles WHERE id = ?`,
      [role_id]
    );

    if (!role) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid role provided");
    }

    if (forbiddenRoles.includes(role.name)) {
      throw new errors.UNAUTHORIZED(`You cannot assign role: ${role.name}`);
    }

    /* ---------- Duplicate Email Check (V2: restore soft-deleted) ---------- */
    const exists = await connection.queryOne(
      `SELECT id, deleted_at FROM admins WHERE email = ?`,
      [email]
    );

    if (exists && !exists.deleted_at) {
      throw new errors.ALREADY_EXIST("Admin with this email already exists");
    }

    /* ---------- Hash Password ---------- */
    const passwordHash = await bcrypt.hash(password, 12);

    let adminId;

    if (exists && exists.deleted_at) {
      /* --- V2: Restore soft-deleted admin --- */
      adminId = exists.id;
      await connection.query(
        `UPDATE admins SET
           password_hash = ?,
           first_name = ?,
           last_name = ?,
           phone = ?,
           address = ?,
           is_active = ?,
           deleted_at = NULL,
           deleted_by_admin_id = NULL,
           token_version = token_version + 1
         WHERE id = ?`,
        [passwordHash, first_name, last_name, phone, address, is_active, adminId]
      );

      /* Update role: remove old roles and assign new one */
      await connection.query("DELETE FROM admin_roles WHERE admin_id = ?", [adminId]);
    } else {
      /* --- Standard new admin insert --- */
      const insertAdmin = await connection.query(
        `INSERT INTO admins
         (email, password_hash, first_name, last_name, phone, address, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, passwordHash, first_name, last_name, phone, address, is_active]
      );
      adminId = insertAdmin.insertId;
    }

    let imgPath = null;
    if (req.files && req.files.profile) {
      imgPath = await saveImage(req.files.profile[0].path, `profiles/admins/${adminId}`);
    }

    await connection.query("UPDATE admins SET profile_img_path=? WHERE id=?", [imgPath, adminId]);

    /* ---------- Assign Role ---------- */
    await connection.query(
      `INSERT INTO admin_roles (admin_id, role_id) VALUES (?, ?)`,
      [adminId, role.id]
    );

    /* ---------- Audit Log ---------- */
    await connection.query(
      `INSERT INTO admin_audit_logs
       (admin_id, action, resource, resource_id, meta)
       VALUES (?, ?, ?, ?, ?)`,
      [
        adminInfo.id,
        exists && exists.deleted_at ? "RESTORE_ADMIN" : "CREATE_ADMIN",
        "admin",
        adminId,
        JSON.stringify({
          email,
          role: role.name,
          first_name,
          last_name,
          phone,
          address,
          is_active,
          restored: !!(exists && exists.deleted_at)
        })
      ]
    );

    /* ---------- V2-018: Auto-seed notification permissions ---------- */
    await connection.query(
      `INSERT INTO admin_notification_permissions
       (admin_id, order_notification_email, order_notification_sms, order_notification_firebase_push,
        personal_notification_email, personal_notification_sms, personal_notification_firebase_push,
        updated_by_admin)
       VALUES (?, 1, 0, 0, 1, 0, 0, ?)
       ON DUPLICATE KEY UPDATE updated_by_admin = VALUES(updated_by_admin), updated_at = NOW()`,
      [adminId, adminInfo.id]
    );

    /* ---------- Response ---------- */
    return {
      id: adminId,
      email,
      roles: [role.name],
      first_name,
      last_name,
      phone,
      address,
      is_active,
      profile_img_path: imgPath
    };
  })
);









exports.uploadAdminProfileImage = uploadApi(
  "profile", // Field name from the form
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const targetAdminId = req.typed.params.id;
    const file = req.files.profile[0]; // Guaranteed to exist by uploadApi

    /* ---------- Fetch Target Admin Roles ---------- */
    // Fetch the target admin's roles to enforce RBAC rules
    const targetAdmin = await connection.queryOne(
      `
      SELECT 
        a.id,
        a.profile_img_path,
        a.is_active,
        a.deleted_at,
        GROUP_CONCAT(r.name) AS roles
      FROM admins a
      JOIN admin_roles ar ON a.id = ar.admin_id
      JOIN roles r ON ar.role_id = r.id
      WHERE a.id = ?
      GROUP BY a.id
      `,
      [targetAdminId]
    );

    if (!targetAdmin) {
      throw new errors.NOT_FOUND("Admin not found");
    }
    if (targetAdmin.deleted_at) {
      throw new errors.NOT_FOUND("Target admin account is deleted.");
    }
    if (!targetAdmin.is_active) {
      throw new errors.BAD_REQUEST("Target admin account is inactive.");
    }

    const targetRoles = targetAdmin.roles ? targetAdmin.roles.split(",") : [];

    /* ---------- Permission Logic ---------- */
    const isSelf = adminInfo.id === targetAdminId;
    const isSuperAdmin = adminInfo.roles.includes("SUPER_ADMIN");
    const isAdmin = adminInfo.roles.includes("ADMIN");

    if (!isSelf) {
      if (isSuperAdmin) {
        if (targetRoles.includes("SUPER_ADMIN")) {
          throw new errors.UNAUTHORIZED("SUPER_ADMIN cannot modify another super admin");
        }
      } else if (isAdmin) {
        if (targetRoles.includes("SUPER_ADMIN") || targetRoles.includes("ADMIN")) {
          throw new errors.UNAUTHORIZED("ADMIN cannot modify another admin's profile image");
        }
      } else {
        throw new errors.UNAUTHORIZED("You do not have permission to modify another admin's profile image");
      }
    }

    /* ---------- Delete Old Image ---------- */
    //Placeholder function (You need to implement this for your file system)
    if (targetAdmin.profile_img_path) {
      deleteFileIfExists(targetAdmin.profile_img_path);
    }

    /* ---------- Save New Image (Reusing saveImage) ---------- */
    const profileImgPath = await saveImage(
      file.path,
      `profiles/admins/${targetAdminId}`
      // Uses profile_size and profile_quality defaults
    );

    /* ---------- Update DB ---------- */
    await connection.query(
      `UPDATE admins SET profile_img_path=? WHERE id=?`,
      [profileImgPath, targetAdminId]
    );

    /* ---------- Audit Log ---------- */
    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        adminInfo.id,
        "UPDATE_PROFILE_IMAGE",
        "admin",
        targetAdminId,
        JSON.stringify({
          by: adminInfo.id,
          target: targetAdminId
        })
      ]
    );

    return {
      admin_id: targetAdminId,
      profile_img_path: profileImgPath
    };
  })
);







exports.editAdmin = api(
  {
    params: {
      id: { type: "int", required: true },
    },
    body: {
      email: { type: "string", required: false },
      password: { type: "string", required: false },
      role_id: { type: "int", required: false },
      first_name: { type: "string", required: false },
      last_name: { type: "string", required: false },
      phone: { type: "string", required: false },
      address: { type: "string", required: false },
      is_active: { type: "bool", required: false },
    }
  },
  auth(async (req, connection, adminInfo) => {


    const targetId = req.typed.params.id;
    const updates = req.typed.body;
    const isSelf = adminInfo.id === targetId;

    if (updates.phone && !validator.isMobilePhone(updates.phone)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
    if (updates.email && !validator.isEmail(updates.email)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");
    if (updates.password && !validator.isLength(updates.password, { min: 8, max: 12 })) throw new errors.INVALID_FIELDS_PROVIDED('Password must be between 8 and 12 characters.');


    // --- 1. Fetch Target Metadata ---
    const target = await connection.queryOne(`
      SELECT a.*, GROUP_CONCAT(r.name) AS role_names
      FROM admins a
      LEFT JOIN admin_roles ar ON a.id = ar.admin_id
      LEFT JOIN roles r ON ar.role_id = r.id
      WHERE a.id = ?
        AND a.deleted_at IS NULL
       
      GROUP BY a.id`, [targetId]
    );

    if (!target) throw new errors.NOT_FOUND("Target admin not found.");
    if (target.deleted_at) throw new errors.NOT_FOUND("Target admin account is deleted.");
   
    const targetRoles = target.role_names ? target.role_names.split(',') : [];
    const isTargetSuper = targetRoles.includes("SUPER_ADMIN");
    const isTargetAdmin = targetRoles.includes("ADMIN");

    // --- 2. RBAC & Hierarchy Guard ---
    if (isSelf) {
      // Prevent self-lockout or self-promotion
      if (updates.role_id !== undefined || updates.is_active !== undefined || updates.password !== undefined) {
        throw new errors.UNAUTHORIZED("Security fields (role, status, password) cannot be self-edited here.");
      }
    } else {
      // Must have manage permission to edit others
      if (!adminInfo.permissions.includes("admin.manage")) {
        throw new errors.UNAUTHORIZED("Insufficient permissions.");
      }
      // Hierarchy: Can't edit Supers. Admins can't edit other Admins.
      if (isTargetSuper) throw new errors.UNAUTHORIZED("SUPER_ADMIN is immutable.");
      if (adminInfo.roles.includes("ADMIN") && isTargetAdmin) {
        throw new errors.UNAUTHORIZED("ADMIN cannot modify another ADMIN.");
      }
    }

    // --- 3. Prepare Updates & Tracking ---
    const updateFields = [];
    const updateValues = [];
    const auditMeta = {};
    let forceLogout = false;

    // Email Unique Check
    if (updates.email && updates.email !== target.email) {
      const exists = await connection.queryOne("SELECT id FROM admins WHERE email = ? AND id != ? AND deleted_at IS NULL", [updates.email, targetId]);
      if (exists) throw new errors.ALREADY_EXIST("Email already in use.");
      updateFields.push("email = ?"), updateValues.push(updates.email);
      auditMeta.email = { old: target.email, new: updates.email };
    }

    // Password Hashing
    if (updates.password) {
      updateFields.push("password_hash = ?"), updateValues.push(await bcrypt.hash(updates.password, 12));
      forceLogout = true;
      auditMeta.password = "changed";
    }

    // Standard Fields
    const fields = ['first_name', 'last_name', 'phone', 'address', 'is_active'];
    fields.forEach(key => {
      if (updates[key] !== undefined && updates[key] !== target[key]) {
        updateFields.push(`${key} = ?`), updateValues.push(updates[key]);
        auditMeta[key] = { new: updates[key] };
        if (key === 'is_active') forceLogout = true;
      }
    });

    // --- 4. Atomic Transaction ---
    // return await connection.transaction(async (connection) => {

    // Role Update Logic (Promotion Guard)
    if (updates.role_id !== undefined) {
      const newRole = await connection.queryOne("SELECT name FROM roles WHERE id = ?", [updates.role_id]);
      if (!newRole) throw new errors.NOT_FOUND("New role not found.");

      // BLOCK: Prevent promotion to SUPER_ADMIN or ADMIN (if requester is only ADMIN)
      const isPromotingToSuper = newRole.name === "SUPER_ADMIN";
      const isPromotingToAdmin = newRole.name === "ADMIN" && adminInfo.roles.includes("ADMIN");

      if (isPromotingToSuper || isPromotingToAdmin) {
        throw new errors.UNAUTHORIZED(`You cannot assign the role: ${newRole.name}`);
      }

      await connection.query("DELETE FROM admin_roles WHERE admin_id = ?", [targetId]);
      await connection.query("INSERT INTO admin_roles (admin_id, role_id) VALUES (?, ?)", [targetId, updates.role_id]);

      auditMeta.role = { old: target.role_names, new: newRole.name };
      forceLogout = true;
    }

    // Final Admin Table Update
    if (forceLogout) updateFields.push("token_version = token_version + 1");

    if (updateFields.length > 0) {
      await connection.query(
        `UPDATE admins SET ${updateFields.join(", ")} WHERE id = ?`,
        [...updateValues, targetId]
      );
    }

    // Audit Logging
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource_id, meta) VALUES (?, ?, ?, ?)`,
      [adminInfo.id, "EDIT_ADMIN", targetId, JSON.stringify(auditMeta)]
    );

    return {
      success: true,
      id: targetId,
      relogin_required: forceLogout,
      changes: auditMeta
    };
    // });
  })
);

exports.adminSoftDelete = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const targetId = req.typed.params.id;
    const isSelf = adminInfo.id === targetId;

    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED("Insufficient permissions.");
    }

    if (isSelf) {
      throw new errors.UNAUTHORIZED("You cannot delete your own account.");
    }

    const target = await connection.queryOne(
      `
      SELECT
        a.id,
        a.email,
        a.is_active,
        a.deleted_at,
        GROUP_CONCAT(r.name) AS role_names
      FROM admins a
      LEFT JOIN admin_roles ar ON a.id = ar.admin_id
      LEFT JOIN roles r ON ar.role_id = r.id
      WHERE a.id = ?
      GROUP BY a.id
      `,
      [targetId]
    );

    if (!target) throw new errors.NOT_FOUND("Target admin not found.");
    if (target.deleted_at) {
      throw new errors.BAD_REQUEST("Target admin already deleted.");
    }

    const targetRoles = target.role_names ? target.role_names.split(",") : [];
    const isTargetSuper = targetRoles.includes("SUPER_ADMIN");
    const isTargetAdmin = targetRoles.includes("ADMIN");

    if (isTargetSuper) throw new errors.UNAUTHORIZED("SUPER_ADMIN is immutable.");
    if (adminInfo.roles.includes("ADMIN") && isTargetAdmin) {
      throw new errors.UNAUTHORIZED("ADMIN cannot modify another ADMIN.");
    }

    const updateResult = await connection.query(
      `
      UPDATE admins
      SET
        is_active = 0,
        deleted_at = NOW(),
        deleted_by_admin_id = ?,
        token_version = token_version + 1
      WHERE id = ? AND deleted_at IS NULL
      `,
      [adminInfo.id, targetId]
    );

    if (!updateResult.affectedRows) {
      throw new errors.BAD_REQUEST("Admin could not be deleted.");
    }

    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'DELETE_ADMIN', 'admin', ?, ?)
      `,
      [
        adminInfo.id,
        targetId,
        JSON.stringify({
          target_email: target.email,
          target_roles: targetRoles,
          previous_is_active: Boolean(target.is_active),
          deleted_by_admin_id: adminInfo.id
        })
      ]
    );

    return {
      success: true,
      id: targetId,
      message: "Admin soft-deleted successfully."
    };
  })
);





exports.getAdminAuditLogs = api(
  {
    query: {
      admin_id: { type: "int", required: false },
      target_id: { type: "int", required: false },
      action: { type: "string", required: false },
      search: { type: "string", required: false },
      date_from: { type: "string", required: false },
      date_to: { type: "string", required: false },
      limit: { type: "int", required: false },

      // Pagination (use ONE only)
      cursor: { type: "int", required: false },
      page: { type: "int", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED();
    }

    // ─────────────────────────────────────
    // 1️⃣ Pagination Params
    // ─────────────────────────────────────
    const rawLimit = req.typed.query.limit;
    const limit = rawLimit === undefined ? 100 : rawLimit;
    if (limit < 20 || limit > 500) {
      throw new errors.INVALID_FIELDS_PROVIDED("limit must be between 20 and 500");
    }
    const {
      admin_id,
      target_id,
      action,
      search,
      date_from,
      date_to,
      cursor,
      page
    } = req.typed.query;

    const usingCursor = cursor !== undefined;
    const usingPage = page !== undefined;

    if (usingCursor && usingPage) {
      throw new errors.INVALID_FIELDS_PROVIDED("Use either cursor or page, not both");
    }
    if (usingCursor && cursor < 1) {
      throw new errors.INVALID_FIELDS_PROVIDED("cursor must be >= 1");
    }
    if (usingPage && page < 1) {
      throw new errors.INVALID_FIELDS_PROVIDED("page must be >= 1");
    }

    // ─────────────────────────────────────
    // 2️⃣ Date Validation (YYYY-MM-DD)
    // ─────────────────────────────────────
    if (date_from && !validator.isISO8601(date_from, { strict: true })) {
      throw new errors.INVALID_FIELDS_PROVIDED("date_from must be YYYY-MM-DD");
    }
    if (date_to && !validator.isISO8601(date_to, { strict: true })) {
      throw new errors.INVALID_FIELDS_PROVIDED("date_to must be YYYY-MM-DD");
    }

    // ─────────────────────────────────────
    // 3️⃣ WHERE Builder (shared)
    // ─────────────────────────────────────
    const whereClauses = ["1=1"];
    const dataValues = [];
    const countValues = [];

    const pushBoth = (val) => {
      dataValues.push(val);
      countValues.push(val);
    };

    if (admin_id !== undefined) {
      whereClauses.push("l.admin_id = ?");
      pushBoth(admin_id);
    }

    if (target_id !== undefined) {
      whereClauses.push("l.resource_id = ?");
      pushBoth(target_id);
    }

    if (action) {
      whereClauses.push("l.action = ?");
      pushBoth(action);
    }

    if (date_from) {
      whereClauses.push("l.created_at >= ?");
      pushBoth(`${date_from} 00:00:00`);
    }

    if (date_to) {
      whereClauses.push("l.created_at <= ?");
      pushBoth(`${date_to} 23:59:59`);
    }

    if (search) {
      whereClauses.push(
        "(a.email LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ?)"
      );
      const s = `%${search}%`;
      dataValues.push(s, s, s);
      countValues.push(s, s, s);
    }

    // ─────────────────────────────────────
    // 4️⃣ Pagination Logic
    // ─────────────────────────────────────
    let paginationSql = "";

    if (usingCursor) {
      whereClauses.push("l.id < ?");
      dataValues.push(cursor);
      paginationSql = "LIMIT ?";
      dataValues.push(limit);
    } else if (usingPage) {
      // page=1 → OFFSET 0, page=2 → OFFSET limit, etc.
      const offset = (page - 1) * limit;
      paginationSql = "LIMIT ? OFFSET ?";
      dataValues.push(limit, offset);
    } else {
      // No pagination params: first page
      paginationSql = "LIMIT ?";
      dataValues.push(limit);
    }

    const whereSql = whereClauses.join(" AND ");

    // ─────────────────────────────────────
    // 5️⃣ Queries
    // ─────────────────────────────────────
    const [totalRaw, logs] = await Promise.all([
      connection.queryOneField(
        `
        SELECT COUNT(*) AS total_count
        FROM admin_audit_logs l
        LEFT JOIN admins a ON l.admin_id = a.id
        WHERE ${whereSql.replace("l.id < ?", "1=1")}
        `,
        countValues,
        "total_count"
      ),
      connection.query(
        `
        SELECT
          l.*,
          a.email AS actor_email,
          CONCAT(a.first_name, ' ', a.last_name) AS actor_name,
          a.profile_img_path AS actor_img_path,
          aa.display_name AS action_display_name
        FROM admin_audit_logs l
        LEFT JOIN admins a ON l.admin_id = a.id
        LEFT JOIN audit_actions aa ON l.action = aa.action_key
        WHERE ${whereSql}
        ORDER BY l.id DESC
        ${paginationSql}
        `,
        dataValues
      )
    ]);
    const total = Number(totalRaw) || 0;

    // ─────────────────────────────────────
    // 6️⃣ Cursor Calculation
    // ─────────────────────────────────────
    // next_cursor: only in cursor-mode or no-param first-page mode.
    // When page= is used, caller should use total count for paging instead.
    const nextCursor = !usingPage && logs.length === limit
      ? logs[logs.length - 1].id
      : null;
    const hasMore = usingPage
      ? page * limit < total
      : !!nextCursor;

    // ─────────────────────────────────────
    // 7️⃣ Meta Parsing
    // ─────────────────────────────────────
    const data = logs.map(row => {
      let meta = {};
      try {
        meta = typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta;
      } catch { }
      return { ...row, meta };
    });

    // ─────────────────────────────────────
    // 8️⃣ Response
    // ─────────────────────────────────────
    return {
      count: total,           // for old UI
      limit,
      next_cursor: nextCursor,
      has_more: hasMore,
      data
    };
  })
);


exports.getAuditActions = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.permissions.includes("admin.manage")) throw new errors.UNAUTHORIZED();

    // Query the reference table instead of the logs table
    const actions = await connection.query(
      `SELECT action_key, display_name FROM audit_actions ORDER BY display_name ASC`
    );

    return actions;
    // Returns: [{ "action_key": "CREATE_ADMIN", "display_name": "Create New Admin" }, ...]
  })
);


// ─────────────────────────────────────────────────────
//  USER AUDIT LOGS  (admin-facing)
// ─────────────────────────────────────────────────────

exports.getAdminUserAuditLogs = api(
  {
    query: {
      user_id:   { type: "int",    required: false },
      action:    { type: "string", required: false },
      search:    { type: "string", required: false },
      date_from: { type: "string", required: false },
      date_to:   { type: "string", required: false },
      limit:     { type: "int",    required: false },
      cursor:    { type: "int",    required: false },
      page:      { type: "int",    required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.permissions.includes("admin.manage")) {
      throw new errors.UNAUTHORIZED();
    }

    // ── 1. Limit validation ──────────────────────────────
    const rawLimit = req.typed.query.limit;
    const limit = rawLimit === undefined ? 100 : rawLimit;
    if (limit < 20 || limit > 500) {
      throw new errors.INVALID_FIELDS_PROVIDED("limit must be between 20 and 500");
    }

    const { user_id, action, search, date_from, date_to, cursor, page } = req.typed.query;

    const usingCursor = cursor !== undefined;
    const usingPage = page !== undefined;

    if (usingCursor && usingPage) {
      throw new errors.INVALID_FIELDS_PROVIDED("Use either cursor or page, not both");
    }
    if (usingCursor && cursor < 1) {
      throw new errors.INVALID_FIELDS_PROVIDED("cursor must be >= 1");
    }
    if (usingPage && page < 1) {
      throw new errors.INVALID_FIELDS_PROVIDED("page must be >= 1");
    }

    // ── 2. Date validation ───────────────────────────────
    if (date_from && !validator.isISO8601(date_from, { strict: true })) {
      throw new errors.INVALID_FIELDS_PROVIDED("date_from must be YYYY-MM-DD");
    }
    if (date_to && !validator.isISO8601(date_to, { strict: true })) {
      throw new errors.INVALID_FIELDS_PROVIDED("date_to must be YYYY-MM-DD");
    }

    // ── 3. WHERE builder ─────────────────────────────────
    const whereClauses = ["1=1"];
    const dataValues   = [];
    const countValues  = [];

    const pushBoth = (val) => { dataValues.push(val); countValues.push(val); };

    if (user_id !== undefined) {
      whereClauses.push("l.user_id = ?");
      pushBoth(user_id);
    }

    if (action) {
      whereClauses.push("l.action = ?");
      pushBoth(action);
    }

    if (date_from) {
      whereClauses.push("l.created_at >= ?");
      pushBoth(`${date_from} 00:00:00`);
    }

    if (date_to) {
      whereClauses.push("l.created_at <= ?");
      pushBoth(`${date_to} 23:59:59`);
    }

    if (search) {
      whereClauses.push(
        "(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)"
      );
      const s = `%${search}%`;
      dataValues.push(s, s, s);
      countValues.push(s, s, s);
    }

    // ── 4. Pagination ────────────────────────────────────
    let paginationSql = "";

    if (usingCursor) {
      whereClauses.push("l.id < ?");
      dataValues.push(cursor);
      paginationSql = "LIMIT ?";
      dataValues.push(limit);
    } else if (usingPage) {
      const offset = (page - 1) * limit;
      paginationSql = "LIMIT ? OFFSET ?";
      dataValues.push(limit, offset);
    } else {
      paginationSql = "LIMIT ?";
      dataValues.push(limit);
    }

    const whereSql = whereClauses.join(" AND ");

    // ── 5. Queries ───────────────────────────────────────
    const [totalRaw, logs] = await Promise.all([
      connection.queryOneField(
        `SELECT COUNT(*) AS total_count
         FROM user_audit_logs l
         LEFT JOIN users u ON l.user_id = u.id
         WHERE ${whereSql.replace("l.id < ?", "1=1")}`,
        countValues,
        "total_count"
      ),
      connection.query(
        `SELECT
           l.id,
           l.user_id,
           l.action,
           l.ip_address,
           l.user_agent,
           l.old_values,
           l.new_values,
           l.created_at,
           u.email         AS user_email,
           u.first_name,
           u.last_name,
           u.img_path      AS user_img_path,
           ua.display_name AS action_display_name
         FROM user_audit_logs l
         LEFT JOIN users u              ON l.user_id = u.id
         LEFT JOIN user_audit_actions ua ON l.action  = ua.action_key
         WHERE ${whereSql}
         ORDER BY l.id DESC
         ${paginationSql}`,
        dataValues
      )
    ]);
    const total = Number(totalRaw) || 0;

    // ── 6. Cursor calc ───────────────────────────────────
    const nextCursor = !usingPage && logs.length === limit
      ? logs[logs.length - 1].id
      : null;
    const hasMore = usingPage
      ? page * limit < total
      : !!nextCursor;

    // ── 7. Parse JSON fields ─────────────────────────────
    const data = logs.map(row => {
      let old_values = null;
      let new_values = null;
      try { old_values = typeof row.old_values === "string" ? JSON.parse(row.old_values) : row.old_values; } catch {}
      try { new_values = typeof row.new_values === "string" ? JSON.parse(row.new_values) : row.new_values; } catch {}
      return { ...row, old_values, new_values };
    });

    return {
      count:       total,
      limit,
      next_cursor: nextCursor,
      has_more:    hasMore,
      data
    };
  })
);


exports.getAdminUserAuditActions = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.permissions.includes("admin.manage")) throw new errors.UNAUTHORIZED();

    const actions = await connection.query(
      `SELECT action_key, display_name
       FROM user_audit_actions
       ORDER BY display_name ASC`
    );

    return actions;
  })
);







// ── Public: which channels are enabled for admin password reset ───────────────
exports.getAdminForgotPassMethods = api(
  {},
  async (req, connection) => {
    const { getPermissionConfig } = require('../config/PermissionSettingsDB');
    const rows = await getPermissionConfig(connection, false, 'forget_pass_method_admin');
    const methods = { email: true, sms: false }; // safe defaults
    (rows || []).forEach(r => {
      if (r.key_name === 'email') methods.email = r.value !== 'false' && r.is_active !== 0;
      if (r.key_name === 'sms')   methods.sms   = r.value === 'true'  && r.is_active !== 0;
    });
    return { success: true, ...methods };
  }
);

exports.forgotPassword = api(
  {
    body: {
      // One of email OR phone is required — validated manually below
      email: { type: "string", required: false },
      phone: { type: "string", required: false }
    }
  },
  async (req, connection) => {
    const { email, phone } = req.typed.body;

    // 1. At least one identifier required
    if (!email && !phone) {
      throw new errors.INVALID_FIELDS_PROVIDED("Please provide your email or phone number.");
    }
    if (email && !validator.isEmail(email)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format.");
    }

    // 2. Know which delivery method the caller expects
    //    email → send via email channel   phone → send via SMS channel
    const requestedChannel = phone ? 'sms' : 'email';

    // 3. Read permission flags
    const { getPermissionConfig } = require('../config/PermissionSettingsDB');
    const { sendSMS } = require('../helpers/sms');

    const permRows = await getPermissionConfig(connection, false, 'forget_pass_method_admin');
    const permMap = {};
    (permRows || []).forEach(r => {
      if (r.is_active !== 0) permMap[r.key_name] = r.value;
    });
    const emailEnabled = permMap['email'] !== 'false'; // default true
    const smsEnabled   = permMap['sms'] === 'true';    // default false

    // 4. Guard: requested channel must be enabled
    if (requestedChannel === 'email' && !emailEnabled) {
      throw new errors.SERVICE_UNAVAILABLE("Email password reset is currently disabled.");
    }
    if (requestedChannel === 'sms' && !smsEnabled) {
      throw new errors.SERVICE_UNAVAILABLE("SMS password reset is currently disabled.");
    }

    // 5. Look up admin by email OR phone
    let admin;
    if (email) {
      admin = await connection.queryOne(
        `SELECT id, first_name, last_name, email, phone
         FROM admins
         WHERE email = ? AND is_active = 1 AND deleted_at IS NULL`,
        [email]
      );
    } else {
      // Normalise: extract last 10 significant digits so we match any stored format
      // e.g. 01629615314, +8801629615314, 8801629615314 all → last10 = 1629615314
      const digitsOnly = phone.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      admin = await connection.queryOne(
        `SELECT id, first_name, last_name, email, phone
         FROM admins
         WHERE phone LIKE ? AND is_active = 1 AND deleted_at IS NULL
         LIMIT 1`,
        [`%${last10}`]
      );
    }

    if (!admin) {
      throw new errors.NOT_FOUND("No active admin account found with those details.");
    }

    // 6. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await connection.query(
      "UPDATE admins SET otp = ?, otp_exp = ? WHERE id = ?",
      [otp, expiresAt, admin.id]
    );

    let emailSent = false;
    let smsSent   = false;

    // 7a. Send via Email (requested or both enabled)
    if (emailEnabled && requestedChannel === 'email') {
      const emailCfg = await getConfig(connection, false, 'email');
      if (emailCfg.length > 0 && emailCfg[0].is_active !== 0) {
        const cfg = emailCfg.reduce((acc, item) => { acc[item.key_name] = item.value; return acc; }, {});
        try {
          const transporter = nodemailer.createTransport({
            host: cfg.MAIL_HOST,
            port: parseInt(cfg.MAIL_PORT),
            secure: parseInt(cfg.MAIL_PORT) === 465,
            auth: { user: cfg.MAIL_USER, pass: cfg.MAIL_PASS }
          });
          await transporter.sendMail({
            from: `"Graduate Team" <${cfg.MAIL_USER}>`,
            to: admin.email,
            subject: "Admin Password Reset OTP",
            html: `<p>Hello ${admin.first_name || 'Admin'},</p>
                   <p>Your password reset OTP is: <b style="font-size:1.2em">${otp}</b></p>
                   <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>`
          });
          emailSent = true;
        } catch (err) {
          console.error("[forgotPassword] Email error:", err.message);
        }
      } else {
        console.warn("[forgotPassword] Email channel enabled in permissions but email service is inactive.");
      }
    }

    // 7b. Send via SMS (requested or both enabled)
    if (smsEnabled && requestedChannel === 'sms') {
      const phoneToSend = admin.phone;
      if (phoneToSend) {
        try {
          const smsMessage = `Your Graduate Fashion admin password reset OTP is: ${otp}. Valid for 10 minutes. Do not share.`;
          await sendSMS(connection, phoneToSend, smsMessage);
          smsSent = true;
        } catch (err) {
          console.error("[forgotPassword] SMS error:", err.message);
        }
      } else {
        throw new errors.SERVICE_UNAVAILABLE("No phone number is registered with this admin account. Please use email reset instead.");
      }
    }

    // 8. Failure guard
    if (!emailSent && !smsSent) {
      throw new errors.SERVICE_UNAVAILABLE("Failed to send OTP. Please try again or contact support.");
    }

    let channelMsg;
    if (emailSent && smsSent)   channelMsg = "OTP sent to your registered email and phone.";
    else if (emailSent)         channelMsg = "OTP sent to your registered email.";
    else                        channelMsg = "OTP sent to your registered phone number.";

    return { success: true, message: channelMsg, email_sent: emailSent, sms_sent: smsSent };
  }
);


exports.resetPassword = api(
  {
    body: {
      email:        { type: "string", required: false },
      phone:        { type: "string", required: false },
      otp:          { type: "string", required: true },
      new_password: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const { email, phone, otp, new_password } = req.typed.body;

    if (!email && !phone) {
      throw new errors.INVALID_FIELDS_PROVIDED("Please provide your email or phone number.");
    }

    // Validate password strength
    validateLogin(email || "placeholder@x.com", new_password);

    // 1. Verify OTP and Expiration — look up by email OR phone
    let admin;
    if (email) {
      admin = await connection.queryOne(
        `SELECT id FROM admins
         WHERE email = ? AND otp = ? AND otp_exp > NOW() AND is_active = 1 AND deleted_at IS NULL`,
        [email, otp]
      );
    } else {
      // Normalise: extract last 10 significant digits
      const digitsOnly = phone.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      admin = await connection.queryOne(
        `SELECT id FROM admins
         WHERE phone LIKE ? AND otp = ? AND otp_exp > NOW() AND is_active = 1 AND deleted_at IS NULL
         LIMIT 1`,
        [`%${last10}`, otp]
      );
    }

    if (!admin) {
      throw new errors.INVALID_FIELDS_PROVIDED("The OTP is invalid or has expired.");
    }

    // 2. Hash and Update
    const hashedPassword = await bcrypt.hash(new_password, 12);

    await connection.query(
      `UPDATE admins SET
          password_hash = ?,
          otp = NULL,
          otp_exp = NULL,
          token_version = token_version + 1
         WHERE id = ?`,
      [hashedPassword, admin.id]
    );

    // 3. Log the action
    await connection.query(
      "INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'PASSWORD_RESET', 'admin', ?)",
      [admin.id, admin.id]
    );

    return { success: true, message: "Password reset successful. Please login." };
  }
);

exports.getOwnProfile = api(
  {}, // No input params or body needed
  auth(async (req, connection, adminInfo) => {

    // We fetch the data using adminInfo.id from the authenticated token
    const sql = `
      SELECT 
        a.id, 
        a.email, 
        a.is_active, 
        a.created_at, 
        a.last_login_at,
        a.profile_img_path, 
        a.first_name, 
        a.last_name, 
        a.phone, 
        a.address,
        GROUP_CONCAT(DISTINCT r.name) AS roles
      FROM admins a
      JOIN admin_roles ar ON a.id = ar.admin_id
      JOIN roles r ON ar.role_id = r.id
      WHERE a.id = ?
      GROUP BY a.id
    `;

    const admin = await connection.queryOne(sql, [adminInfo.id]);

    if (!admin) {
      throw new errors.NOT_FOUND("Profile not found");
    }

    // Return consistent structure
    return {
      id: admin.id,
      email: admin.email,
      is_active: Boolean(admin.is_active),
      created_at: admin.created_at,
      last_login_at: admin.last_login_at,
      profile_img_path: admin.profile_img_path,
      first_name: admin.first_name,
      last_name: admin.last_name,
      phone: admin.phone,
      address: admin.address,
      roles: admin.roles ? admin.roles.split(",") : []
    };
  })
);
exports.editOwnProfile = api(
  {
    body: {
      first_name: { type: "string", required: false },
      last_name: { type: "string", required: false },
      phone: { type: "string", required: false },
      address: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const { first_name, last_name, phone, address } = req.typed.body;
    const adminId = adminInfo.id;

    // 1. Dynamic Update Builder
    const updates = [];
    const params = [];
    const fields = { first_name, last_name, phone, address };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    // 2. Safeguard: Check if any fields were actually provided
    if (updates.length === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("Please provide at least one field to update.");
    }

    params.push(adminId);

    // 3. Execution with Audit Logging
    // await connection.transaction(async (connection) => {
    const result = await connection.query(
      `UPDATE admins SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new errors.NOT_FOUND("Admin profile not found.");
    }

    // Record the change in the audit logs
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, 'EDIT_SELF_PROFILE', 'admin', ?, ?)`,
      [
        adminId,
        adminId,
        JSON.stringify({
          updated_fields: Object.keys(fields).filter(k => fields[k] !== undefined)
        })
      ]
    );
    // });

    return { success: true, message: "Profile updated successfully." };
  })
);


 
exports.adminCreateUser = optionalUploadApi(
  "user_profile",
  {
    body: {
      email: { type: "string", required: true },
      password: { type: "string", required: true },

      first_name: { type: "string", required: false },
      last_name: { type: "string", required: false },
      gender: { type: "string", required: false },
      dob: { type: "string", required: false },

      phone: { type: "string", required: false },
      status: { type: "string", required: false, default: "active" }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const {
      email,
      password,
      first_name,
      last_name,
      gender,
      dob,
      phone,
      status
    } = req.typed.body;

    /* ─────────────── AUTHORIZATION ─────────────── */

    if (
      !adminInfo.roles.includes("ADMIN") &&
      !adminInfo.roles.includes("SUPER_ADMIN")
    ) {
      throw new errors.UNAUTHORIZED(
        "You do not have permission to create users"
      );
    }

    /* ─────────────── VALIDATION ─────────────── */

    validateLogin(email, password);

    if (first_name && (first_name.length < 2 || first_name.length > 50)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "First name must be between 2 and 50 characters"
      );
    }

    if (last_name && (last_name.length < 2 || last_name.length > 50)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Last name must be between 2 and 50 characters"
      );
    }

    if (gender && !["male", "female", "other", "unspecified"].includes(gender)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid gender value");
    }

    if (dob && !validator.isDate(dob)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Invalid date of birth format"
      );
    }

    if (phone && !validator.isMobilePhone(phone)) {
      throw new errors.INVALID_FIELDS_PROVIDED(
        "Invalid phone number format"
      );
    }

    if (status && !["active", "inactive", "suspended"].includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid status value");
    }

    /* ─────────────── DUPLICATE EMAIL CHECK ─────────────── */

    const existingUser = await connection.queryOne(
      `
      SELECT id,is_email_verified,deleted_at
      FROM users 
      WHERE email = ?
         
      `,
      [email]
    );

    if (existingUser) {
       if(existingUser.is_email_verified==1) throw new errors.ALREADY_EXIST("User with this email already exists and verified")
       if(existingUser.deleted_at) throw new errors.ALREADY_EXIST("User with this email already exists but deleted please retore it")

      throw new errors.ALREADY_EXIST(
        "User with this email already exists"
      );
    }

    /* ─────────────── PASSWORD ─────────────── */

    const passwordHash = await bcrypt.hash(password, 12);

    /* ─────────────── CREATE USER ─────────────── */

    const result = await connection.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        gender,
        dob,
        status,
        is_email_verified,
        is_fully_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        email,
        passwordHash,
        first_name || null,
        last_name || null,
        gender || "unspecified",
        dob || null,
        status || "active",
        0,
        0
      ]
    );

    const userId = result.insertId;

    /* ─────────────── VERIFICATION ROW ─────────────── */

    await connection.query(
      `
      INSERT INTO user_verifications (user_id)
      VALUES (?)
      `,
      [userId]
    );

    /* ─────────────── PHONE HANDLING ─────────────── */

    if (phone) {
      const phoneExists = await connection.query(
        `
        SELECT id, user_id, is_verified
        FROM user_phones
        WHERE phone_number = ?
        `,
        [phone]
      );

      for (const p of phoneExists) {
        if (p.is_verified === 1) {
          throw new errors.ALREADY_EXIST(
            "Phone number already verified by another user"
          );
        }
      }

      await connection.query(
        `
        INSERT INTO user_phones (user_id, phone_number, is_verified)
        VALUES (?, ?, 0)
        `,
        [userId, phone]
      );
    }

    /* ─────────────── PROFILE IMAGE ─────────────── */

    let imgPath = null;
    if (req.files && req.files.user_profile) {
      imgPath = await saveImage(
        req.files.user_profile[0].path,
        `profiles/users/${userId}`
      );
    }

    await connection.query(
      `UPDATE users SET img_path = ? WHERE id = ?`,
      [imgPath, userId]
    );

    /* ─────────────── ADMIN AUDIT LOG ─────────────── */

    await connection.query(
      `
      INSERT INTO admin_audit_logs
        (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'CREATE_USER', 'user', ?, ?)
      `,
      [
        adminInfo.id,
        userId,
        JSON.stringify({
          by: adminInfo.id,
          email
        })
      ]
    );

    /* ─────────────── RESPONSE ─────────────── */

    return {
      success: true,
      message: "User created successfully",
      data: {
        id: userId,
        email
      }
    };
  })
);









exports.adminEditUser = optionalUploadApi(
  "user_profile",
  {
    params: {
      id: { type: "int", required: true }
    },
    body: {
      restore_user: { type: "bool", required: false },

      email: { type: "string", required: false },
      password: { type: "string", required: false },

      first_name: { type: "string", required: false },
      last_name: { type: "string", required: false },
      gender: { type: "string", required: false },
      dob: { type: "string", required: false },
      phone: { type: "string", required: false },
      status: { type: "string", required: false },
      fraud: { type: "string", required: false }

    }
  },
  auth(async (req, connection, adminInfo) => {
    const userId = req.typed.params.id;
    const {
      restore_user,
      email,
      password,
      first_name,
      last_name,
      gender,
      dob,
      phone,
      status,
      fraud
    } = req.typed.body;

    /* ---------------- PERMISSION ---------------- */

    if (
      !adminInfo.roles.includes("ADMIN") &&
      !adminInfo.roles.includes("SUPER_ADMIN")
    ) {
      throw new errors.UNAUTHORIZED("You do not have permission to edit users");
    }

 

    /* ---------------- VALIDATION ---------------- */

    if (first_name && (first_name.length < 2 || first_name.length > 50)) {
      throw new errors.INVALID_FIELDS_PROVIDED("First name must be between 2 and 50 characters");
    }

    if (last_name && (last_name.length < 2 || last_name.length > 50)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Last name must be between 2 and 50 characters");
    }

    if (gender && !["male", "female", "other", "unspecified"].includes(gender)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid gender value");
    }

    if (dob && !validator.isDate(dob)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date of birth format");
    }

    if (phone && !validator.isMobilePhone(phone)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
    }

    if (email && !validator.isEmail(email)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");
    }

    if (password && !validator.isLength(password, { min: 8, max: 20 })) {
      throw new errors.INVALID_PARAMETER("Password must be between 8 and 20 characters.");
    }

    if (status && !["active", "inactive", "suspended"].includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid status value");
    }



       /* ---------------- USER EXISTS (INCLUDING DELETED) ---------------- */

    const user = await connection.queryOne(
      `SELECT id, img_path, deleted_at, status as current_status FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new errors.NOT_FOUND("User not found");
    }

    /* ---------------- UPDATE BUILD ---------------- */

    const updates = [];
    const params = [];

    /* -------- RESTORE USER -------- */
    if (restore_user === true) {
      updates.push("deleted_at = NULL");
    }

    if (first_name) {
      updates.push("first_name = ?");
      params.push(first_name);
    }

    if (last_name) {
      updates.push("last_name = ?");
      params.push(last_name);
    }
    if (fraud) {
      updates.push("fraud = ?");
      params.push(fraud);
    }

    if (gender) {
      updates.push("gender = ?");
      params.push(gender);
    }

    if (dob) {
      updates.push("dob = ?");
      params.push(dob);
    }

    if (status) {
      updates.push("status = ?");
      params.push(status);
    }

    /* ---------------- EMAIL CHANGE ---------------- */

    if (email) {
      const emailExists = await connection.queryOne(
        `
        SELECT id FROM users
        WHERE email = ?
          AND is_email_verified = 1
          AND deleted_at IS NULL
          AND id != ?
        `,
        [email, userId]
      );

      if (emailExists) {
        throw new errors.ALREADY_EXIST("Email already in use by another user");
      }

      updates.push("email = ?");
      updates.push("is_email_verified = 0");
      updates.push("token_version = token_version + 1");

      params.push(email);
    }

    /* ---------------- PASSWORD CHANGE ---------------- */

    if (password) {
      const hash = await bcrypt.hash(password, 12);

      updates.push("password_hash = ?");
      updates.push("token_version = token_version + 1");

      params.push(hash);
    }

    /* ---------------- PHONE LOGIC ---------------- */

    if (phone) {
      const phones = await connection.query(
        `SELECT id, user_id, is_verified FROM user_phones WHERE phone_number = ?`,
        [phone]
      );

      for (const p of phones) {
        if (p.is_verified === 1 && p.user_id !== userId) {
          throw new errors.ALREADY_EXIST("Phone number already verified by another user");
        }
      }

      const ownPhone = phones.find(p => p.user_id === userId);
      if (!ownPhone) {
        await connection.query(
          `
          INSERT INTO user_phones (user_id, phone_number, is_verified)
          VALUES (?, ?, 0)
          `,
          [userId, phone]
        );
      }
    }

    /* ---------------- IMAGE HANDLING ---------------- */

    if (req.files?.user_profile) {
      if (user.img_path) {
        deleteFileIfExists(user.img_path);
      }

      const imgPath = await saveImage(
        req.files.user_profile[0].path,
        `profiles/users/${userId}`
      );

      updates.push("img_path = ?");
      params.push(imgPath);
    }

    /* ---------------- EXECUTE UPDATE ---------------- */

    if (updates.length === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("No valid fields provided for update");
    }

    params.push(userId);

    await connection.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    /* ---------------- AUDIT LOG ---------------- */
    
    // Determine specific action for audit log
    let auditAction = 'EDIT_USER';
    let statusNote = '';
    
    // Check if status was changed
    if (status && status !== user.current_status) {
      if (status === 'suspended') {
        auditAction = 'SUSPEND_USER';
        statusNote = 'User suspended';
      } else if (status === 'active' && user.current_status === 'suspended') {
        auditAction = 'UNSUSPEND_USER';
        statusNote = 'User unsuspended (reactivated)';
      } else if (status === 'inactive') {
        auditAction = 'DEACTIVATE_USER';
        statusNote = 'User deactivated';
      } else if (status === 'active' && user.current_status === 'inactive') {
        auditAction = 'ACTIVATE_USER';
        statusNote = 'User activated';
      }
    } else if (restore_user) {
      auditAction = 'RESTORE_USER';
      statusNote = 'User restored (deleted_at removed)';
    }

    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, ?, 'user', ?, ?)
      `,
      [
        adminInfo.id,
        auditAction,
        userId,
        JSON.stringify({
          restore_user,
          status_change: status && status !== user.current_status ? {
            from: user.current_status,
            to: status,
            note: statusNote
          } : null,
          updated_fields: Object.keys(req.typed.body).filter(key => req.typed.body[key] !== undefined)
        })
      ]
    );

    return {
      success: true,
     
      message: restore_user
        ? "User restored and updated successfully"
        : "User updated successfully"
    };
  })
);




exports.adminEditUser = optionalUploadApi(
  "user_profile",
  {
    params: {
      id: { type: "int", required: true }
    },
    body: {
      restore_user: { type: "bool", required: false },

      email: { type: "string", required: false },
      password: { type: "string", required: false },

      first_name: { type: "string", required: false },
      last_name: { type: "string", required: false },
      gender: { type: "string", required: false },
      dob: { type: "string", required: false },
      phone: { type: "string", required: false },
      status: { type: "string", required: false },
      fraud: { type: "string", required: false }

    }
  },
  auth(async (req, connection, adminInfo) => {
    const userId = req.typed.params.id;
    const {
      restore_user,
      email,
      password,
      first_name,
      last_name,
      gender,
      dob,
      phone,
      status,
      fraud
    } = req.typed.body;

    /* ---------------- PERMISSION ---------------- */

    if (
      !adminInfo.roles.includes("ADMIN") &&
      !adminInfo.roles.includes("SUPER_ADMIN")
    ) {
      throw new errors.UNAUTHORIZED("You do not have permission to edit users");
    }

 

    /* ---------------- VALIDATION ---------------- */

    if (first_name && (first_name.length < 2 || first_name.length > 50)) {
      throw new errors.INVALID_FIELDS_PROVIDED("First name must be between 2 and 50 characters");
    }

    if (last_name && (last_name.length < 2 || last_name.length > 50)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Last name must be between 2 and 50 characters");
    }

    if (gender && !["male", "female", "other", "unspecified"].includes(gender)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid gender value");
    }

    if (dob && !validator.isDate(dob)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid date of birth format");
    }

    if (phone && !validator.isMobilePhone(phone)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone number format");
    }

    if (email && !validator.isEmail(email)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format");
    }

    if (password && !validator.isLength(password, { min: 8, max: 20 })) {
      throw new errors.INVALID_PARAMETER("Password must be between 8 and 20 characters.");
    }

    if (status && !["active", "inactive", "suspended"].includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid status value");
    }



       /* ---------------- USER EXISTS (INCLUDING DELETED) ---------------- */

    const user = await connection.queryOne(
      `SELECT id, img_path, deleted_at, status as current_status FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new errors.NOT_FOUND("User not found");
    }

    /* ---------------- UPDATE BUILD ---------------- */

    const updates = [];
    const params = [];

    /* -------- RESTORE USER -------- */
    if (restore_user === true) {
      updates.push("deleted_at = NULL");
    }

    if (first_name) {
      updates.push("first_name = ?");
      params.push(first_name);
    }

    if (last_name) {
      updates.push("last_name = ?");
      params.push(last_name);
    }
    if (fraud) {
      updates.push("fraud = ?");
      params.push(fraud);
    }

    if (gender) {
      updates.push("gender = ?");
      params.push(gender);
    }

    if (dob) {
      updates.push("dob = ?");
      params.push(dob);
    }

    if (status) {
      updates.push("status = ?");
      params.push(status);
    }

    /* ---------------- EMAIL CHANGE ---------------- */

    if (email) {
      const emailExists = await connection.queryOne(
        `
        SELECT id FROM users
        WHERE email = ?
          AND is_email_verified = 1
          AND deleted_at IS NULL
          AND id != ?
        `,
        [email, userId]
      );

      if (emailExists) {
        throw new errors.ALREADY_EXIST("Email already in use by another user");
      }

      updates.push("email = ?");
      updates.push("is_email_verified = 0");
      updates.push("token_version = token_version + 1");

      params.push(email);
    }

    /* ---------------- PASSWORD CHANGE ---------------- */

    if (password) {
      const hash = await bcrypt.hash(password, 12);

      updates.push("password_hash = ?");
      updates.push("token_version = token_version + 1");

      params.push(hash);
    }

    /* ---------------- PHONE LOGIC ---------------- */

    if (phone) {
      const phones = await connection.query(
        `SELECT id, user_id, is_verified FROM user_phones WHERE phone_number = ?`,
        [phone]
      );

      for (const p of phones) {
        if (p.is_verified === 1 && p.user_id !== userId) {
          throw new errors.ALREADY_EXIST("Phone number already verified by another user");
        }
      }

      const ownPhone = phones.find(p => p.user_id === userId);
      if (!ownPhone) {
        await connection.query(
          `
          INSERT INTO user_phones (user_id, phone_number, is_verified)
          VALUES (?, ?, 0)
          `,
          [userId, phone]
        );
      }
    }

    /* ---------------- IMAGE HANDLING ---------------- */

    if (req.files?.user_profile) {
      if (user.img_path) {
        deleteFileIfExists(user.img_path);
      }

      const imgPath = await saveImage(
        req.files.user_profile[0].path,
        `profiles/users/${userId}`
      );

      updates.push("img_path = ?");
      params.push(imgPath);
    }

    /* ---------------- EXECUTE UPDATE ---------------- */

    if (updates.length === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("No valid fields provided for update");
    }

    params.push(userId);

    await connection.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );








    if (status || restore_user) {
      const subscriber = await connection.queryOne(
        "SELECT id FROM subscribers WHERE user_id = ?",
        [userId]
      );

      if (subscriber) {
        if (status === 'suspended') {
          // Suspend subscriber if user is suspended
          await connection.query(
            "UPDATE subscribers SET suspended_at = NOW(), updated_at = NOW() WHERE user_id = ?",
            [userId]
          );
        } else if (status === 'active' || restore_user === true) {
          // Reactivate subscriber if user is reactivated or restored
          await connection.query(
            "UPDATE subscribers SET suspended_at = NULL, updated_at = NOW() WHERE user_id = ?",
            [userId]
          );
        }
      }
    }

    /* ---------------- AUDIT LOG ---------------- */
    
    // Determine specific action for audit log
    let auditAction = 'EDIT_USER';
    let statusNote = '';
    
    // Check if status was changed
    if (status && status !== user.current_status) {
      if (status === 'suspended') {
        auditAction = 'SUSPEND_USER';
        statusNote = 'User suspended';
      } else if (status === 'active' && user.current_status === 'suspended') {
        auditAction = 'UNSUSPEND_USER';
        statusNote = 'User unsuspended (reactivated)';
      } else if (status === 'inactive') {
        auditAction = 'DEACTIVATE_USER';
        statusNote = 'User deactivated';
      } else if (status === 'active' && user.current_status === 'inactive') {
        auditAction = 'ACTIVATE_USER';
        statusNote = 'User activated';
      }
    } else if (restore_user) {
      auditAction = 'RESTORE_USER';
      statusNote = 'User restored (deleted_at removed)';
    }

    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, ?, 'user', ?, ?)
      `,
      [
        adminInfo.id,
        auditAction,
        userId,
        JSON.stringify({
          restore_user,
          status_change: status && status !== user.current_status ? {
            from: user.current_status,
            to: status,
            note: statusNote
          } : null,
          updated_fields: Object.keys(req.typed.body).filter(key => req.typed.body[key] !== undefined)
        })
      ]
    );

    return {
      success: true,
     
      message: restore_user
        ? "User restored and updated successfully"
        : "User updated successfully"
    };
  })
);


 
exports.adminGetUsers = api(
  {
    query: {
      limit: { type: "int", required: false, default: 20 },
      offset: { type: "int", required: false, default: 0 },

      status: { type: "string", required: false },
      gender: { type: "string", required: false },

      is_email_verified: { type: "bool", required: false },
      is_fully_verified: { type: "bool", required: false },
      is_deleted: { type: "bool", required: false },

      min_spent: { type: "float", required: false },
      max_spent: { type: "float", required: false },

      search: { type: "string", required: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    /* ---------------- PERMISSION ---------------- */

    if (
      !adminInfo.roles.includes("ADMIN") &&
      !adminInfo.roles.includes("SUPER_ADMIN") && !adminInfo.roles.includes("READ_ONLY_ADMIN") 
    ) {
      throw new errors.UNAUTHORIZED("You do not have permission to view users");
    }

    let {
      limit,
      offset,
      status,
      gender,
      is_email_verified,
      is_fully_verified,
      is_deleted,
      min_spent,
      max_spent,
      search
    } = req.typed.query;
// return { limit,
//       offset,
//       status,
//       gender,
//       is_email_verified,
//       is_fully_verified,
//       is_deleted,
//       min_spent,
//       max_spent,
//       search}
    /* ---------------- PAGINATION GUARD ---------------- */

    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    


    
    if (gender && !["male", "female", "other", "unspecified"].includes(gender)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid gender value");
    }
    if (status && !["active", "inactive", "suspended"].includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED("Invalid status value");
    }
    



    /* ---------------- FILTER BUILD ---------------- */

    const where = [];
    const params = [];

    // Deleted filter (default = not deleted)
    if (typeof is_deleted === "boolean") {
      where.push(is_deleted ? "u.deleted_at IS NOT NULL" : "u.deleted_at IS NULL");
    }  

    if (status) {
      where.push("u.status = ?");
      params.push(status);
    }

    if (gender) {
      where.push("u.gender = ?");
      params.push(gender);
    }

    if (typeof is_email_verified === "boolean") {
      where.push("u.is_email_verified = ?");
      params.push(is_email_verified ? 1 : 0);
    }
    // if ( is_email_verified ) {
    //   where.push("u.is_email_verified = ?");
    //   params.push(is_email_verified==true ? 1 : 0);
    // }



    if (typeof is_fully_verified === "boolean") {
      where.push("u.is_fully_verified = ?");
      params.push(is_fully_verified ? 1 : 0);
    }

    if (typeof min_spent === "number") {
      where.push("u.total_spent >= ?");
      params.push(min_spent);
    }

    if (typeof max_spent === "number") {
      where.push("u.total_spent <= ?");
      params.push(max_spent);
    }

    // if (search) {
    //   where.push(`
    //     (
    //       u.email LIKE ?
    //       OR u.first_name LIKE ?
    //       OR u.last_name LIKE ?
    //     )
    //   `);
    //   const like = `%${search}%`;
    //   params.push(like, like, like);
    // }



if (search) {
      where.push(`
        (
          u.email LIKE ?
          OR u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) LIKE ?
          OR CAST(u.id AS CHAR) LIKE ?
          OR EXISTS (
            SELECT 1 FROM user_phones up 
            WHERE up.user_id = u.id AND up.phone_number LIKE ?
          )
        )
      `);
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    /* ---------------- USERS ---------------- */

    const users = await connection.query(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.img_path,
        u.status,
        u.gender,
        u.dob,
        u.is_email_verified,
        u.is_fully_verified,
        u.total_spent,
        u.default_phone_id,
        u.default_address_id,
        u.created_at,
        u.deleted_at,
        (u.password_hash IS NOT NULL) AS has_password
      FROM users u
      ${whereSQL}
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    if (!users.length) {
      return {
        success: true,
        meta: { limit, offset, total: 0 },
        users: []
      };
    }

    const userIds = users.map(u => u.id);

    /* ---------------- PHONES ---------------- */

    const phones = await connection.query(
      `
      SELECT id, user_id, phone_number, is_verified
      FROM user_phones
      WHERE user_id IN (?)
      ORDER BY id ASC
      `,
      [userIds]
    );

    /* ---------------- ADDRESSES ---------------- */

    const addresses = await connection.query(
      `
      SELECT a.id, a.user_id, a.phone_id, a.name, a.address_type, a.full_address, a.city, a.zip_code,
             IF(p.id IS NOT NULL, p.is_verified, NULL) AS phone_verified
      FROM user_addresses a
      LEFT JOIN user_phones p ON p.id = a.phone_id
      WHERE a.user_id IN (?)
      ORDER BY a.id ASC
      `,
      [userIds]
    );

    /* ---------------- MAP ---------------- */

    const phoneMap = {};
    const addressMap = {};

    for (const p of phones) {
      if (!phoneMap[p.user_id]) phoneMap[p.user_id] = [];
      phoneMap[p.user_id].push({
        id: p.id,
        phone_number: p.phone_number,
        is_verified: !!p.is_verified
      });
    }

    for (const a of addresses) {
      if (!addressMap[a.user_id]) addressMap[a.user_id] = [];
      addressMap[a.user_id].push({
        id: a.id,
        phone_id: a.phone_id,
        name: a.name,
        address_type: a.address_type,
        full_address: a.full_address,
        city: a.city,
        zip_code: a.zip_code,
        phone_verified: a.phone_verified === null ? null : !!a.phone_verified
      });
    }

    /* ---------------- FINAL SHAPE ---------------- */

    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      img_path: u.img_path,
      status: u.status,
      gender: u.gender,
      dob: u.dob,

      is_email_verified: !!u.is_email_verified,
      is_fully_verified: !!u.is_fully_verified,
      has_password: !!u.has_password,

      total_spent: u.total_spent,

      default_phone: u.default_phone_id,
      phones: phoneMap[u.id] || [],

      default_address: u.default_address_id,
      addresses: addressMap[u.id] || [],

      created_at: u.created_at,
      deleted_at:u.deleted_at||null
    }));

    /* ---------------- TOTAL COUNT ---------------- */

    const count = await connection.queryOne(
      `
      SELECT COUNT(*) AS total
      FROM users u
      ${whereSQL}
      `,
      params
    );

    return {
      success: true,
      meta: {
        limit,
        offset,
        total: count.total
      },
      users: data
    };
  })
);




exports.adminGetUserById = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const userId = req.typed.params.id;

    /* ---------------- PERMISSION ---------------- */

    if (
      !adminInfo.roles.includes("ADMIN") &&
      !adminInfo.roles.includes("SUPER_ADMIN") &&
      !adminInfo.roles.includes("READ_ONLY_ADMIN") 
    ) {
      throw new errors.UNAUTHORIZED("You do not have permission to view users");
    }

    /* ---------------- USER ---------------- */

    const user = await connection.queryOne(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.img_path,
        u.status,
        u.gender,
        u.dob,
        u.is_email_verified,
        u.is_fully_verified,
        u.total_spent,
        u.default_phone_id,
        u.default_address_id,
        u.created_at,
        u.deleted_at,
        u.deleted_at,
        (u.password_hash IS NOT NULL) AS has_password
      FROM users u
      WHERE u.id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!user) {
      throw new errors.NOT_FOUND("User not found");
    }

    /* ---------------- PHONES ---------------- */

    const phones = await connection.query(
      `
      SELECT id, phone_number, is_verified
      FROM user_phones
      WHERE user_id = ?
      ORDER BY id ASC
      `,
      [userId]
    );

    /* ---------------- ADDRESSES ---------------- */

    const addresses = await connection.query(
      `
      SELECT a.id, a.phone_id, a.name, a.address_type, a.full_address, a.city, a.zip_code,
             IF(p.id IS NOT NULL, p.is_verified, NULL) AS phone_verified
      FROM user_addresses a
      LEFT JOIN user_phones p ON p.id = a.phone_id
      WHERE a.user_id = ?
      ORDER BY a.id ASC
      `,
      [userId]
    );

    /* ---------------- RESPONSE ---------------- */

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        img_path: user.img_path,
        status: user.status,
        gender: user.gender,
        dob: user.dob,

        is_email_verified: !!user.is_email_verified,
        is_fully_verified: !!user.is_fully_verified,
        has_password: !!user.has_password,

        total_spent: user.total_spent,
        
        default_phone: user.default_phone_id,
        phones,

        default_address: user.default_address_id,
        addresses,

        created_at: user.created_at,
        deleted_at: user.deleted_at ,
      }
    };
  })
);




exports.adminSoftDeleteUser = api(
  {
    params: {
      id: { type: "int", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const userId = req.typed.params.id;

    /* ---------------- PERMISSION ---------------- */

    if (
      !adminInfo.roles.includes("ADMIN") &&
      !adminInfo.roles.includes("SUPER_ADMIN")
    ) {
      throw new errors.UNAUTHORIZED("You do not have permission to delete users");
    }

    /* ---------------- USER EXISTS ---------------- */

    const user = await connection.queryOne(
      `
      SELECT id, deleted_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!user) {
      throw new errors.NOT_FOUND("User not found");
    }

    /* ---------------- ALREADY DELETED ---------------- */

    if (user.deleted_at) {
      return {
        success: true,
        message: "User already deleted"
      };
    }

    /* ---------------- SOFT DELETE ---------------- */

    await connection.query(
      `
      UPDATE users
      SET
        deleted_at = NOW(),
        status = 'inactive',
        token_version = token_version + 1
      WHERE id = ?
      `,
      [userId]
    );

    /* ---------------- AUDIT LOG ---------------- */

    await connection.query(
      `
      INSERT INTO admin_audit_logs
      (admin_id, action, resource, resource_id, meta)
      VALUES (?, 'SOFT_DELETE_USER', 'user', ?, ?)
      `,
      [
        adminInfo.id,
        userId,
        JSON.stringify({
          by: adminInfo.id,
          reason: "admin_soft_delete"
        })
      ]
    );

    return {
      success: true,
      message: "User soft-deleted successfully"
    };
  })
);


