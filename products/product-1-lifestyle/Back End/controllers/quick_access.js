const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

exports.getQuickAccess = api({
    query: {
        is_pinned: { type: "bool" }
    }
}, auth(async (req, connection, adminInfo) => {
    const COLOR_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    const hasPermission = adminInfo.roles.some(role => COLOR_ALLOWED_ROLES.includes(role));

    if (!hasPermission) {
        throw new errors.UNAUTHORIZED("You do not have permission to access quick access items.");
    }
    
    const q = req.typed.query;
    const filters = [];
    const values = [];

    // Add filter if is_pinned is provided
    if (q.is_pinned !== undefined) {
        filters.push("is_pinned = ?");
        values.push(q.is_pinned ? 1 : 0);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // Fetch quick access items (including path field)
    const quickAccessItems = await connection.query(
        `SELECT 
            id, 
            title, 
            is_pinned, 
            img_path, 
            path,  -- Added path field
            sort_order 
         FROM quick_access 
         ${whereClause}
         ORDER BY sort_order ASC, id ASC`,
        values
    );

    // Format the response
    const formattedItems = quickAccessItems.map(item => ({
        id: item.id,
        title: item.title,
        is_pinned: !!item.is_pinned,
        img_path: item.img_path,
        path: item.path,  // Added path field
        sort_order: item.sort_order 
    }));

    return {
        success: true,
        count: formattedItems.length,
        quick_access: formattedItems
    };
}));

exports.getQuickAccessById = api({
    params: { id: { type: "int", required: true } }
}, auth(async (req, connection, adminInfo) => {
    const COLOR_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    const hasPermission = adminInfo.roles.some(role => COLOR_ALLOWED_ROLES.includes(role));
    
    if (!hasPermission) {
        throw new errors.UNAUTHORIZED("You do not have permission to access quick access items.");
    }
    
    const { id } = req.typed.params;

    // Fetch the quick access item (including path field)
    const item = await connection.queryOne(
        `SELECT 
            id, 
            title, 
            is_pinned, 
            img_path, 
            path,  -- Added path field
            sort_order 
         FROM quick_access 
         WHERE id = ?`,
        [id]
    );

    if (!item) {
        throw new errors.NOT_FOUND("Quick access item not found.");
    }

    // Format the response
    const quick_access = {
        id: item.id,
        title: item.title,
        is_pinned: !!item.is_pinned,
        img_path: item.img_path,
        path: item.path,  // Added path field
        sort_order: item.sort_order 
    };

    return {
        success: true,
        quick_access
    };
}));

exports.updateQuickAccess = api({
    params: { id: { type: "int", required: true } },
    body: {
        title: { type: "string" },
        is_pinned: { type: "bool" },
        img_path: { type: "string" },
        path: { type: "string" },  // Added path field
        sort_order: { type: "int" }
    }
}, auth(async (req, connection, adminInfo) => {
    const COLOR_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    const hasPermission = adminInfo.roles.some(role => COLOR_ALLOWED_ROLES.includes(role));

    if (!hasPermission) {
        throw new errors.UNAUTHORIZED("You do not have permission to update quick access items.");
    }
    
    const { id } = req.typed.params;
    const updates = req.typed.body;

    // Check if any field is provided for update
    const hasUpdates = Object.values(updates).some(val => val !== undefined);
    
    if (!hasUpdates) {
        throw new errors.NO_FIELDS_PROVIDED();
    }

    // 1. Check if quick access item exists
    const item = await connection.queryOne(
        "SELECT id, title, is_pinned FROM quick_access WHERE id = ?",
        [id]
    );
    
    if (!item) {
        throw new errors.NOT_FOUND("Quick access item not found.");
    }

    // 2. Validations
    if (updates.title !== undefined) {
        if (updates.title.length > 100) {
            throw new errors.INVALID_FIELDS_PROVIDED("Title cannot exceed 100 characters.");
        }
        
        // Check for duplicate title (excluding current item)
        const isExisting = await connection.queryOne(
            "SELECT id FROM quick_access WHERE title = ? AND id != ?",
            [updates.title, id]
        );
        if (isExisting) {
            throw new errors.ALREADY_EXIST("A quick access item with this title already exists.");
        }
    }

    if (updates.sort_order !== undefined) {
        if (updates.sort_order < 0 || updates.sort_order > 50) {
            throw new errors.INVALID_FIELDS_PROVIDED("sort_order must be between 0 and 50.");
        }
    }

    if (updates.img_path !== undefined && updates.img_path.length > 512) {
        throw new errors.INVALID_FIELDS_PROVIDED("Image path cannot exceed 512 characters.");
    }

    if (updates.path !== undefined && updates.path.length > 512) {
        throw new errors.INVALID_FIELDS_PROVIDED("Path cannot exceed 512 characters.");
    }

    // 3. Check maximum pinned items (max 6)
    if (updates.is_pinned === true) {
        // Count current pinned items
        const pinnedCountResult = await connection.queryOne(
            "SELECT COUNT(*) as count FROM quick_access WHERE is_pinned = 1",
            []
        );
        
        const currentPinnedCount = pinnedCountResult.count;
        
        // If item is currently not pinned, we need to check if adding it would exceed limit
        if (item.is_pinned === 0 && currentPinnedCount >= 6) {
            throw new errors.INVALID_FIELDS_PROVIDED("Maximum 6 items can be pinned at a time.");
        }
        
        // If item is already pinned, no need to check (we're not adding a new pinned item)
    }

    // 4. Build update query
    let fields = [];
    let values = [];

    // Handle other fields
    for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            
            // Convert boolean to TINYINT for is_pinned
            if (key === 'is_pinned') {
                values.push(val ? 1 : 0);
            } 
            // Handle null path (empty string becomes NULL)
            else if (key === 'path' && val === '') {
                values.push(null);
            }
            else {
                values.push(val);
            }
        }
    }

    // 5. Execute update
    if (fields.length > 0) {
        await connection.query(
            `UPDATE quick_access SET ${fields.join(", ")} WHERE id = ?`,
            [...values, id]
        );
    }

    // 6. Fetch updated item for response
    const updatedItem = await connection.queryOne(
        `SELECT id, title, is_pinned, img_path, path, sort_order, created_at 
         FROM quick_access WHERE id = ?`,
        [id]
    );

    // 7. Get current pinned count after update
    const pinnedCountAfter = await connection.queryOne(
        "SELECT COUNT(*) as count FROM quick_access WHERE is_pinned = 1",
        []
    );

    return {
        success: true,
        message: "Quick access item updated successfully",
        // quick_access: {
        //     id: updatedItem.id,
        //     title: updatedItem.title,
        //     is_pinned: !!updatedItem.is_pinned,
        //     img_path: updatedItem.img_path,
        //     path: updatedItem.path,  // Added path field
        //     sort_order: updatedItem.sort_order,
        //     created_at: updatedItem.created_at
        // },
        // pinned_stats: {
        //     current_pinned: pinnedCountAfter.count,
        //     max_allowed: 6,
        //     remaining_slots: 6 - pinnedCountAfter.count
        // }
    };
}));