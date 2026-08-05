const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

/* ---------- CREATE ATTRIBUTE ---------- */
exports.createAttribute = api({
    body: {
        name: { type: "string", required: true },
        name_bd: { type: "string" },
        priority: { type: "int", default: 1 },
        status: { type: "bool", default: true }
    }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const { name, name_bd, status, priority } = req.typed.body;

    if (name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
    if (name_bd && name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    if (priority && ![1, 2, 3].includes(priority)) throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");

    const existing = await connection.queryOne(
        `SELECT name, name_bd FROM attributes
         WHERE name = ? OR (? IS NOT NULL AND name_bd = ?)`,
        [name, name_bd || null, name_bd || null]
    );
    if (existing) {
        if (existing.name === name) throw new errors.ALREADY_EXIST("Attribute name already exists.");
        if (name_bd && existing.name_bd === name_bd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
    }

    const result = await connection.query(
        "INSERT INTO attributes (name, name_bd, status, priority) VALUES (?, ?, ?, ?)",
        [name, name_bd || null, status, priority]
    );

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'CREATE_ATTRIBUTE', 'attribute', ?, ?)`,
        [adminInfo.id, result.insertId, JSON.stringify({ name, name_bd, priority })]
    );

    return { id: result.insertId, name, name_bd, priority, status: !!status };
}));

/* ---------- UPDATE ATTRIBUTE ---------- */
exports.updateAttribute = api({
    params: { id: { type: "int", required: true } },
    body: {
        name: { type: "string" },
        name_bd: { type: "string" },
        priority: { type: "int" },
        status: { type: "bool" }
    }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const { id } = req.typed.params;
    const updates = req.typed.body;

    if (!updates.name && !updates.name_bd && !updates.status && !updates.priority) {
        throw new errors.NO_FIELDS_PROVIDED();
    }
    const attribute = await connection.queryOne("SELECT * FROM attributes WHERE id = ?", [id]);
    if (!attribute) throw new errors.NOT_FOUND("Attribute not found.");

    let fields = [];
    let values = [];

    if (updates.name && updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
    if (updates.name_bd && updates.name_bd.length > 255) {
        throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    }
    if (updates.name || updates.name_bd) {
        const targetName = updates.name || attribute.name;
        const targetNameBd = updates.name_bd || attribute.name_bd;
        const existing = await connection.queryOne(
            `SELECT name, name_bd FROM attributes
             WHERE id != ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
            [id, targetName, targetNameBd || null, targetNameBd || null]
        );
        if (existing) {
            if (existing.name === targetName) throw new errors.ALREADY_EXIST("Attribute name already taken.");
            if (targetNameBd && existing.name_bd === targetNameBd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
        }
    }

    if (updates.priority && ![1, 2, 3].includes(updates.priority)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");
    }

    for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    }

    await connection.query(`UPDATE attributes SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_ATTRIBUTE', 'attribute', ?, ?)`,
        [adminInfo.id, id, JSON.stringify(updates)]
    );

    return { success: true };
}));

/* ---------- GET ATTRIBUTE BY ID (WITH VARIANTS) ---------- */
exports.getAttributeById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;

    const attribute = await connection.queryOne("SELECT * FROM attributes WHERE id = ?", [id]);
    if (!attribute) throw new errors.NOT_FOUND("Attribute not found.");

    // Sorted by serial position
    const variants = await connection.query(
        "SELECT * FROM variants WHERE attribute_id = ? ORDER BY serial ASC, id ASC",
        [id]
    );

    return {
        ...attribute,
        name_bd: attribute.name_bd,
        status: !!attribute.status,
        variants: variants.map(v => ({ ...v, status: !!v.status }))
    };
});



/* ---------- GET ATTRIBUTES (NESTED) ---------- */
exports.getAttributes = api({
    query: {
        name: { type: "string" },
        status: { type: "bool" },
        priority: { type: "int" }, // Added priority filter
        limit: { type: "int", default: 20 }, // Added pagination
        offset: { type: "int", default: 0 }  // Added pagination
    }
}, async (req, connection) => {
    const { name, status, priority } = req.typed.query;
    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);
    let where = [];
    let params = [];

    // 1. Build Filters
    if (name) {
        where.push("(CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR name_bd COLLATE utf8mb4_unicode_ci LIKE ?)");
        params.push(`%${name}%`, `%${name}%`);
    }
    if (status !== undefined) { where.push("status = ?"); params.push(status); }
    if (priority) { where.push("priority = ?"); params.push(priority); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // 2. Fetch Paginated Attributes (Parents)
    // We apply LIMIT and OFFSET here to control how many "Groups" we see
    const attributes = await connection.query(
        `SELECT * FROM attributes 
         ${whereClause} 
         ORDER BY priority DESC, name ASC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    if (attributes.length === 0) return { data: [], total: 0 };

    // 3. Get Total Count for Pagination Metadata
    const totalCount = await connection.queryOne(
        `SELECT COUNT(*) as count FROM attributes ${whereClause}`,
        params
    );

    // 4. Fetch all variants for the specific attributes returned above
    const attrIds = attributes.map(a => a.id);
    const variants = await connection.query(
        `SELECT * FROM variants 
         WHERE attribute_id IN (?) 
         ORDER BY serial ASC, id ASC`,
        [attrIds]
    );

    // 5. Map Nested Structure
    const data = attributes.map(attr => ({
        ...attr,
        name_bd: attr.name_bd,
        status: !!attr.status,
        variants: variants
            .filter(v => v.attribute_id === attr.id)
            .map(v => ({
                ...v,
                name_bd: v.name_bd,
                status: !!v.status
            }))
    }));

    return {
        data,
        total: totalCount.count
    };
});

/* ---------- DELETE ATTRIBUTE ---------- */
exports.deleteAttribute = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const usage = await connection.queryOne(`
        SELECT s.id 
        FROM product_skus s
        JOIN variants v ON s.variant_id = v.id
        WHERE v.attribute_id = ? 
         
    `, [req.typed.params.id]);

    if (usage) {
        throw new errors.FORBIDDEN("Cannot delete: Products are currently using variants belonging to this attribute.");
    }

    // SQL Cascade will handle variants if you used the script I gave earlier
    await connection.query("DELETE FROM attributes WHERE id = ?", [req.typed.params.id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_ATTRIBUTE', 'attribute', ?)`,
        [adminInfo.id, req.typed.params.id]
    );

    return { success: true };
}));


/* ---------- CREATE VARIANT ---------- */



exports.createVariant = api({
    body: {
        attribute_id: { type: "int", required: true },
        name: { type: "string", required: true },
        name_bd: { type: "string" },
        serial: { type: "int", default: 1 },
        status: { type: "bool", default: true }
    }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const { attribute_id, name, name_bd, status, serial } = req.typed.body;

    if (name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
    if (name_bd && name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    if (serial !== undefined && serial < 1) throw new errors.INVALID_FIELDS_PROVIDED("Serial must be >= 1.");

    const attribute = await connection.queryOne("SELECT id FROM attributes WHERE id = ?", [attribute_id]);
    if (!attribute) throw new errors.NOT_FOUND("Parent attribute not found.");

    const existing = await connection.queryOne(
        `SELECT name, name_bd FROM variants
         WHERE attribute_id = ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
        [attribute_id, name, name_bd || null, name_bd || null]
    );
    if (existing) {
        if (existing.name === name) throw new errors.ALREADY_EXIST("Variant name already exists for this attribute.");
        if (name_bd && existing.name_bd === name_bd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
    }

    const result = await connection.query(
        "INSERT INTO variants (attribute_id, name, name_bd, status, serial) VALUES (?, ?, ?, ?, ?)",
        [attribute_id, name, name_bd || null, status, serial]
    );

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'CREATE_VARIANT', 'variant', ?, ?)`,
        [adminInfo.id, result.insertId, JSON.stringify({ name, name_bd, attribute_id, serial })]
    );

    return { id: result.insertId, attribute_id, name, name_bd, serial, status: !!status };
}));

/* ---------- UPDATE VARIANT ---------- */
exports.updateVariant = api({
    params: { id: { type: "int", required: true } },
    body: {
        attribute_id: { type: "int" },
        name: { type: "string" },
        name_bd: { type: "string" },
        serial: { type: "int" },
        status: { type: "bool" }
    }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const { id } = req.typed.params;
    const updates = req.typed.body;

    // Check if any fields were actually provided
    if(updates.attribute_id === undefined && !updates.name && !updates.name_bd && !updates.status && updates.serial === undefined) {
        throw new errors.NO_FIELDS_PROVIDED();
    }

    // 1. Fetch current variant to get existing attribute_id if not being updated
    const variant = await connection.queryOne("SELECT * FROM variants WHERE id = ?", [id]);
    if (!variant) throw new errors.NOT_FOUND("Variant not found.");

    // 2. Serial Validation
    if (updates.serial !== undefined && updates.serial < 1) {
        throw new errors.INVALID_FIELDS_PROVIDED("Serial must be >= 1.");
    }
    if (updates.name) {
        if (updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
    }
    if (updates.name_bd && updates.name_bd.length > 255) {
        throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    }
    if (updates.name) {
        if (updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
    }
    if (updates.name_bd && updates.name_bd.length > 255) {
        throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
    }

    // 3. Attribute Existence Check (if attribute_id is being changed)
    const targetAttributeId = updates.attribute_id || variant.attribute_id;
    if (updates.attribute_id) {
        const attrExists = await connection.queryOne("SELECT id FROM attributes WHERE id = ?", [updates.attribute_id]);
        if (!attrExists) throw new errors.NOT_FOUND("Target attribute does not exist.");
    }

    // 4. Duplicate Check (Check if name exists within the target attribute)
    const targetName = updates.name || variant.name;
    const targetNameBd = updates.name_bd || variant.name_bd;
    if (updates.name || updates.name_bd || updates.attribute_id) {
        const existing = await connection.queryOne(
            `SELECT name, name_bd FROM variants
             WHERE id != ? AND attribute_id = ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
            [id, targetAttributeId, targetName, targetNameBd || null, targetNameBd || null]
        );
        if (existing) {
            if (existing.name === targetName) throw new errors.ALREADY_EXIST("A variant with this name already exists in the target attribute.");
            if (targetNameBd && existing.name_bd === targetNameBd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
        }
    }

    // 5. Build Dynamic Update Query
    let fields = [];
    let values = [];

    for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    }
    fields.push("updated_at = CURRENT_TIMESTAMP"); // Auto-update timestamp

    await connection.query(`UPDATE variants SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);

    // 6. Audit Logging
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_VARIANT', 'variant', ?, ?)`,
        [adminInfo.id, id, JSON.stringify(updates)]
    );

    return { success: true };
}));
/* ---------- GET ALL VARIANTS (FLAT LIST) ---------- */


/* ---------- GET ALL VARIANTS (FLAT LIST) ---------- */
exports.getVariants = api({
    query: {
        name: { type: "string" },
        attribute_id: { type: "int" },
        status: { type: "bool" },
        limit: { type: "int", default: 50 },
        offset: { type: "int", default: 0 }
    }
}, async (req, connection) => {
    const { name, attribute_id, status } = req.typed.query;
    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);
    let where = [];
    let params = [];

    // 1. Build Where Clause with Table Aliases
    if (name) { 
        where.push("(CONVERT(v.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR v.name_bd COLLATE utf8mb4_unicode_ci LIKE ?)"); 
        params.push(`%${name}%`, `%${name}%`); 
    }
    if (attribute_id) { 
        where.push("v.attribute_id = ?"); 
        params.push(attribute_id); 
    }
    if (status !== undefined) { 
        where.push("v.status = ?"); 
        params.push(status); 
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // 2. Fetch Data with Multi-Level Sorting
    const rows = await connection.query(
        `SELECT v.*, a.name as attribute_name, a.name_bd as attribute_name_bd, a.priority as attribute_priority
         FROM variants v 
         JOIN attributes a ON v.attribute_id = a.id 
         ${whereClause} 
         ORDER BY a.priority DESC, a.name ASC, v.serial ASC, v.id ASC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    // 3. Get Total for Pagination
    const total = await connection.queryOne(
        `SELECT COUNT(*) as count 
         FROM variants v 
         ${whereClause}`, 
        params
    );

    return {
        data: rows.map(r => ({ 
            ...r, 
            name_bd: r.name_bd,
            status: !!r.status 
        })),
        total: total.count
    };
});


/* ---------- GET VARIANT BY ID ---------- */
exports.getVariantById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;

    const variant = await connection.queryOne(
        `SELECT v.*, a.name as attribute_name, a.name_bd as attribute_name_bd
         FROM variants v 
         JOIN attributes a ON v.attribute_id = a.id 
         WHERE v.id = ?`,
        [id]
    );

    if (!variant) throw new errors.NOT_FOUND("Variant not found.");

    return {
        ...variant,
        name_bd: variant.name_bd,
        status: !!variant.status
    };
});


/* ---------- DELETE VARIANT ---------- */
exports.deleteVariant = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();


// Check if any SKUs are using this variant
    const inUse = await connection.queryOne(
        "SELECT id FROM product_skus WHERE variant_id = ? ", 
        [ req.typed.params.id]
    );

    if (inUse) {
        throw new errors.FORBIDDEN("Cannot delete variant: It is currently linked to product SKUs. Try deactivating it instead.");
    }

    await connection.query("DELETE FROM variants WHERE id = ?", [req.typed.params.id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_VARIANT', 'variant', ?)`,
        [adminInfo.id, req.typed.params.id]
    );

    return { success: true };
}));

/* ---------- REORDER VARIANTS (bulk serial update) ---------- */
exports.reorderVariants = api({
    params: { attribute_id: { type: "int", required: true } },
    body: {
        order: { type: "array", required: true }
        // order: [{id: number, serial: number}, ...]
    }
}, auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

    const { attribute_id } = req.typed.params;
    const { order } = req.typed.body;

    if (!Array.isArray(order) || order.length === 0) {
        throw new errors.INVALID_FIELDS_PROVIDED("order must be a non-empty array.");
    }
    for (const item of order) {
        if (!item || typeof item.id !== "number" || typeof item.serial !== "number" || item.serial < 1) {
            throw new errors.INVALID_FIELDS_PROVIDED("Each item must have numeric id and serial >= 1.");
        }
    }

    // Verify attribute exists
    const attribute = await connection.queryOne("SELECT id FROM attributes WHERE id = ?", [attribute_id]);
    if (!attribute) throw new errors.NOT_FOUND("Attribute not found.");

    // Validate all variant IDs belong to this attribute
    const ids = order.map(o => o.id);
    const existing = await connection.query(
        `SELECT id FROM variants WHERE id IN (?) AND attribute_id = ?`,
        [ids, attribute_id]
    );
    if (existing.length !== ids.length) {
        throw new errors.INVALID_FIELDS_PROVIDED("One or more variant IDs do not belong to this attribute.");
    }

    // Bulk update each serial
    for (const item of order) {
        await connection.query(
            "UPDATE variants SET serial = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND attribute_id = ?",
            [item.serial, item.id, attribute_id]
        );
    }

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'REORDER_VARIANTS', 'attribute', ?, ?)`,
        [adminInfo.id, attribute_id, JSON.stringify({ order })]
    );

    return { success: true };
}));
