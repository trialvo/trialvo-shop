const { optionalUploadApi, saveBannerImage, deleteFileIfExists } = require('../helpers/img');
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

exports.createBanner = optionalUploadApi(
    "banner_img",
    {
        body: {
            title: { type: "string", required: true },
            zone: { type: "string", required: true },
            type: { type: "string", required: true },
            path: { type: "string", required: false }, // Added path field
            status: { type: "bool", default: true },
            featured: { type: "bool", default: false }
        }
    },
    auth(async (req, connection, adminInfo) => {
        // 1. Role Authorization Check
        const BANNER_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        const hasPermission = adminInfo.roles.some(role => BANNER_ALLOWED_ROLES.includes(role));

        if (!hasPermission) {
            throw new errors.UNAUTHORIZED("You do not have permission to create banners.");
        }

        const { title, zone, type, path, status, featured } = req.typed.body;

        // 2. Validations
        if (title.length > 255) {
            throw new errors.INVALID_FIELDS_PROVIDED("Title cannot exceed 255 characters.");
        }

        // Validate path length if provided
        if (path && path.length > 512) {
            throw new errors.INVALID_FIELDS_PROVIDED("Path cannot exceed 512 characters.");
        }

        // Validate zone
        const validZones = ['Home Top', 'Home Middle', 'Home Bottom', 'Category Page', 'Product Page', 'Campaign'];
        if (!validZones.includes(zone)) {
            throw new errors.INVALID_FIELDS_PROVIDED(`Zone must be one of: ${validZones.join(', ')}`);
        }

        // Validate type
        const validTypes = ['Default', 'Category wise', 'Product wise', 'Custom URL'];
        if (!validTypes.includes(type)) {
            throw new errors.INVALID_FIELDS_PROVIDED(`Type must be one of: ${validTypes.join(', ')}`);
        }

        // Check for duplicate title
        const isExisting = await connection.queryOne(
            `SELECT id FROM banners WHERE title = ?`,
            [title]
        );
        if (isExisting) {
            throw new errors.ALREADY_EXIST("A banner with this title already exists.");
        }

        // 3. Image Handling (required for banner creation)
        if (!req.files || !req.files.banner_img) {
            throw new errors.INVALID_FIELDS_PROVIDED("Banner image is required.");
        }

        const imgPath = await saveBannerImage(req.files.banner_img[0].path, "banners");

        // 4. Database Insertion with path field
        const result = await connection.query(
            `INSERT INTO banners (title, zone, type, img_path, path, status, featured) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, zone, type, imgPath, path || null, status, featured]
        );

        // 5. Audit Logging
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
             VALUES (?, 'CREATE_BANNER', 'banner', ?, ?)`,
            [adminInfo.id, result.insertId, JSON.stringify({ title, zone, type, has_path: !!path })]
        );

        return {
            success: true,
            banner: {
                id: result.insertId,
                title,
                zone,
                type,
                img_path: imgPath,
                path: path || null,
                status: !!status,
                featured: !!featured
            }
        };
    })
);

exports.getAllBanners = api(
    {
        query: {
            search: { type: "string" },
            zone: { type: "string" },
            type: { type: "string" },
            status: { type: "bool" },
            featured: { type: "bool" },
            limit: { type: "int", default: 20 },
            offset: { type: "int", default: 0 },
            sort_by: { type: "string", default: "created_at" },
            sort_order: { type: "string", default: "DESC" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        /* =======================
           ROLE VALIDATION
        ======================= */
        const BANNER_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => BANNER_ALLOWED_ROLES.includes(role))) {
            throw new errors.UNAUTHORIZED();
        }

        /* =======================
           PAGINATION
        ======================= */
        let { limit, offset } = req.typed.query;
        limit = Math.min(Math.max(limit, 1), 100);
        offset = Math.max(offset, 0);

        const q = req.typed.query;
        const filters = [];
        const values = [];

        /* =======================
           VALID ENUMS
        ======================= */
        const VALID_ZONES = [
            'Home Top',
            'Home Middle',
            'Home Bottom',
            'Category Page',
            'Product Page',
            'Campaign'
        ];

        const VALID_TYPES = [
            'Default',
            'Category wise',
            'Product wise',
            'Custom URL'
        ];

        /* =======================
           SEARCH FILTER
        ======================= */
        if (q.search) {
            filters.push("(title LIKE ? OR zone LIKE ? OR type LIKE ? OR path LIKE ?)");
            const searchTerm = `%${q.search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        /* =======================
           ZONE FILTER + VALIDATION
        ======================= */
        if (q.zone !== undefined) {
            if (!VALID_ZONES.includes(q.zone)) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    `Zone must be one of: ${VALID_ZONES.join(', ')}`
                );
            }
            filters.push("zone = ?");
            values.push(q.zone);
        }

        /* =======================
           TYPE FILTER + VALIDATION
        ======================= */
        if (q.type !== undefined) {
            if (!VALID_TYPES.includes(q.type)) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    `Type must be one of: ${VALID_TYPES.join(', ')}`
                );
            }
            filters.push("type = ?");
            values.push(q.type);
        }

        /* =======================
           STATUS FILTER
        ======================= */
        if (typeof q.status === "boolean") {
            filters.push("status = ?");
            values.push(q.status ? 1 : 0);
        }

        /* =======================
           FEATURED FILTER
        ======================= */
        if (typeof q.featured === "boolean") {
            filters.push("featured = ?");
            values.push(q.featured ? 1 : 0);
        }

        const whereClause = filters.length
            ? `WHERE ${filters.join(" AND ")}`
            : "";

        /* =======================
           TOTAL COUNT
        ======================= */
        const [{ total }] = await connection.query(
            `SELECT COUNT(*) AS total FROM banners ${whereClause}`,
            values
        );

        /* =======================
           SORTING (SAFE)
        ======================= */
        const validSortColumns = ["title", "created_at", "featured", "zone", "type"];

        if(!validSortColumns.includes(q.sort_by)) {
            throw new errors.INVALID_FIELDS_PROVIDED(
                `Sort by must be one of: ${validSortColumns.join(', ')}`
            );
        }
        
        const sortBy = validSortColumns.includes(q.sort_by)
            ? q.sort_by
            : "created_at";

        const sortOrder = q.sort_order.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

        let orderByClause;
        if (sortBy === "featured") {
            orderByClause = `featured DESC, created_at ${sortOrder}`;
        } else {
            orderByClause = `${sortBy} ${sortOrder}`;
        }

        /* =======================
           FETCH DATA (including path field)
        ======================= */
        const banners = await connection.query(
            `SELECT 
                id,
                title,
                zone,
                type,
                img_path,
                path,  -- Added path field
                status,
                featured,
                created_at,
                updated_at
             FROM banners
             ${whereClause}
             ORDER BY ${orderByClause}
             LIMIT ? OFFSET ?`,
            [...values, limit, offset]
        );

        /* =======================
           RESPONSE
        ======================= */
        return {
            success: true,
            total,
            limit,
            offset,
            banners: banners.map(banner => ({
                id: banner.id,
                title: banner.title,
                zone: banner.zone,
                type: banner.type,
                img_path: banner.img_path,
                path: banner.path,  // Added path field
                status: !!banner.status,
                featured: !!banner.featured,
                created_at: banner.created_at,
                updated_at: banner.updated_at
            }))
        };
    })
);

exports.getBannerById = api(
    {
        params: { id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        const BANNER_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => BANNER_ALLOWED_ROLES.includes(role))) {
            throw new errors.UNAUTHORIZED();
        }

        // Updated query to include path field
        const banner = await connection.queryOne(
            `SELECT id, title, zone, type, img_path, path, status, featured, created_at, updated_at 
             FROM banners 
             WHERE id = ?`,
            [req.typed.params.id]
        );

        if (!banner) {
            throw new errors.NOT_FOUND("Banner not found.");
        }

        return {
            success: true,
            banner: {
                id: banner.id,
                title: banner.title,
                zone: banner.zone,
                type: banner.type,
                img_path: banner.img_path,
                path: banner.path,  // Added path field
                status: !!banner.status,
                featured: !!banner.featured,
                created_at: banner.created_at,
                updated_at: banner.updated_at
            }
        };
    })
);

exports.updateBanner = optionalUploadApi(
    "banner_img",
    {
        params: { id: { type: "int", required: true } },
        body: {
            title: { type: "string" },
            zone: { type: "string" },
            type: { type: "string" },
            path: { type: "string" },  // Added path field
            status: { type: "bool" },
            featured: { type: "bool" }
        }
    },
    auth(async (req, connection, adminInfo) => {
        const BANNER_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => BANNER_ALLOWED_ROLES.includes(role))) {
            throw new errors.UNAUTHORIZED();
        }

        const { id } = req.typed.params;
        const updates = req.typed.body;

        // Check if any field is provided for update
        const hasUpdates = Object.values(updates).some(val => val !== undefined) || 
                          (req.files && req.files.banner_img);
        
        if (!hasUpdates) {
            throw new errors.NO_FIELDS_PROVIDED();
        }

        // 1. Check if banner exists
        const banner = await connection.queryOne("SELECT * FROM banners WHERE id = ?", [id]);
        if (!banner) {
            throw new errors.NOT_FOUND("Banner not found.");
        }

        // 2. Validations
        if (updates.title !== undefined) {
            if (updates.title.length > 255) {
                throw new errors.INVALID_FIELDS_PROVIDED("Title cannot exceed 255 characters.");
            }
            
            // Check for duplicate title (excluding current banner)
            const isExisting = await connection.queryOne(
                "SELECT id FROM banners WHERE title = ? AND id != ?",
                [updates.title, id]
            );
            if (isExisting) {
                throw new errors.ALREADY_EXIST("A banner with this title already exists.");
            }
        }

        if (updates.zone !== undefined) {
            const validZones = ['Home Top', 'Home Middle', 'Home Bottom', 'Category Page', 'Product Page', 'Campaign'];
            if (!validZones.includes(updates.zone)) {
                throw new errors.INVALID_FIELDS_PROVIDED(`Zone must be one of: ${validZones.join(', ')}`);
            }
        }

        if (updates.type !== undefined) {
            const validTypes = ['Default', 'Category wise', 'Product wise', 'Custom URL'];
            if (!validTypes.includes(updates.type)) {
                throw new errors.INVALID_FIELDS_PROVIDED(`Type must be one of: ${validTypes.join(', ')}`);
            }
        }

        if (updates.path !== undefined && updates.path.length > 512) {
            throw new errors.INVALID_FIELDS_PROVIDED("Path cannot exceed 512 characters.");
        }

        // 3. Build update query
        let fields = [];
        let values = [];

        // Handle image replacement
        if (req.files && req.files.banner_img) {
            // Delete old image if exists
            if (banner.img_path) {
                deleteFileIfExists(banner.img_path);
            }
            
            const newPath = await saveBannerImage(req.files.banner_img[0].path, "banners");
            fields.push("img_path = ?");
            values.push(newPath);
        }

        // Handle other fields including path
        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined) {
                fields.push(`${key} = ?`);
                // Handle null path
                if (key === 'path' && val === '') {
                    values.push(null);
                } else {
                    values.push(val);
                }
            }
        }

        // Add updated_at timestamp
        fields.push("updated_at = CURRENT_TIMESTAMP");

        // 4. Execute update
        if (fields.length > 0) {
            await connection.query(
                `UPDATE banners SET ${fields.join(", ")} WHERE id = ?`,
                [...values, id]
            );
        }

        // 5. Audit Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
             VALUES (?, 'UPDATE_BANNER', 'banner', ?, ?)`,
            [adminInfo.id, id, JSON.stringify({ 
                ...updates,
                image_updated: !!(req.files && req.files.banner_img)
            })]
        );

        return { 
            success: true, 
            message: "Banner updated successfully",
            id 
        };
    })
);

exports.deleteBanner = api(
    {
        params: { id: { type: "int", required: true } }
    },
    auth(async (req, connection, adminInfo) => {
        const BANNER_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
        if (!adminInfo.roles.some(role => BANNER_ALLOWED_ROLES.includes(role))) {
            throw new errors.UNAUTHORIZED();
        }

        const { id } = req.typed.params;

        // 1. Check if banner exists
        const banner = await connection.queryOne(
            "SELECT id, img_path FROM banners WHERE id = ?",
            [id]
        );

        if (!banner) {
            throw new errors.NOT_FOUND("Banner not found.");
        }

        // 2. Delete associated image file
        if (banner.img_path) {
            deleteFileIfExists(banner.img_path);
        }

        // 3. Delete banner from database
        const result = await connection.query(
            "DELETE FROM banners WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            throw new errors.INTERNAL_SERVER_ERROR("Failed to delete banner.");
        }

        // 4. Audit Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
             VALUES (?, 'DELETE_BANNER', 'banner', ?, ?)`,
            [adminInfo.id, id, JSON.stringify({ title: banner.title })]
        );

        return { 
            success: true, 
            message: "Banner deleted successfully",
            id 
        };
    })
);

exports.getActiveBanners = api(
    {
        query: {
            search: { type: "string" },
            zone: { type: "string" },
            type: { type: "string" },
            featured: { type: "bool" },
            limit: { type: "int", default: 20 },
            offset: { type: "int", default: 0 },
            sort_by: { type: "string", default: "created_at" },
            sort_order: { type: "string", default: "DESC" }
        }
    },
    async (req, connection) => {
        /* =======================
           PAGINATION
        ======================= */
        let { limit, offset } = req.typed.query;
        limit = Math.min(Math.max(limit, 1), 100);
        offset = Math.max(offset, 0);

        const q = req.typed.query;
        const filters = [];
        const values = [];

        /* =======================
           VALID ENUMS
        ======================= */
        const VALID_ZONES = [
            'Home Top',
            'Home Middle',
            'Home Bottom',
            'Category Page',
            'Product Page',
            'Campaign'
        ];

        const VALID_TYPES = [
            'Default',
            'Category wise',
            'Product wise',
            'Custom URL'
        ];

        /* =======================
           BASE FILTER - ACTIVE BANNERS ONLY
        ======================= */
        filters.push("status = 1");

        /* =======================
           SEARCH FILTER
        ======================= */
        if (q.search) {
            filters.push("(title LIKE ? OR zone LIKE ? OR type LIKE ? OR path LIKE ?)");
            const searchTerm = `%${q.search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        /* =======================
           ZONE FILTER + VALIDATION
        ======================= */
        if (q.zone !== undefined) {
            if (!VALID_ZONES.includes(q.zone)) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    `Zone must be one of: ${VALID_ZONES.join(', ')}`
                );
            }
            filters.push("zone = ?");
            values.push(q.zone);
        }

        /* =======================
           TYPE FILTER + VALIDATION
        ======================= */
        if (q.type !== undefined) {
            if (!VALID_TYPES.includes(q.type)) {
                throw new errors.INVALID_FIELDS_PROVIDED(
                    `Type must be one of: ${VALID_TYPES.join(', ')}`
                );
            }
            filters.push("type = ?");
            values.push(q.type);
        }

        /* =======================
           FEATURED FILTER
        ======================= */
        if (typeof q.featured === "boolean") {
            filters.push("featured = ?");
            values.push(q.featured ? 1 : 0);
        }

        const whereClause = filters.length
            ? `WHERE ${filters.join(" AND ")}`
            : "";

        /* =======================
           TOTAL COUNT
        ======================= */
        const [{ total }] = await connection.query(
            `SELECT COUNT(*) AS total FROM banners ${whereClause}`,
            values
        );

        /* =======================
           SORTING (SAFE)
        ======================= */
        const validSortColumns = ["title", "created_at", "featured", "zone", "type"];

        if (!validSortColumns.includes(q.sort_by)) {
            throw new errors.INVALID_FIELDS_PROVIDED(
                `Sort by must be one of: ${validSortColumns.join(', ')}`
            );
        }
        
        const sortBy = validSortColumns.includes(q.sort_by)
            ? q.sort_by
            : "created_at";

        const sortOrder = q.sort_order.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

        let orderByClause;
        if (sortBy === "featured") {
            orderByClause = `featured DESC, created_at ${sortOrder}`;
        } else {
            orderByClause = `${sortBy} ${sortOrder}`;
        }

        /* =======================
           FETCH DATA (including path field)
        ======================= */
        const banners = await connection.query(
            `SELECT 
                id,
                title,
                zone,
                type,
                img_path,
                path,  -- Added path field
                featured
             FROM banners
             ${whereClause}
             ORDER BY ${orderByClause}
             LIMIT ? OFFSET ?`,
            [...values, limit, offset]
        );

        /* =======================
           RESPONSE
        ======================= */
        return {
            success: true,
            total,
            limit,
            offset,
            banners: banners.map(banner => ({
                id: banner.id,
                title: banner.title,
                zone: banner.zone,
                type: banner.type,
                img_path: banner.img_path,
                path: banner.path,  // Added path field
                featured: !!banner.featured
            }))
        };
    }
);

exports.getBannerByIdUser = api(
    {
        params: { id: { type: "int", required: true } }
    },
    async (req, connection) => {
        // Updated query to include path field
        const banner = await connection.queryOne(
            `SELECT id, title, zone, type, img_path, path, featured 
             FROM banners 
             WHERE id = ? AND status = 1`,
            [req.typed.params.id]
        );

        if (!banner) {
            throw new errors.NOT_FOUND("Banner not found or not active.");
        }

        return {
            success: true,
            banner: {
                id: banner.id,
                title: banner.title,
                zone: banner.zone,
                type: banner.type,
                img_path: banner.img_path,
                path: banner.path,  // Added path field
                featured: !!banner.featured
            }
        };
    }
);