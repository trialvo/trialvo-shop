const { optionalUploadApi, saveImage, saveCategoryImage, deleteFileIfExists } = require('../helpers/img');
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');


/**
 * Unified Create API: Handles text fields and image upload in one request.
 * Required Roles: SUPER_ADMIN, ADMIN, or CATALOG_MANAGER
 */
exports.createMainCategory = optionalUploadApi(
    "category_img", // The field name for the image file
    {
        body: {
            name: { type: "string", required: true },
            name_bd: { type: "string" },
            status: { type: "bool", default: true },
            featured: { type: "bool", default: false },
            priority: { type: "int", default: 1 }
        }
    },
    auth(async (req, connection, adminInfo) => {




        // 1. Role Authorization Check
        const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        const hasPermission = adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role));

        if (!hasPermission) {
            throw new errors.UNAUTHORIZED("You do not have permission to create categories.");
        }

        const { name, name_bd, status, featured, priority } = req.typed.body;


        if (name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Category name cannot exceed 50 characters.");
        if (name_bd && name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        if (priority && priority != 1 && priority != 2 && priority != 3) throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");


        const existing = await connection.queryOne(
            `SELECT name, name_bd FROM main_categories
             WHERE name = ? OR (? IS NOT NULL AND name_bd = ?)`,
            [name, name_bd || null, name_bd || null]
        );

        if (existing) {
            if (existing.name === name) throw new errors.ALREADY_EXIST("A main category with this name already exists.");
            if (name_bd && existing.name_bd === name_bd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
        }


        let imgPath = null;
        // Check if a file was actually provided
        if (req.files && req.files.category_img) {
            imgPath = await saveCategoryImage(req.files.category_img[0].path, "categories/main");
        }

        // 4. Database Insertion
        const result = await connection.query(
            `INSERT INTO main_categories 
            (name, name_bd, img_path, status, featured, priority) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [name, name_bd || null, imgPath, status, featured, priority]
        );

        // 5. Audit Logging (Optional but recommended)
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
             VALUES (?, 'CREATE_MAIN_CATEGORY', 'main_category', ?, ?)`,
            [adminInfo.id, result.insertId, JSON.stringify({ name, name_bd, imgPath })]
        );

        // 6. Return the newly created object
        return {
            id: result.insertId,
            name,
            name_bd,
            img_path: imgPath,
            status: !!status,
            featured: !!featured,
            priority
        };
    })
);

exports.updateMainCategory = optionalUploadApi(
    "category_img",
    {
        params: { id: { type: "int", required: true } },
        body: {
            name: { type: "string" },
            name_bd: { type: "string" },
            status: { type: "bool" },
            featured: { type: "bool" },
            priority: { type: "int" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role))) {
            throw new errors.UNAUTHORIZED();
        }

        const { id } = req.typed.params;
        const updates = req.typed.body;

        if (!updates.name && !updates.name_bd && !updates.status && !updates.featured && !updates.priority && !(req.files && req.files.category_img)) {
            throw new errors.NO_FIELDS_PROVIDED();
        }

        // 1. Check if category exists
        const category = await connection.queryOne("SELECT * FROM main_categories WHERE id = ?", [id]);
        if (!category) throw new errors.NOT_FOUND("Category not found.");

        // 2. Validations
        if (updates.name && updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Category name cannot exceed 50 characters.");
        if (updates.name_bd && updates.name_bd.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        }
        if (updates.name || updates.name_bd) {
            const targetName = updates.name || category.name;
            const targetNameBd = updates.name_bd || category.name_bd;
            const existing = await connection.queryOne(
                `SELECT name, name_bd FROM main_categories
                 WHERE id != ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
                [id, targetName, targetNameBd || null, targetNameBd || null]
            );
            if (existing) {
                if (existing.name === targetName) throw new errors.ALREADY_EXIST("Name already taken.");
                if (targetNameBd && existing.name_bd === targetNameBd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
            }
        }
        if (updates.priority && ![1, 2, 3].includes(updates.priority)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");
        }

        let fields = [];
        let values = [];

        // 3. Handle Image replacement
        if (req.files && req.files.category_img) {
            if (category.img_path) deleteFileIfExists(category.img_path);
            const newPath = await saveCategoryImage(req.files.category_img[0].path, "categories/main");
            fields.push("img_path = ?");
            values.push(newPath);
        }

        // 4. Build dynamic query for text fields
        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined) {
                fields.push(`${key} = ?`);
                values.push(val);
            }
        }

        if (fields.length > 0) {
            await connection.query(`UPDATE main_categories SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
        }

        // 5. Audit Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_MAIN_CATEGORY', 'main_category', ?, ?)`,
            [adminInfo.id, id, JSON.stringify(updates)]
        );

        return { success: true, id };
    })
);


// exports.getMainCategories = api({
//     query: {
//         name: { type: "string" },
//         status: { type: "bool" },
//         featured: { type: "bool" },
//         priority: { type: "int" },
//         limit: { type: "int", default: 20 },
//         offset: { type: "int", default: 0 }
//     }
// }, async (req, connection) => {
//     const { name, status, featured, priority } = req.typed.query;

//     let where = [];
//     let params = [];
//     if (name) { where.push("name LIKE ?"); params.push(`%${name}%`); }
//     if (status !== undefined) { where.push("status = ?"); params.push(status); }
//     if (featured !== undefined) { where.push("featured = ?"); params.push(featured); }
//     if (priority) { where.push("priority = ?"); params.push(priority); }

//  let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);

//     const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

//     // 1. Fetch Main Categories
//     const mains = await connection.query(
//         `SELECT * FROM main_categories ${whereClause} ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?`,
//         [...params, limit, offset]
//     );

//     if (mains.length === 0) return { data: [], total: 0 };

//     const mainIds = mains.map(m => m.id);

//     // 2. Fetch all related Sub Categories
//     const subs = await connection.query(
//         `SELECT * FROM sub_categories WHERE main_category_id IN (?) ORDER BY priority DESC`,
//         [mainIds]
//     );

//     // 3. Fetch all related Child Categories
//     const subIds = subs.map(s => s.id);
//     let childs = [];
//     if (subIds.length > 0) {
//         childs = await connection.query(
//             `SELECT * FROM child_categories WHERE sub_category_id IN (?) ORDER BY priority DESC`,
//             [subIds]
//         );
//     }

//     // 4. Map the Hierarchy
//     const data = mains.map(main => {
//         const mainSubs = subs.filter(s => s.main_category_id === main.id).map(sub => {
//             return {
//                 ...sub,
//                 status: !!sub.status,
//                 featured: !!sub.featured,
//                 child_categories: childs.filter(c => c.sub_category_id === sub.id).map(c => ({
//                     ...c,
//                     status: !!c.status,
//                     featured: !!c.featured
//                 }))
//             };
//         });

//         return {
//             ...main,
//             status: !!main.status,
//             featured: !!main.featured,
//             sub_categories: mainSubs
//         };
//     });

//     const total = await connection.queryOne(`SELECT COUNT(*) as count FROM main_categories ${whereClause}`, params);

//     return { data, total: total.count };
// });


exports.getMainCategories = api({
    query: {
        name: { type: "string" },
        status: { type: "bool" },
        featured: { type: "bool" },
        priority: { type: "int" },
        limit: { type: "int", default: 20 },
        offset: { type: "int", default: 0 }
    }
}, async (req, connection) => {
    const { name, status, featured, priority } = req.typed.query;

    let where = [];
    let params = [];
    if (name) {
        where.push("(CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR name_bd COLLATE utf8mb4_unicode_ci LIKE ?)");
        params.push(`%${name}%`, `%${name}%`);
    }
    if (status !== undefined) { where.push("status = ?"); params.push(status); }
    if (featured !== undefined) { where.push("featured = ?"); params.push(featured); }
    if (priority) { where.push("priority = ?"); params.push(priority); }

    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // 1. Fetch Main Categories with total stock
    // Note: Adjust 'status' column name if your product_skus uses 'is_active' or 'status'
    const mains = await connection.query(
        `SELECT m.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.main_category_id = m.id AND ps.status = 1) as total_stock
        FROM main_categories m 
        ${whereClause} 
        ORDER BY m.priority DESC, m.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    if (mains.length === 0) return { data: [], total: 0 };

    const mainIds = mains.map(m => m.id);

    // 2. Fetch Sub Categories with stock
    const subs = await connection.query(
        `SELECT s.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.sub_category_id = s.id AND ps.status = 1) as total_stock
        FROM sub_categories s 
        WHERE s.main_category_id IN (?) 
        ORDER BY s.priority DESC`,
        [mainIds]
    );

    // 3. Fetch Child Categories with stock
    const subIds = subs.map(s => s.id);
    let childs = [];
    if (subIds.length > 0) {
        childs = await connection.query(
            `SELECT c.*, 
                (SELECT COALESCE(SUM(ps.stock), 0) 
                 FROM products p 
                 JOIN product_skus ps ON p.id = ps.product_id 
                 WHERE p.child_category_id = c.id AND ps.status = 1) as total_stock
            FROM child_categories c 
            WHERE c.sub_category_id IN (?) 
            ORDER BY c.priority DESC`,
            [subIds]
        );
    }

    // 4. Map the Hierarchy
    const data = mains.map(main => {
        const mainSubs = subs.filter(s => s.main_category_id === main.id).map(sub => {
            return {
                ...sub,
                name_bd: sub.name_bd,
                status: !!sub.status,
                featured: !!sub.featured,
                total_stock: Number(sub.total_stock), // Ensure it's a number
                child_categories: childs.filter(c => c.sub_category_id === sub.id).map(c => ({
                    ...c,
                    name_bd: c.name_bd,
                    status: !!c.status,
                    featured: !!c.featured,
                    total_stock: Number(c.total_stock)
                }))
            };
        });

        return {
            ...main,
            name_bd: main.name_bd,
            status: !!main.status,
            featured: !!main.featured,
            total_stock: Number(main.total_stock),
            sub_categories: mainSubs
        };
    });

    const total = await connection.queryOne(`SELECT COUNT(*) as count FROM main_categories ${whereClause}`, params);

    return { data, total: total.count };
});



// exports.getMainCategoryById = api({
//     params: { id: { type: "int", required: true } }
// }, async (req, connection) => {
//     const { id } = req.typed.params;

//     const main = await connection.queryOne("SELECT * FROM main_categories WHERE id = ?", [id]);
//     if (!main) throw new errors.NOT_FOUND("Category not found.");

//     const subs = await connection.query(
//         "SELECT * FROM sub_categories WHERE main_category_id = ? ORDER BY priority DESC", 
//         [id]
//     );

//     const subIds = subs.map(s => s.id);
//     let childs = [];
//     if (subIds.length > 0) {
//         childs = await connection.query(
//             "SELECT * FROM child_categories WHERE sub_category_id IN (?) ORDER BY priority DESC", 
//             [subIds]
//         );
//     }

//     return {
//         ...main,
//         status: !!main.status,
//         featured: !!main.featured,
//         sub_categories: subs.map(s => ({
//             ...s,
//             status: !!s.status,
//             featured: !!s.featured,
//             child_categories: childs.filter(c => c.sub_category_id === s.id).map(c => ({
//                 ...c,
//                 status: !!c.status,
//                 featured: !!c.featured
//             }))
//         }))
//     };
// });


exports.getMainCategoryById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;

    // 1. Fetch Main Category with total stock
    const main = await connection.queryOne(`
        SELECT m.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.main_category_id = m.id AND ps.status = 1) as total_stock
        FROM main_categories m 
        WHERE m.id = ?`, 
        [id]
    );

    if (!main) throw new errors.NOT_FOUND("Category not found.");

    // 2. Fetch Sub Categories with stock
    const subs = await connection.query(`
        SELECT s.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.sub_category_id = s.id AND ps.status = 1) as total_stock
        FROM sub_categories s 
        WHERE s.main_category_id = ? 
        ORDER BY s.priority DESC`, 
        [id]
    );

    // 3. Fetch Child Categories with stock
    const subIds = subs.map(s => s.id);
    let childs = [];
    if (subIds.length > 0) {
        childs = await connection.query(`
            SELECT c.*, 
                (SELECT COALESCE(SUM(ps.stock), 0) 
                 FROM products p 
                 JOIN product_skus ps ON p.id = ps.product_id 
                 WHERE p.child_category_id = c.id AND ps.status = 1) as total_stock
            FROM child_categories c 
            WHERE c.sub_category_id IN (?) 
            ORDER BY c.priority DESC`, 
            [subIds]
        );
    }

    // 4. Map the Hierarchy with Boolean conversions and Number casting
    return {
        ...main,
        name_bd: main.name_bd,
        status: !!main.status,
        featured: !!main.featured,
        total_stock: Number(main.total_stock),
        sub_categories: subs.map(s => ({
            ...s,
            name_bd: s.name_bd,
            status: !!s.status,
            featured: !!s.featured,
            total_stock: Number(s.total_stock),
            child_categories: childs.filter(c => c.sub_category_id === s.id).map(c => ({
                ...c,
                name_bd: c.name_bd,
                status: !!c.status,
                featured: !!c.featured,
                total_stock: Number(c.total_stock)
            }))
        }))
    };
});

exports.deleteMainCategory = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role))) {
        throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;

    // 1. Get path to delete file
    const category = await connection.queryOne("SELECT img_path FROM main_categories WHERE id = ?", [id]);
    if (!category) throw new errors.NOT_FOUND();

const productUsage = await connection.queryOne(
        "SELECT id FROM products WHERE main_category_id = ?  ",
        [id]
    );

    if (productUsage) {
        throw new errors.FORBIDDEN(
            "Cannot delete: There are products assigned to this category. " +
            "Please move or delete the products first."
        );
    }

    // 2. Physical Delete
    if (category.img_path) deleteFileIfExists(category.img_path);

    // 3. Database Delete (Note: Cascade will handle sub/child rows if SQL FK is set)
    await connection.query("DELETE FROM main_categories WHERE id = ?", [id]);

    // 4. Audit Log
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_MAIN_CATEGORY', 'main_category', ?)`,
        [adminInfo.id, id]
    );

    return { success: true };
}));



/* ---------- CREATE SUB CATEGORY ---------- */
exports.createSubCategory = optionalUploadApi(
    "category_img",
    {
        body: {
            main_category_id: { type: "int", required: true },
            name: { type: "string", required: true },
            name_bd: { type: "string" },
            status: { type: "bool", default: true },
            featured: { type: "bool", default: false },
            priority: { type: "int", default: 1 }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];

        const hasPermission = adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role));
        if (!hasPermission) throw new errors.UNAUTHORIZED();

        const { main_category_id, name, name_bd, status, featured, priority } = req.typed.body;

        if (name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name exceeds 50 characters.");
        if (name_bd && name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        if (priority && ![1, 2, 3].includes(priority)) throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");

        // Check if Main Category exists
        const mainExists = await connection.queryOne(`SELECT id FROM main_categories WHERE id = ?`, [main_category_id]);
        if (!mainExists) throw new errors.NOT_FOUND("Main category not found.");

        // Duplicate check (scoped to same main category)
        const existing = await connection.queryOne(
            `SELECT name, name_bd FROM sub_categories
             WHERE main_category_id = ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
            [main_category_id, name, name_bd || null, name_bd || null]
        );
        if (existing) {
            if (existing.name === name) throw new errors.ALREADY_EXIST("Sub category name already exists in this main category.");
            if (name_bd && existing.name_bd === name_bd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
        }

        let imgPath = null;
        if (req.files && req.files.category_img) {
            imgPath = await saveCategoryImage(req.files.category_img[0].path, "categories/sub");
        }

        const result = await connection.query(
            `INSERT INTO sub_categories (main_category_id, name, name_bd, img_path, status, featured, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [main_category_id, name, name_bd || null, imgPath, status, featured, priority]
        );

        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'CREATE_SUB_CATEGORY', 'sub_category', ?, ?)`,
            [adminInfo.id, result.insertId, JSON.stringify({ name, name_bd, main_category_id })]
        );

        return { id: result.insertId, name, name_bd, img_path: imgPath, status: !!status, featured: !!featured ,priority: !!priority};
    })
);

/* ---------- UPDATE SUB CATEGORY ---------- */
exports.updateSubCategory = optionalUploadApi(
    "category_img",
    {
        params: { id: { type: "int", required: true } },
        body: {
            main_category_id: { type: "int" },
            name: { type: "string" },
            name_bd: { type: "string" },
            status: { type: "bool" },
            featured: { type: "bool" },
            priority: { type: "int" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];

        if (!adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

        const { id } = req.typed.params;
        const updates = req.typed.body;
        if (!updates.name && !updates.name_bd && !updates.status && !updates.featured && !updates.priority && !updates.main_category_id && !(req.files && req.files.category_img)) {
            throw new errors.NO_FIELDS_PROVIDED();
        }
        if (updates.priority && ![1, 2, 3].includes(updates.priority)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");
        }
        const category = await connection.queryOne("SELECT * FROM sub_categories WHERE id = ?", [id]);
        if (!category) throw new errors.NOT_FOUND("Sub category not found.");

        if (updates.main_category_id) {
            const mainExists = await connection.queryOne("SELECT id FROM main_categories WHERE id = ?", [updates.main_category_id]);
            if (!mainExists) throw new errors.NOT_FOUND("Main category not found.");
        }

        const targetMainCategoryId = updates.main_category_id || category.main_category_id;

        if (updates.name && updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
        if (updates.name_bd && updates.name_bd.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        }
        if (updates.name || updates.name_bd || updates.main_category_id) {
            const targetName = updates.name || category.name;
            const targetNameBd = updates.name_bd || category.name_bd;
            const existing = await connection.queryOne(
                `SELECT name, name_bd FROM sub_categories
                 WHERE id != ? AND main_category_id = ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
                [id, targetMainCategoryId, targetName, targetNameBd || null, targetNameBd || null]
            );
            if (existing) {
                if (existing.name === targetName) throw new errors.ALREADY_EXIST("Name already taken.");
                if (targetNameBd && existing.name_bd === targetNameBd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
            }
        }



        let fields = [];
        let values = [];

        if (req.files && req.files.category_img) {
            if (category.img_path) deleteFileIfExists(category.img_path);
            const newPath = await saveCategoryImage(req.files.category_img[0].path, "categories/sub");
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
            await connection.query(`UPDATE sub_categories SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
        }
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_SUB_CATEGORY', 'sub_category', ?, ?)`,
            [adminInfo.id, id, JSON.stringify(updates)]
        );
        return { success: true, id };
    })
);



// exports.getSubCategories = api({
//     query: {
//         main_category_id: { type: "int" },
//         name: { type: "string" },
//         status: { type: "bool" },
//         limit: { type: "int", default: 20 },
//         offset: { type: "int", default: 0 }
//     }
// }, async (req, connection) => {
//     const { main_category_id, name, status } = req.typed.query;
//   let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);
//     let where = [];
//     let params = [];
//     if (main_category_id) { where.push("main_category_id = ?"); params.push(main_category_id); }
//     if (name) { where.push("name LIKE ?"); params.push(`%${name}%`); }
//     if (status !== undefined) { where.push("status = ?"); params.push(status); }

//     const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

//     const subs = await connection.query(
//         `SELECT * FROM sub_categories ${whereClause} ORDER BY priority DESC LIMIT ? OFFSET ?`,
//         [...params, limit, offset]
//     );

//     if (subs.length === 0) return { data: [], total: 0 };

//     const subIds = subs.map(s => s.id);
//     const childs = await connection.query(
//         `SELECT * FROM child_categories WHERE sub_category_id IN (?) ORDER BY priority DESC`,
//         [subIds]
//     );

//     const data = subs.map(sub => ({
//         ...sub,
//         status: !!sub.status,
//         featured: !!sub.featured,
//         child_categories: childs.filter(c => c.sub_category_id === sub.id).map(c => ({
//             ...c,
//             status: !!c.status,
//             featured: !!c.featured
//         }))
//     }));

//     const total = await connection.queryOne(`SELECT COUNT(*) as count FROM sub_categories ${whereClause}`, params);
//     return { data, total: total.count };
// });


exports.getSubCategories = api({
    query: {
        main_category_id: { type: "int" },
        name: { type: "string" },
        status: { type: "bool" },
        limit: { type: "int", default: 20 },
        offset: { type: "int", default: 0 }
    }
}, async (req, connection) => {
    const { main_category_id, name, status } = req.typed.query;
    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    let where = [];
    let params = [];
    if (main_category_id) { where.push("main_category_id = ?"); params.push(main_category_id); }
    if (name) {
        where.push("(CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR name_bd COLLATE utf8mb4_unicode_ci LIKE ?)");
        params.push(`%${name}%`, `%${name}%`);
    }
    if (status !== undefined) { where.push("status = ?"); params.push(status); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // 1. Fetch Sub Categories with stock count
    const subs = await connection.query(
        `SELECT s.*,
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.sub_category_id = s.id AND ps.status = 1) as total_stock
        FROM sub_categories s 
        ${whereClause} 
        ORDER BY s.priority DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    if (subs.length === 0) return { data: [], total: 0 };

    const subIds = subs.map(s => s.id);

    // 2. Fetch Child Categories with stock count
    const childs = await connection.query(
        `SELECT c.*,
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.child_category_id = c.id AND ps.status = 1) as total_stock
        FROM child_categories c 
        WHERE c.sub_category_id IN (?) 
        ORDER BY c.priority DESC`,
        [subIds]
    );

    // 3. Map the Hierarchy
    const data = subs.map(sub => ({
        ...sub,
        name_bd: sub.name_bd,
        status: !!sub.status,
        featured: !!sub.featured,
        total_stock: Number(sub.total_stock),
        child_categories: childs.filter(c => c.sub_category_id === sub.id).map(c => ({
            ...c,
            name_bd: c.name_bd,
            status: !!c.status,
            featured: !!c.featured,
            total_stock: Number(c.total_stock)
        }))
    }));

    const total = await connection.queryOne(`SELECT COUNT(*) as count FROM sub_categories ${whereClause}`, params);
    
    return { data, total: total.count };
});

// exports.getSubCategoryById = api({
//     params: { id: { type: "int", required: true } }
// }, async (req, connection) => {
//     const { id } = req.typed.params;

//     const sub = await connection.queryOne("SELECT * FROM sub_categories WHERE id = ?", [id]);
//     if (!sub) throw new errors.NOT_FOUND("Sub category not found.");

//     const childs = await connection.query(
//         "SELECT * FROM child_categories WHERE sub_category_id = ? ORDER BY priority DESC", 
//         [id]
//     );

//     return {
//         ...sub,
//         status: !!sub.status,
//         featured: !!sub.featured,
//         child_categories: childs.map(c => ({
//             ...c,
//             status: !!c.status,
//             featured: !!c.featured
//         }))
//     };
// });


exports.getSubCategoryById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;

    // 1. Fetch the Sub Category with total stock
    const sub = await connection.queryOne(`
        SELECT s.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.sub_category_id = s.id AND ps.status = 1) as total_stock
        FROM sub_categories s 
        WHERE s.id = ?`, 
        [id]
    );

    if (!sub) throw new errors.NOT_FOUND("Sub category not found.");

    // 2. Fetch all related Child Categories with their own stock counts
    const childs = await connection.query(`
        SELECT c.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.child_category_id = c.id AND ps.status = 1) as total_stock
        FROM child_categories c 
        WHERE c.sub_category_id = ? 
        ORDER BY c.priority DESC`, 
        [id]
    );

    // 3. Map and return the data
    return {
        ...sub,
        name_bd: sub.name_bd,
        status: !!sub.status,
        featured: !!sub.featured,
        total_stock: Number(sub.total_stock),
        child_categories: childs.map(c => ({
            ...c,
            name_bd: c.name_bd,
            status: !!c.status,
            featured: !!c.featured,
            total_stock: Number(c.total_stock)
        }))
    };
});
// --- DELETE SUB ---
exports.deleteSubCategory = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role))) {
        throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;

    const category = await connection.queryOne("SELECT img_path FROM sub_categories WHERE id = ?", [id]);
    if (!category) throw new errors.NOT_FOUND();


const productUsage = await connection.queryOne(
        "SELECT id FROM products WHERE sub_category_id = ?  ",
        [id]
    );

    if (productUsage) {
        throw new errors.FORBIDDEN(
            "Cannot delete: There are products assigned to this sub category. " +
            "Please move or delete the products first."
        );
    }


    if (category.img_path) deleteFileIfExists(category.img_path);

    await connection.query("DELETE FROM sub_categories WHERE id = ?", [id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_SUB_CATEGORY', 'sub_category', ?)`,
        [adminInfo.id, id]
    );

    return { success: true };
}));





// --- GET ALL CHILDS WITH FILTERS ---

/* ---------- CREATE CHILD CATEGORY ---------- */
exports.createChildCategory = optionalUploadApi(
    "category_img",
    {
        body: {
            sub_category_id: { type: "int", required: true },
            name: { type: "string", required: true },
            name_bd: { type: "string" },
            status: { type: "bool", default: true },
            featured: { type: "bool", default: false },
            priority: { type: "int", default: 1 }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];

        const hasPermission = adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role));
        if (!hasPermission) throw new errors.UNAUTHORIZED();

        const { sub_category_id, name, name_bd, status, featured, priority } = req.typed.body;

        if (name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name exceeds 50 characters.");
        if (name_bd && name_bd.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        if (priority && ![1, 2, 3].includes(priority)) throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");

        // Check if Parent (Sub Category) exists
        const subExists = await connection.queryOne(`SELECT id FROM sub_categories WHERE id = ?`, [sub_category_id]);
        if (!subExists) throw new errors.NOT_FOUND("Sub category not found.");

        // Duplicate check (scoped to same sub category)
        const existing = await connection.queryOne(
            `SELECT name, name_bd FROM child_categories
             WHERE sub_category_id = ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
            [sub_category_id, name, name_bd || null, name_bd || null]
        );
        if (existing) {
            if (existing.name === name) throw new errors.ALREADY_EXIST("Child category name already exists in this sub category.");
            if (name_bd && existing.name_bd === name_bd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
        }

        let imgPath = null;
        if (req.files && req.files.category_img) {
            imgPath = await saveCategoryImage(req.files.category_img[0].path, "categories/child");
        }

        const result = await connection.query(
            `INSERT INTO child_categories (sub_category_id, name, name_bd, img_path, status, featured, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [sub_category_id, name, name_bd || null, imgPath, status, featured, priority]
        );

        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'CREATE_CHILD_CATEGORY', 'child_category', ?, ?)`,
            [adminInfo.id, result.insertId, JSON.stringify({ name, name_bd, sub_category_id })]
        );

        return { 
            id: result.insertId, 
            name, 
            name_bd,
            img_path: imgPath, 
            status: !!status, 
            featured: !!featured, 
            priority: priority 
        };
    })
);
/* ---------- UPDATE CHILD CATEGORY ---------- */
exports.updateChildCategory = optionalUploadApi(
    "category_img",
    {
        params: { id: { type: "int", required: true } },
        body: {
            sub_category_id: { type: "int" },
            name: { type: "string" },
            name_bd: { type: "string" },
            status: { type: "bool" },
            featured: { type: "bool" },
            priority: { type: "int" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];

        if (!adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role))) throw new errors.UNAUTHORIZED();

        const { id } = req.typed.params;
        const updates = req.typed.body;

        // Ensure at least one field is being updated
        if (!updates.name && !updates.name_bd && !updates.status && !updates.featured && !updates.priority && !updates.sub_category_id && !(req.files && req.files.category_img)) {
            throw new errors.NO_FIELDS_PROVIDED();
        }

        if (updates.priority && ![1, 2, 3].includes(updates.priority)) {
            throw new errors.INVALID_FIELDS_PROVIDED("Priority must be 1, 2, or 3.");
        }

        const category = await connection.queryOne("SELECT * FROM child_categories WHERE id = ?", [id]);
        if (!category) throw new errors.NOT_FOUND("Child category not found.");

        // If moving to a different sub-category, verify it exists
        if (updates.sub_category_id) {
            const subExists = await connection.queryOne("SELECT id FROM sub_categories WHERE id = ?", [updates.sub_category_id]);
            if (!subExists) throw new errors.NOT_FOUND("Target sub category not found.");
        }

        const parentId = updates.sub_category_id || category.sub_category_id;

        // Duplicate name check within the sub-category
        if (updates.name && updates.name.length > 50) throw new errors.INVALID_FIELDS_PROVIDED("Name too long.");
        if (updates.name_bd && updates.name_bd.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("বাংলা নাম ২৫৫ অক্ষরের বেশি হতে পারবে না");
        }
        if (updates.name || updates.name_bd || updates.sub_category_id) {
            const targetName = updates.name || category.name;
            const targetNameBd = updates.name_bd || category.name_bd;
            const existing = await connection.queryOne(
                `SELECT name, name_bd FROM child_categories
                 WHERE id != ? AND sub_category_id = ? AND (name = ? OR (? IS NOT NULL AND name_bd = ?))`,
                [id, parentId, targetName, targetNameBd || null, targetNameBd || null]
            );
            if (existing) {
                if (existing.name === targetName) throw new errors.ALREADY_EXIST("Name already taken in this sub category.");
                if (targetNameBd && existing.name_bd === targetNameBd) throw new errors.ALREADY_EXIST("এই বাংলা নামটি ইতিমধ্যেই বিদ্যমান।");
            }
        }

        let fields = [];
        let values = [];

        // Image replacement logic
        if (req.files && req.files.category_img) {
            if (category.img_path) deleteFileIfExists(category.img_path);
            const newPath = await saveCategoryImage(req.files.category_img[0].path, "categories/child");
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
            await connection.query(`UPDATE child_categories SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
        }

        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) VALUES (?, 'UPDATE_CHILD_CATEGORY', 'child_category', ?, ?)`,
            [adminInfo.id, id, JSON.stringify(updates)]
        );

        return { success: true, id };
    })
);


// exports.getChildCategories = api({
//     query: {
//         sub_category_id: { type: "int" }, // Filter by parent
//         name: { type: "string" },
//         status: { type: "bool" },
//         featured: { type: "bool" },
//         priority: { type: "int" },
//         limit: { type: "int", default: 20 },
//         offset: { type: "int", default: 0 }
//     }
// }, async (req, connection) => {
//     const { sub_category_id, name, status, featured, priority } = req.typed.query;
//     let { limit, offset } = req.typed.query;
//     limit = Math.min(Math.max(limit, 1), 50);
//     offset = Math.max(offset, 0);
//     let where = [];
//     let params = [];

//     if (sub_category_id) { where.push("sub_category_id = ?"); params.push(sub_category_id); }
//     if (name) { where.push("name LIKE ?"); params.push(`%${name}%`); }
//     if (status !== undefined) { where.push("status = ?"); params.push(status); }
//     if (featured !== undefined) { where.push("featured = ?"); params.push(featured); }
//     if (priority) { where.push("priority = ?"); params.push(priority); }

//     const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

//     const rows = await connection.query(
//         `SELECT * FROM child_categories ${whereClause} ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?`,
//         [...params, limit, offset]
//     );

//     const total = await connection.queryOne(`SELECT COUNT(*) as count FROM child_categories ${whereClause}`, params);

//     return {
//         data: rows.map(r => ({ ...r, status: !!r.status, featured: !!r.featured })),
//         total: total.count
//     };
// });

exports.getChildCategories = api({
    query: {
        sub_category_id: { type: "int" },
        name: { type: "string" },
        status: { type: "bool" },
        featured: { type: "bool" },
        priority: { type: "int" },
        limit: { type: "int", default: 20 },
        offset: { type: "int", default: 0 }
    }
}, async (req, connection) => {
    const { sub_category_id, name, status, featured, priority } = req.typed.query;
    let { limit, offset } = req.typed.query;
    limit = Math.min(Math.max(limit, 1), 50);
    offset = Math.max(offset, 0);

    let where = [];
    let params = [];

    if (sub_category_id) { where.push("sub_category_id = ?"); params.push(sub_category_id); }
    if (name) {
        where.push("(CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? OR name_bd COLLATE utf8mb4_unicode_ci LIKE ?)");
        params.push(`%${name}%`, `%${name}%`);
    }
    if (status !== undefined) { where.push("status = ?"); params.push(status); }
    if (featured !== undefined) { where.push("featured = ?"); params.push(featured); }
    if (priority) { where.push("priority = ?"); params.push(priority); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // Fetch Child Categories with active SKU stock count
    const rows = await connection.query(
        `SELECT c.*,
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.child_category_id = c.id AND ps.status = 1) as total_stock
        FROM child_categories c 
        ${whereClause} 
        ORDER BY c.priority DESC, c.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const total = await connection.queryOne(`SELECT COUNT(*) as count FROM child_categories ${whereClause}`, params);

    return {
        data: rows.map(r => ({ 
            ...r, 
            name_bd: r.name_bd,
            status: !!r.status, 
            featured: !!r.featured,
            total_stock: Number(r.total_stock)
        })),
        total: total.count
    };
});

// --- GET SINGLE CHILD ---
// exports.getChildCategoryById = api({
//     params: { id: { type: "int", required: true } }
// }, async (req, connection) => {
//     const { id } = req.typed.params;

//     const category = await connection.queryOne("SELECT * FROM child_categories WHERE id = ?", [id]);
//     if (!category) throw new errors.NOT_FOUND("Child category not found.");

//     return {
//         ...category,
//         status: !!category.status,
//         featured: !!category.featured
//     };
// });


exports.getChildCategoryById = api({
    params: { id: { type: "int", required: true } }
}, async (req, connection) => {
    const { id } = req.typed.params;

    // Fetch the specific child category along with the sum of stock from active SKUs
    const category = await connection.queryOne(`
        SELECT c.*, 
            (SELECT COALESCE(SUM(ps.stock), 0) 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id 
             WHERE p.child_category_id = c.id AND ps.status = 1) as total_stock
        FROM child_categories c 
        WHERE c.id = ?`, 
        [id]
    );

    if (!category) throw new errors.NOT_FOUND("Child category not found.");

    return {
        ...category,
        name_bd: category.name_bd,
        status: !!category.status,
        featured: !!category.featured,
        total_stock: Number(category.total_stock)
    };
});
// --- DELETE CHILD ---
exports.deleteChildCategory = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const CATEGORY_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(role => CATEGORY_ALLOWED_ROLES.includes(role))) {
        throw new errors.UNAUTHORIZED();
    }

    const { id } = req.typed.params;

    const category = await connection.queryOne("SELECT img_path FROM child_categories WHERE id = ?", [id]);
    if (!category) throw new errors.NOT_FOUND();


    const productUsage = await connection.queryOne(
        "SELECT id FROM products WHERE child_category_id = ?  ",
        [id]
    );

    if (productUsage) {
        throw new errors.FORBIDDEN(
            "Cannot delete: There are products assigned to this child category. " +
            "Please move or delete the products first."
        );
    }

    if (category.img_path) deleteFileIfExists(category.img_path);

    await connection.query("DELETE FROM child_categories WHERE id = ?", [id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id) VALUES (?, 'DELETE_CHILD_CATEGORY', 'child_category', ?)`,
        [adminInfo.id, id]
    );

    return { success: true };
}));











