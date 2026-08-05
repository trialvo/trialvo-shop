const { api, auth ,verifyUnsubscribeToken} = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require("validator");
 
 
const { BRAND_NAME } = require('../config/ApplicationSettings');




exports.subscribe = api({
    body: {
        email: { type: "string", required: true },
        user_id: { type: "int", required: false } // Optional, if user is logged in
    }
}, async (req, connection) => {
    const { email, user_id } = req.typed.body;

    // 1. Basic Validation
    if (!validator.isEmail(email)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format.");
    }

    // 2. If user_id is provided, verify user exists and matches email
    if (user_id) {
        const user = await connection.queryOne(
            "SELECT id FROM users WHERE id = ? AND email = ? AND status = 'active' AND deleted_at IS NULL", 
            [user_id, email]
        );
        if (!user) {
            throw new errors.INVALID_FIELDS_PROVIDED("User ID does not match the provided email or is inactive.");
        }
    }

    // 3. Check for existing subscription (including soft-deleted)
    const existingSub = await connection.queryOne(
        "SELECT id, status, suspended_at FROM subscribers WHERE email = ? ",
        [email]
    );

    if (existingSub) {
        // If already active, don't allow duplicate subscription
        if (existingSub.status === 1) {
            throw new errors.ALREADY_EXIST("This email is already subscribed.");
        }

        if(existingSub.suspended_at !== null) throw new errors.FORBIDDEN("This email was unsubscribed and suspended and cannot be re-subscribed.");

        // If they were unsubscribed (status 0), re-activate them
        await connection.query(
            "UPDATE subscribers SET status = 1, unsubscribed_at = NULL, user_id = ? WHERE id = ?",
            [user_id || null, existingSub.id]
        );

        return {
            subscriber_id: existingSub.id,
            message: "Subscription re-activated successfully."
        };
    }

    // 4. Create new subscription
    const result = await connection.query(
        "INSERT INTO subscribers (email, user_id, status, subscribed_at) VALUES (?, ?, 1, NOW())",
        [email, user_id || null]
    );

    return {
        subscriber_id: result.insertId,
        message: "Thank you for subscribing to our platform!"
    };
});



exports.getAllSubscribers = api({
    query: {
        limit: { type: "int", required: false, default: 20 },
        offset: { type: "int", required: false, default: 0 },
        type: { type: "string", required: false }, // 'subscribed', 'unsubscribed', 'suspended'
        search: { type: "string", required: false }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { limit, offset, type, search } = req.typed.query;

    if (type && !['subscribed', 'unsubscribed', 'suspended'].includes(type)) {
        throw new errors.INVALID_PARAMETER("Invalid type parameter. Allowed values: subscribed, unsubscribed, suspended.");
    }
    if (search && !validator.isLength(search, { min: 2, max: 100 })) {
        throw new errors.INVALID_PARAMETER("Search term must be between 2 and 100 characters.");
    }

    let queryParts = ["WHERE 1=1"]; // Base query
    let queryValues = [];

    /** 2️⃣ Build Dynamic Filters for Subscriber States */
    if (type === 'subscribed') {
        // Active and not suspended
        queryParts.push("AND s.status = 1 AND s.suspended_at IS NULL");
    } else if (type === 'unsubscribed') {
        // Opted out but not suspended
        queryParts.push("AND s.status = 0 AND s.suspended_at IS NULL");
    } else if (type === 'suspended') {
        // Soft-deleted records (suspended/Archived)
        queryParts.push("AND s.suspended_at IS NOT NULL");
    }

    /** 3️⃣ Global Search (Subscriber Email, User First/Last Name) */
    if (search) {
        queryParts.push(`AND (
            s.email LIKE ? OR 
            u.first_name LIKE ? OR 
            u.last_name LIKE ?
        )`);
        const searchVal = `%${search}%`;
        queryValues.push(searchVal, searchVal, searchVal);
    }

    const whereClause = queryParts.join(" ");

    /** 4️⃣ Execute Count and Data queries */
    // Using a LEFT JOIN with users to get name details for the search
    const countResult = await connection.queryOne(
        `SELECT COUNT(*) as total 
         FROM subscribers s
         LEFT JOIN users u ON s.user_id = u.id 
         ${whereClause}`,
        queryValues
    );

    const subscribers = await connection.query(
        `SELECT 
            s.id,
            s.user_id,
            s.email,
            s.status,
            s.subscribed_at,
            s.unsubscribed_at,
            s.updated_at,
            s.suspended_at as suspended_at,
            u.first_name,
            u.last_name,
            u.img_path as user_avatar 
         FROM subscribers s
         LEFT JOIN users u ON s.user_id = u.id
         ${whereClause}
         ORDER BY s.subscribed_at DESC
         LIMIT ? OFFSET ?`,
        [...queryValues, limit, offset]
    );

    return {
        success: true,
        total: countResult.total,
        limit,
        offset,
        data: subscribers
    };
}));




exports.getSubscriberById = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { id } = req.typed.params;

    /** 2️⃣ Fetch Subscriber with User Details */
    const subscriber = await connection.queryOne(
        `SELECT 
            s.id,
            s.user_id,
            s.email,
            s.status,
            s.subscribed_at,
            s.unsubscribed_at,
            s.updated_at,
            s.suspended_at as suspended_at,
            u.first_name,
            u.last_name,
            u.img_path as user_avatar 
         FROM subscribers s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [id]
    );

    /** 3️⃣ Handle Not Found */
    if (!subscriber) {
        throw new errors.NOT_FOUND("Subscriber record not found.");
    }

    return {
        success: true,
        data: subscriber
    };
}));




exports.toggleSubscription = api({
    params: {
        id: { type: "int", required: true }
    },
    body: {
        reason: { type: "string", required: false }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { id } = req.typed.params;
    const { reason } = req.typed.body;

    /** 2️⃣ Fetch current state */
    const subscriber = await connection.queryOne(
        "SELECT id, email, status, suspended_at FROM subscribers WHERE id = ?",
        [id]
    );

    if (!subscriber) {
        throw new errors.NOT_FOUND("Subscriber record not found.");
    }

    // Prevent toggling if the user is suspended (soft-deleted)
    if (subscriber.suspended_at !== null) {
        throw new errors.FORBIDDEN("This subscriber is suspended/deleted. Unban them before toggling status.");
    }

    /** 3️⃣ Determine new state */
    const newStatus = subscriber.status === 1 ? 0 : 1;
    const unsubscribedAt = newStatus === 0 ? "NOW()" : "NULL";
    const actionLabel = newStatus === 1 ? "MANUAL_RESUBSCRIBE" : "MANUAL_UNSUBSCRIBE";

    /** 4️⃣ Execute Update */
    // Note: We use raw values for unsubscribed_at to handle the NULL vs NOW() logic easily
    await connection.query(
        `UPDATE subscribers 
         SET status = ?, 
             unsubscribed_at = ${unsubscribedAt}, 
             updated_at = NOW() 
         WHERE id = ?`,
        [newStatus, id]
    );

    /** 5️⃣ Audit Log */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            adminInfo.id, 
            actionLabel, 
            'subscribers', 
            id, 
            JSON.stringify({ 
                email: subscriber.email, 
                reason: reason || `Admin toggled status to ${newStatus === 1 ? 'Active' : 'Unsubscribed'}` 
            })
        ]
    );

    return {
        success: true,
        new_status: newStatus,
        message: `Subscriber ${subscriber.email} is now ${newStatus === 1 ? 'Active' : 'Unsubscribed'}.`
    };
}));

 

exports.toggleBanSubscriber = api({
    params: {
        id: { type: "int", required: true }
    },
    body: {
        reason: { type: "string", required: false },
        effect_linked_account: { type: "bool", required: false, default: false } // Controlled sync
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { id } = req.typed.params;
    const { reason, effect_linked_account } = req.typed.body;

    /** 2️⃣ Fetch subscriber state */
    const subscriber = await connection.queryOne(
        "SELECT id, email, user_id, suspended_at FROM subscribers WHERE id = ?",
        [id]
    );

    if (!subscriber) {
        throw new errors.NOT_FOUND("Subscriber record not found.");
    }

    /** 3️⃣ Determine state logic */
    const isCurrentlySuspended = subscriber.suspended_at !== null;
    const newSuspendedAt = isCurrentlySuspended ? "NULL" : "NOW()";
    const newUserStatus = isCurrentlySuspended ? 'active' : 'suspended';
    const actionLabel = isCurrentlySuspended ? "MANUAL_UNBAN" : "MANUAL_BAN";

    /** 4️⃣ Execute Updates */
    // Always update the subscriber record
    await connection.query(
        `UPDATE subscribers 
         SET suspended_at = ${newSuspendedAt}, 
             updated_at = NOW() 
         WHERE id = ?`,
        [id]
    );

    // Only update the user account if linked AND admin explicitly requested it
    let userTableUpdated = false;
    if (subscriber.user_id && effect_linked_account==true) {
        await connection.query(
            "UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?",
            [newUserStatus, subscriber.user_id]
        );
        userTableUpdated = true;
    }

    /** 5️⃣ Audit Log with precise details */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            adminInfo.id, 
            actionLabel, 
            'subscribers', 
            id, 
            JSON.stringify({ 
                email: subscriber.email, 
                user_id: subscriber.user_id,
                user_account_synced: userTableUpdated,
                reason: reason || `Admin toggled suspension (Linked account sync: ${userTableUpdated})` 
            })
        ]
    );

    return {
        success: true,
        is_suspended: !isCurrentlySuspended,
        user_account_synced: userTableUpdated,
        message: userTableUpdated 
            ? `Subscriber and linked account have been ${isCurrentlySuspended ? 'restored' : 'suspended'}.`
            : `Subscriber ${isCurrentlySuspended ? 'restored' : 'suspended'}. Linked user account was not affected.`
    };
}));





exports.unsubscribe = api({
    body: {
        email: { type: "string", required: true },
        token: { type: "string", required: true }
    }
}, async (req, connection) => {
    const { email, token } = req.typed.body;

    /** 1️⃣ Validation */
    if (!validator.isEmail(email)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format.");
    }


// Using the same helper you use for generation to verify
    const decodedToken = await verifyUnsubscribeToken( token);
    
     if (!decodedToken || !decodedToken.email) throw new errors.INVALID_ACCESS_TOKEN("Invalid or expired unsubscribe token.");
    if(decodedToken.type !== "unsubscribe") throw new errors.INVALID_ACCESS_TOKEN("Invalid unsubscribe token type.");
    if (decodedToken.email !== email) {
        throw new errors.INVALID_ACCESS_TOKEN("Token email does not match.");
    }


    /** 2️⃣ Identify the Subscriber */
    const subscriber = await connection.queryOne(
        "SELECT id, email, status FROM subscribers WHERE email = ?   AND suspended_at IS NULL",
        [email]
    );

    if (!subscriber) {
        // We return success even if not found to prevent "email harvesting" 
        // (telling attackers if an email exists in our DB)
        return {
            success: true,
            message: "If this email was subscribed, it has been removed from our list."
        };
    }

    if (subscriber.status === 0) {
        return {
            success: true,
            message: "You are already unsubscribed."
        };
    }

    /** 3️⃣ Verify the Token */
    

    /** 4️⃣ Execute Unsubscribe */
    await connection.query(
        `UPDATE subscribers 
         SET status = 0, 
             unsubscribed_at = NOW(), 
             updated_at = NOW() 
         WHERE id = ?`,
        [subscriber.id]
    );

   

    return {
        success: true,
        message: "You have been successfully unsubscribed from our newsletter."
    };
});