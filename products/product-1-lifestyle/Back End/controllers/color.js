// Adjust paths as needed
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');




exports.createColor = api({
    body: {
        name: { type: "string", required: true },
        name_bd: { type: "string" },
        hex: { type: "string", required: true },
        status: { type: "bool", default: true },
        priority: { type: "int", default: 1 }
    }
}, auth(async (req, connection, adminInfo) => {
    // 1. Role Authorization Check
    const COLOR_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    const hasPermission = adminInfo.roles.some(role => COLOR_ALLOWED_ROLES.includes(role));

    if (!hasPermission) {
        throw new errors.UNAUTHORIZED("You do not have permission to create colors.");
    }

    const { name, name_bd, hex, status, priority } = req.typed.body;

    // 2. Validations
    if (name.length > 30) throw new errors.INVALID_FIELDS_PROVIDED("Color name too long.");
    if (name_bd && name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid hex code format (e.g. #FFFFFF).");
    if (priority && ![1, 2, 3].includes(priority)) throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");

    const existing = await connection.queryOne(
        `SELECT name, name_bd, hex FROM colors
         WHERE name = ? OR hex = ? OR (? IS NOT NULL AND name_bd = ?)`,
        [name, hex, name_bd || null, name_bd || null]
    );
    if (existing) {
        if (existing.name === name) throw new errors.ALREADY_EXIST("Color name already exists.");
        if (existing.hex === hex) throw new errors.ALREADY_EXIST("Color hex already exists.");
        if (name_bd && existing.name_bd === name_bd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
    }

    // 3. Database Insertion
    const result = await connection.query(
        `INSERT INTO colors (name, name_bd, hex, status, priority) VALUES (?, ?, ?, ?, ?)`,
        [name, name_bd || null, hex, status, priority]
    );

    // 4. Audit Logging
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, 'CREATE_COLOR', 'color', ?, ?)`,
        [adminInfo.id, result.insertId, JSON.stringify({ name, name_bd, hex })]
    );

    return {
        id: result.insertId,
        name,
        name_bd,
        hex,
        status: !!status,
        priority
    };
}));

exports.updateColor = api({
    params: { id: { type: "int", required: true } },
    body: {
        name: { type: "string" },
        name_bd: { type: "string" },
        hex: { type: "string" },
        status: { type: "bool" },
        priority: { type: "int" }
    }
}, auth(async (req, connection, adminInfo) => {
    const COLOR_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => COLOR_ALLOWED_ROLES.includes(role))) {
        throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;
    const updates = req.typed.body;

    if (!updates.name && !updates.name_bd && !updates.hex && !updates.status && !updates.priority) {
        throw new errors.NO_FIELDS_PROVIDED();
    }

    const color = await connection.queryOne("SELECT * FROM colors WHERE id = ?", [id]);
    if (!color) throw new errors.NOT_FOUND("Color not found.");

    // Validations
    if (updates.name && updates.name.length > 30) throw new errors.INVALID_FIELDS_PROVIDED("Color name too long.");
    if (updates.name_bd && updates.name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    if (updates.hex && !/^#[0-9A-Fa-f]{6}$/.test(updates.hex)) throw new errors.INVALID_FIELDS_PROVIDED("Invalid hex format.");

    if (updates.name || updates.name_bd || updates.hex) {
        const targetName = updates.name || color.name;
        const targetNameBd = updates.name_bd || color.name_bd;
        const targetHex = updates.hex || color.hex;
        const existing = await connection.queryOne(
            `SELECT name, name_bd, hex FROM colors
             WHERE id != ? AND (name = ? OR hex = ? OR (? IS NOT NULL AND name_bd = ?))`,
            [id, targetName, targetHex, targetNameBd || null, targetNameBd || null]
        );
        if (existing) {
            if (existing.name === targetName) throw new errors.ALREADY_EXIST("Name already taken.");
            if (existing.hex === targetHex) throw new errors.ALREADY_EXIST("Hex already taken.");
            if (targetNameBd && existing.name_bd === targetNameBd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
        }
    }

    let fields = [];
    let values = [];

    for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    }

    if (fields.length > 0) {
        await connection.query(`UPDATE colors SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
    }

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_COLOR', 'color', ?, ?)`,
        [adminInfo.id, id, JSON.stringify(updates)]
    );

    return { success: true, id };
}));

exports.getColors = api({
    query: {
        name: { type: "string" },
        status: { type: "bool" },
        priority: { type: "int" },
        limit: { type: "int", default: 50 },
        offset: { type: "int", default: 0 }
    }
}, async (req, connection) => {
    const { name, status, priority } = req.typed.query;
    let { limit, offset } = req.typed.query;
    // limit = Math.min(Math.max(limit, 1), 50);
    limit = Math.max(limit, 1);
    offset = Math.max(offset, 0);
    let where = [];
    let params = [];
    if (name) {
        where.push("(CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR name_bd COLLATE utf8mb4_unicode_ci LIKE ?)");
        params.push(`%${name}%`, `%${name}%`);
    }
    if (status !== undefined) { where.push("status = ?"); params.push(status); }
    if (priority) { where.push("priority = ?"); params.push(priority); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await connection.query(
        `SELECT * FROM colors ${whereClause} ORDER BY priority DESC, name ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const total = await connection.queryOne(`SELECT COUNT(*) as count FROM colors ${whereClause}`, params);

    return { 
        data: rows.map(r => ({ ...r, status: !!r.status })), 
        total: total.count 
    };
});

exports.getColorById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;
    const color = await connection.queryOne("SELECT * FROM colors WHERE id = ?", [id]);
    if (!color) throw new errors.NOT_FOUND("Color not found.");

    return { ...color, status: !!color.status };
});

exports.deleteColor = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const COLOR_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => COLOR_ALLOWED_ROLES.includes(role))) {
        throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;

const usage = await connection.queryOne(
    "SELECT id FROM product_skus WHERE color_id = ? ", 
    [id]
);

if (usage) throw new errors.FORBIDDEN("Cannot delete color in use by product SKUs.change product sku or delete it first");


    await connection.query("DELETE FROM colors WHERE id = ?", [id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_COLOR', 'color', ?)`,
        [adminInfo.id, id]
    );

    return { success: true };
}));
