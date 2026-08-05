const { optionalUploadApi, saveImage, deleteFileIfExists } = require('../helpers/img'); // Adjust paths as needed
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

exports.createBrand = optionalUploadApi(
    "brand_img", 
    {
        body: {
            name: { type: "string", required: true },
            status: { type: "bool", default: true },
            priority: { type: "int", default: 1 }
        }
    },
    auth(async (req, connection, adminInfo) => {
        // 1. Role Authorization Check
        const BRAND_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        const hasPermission = adminInfo.roles.some(role => BRAND_ALLOWED_ROLES.includes(role));

        if (!hasPermission) {
            throw new errors.UNAUTHORIZED("You do not have permission to create brands.");
        }

        const { name, status, priority } = req.typed.body;

        // 2. Validations
        if (name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Brand name cannot exceed 50 characters.");
        if (priority && ![1, 2, 3].includes(priority)) throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");

        const isExisting = await connection.queryOne(
            `SELECT id FROM brands WHERE name = ?`,
            [name]
        );
        if (isExisting) throw new errors.ALREADY_EXIST("A brand with this name already exists.");

        // 3. Image Handling
        let imgPath = null;
        if (req.files && req.files.brand_img) {
            imgPath = await saveImage(req.files.brand_img[0].path, "brands");
        }

        // 4. Database Insertion
        const result = await connection.query(
            `INSERT INTO brands (name, img_path, status, priority) VALUES (?, ?, ?, ?)`,
            [name, imgPath, status, priority]
        );

        // 5. Audit Logging
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
             VALUES (?, 'CREATE_BRAND', 'brand', ?, ?)`,
            [adminInfo.id, result.insertId, JSON.stringify({ name, imgPath })]
        );

        return {
            id: result.insertId,
            name,
            img_path: imgPath,
            status: !!status,
            priority
        };
    })
);


exports.updateBrand = optionalUploadApi(
    "brand_img",
    {
        params: { id: { type: "int", required: true } },
        body: {
            name: { type: "string" },
            status: { type: "bool" },
            priority: { type: "int" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const BRAND_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => BRAND_ALLOWED_ROLES.includes(role))) {
            throw new errors.UNAUTHORIZED();
        }

        const { id } = req.typed.params;
        const updates = req.typed.body;

        if (!updates.name && !updates.status && !updates.priority && !(req.files && req.files.brand_img)) {
            throw new errors.NO_FIELDS_PROVIDED();
        }

        // 1. Check if brand exists
        const brand = await connection.queryOne("SELECT * FROM brands WHERE id = ?", [id]);
        if (!brand) throw new errors.NOT_FOUND("Brand not found.");

        // 2. Validations
        if (updates.name) {
            if (updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
            const isExisting = await connection.queryOne("SELECT id FROM brands WHERE name = ? AND id != ?", [updates.name, id]);
            if (isExisting) throw new errors.ALREADY_EXIST("Brand name already taken.");
        }
        if (updates.priority && ![1, 2, 3].includes(updates.priority)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");
        }

        let fields = [];
        let values = [];

        // 3. Handle Image replacement
        if (req.files && req.files.brand_img) {
            if (brand.img_path) deleteFileIfExists(brand.img_path);
            const newPath = await saveImage(req.files.brand_img[0].path, "brands");
            fields.push("img_path = ?");
            values.push(newPath);
        }

        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined) {
                fields.push(`${key} = ?`);
                values.push(val);
            }
        }

        if (fields.length > 0) {
            await connection.query(`UPDATE brands SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
        }

        // 4. Audit Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_BRAND', 'brand', ?, ?)`,
            [adminInfo.id, id, JSON.stringify(updates)]
        );

        return { success: true, id };
    })
);

exports.getBrands = api({
    query: {
        name: { type: "string" },
        status: { type: "bool" },
        priority: { type: "int" },
        limit: { type: "int", default: 20 },
        offset: { type: "int", default: 0 }
    }
}, async (req, connection) => {
    const { name, status, priority } = req.typed.query;
    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    let where = [];
    let params = [];
    if (name) { where.push("name LIKE ?"); params.push(`%${name}%`); }
    if (status !== undefined) { where.push("status = ?"); params.push(status); }
    if (priority) { where.push("priority = ?"); params.push(priority); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await connection.query(
        `SELECT * FROM brands ${whereClause} ORDER BY priority DESC, name ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const total = await connection.queryOne(`SELECT COUNT(*) as count FROM brands ${whereClause}`, params);

    return { 
        data: rows.map(r => ({ ...r, status: !!r.status })), 
        total: total.count 
    };
});

/* ---------- GET SINGLE BRAND ---------- */
exports.getBrandById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;

    // Fetch the brand record
    const brand = await connection.queryOne(
        "SELECT * FROM brands WHERE id = ?", 
        [id]
    );

    // If no brand is found, throw a 404 error
    if (!brand) {
        throw new errors.NOT_FOUND("Brand not found.");
    }

    // Return the brand object with status cast to boolean for consistency
    return {
        ...brand,
        status: !!brand.status
    };
});
exports.deleteBrand = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const BRAND_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => BRAND_ALLOWED_ROLES.includes(role))) {
        throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;

    const brand = await connection.queryOne("SELECT img_path FROM brands WHERE id = ?", [id]);
    if (!brand) throw new errors.NOT_FOUND();

// 1. Check if any products are using this brand
    const productsUsingBrand = await connection.queryOne(
        "SELECT id FROM products WHERE brand_id = ? ", 
        [id]
    );

    if (productsUsingBrand) {
        // You can create a custom error or use a generic 400
        throw new errors.FORBIDDEN("Cannot delete brand: It is assigned to existing products. Deactivate it instead. or erdit/delete product");
    }


    if (brand.img_path) deleteFileIfExists(brand.img_path);

    await connection.query("DELETE FROM brands WHERE id = ?", [id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_BRAND', 'brand', ?)`,
        [adminInfo.id, id]
    );

    return { success: true };
}));