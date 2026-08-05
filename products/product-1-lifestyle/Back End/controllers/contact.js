// Adjust paths as needed
const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require("validator");
const { sendSMS } = require('../helpers/sms');
const { sendSupportReplyMail } = require('../mail-templates/response');
const { BRAND_NAME } = require('../config/ApplicationSettings');
const { sendAdminContactNotification, sendUserFirebasePush } = require('../helpers/notify'); // V2-036, V2-041
const { logNotification } = require('./notification_history'); // V2-040

exports.createContactMessage = api({
    body: {
        first_name: { type: "string", required: false },
        last_name: { type: "string", required: false },
        email: { type: "string", required: false },
        phone: { type: "string", required: false },
        subject: { type: "string", required: true },
        message: { type: "string", required: true },
        user_id: { type: "int" } // Optional, if user is logged in
    }
}, async (req, connection) => {
    const { first_name, last_name, email, phone, subject, message, user_id } = req.typed.body;

    // Validations
    if (first_name && first_name.length > 100) throw new errors.INVALID_FIELDS_PROVIDED("First name too long.");
    if (last_name && last_name.length > 100) throw new errors.INVALID_FIELDS_PROVIDED("Last name too long.");
    if (subject && subject.length > 255) throw new errors.INVALID_FIELDS_PROVIDED("Subject too long.");

    if (!email && !phone) {
        throw new errors.INVALID_FIELDS_PROVIDED("Either email or phone must be provided.");
    }

    if (email && !validator.isEmail(email)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format.");
    }
    if (phone && !validator.isMobilePhone(phone)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone format.");
    }


    if (user_id) {
        if (!email) {
            throw new errors.INVALID_FIELDS_PROVIDED("Email is required when user_id is provided.");
        }

        const user = await connection.queryOne("SELECT id FROM users WHERE id = ? and email = ? and status ='active' AND deleted_at IS NULL", [user_id, email]);
        if (!user) throw new errors.INVALID_FIELDS_PROVIDED("User ID does not exist.");
    }

    // Insert contact message
    const result = await connection.query(
        `INSERT INTO contact_messages (user_id, first_name, last_name, email, phone, subject, message) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id || null, first_name, last_name, email, phone, subject, message]
    );

    const messageId = result.insertId;

    // ── User audit log (if submitted by a logged-in user) ─────────────────────
    if (user_id) {
      connection.query(
        `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
         VALUES (?, 'SUBMIT_CONTACT_MESSAGE', ?, ?)`,
        [
          user_id,
          req.ip || req.headers['x-forwarded-for'] || null,
          JSON.stringify({ message_id: messageId, subject })
        ]
      ).catch(e => console.error('[Contact] user_audit_log failed:', e.message));
    }

    // V2-037: Auto-assign via distribution pool
    // MUST be awaited — uses the handler's `connection` which the api() wrapper
    // commits + releases immediately after this handler returns.
    try {
      const adminId = await autoAssignContactMessage(connection, messageId);
      if (adminId) sendAdminContactNotification(null, messageId, 'contact_assigned');
    } catch (e) {
      console.error('[Contact] Auto-assign error:', e.message);
    }

    return {
        query_id: messageId,
        message: "Contact message submitted successfully."
    };
});



// ── V2-041: User-facing: get own contact messages ────────────────────────────
exports.getMyContactMessages = api({
  query: {
    user_id: { type: 'int', required: true },
    limit:   { type: 'int', required: false, default: 20 },
    offset:  { type: 'int', required: false, default: 0  },
  },
}, async (req, connection) => {
  const { user_id, limit, offset } = req.typed.query;

  // Verify the user exists
  const user = await connection.queryOne(
    `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
    [user_id]
  );
  if (!user) throw new (require('../helpers/errors')).NOT_FOUND('User not found.');

  const messages = await connection.query(
    `SELECT id, subject, message, is_read, is_replied, status, created_at, updated_at
     FROM contact_messages
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [user_id, limit, offset]
  );

  if (!messages.length) {
    return { success: true, data: [] };
  }

  // Fetch replies for all messages
  const msgIds = messages.map(m => m.id);
  const replies = await connection.query(
    `SELECT message_id, reply_text, type AS via, created_at AS sent_at
     FROM contact_replies
     WHERE message_id IN (?) AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [msgIds]
  );

  const repliesMap = {};
  replies.forEach(r => {
    if (!repliesMap[r.message_id]) repliesMap[r.message_id] = [];
    repliesMap[r.message_id].push(r);
  });

  const data = messages.map(m => ({
    ...m,
    replies: repliesMap[m.id] || [],
  }));

  return { success: true, data };
});

exports.getAllContactMessages = api({
    query: {
        limit: { type: "int", required: false, default: 20 },
        offset: { type: "int", required: false, default: 0 },
        is_read: { type: "bool", required: false },      // 0 or 1
        is_replied: { type: "bool", required: false },   // 0 or 1
        status: { type: "bool", required: false },       // 0 or 1
        subject: { type: "string", required: false },
        search: { type: "string", required: false },
        assigned_to_me: { type: "bool", required: false } // bell dropdown filter
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1️⃣ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const isSuperAdmin   = adminInfo.roles.includes('SUPER_ADMIN');
    const isAdmin        = adminInfo.roles.includes('ADMIN');
    const isOrderManager = !isSuperAdmin && !isAdmin && adminInfo.roles.includes('ORDER_MANAGER');
    const { limit, offset, is_read, is_replied, status, subject, search, assigned_to_me } = req.typed.query;

    let queryParts = ["WHERE cm.deleted_at IS NULL"];
    let queryValues = [];

    // V2-039: ORDER_MANAGER always sees only their assigned messages.
    // assigned_to_me=true: any role can opt-in to filter by their assigned messages (used by bell dropdown).
    if (isOrderManager || assigned_to_me) {
        queryParts.push("AND cm.assigned_to_admin_id = ?");
        queryValues.push(adminInfo.id);
    }

    /** 2️⃣ Build Dynamic Filters */
    if (is_read !== undefined) {
        queryParts.push("AND cm.is_read = ?");
        queryValues.push(is_read ? 1 : 0);
    }
    if (is_replied !== undefined) {
        queryParts.push("AND cm.is_replied = ?");
        queryValues.push(is_replied ? 1 : 0);
    }
    if (status !== undefined) {
        queryParts.push("AND cm.status = ?");
        queryValues.push(status ? 1 : 0);
    }
    if (subject) {
        queryParts.push("AND cm.subject LIKE ?");
        queryValues.push(`%${subject}%`);
    }

    /** 3ï¸âƒ£ Global Search (Name, Email, Phone, Subject) */
    if (search) {
        queryParts.push(`AND (
            cm.first_name LIKE ? OR 
            cm.last_name LIKE ? OR 
            cm.email LIKE ? OR 
            cm.phone LIKE ? OR 
            cm.subject LIKE ?
        )`);
        const searchVal = `%${search}%`;
        queryValues.push(searchVal, searchVal, searchVal, searchVal, searchVal);
    }

    const whereClause = queryParts.join(" ");

    /** 4ï¸âƒ£ Execute Count and Data queries */
    const countResult = await connection.queryOne(
        `SELECT COUNT(*) as total FROM contact_messages cm ${whereClause}`,
        queryValues
    );

    // Join with users to see if they are registered customers
    const messages = await connection.query(
        `SELECT 
            cm.*,
            u.img_path as user_avatar,
            u.status as user_account_status
         FROM contact_messages cm
         LEFT JOIN users u ON cm.user_id = u.id
         ${whereClause}
         ORDER BY cm.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryValues, limit, offset]
    );

    return {
        success: true,
        total: countResult.total,
        limit,
        offset,
        data: messages
    };
}));



exports.getContactMessageById = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1ï¸âƒ£ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { id } = req.typed.params;

    /** 2ï¸âƒ£ Fetch Message with User Details */
    // We join with users and also pull basic order stats to give the admin context
    const message = await connection.queryOne(
        `SELECT 
            cm.*,
            u.first_name as registered_first_name,
            u.last_name as registered_last_name,
            u.email as registered_email,
            u.total_spent,
            (SELECT COUNT(*) FROM orders WHERE customer_id = cm.user_id) as total_orders
         FROM contact_messages cm
         LEFT JOIN users u ON cm.user_id = u.id
         WHERE cm.id = ? AND cm.deleted_at IS NULL`,
        [id]
    );

    if (!message) {
        throw new errors.NOT_FOUND("Message not found or has been deleted.");
    }

    /** 3ï¸âƒ£ Auto-mark as Read */
    if (message.is_read === 0) {
        await connection.query(
            `UPDATE contact_messages SET is_read = 1, updated_at = NOW() WHERE id = ?`,
            [id]
        );
        // Update the local object so the frontend knows it's now read
        message.is_read = 1;
    }

    return {
        success: true,
        data: message
    };
}));



exports.getContactMessageById = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1ï¸âƒ£ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { id } = req.typed.params;

    /** 2ï¸âƒ£ Fetch Message with User Details & Order Stats */
    const message = await connection.queryOne(
        `SELECT 
            cm.*,
            u.first_name as registered_first_name,
            u.last_name as registered_last_name,
            u.img_path as user_avatar,
            u.total_spent,
            (SELECT COUNT(*) FROM orders WHERE customer_id = cm.user_id) as total_orders
         FROM contact_messages cm
         LEFT JOIN users u ON cm.user_id = u.id
         WHERE cm.id = ? AND cm.deleted_at IS NULL`,
        [id]
    );

    if (!message) {
        throw new errors.NOT_FOUND("Message not found or has been deleted.");
    }

    /** 3ï¸âƒ£ Auto-mark as Read */
    if (message.is_read === 0) {
        await connection.query(
            `UPDATE contact_messages SET is_read = 1, updated_at = NOW() WHERE id = ?`,
            [id]
        );
        message.is_read = 1;
    }

    /** 4ï¸âƒ£ Fetch All Replies (The Conversation History) */
    const replies = await connection.query(
        `SELECT 
            cr.id,
            cr.reply_text,
            cr.type as reply_type,
            cr.created_at,
            a.first_name as admin_name,
            a.last_name as admin_last_name,
            a.profile_img_path as admin_avatar
         FROM contact_replies cr
         JOIN admins a ON cr.admin_id = a.id
         WHERE cr.message_id = ? AND cr.deleted_at IS NULL
         ORDER BY cr.created_at ASC`,
        [id]
    );

    return {
        success: true,
        data: {
            ...message,
            replies: replies || [] // Returns an empty array if no replies exist
        }
    };
}));
exports.deleteContactMessage = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1ï¸âƒ£ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Only Admins can delete messages.");
    }

    const { id } = req.typed.params;

    /** 2ï¸âƒ£ Check if message exists and isn't already deleted */
    const message = await connection.queryOne(
        "SELECT id FROM contact_messages WHERE id = ? AND deleted_at IS NULL",
        [id]
    );

    if (!message) {
        throw new errors.NOT_FOUND("Message not found or already deleted.");
    }

    /** 3ï¸âƒ£ Perform Soft Delete */
    await connection.query(
        `UPDATE contact_messages 
         SET deleted_at = NOW(), 
             status = 0, 
             updated_at = NOW() 
         WHERE id = ?`,
        [id]
    );

    /** 4ï¸âƒ£ Admin Audit Log */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'DELETE_CONTACT_MESSAGE', 'contact_message', ?, ?)`,
        [adminInfo.id, id, JSON.stringify({ deleted_by: adminInfo.email })]
    );

    return {
        success: true,
        message: "Message moved to trash successfully."
    };
}));


exports.getContactMessageCounts = api({
    // No params needed, just global counts for the admin
}, auth(async (req, connection, adminInfo) => {

    /** 1ï¸âƒ£ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "READ_ONLY_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    /** 2ï¸âƒ£ Efficient Conditional Counting */
    // We use a single query to get multiple counts at once for better performance
    const counts = await connection.queryOne(`
        SELECT 
            COUNT(*) AS total_active,
            SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
            SUM(CASE WHEN is_replied = 0 THEN 1 ELSE 0 END) AS unreplied_count,
            SUM(CASE WHEN is_read = 1 AND is_replied = 0 THEN 1 ELSE 0 END) AS read_but_pending_reply
        FROM contact_messages 
        WHERE deleted_at IS NULL AND status = 1
    `);

    return {
        success: true,
        data: {
            total: Number(counts.total_active || 0),
            unread: Number(counts.unread_count || 0),
            unreplied: Number(counts.unreplied_count || 0),
            read_but_not_replied: Number(counts.read_but_pending_reply || 0)
        }
    };
}));



exports.toggleContactMessageStatus = api({
    params: {
        id: { type: "int", required: true }
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1ï¸âƒ£ Authorization check */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Only Admins can change message status.");
    }

    const { id } = req.typed.params;

    /** 2ï¸âƒ£ Fetch current status and verify existence */
    const message = await connection.queryOne(
        "SELECT id, status FROM contact_messages WHERE id = ? AND deleted_at IS NULL",
        [id]
    );

    if (!message) {
        throw new errors.NOT_FOUND("Message not found or has been deleted.");
    }

    /** 3ï¸âƒ£ Toggle Logic */
    const newStatus = message.status === 1 ? 0 : 1;

    await connection.query(
        `UPDATE contact_messages 
         SET status = ?, 
             updated_at = NOW() 
         WHERE id = ?`,
        [newStatus, id]
    );

    /** 4ï¸âƒ£ Audit Log */
    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'TOGGLE_CONTACT_STATUS', 'contact_message', ?, ?)`,
        [adminInfo.id, id, JSON.stringify({ old_status: message.status, new_status: newStatus })]
    );

    return {
        success: true,
        message: `Message status updated to ${newStatus === 1 ? 'Active' : 'Archived'}.`,
        data: {
            id,
            status: newStatus
        }
    };
}));


exports.replyToContactMessage = api({
    body: {
        message_id: { type: "int", required: true },
        reply_text: { type: "string", required: true },
        type: { type: "string", required: true } // 'email' or 'sms'
    }
}, auth(async (req, connection, adminInfo) => {

    /** 1ï¸âƒ£ Authorization */
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
        throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { message_id, reply_text, type } = req.typed.body;

    if (!['email', 'sms'].includes(type)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Reply type must be either 'email' or 'sms'.");
    }

    /** 2ï¸âƒ£ Fetch Original Message */
    const originalMsg = await connection.queryOne(
        "SELECT * FROM contact_messages WHERE id = ? AND status = 1 AND deleted_at IS NULL",
        [message_id]
    );
    if (!originalMsg) throw new errors.NOT_FOUND("Original message not found.");

    /** 3ï¸âƒ£ Save Reply to Database */
    /** 3ï¸ âƒ£ Save Reply to Database */
    const result = await connection.query(
        `INSERT INTO contact_replies (message_id, admin_id, reply_text, type) VALUES (?, ?, ?, ?)`,
        [message_id, adminInfo.id, reply_text, type]
    );

    /** 4️⃣ Update Original Message Status */
    await connection.query(
        "UPDATE contact_messages SET is_replied = 1, is_read = 1, updated_at = NOW() WHERE id = ?",
        [message_id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'REPLY_CONTACT_MESSAGE', 'contact_messages', ?, ?)`,
        [adminInfo.id, message_id, JSON.stringify({ via: type, reply_preview: reply_text.substring(0, 100) })]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    /** 5️⃣ Dispatch Communication (Async/Background) */
    const name = `${originalMsg.first_name} ${originalMsg.last_name}`.trim() || "Customer";
    if (type === 'email') {
        if (!originalMsg.email) throw new errors.NOT_FOUND("No email provided for this inquiry.");

        let emailSt = 'sent'; let emailEr = null;
        try {
            await sendSupportReplyMail(connection, {
                name: name,
                email: originalMsg.email,
                subject: `${originalMsg.subject}`,
                reply_text: reply_text,
                query_id: originalMsg.id,
                query_message: originalMsg.message,
                query_created_at: originalMsg.created_at
            });
        } catch(mailErr) {
            emailSt = 'failed'; emailEr = mailErr.message;
            console.error('[Contact Reply] Email failed:===========================================================================================================================', mailErr.message);
        } finally {
            await logNotification(connection, { channel: 'email', category: 'contact_reply', recipientType: originalMsg.user_id ? 'user' : 'guest', recipientUserId: originalMsg.user_id || null, recipientEmail: originalMsg.email, title: originalMsg.subject, message: reply_text, status: emailSt, errorMessage: emailEr, relatedContactMessageId: message_id, triggeredByAdminId: adminInfo.id });
        }
    }

    else if (type === 'sms') {
        if (!originalMsg.phone) throw new errors.NOT_FOUND("No phone number provided for this inquiry.");

        const smsBody = `Hi ${name} your reply for query id ${message_id} is: ${reply_text} - Team ${BRAND_NAME}`;

        let smsSt = 'sent'; let smsEr = null;
        try {
            await sendSMS(connection, originalMsg.phone, smsBody);
        } catch(smsErr) {
            smsSt = 'failed'; smsEr = smsErr.message;
            console.error('[Contact Reply] SMS failed:', smsErr.message);
        } finally {
            await logNotification(connection, { channel: 'sms', category: 'contact_reply', recipientType: originalMsg.user_id ? 'user' : 'guest', recipientUserId: originalMsg.user_id || null, recipientPhone: originalMsg.phone, message: smsBody, status: smsSt, errorMessage: smsEr, relatedContactMessageId: message_id, triggeredByAdminId: adminInfo.id });
        }
    }




    // ── V2-041: Firebase push to customer if logged in ──────────────────────────
    if (originalMsg.user_id) {
      const database = require('../utils/connection');
      const conn2 = await database.getConnection();
      try {
        await sendUserFirebasePush(
          conn2,
          originalMsg.user_id,
          `Reply to Your Message #${message_id}`,
          `A support agent has responded to your inquiry: "${originalMsg.subject}"`,
          { message_id: String(message_id), type: 'contact_reply' }
        );
        await logNotification(conn2, { channel: 'push', category: 'contact_reply', recipientType: 'user', recipientUserId: originalMsg.user_id, title: `Reply to Your Message #${message_id}`, message: `A support agent has responded to your inquiry: "${originalMsg.subject}"`, status: 'sent', relatedContactMessageId: message_id, triggeredByAdminId: adminInfo.id });
      } catch (e) {
        console.error(`[Contact Reply] User push failed for message #${message_id}:`, e.message);
      } finally {
        await conn2.release();
      }
    }

    return {
        success: true,
        reply_id: result.insertId,
        message: `Reply recorded and ${type} dispatch initiated.`
    };
}));

// ── Admin audit log for reply ───────────────────────────────────────────


exports.searchContactHistory = api({
    query: {
        limit: { type: "int", required: false, default: 20 },
        offset: { type: "int", required: false, default: 0 },
        query_id: { type: "int", required: false },
        phone: { type: "string", required: false },
        email: { type: "string", required: false },
        user_id: { type: "int", required: false }
    }
}, async (req, connection) => {
    const { limit, offset, query_id, phone, email, user_id } = req.typed.query;

    /** 1ï¸âƒ£ Validation: Ensure at least one identifier is provided */
    if (!query_id && !phone && !email && !user_id) {
        throw new errors.INVALID_FIELDS_PROVIDED("Please provide an Order ID, Email, Phone number, or User ID to search.");
    }

    if (email && !validator.isEmail(email)) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid email format.");
    }

    if (phone && !validator.isMobilePhone(phone, "any")) {
        throw new errors.INVALID_FIELDS_PROVIDED("Invalid phone format.");
    }

    /** 2ï¸âƒ£ Build Dynamic Search Query */
    let queryParts = ["WHERE cm.deleted_at IS NULL AND cm.status = 1"];
    let queryValues = [];

    if (query_id) {
        queryParts.push("AND cm.id = ?");
        queryValues.push(query_id);
    }
    else if (user_id) {
        queryParts.push("AND cm.user_id = ?");
        queryValues.push(user_id);
    }
    else if (email) {
        queryParts.push("AND cm.email = ?");
        queryValues.push(email);
    } else if (phone) {
        queryParts.push("AND cm.phone = ?");
        queryValues.push(phone);
    }

    const whereClause = queryParts.join(" ");

    /** 3ï¸âƒ£ Fetch Inquiries */
    const inquiries = await connection.query(
        `SELECT 
            cm.id, cm.first_name, cm.subject, cm.message, 
            cm.is_read, cm.is_replied, cm.created_at
         FROM contact_messages cm
         ${whereClause}
         ORDER BY cm.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryValues, limit, offset]
    );

    if (inquiries.length === 0) {
        return { success: true, data: [], message: "No inquiries found." };
    }

    /** 4ï¸âƒ£ Fetch and Nest Replies for these Inquiries */
    const inquiryIds = inquiries.map(q => q.id);
    const allReplies = await connection.query(
        `SELECT 
            cr.message_id, cr.reply_text, cr.type as reply_type, cr.created_at
         FROM contact_replies cr
         WHERE cr.message_id IN (?) AND cr.deleted_at IS NULL
         ORDER BY cr.created_at ASC`,
        [inquiryIds]
    );

    // Group replies by message_id
    const repliesMap = {};
    allReplies.forEach(reply => {
        if (!repliesMap[reply.message_id]) repliesMap[reply.message_id] = [];
        repliesMap[reply.message_id].push(reply);
    });

    // Map replies back to their respective inquiries
    const result = inquiries.map(inquiry => ({
        ...inquiry,
        replies: repliesMap[inquiry.id] || []
    }));

    return {
        success: true,
        count: result.length,
        data: result
    };
});


// V2-036: Assign a contact message to a specific admin
exports.assignContactMessage = api(
  {
    params: { id: { type: 'int', required: true } },
    body:   { admin_id: { type: 'int', required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const messageId = req.typed.params.id;
    const { admin_id } = req.typed.body;

    // Verify message exists
    const msg = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM contact_messages WHERE id = ? AND deleted_at IS NULL`,
      [messageId]
    );
    if (!msg) throw new errors.NOT_FOUND('Contact message not found.');

    // Verify target admin
    const targetAdmin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [admin_id]
    );
    if (!targetAdmin) throw new errors.NOT_FOUND('Target admin not found or inactive.');

    if (msg.assigned_to_admin_id === admin_id) {
      throw new errors.INVALID_FIELDS_PROVIDED('Message is already assigned to this admin.');
    }

    await connection.query(
      `UPDATE contact_messages
       SET assigned_to_admin_id = ?, assigned_by_admin_id = ?, assigned_at = NOW()
       WHERE id = ?`,
      [admin_id, adminInfo.id, messageId]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'ASSIGN_CONTACT_MESSAGE', 'contact_messages', ?, ?)`,
      [adminInfo.id, messageId, JSON.stringify({ assigned_to: admin_id })]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    // Notify the assigned admin (non-blocking)
    sendAdminContactNotification(null, messageId, 'contact_assigned');

    return { success: true, message: 'Contact message assigned successfully.' };
  })
);
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// V2-037: CONTACT MESSAGE DISTRIBUTION POOL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** Auto-assign a contact message to the least-loaded active pool agent. */
async function autoAssignContactMessage(connection, messageId) {
  const settings = await connection.queryOne(
    `SELECT auto_assign_enabled, assign_on_message_create FROM contact_distribution_settings WHERE id = 1`
  );
  if (!settings || !settings.auto_assign_enabled || !settings.assign_on_message_create) return null;

  const agents = await connection.query(`
    SELECT cda.admin_id, cda.max_active_messages, cda.serial,
           -- Active = messages admin still needs to reply to (not yet replied, still open)
           COUNT(CASE WHEN cm.status = 1 AND cm.is_replied = 0 THEN 1 END) AS active_count
    FROM contact_distribution_agents cda
    JOIN admins a ON a.id = cda.admin_id AND a.is_active = 1 AND a.deleted_at IS NULL
    LEFT JOIN contact_messages cm ON cm.assigned_to_admin_id = cda.admin_id AND cm.deleted_at IS NULL
    WHERE cda.status = 1 AND cda.auto_assign_enabled = 1
    GROUP BY cda.admin_id, cda.max_active_messages, cda.serial, cda.id
    ORDER BY active_count ASC, cda.serial ASC, cda.id ASC
  `);

  if (!agents.length) return null;
  let chosen = null;
  for (const agent of agents) {
    if (agent.max_active_messages && agent.max_active_messages > 0 && agent.active_count >= agent.max_active_messages) continue;
    chosen = agent;
    break;
  }
  if (!chosen) return null;

  await connection.query(
    `UPDATE contact_messages SET assigned_to_admin_id = ?, assigned_by_admin_id = NULL, assigned_at = NOW() WHERE id = ?`,
    [chosen.admin_id, messageId]
  );
  await connection.query(`UPDATE contact_distribution_settings SET last_assigned_admin_id = ? WHERE id = 1`, [chosen.admin_id]);
  return chosen.admin_id;
}

// â”€â”€â”€ Contact Counts (full breakdown) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getContactCounts = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();
    const isSuperAdmin = adminInfo.roles.includes('SUPER_ADMIN');
    const w = isSuperAdmin ? 'cm.deleted_at IS NULL' : `cm.deleted_at IS NULL AND cm.assigned_to_admin_id = ${Number(adminInfo.id)}`;

    const [cTotal, cUnread, cUnreplied, cReadNotReplied, cArchived] = await Promise.all([
      connection.queryOne(`SELECT COUNT(*) AS c FROM contact_messages cm WHERE ${w} AND cm.status = 1`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM contact_messages cm WHERE ${w} AND cm.is_read = 0 AND cm.status = 1`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM contact_messages cm WHERE ${w} AND cm.is_replied = 0 AND cm.status = 1`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM contact_messages cm WHERE ${w} AND cm.is_read = 1 AND cm.is_replied = 0 AND cm.status = 1`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM contact_messages cm WHERE ${w} AND cm.status = 0`),
    ]);

    return {
      success: true,
      data: { total: cTotal?.c || 0, unread: cUnread?.c || 0, unreplied: cUnreplied?.c || 0, read_but_not_replied: cReadNotReplied?.c || 0, archived: cArchived?.c || 0 }
    };
  })
);

// â”€â”€â”€ Distribution Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getContactDistributionSettings = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();
    const settings = await connection.queryOne(`SELECT * FROM contact_distribution_settings WHERE id = 1`);
    return { success: true, data: settings || null };
  })
);

exports.updateContactDistributionSettings = api(
  { body: { auto_assign_enabled: { type: 'bool', required: false }, assign_on_message_create: { type: 'bool', required: false }, include_admin_role: { type: 'bool', required: false }, include_order_manager_role: { type: 'bool', required: false } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();
    const { auto_assign_enabled, assign_on_message_create, include_admin_role, include_order_manager_role } = req.typed.body;
    const updates = [], values = [];
    if (auto_assign_enabled !== undefined)        { updates.push('auto_assign_enabled = ?');        values.push(auto_assign_enabled ? 1 : 0); }
    if (assign_on_message_create !== undefined)   { updates.push('assign_on_message_create = ?');   values.push(assign_on_message_create ? 1 : 0); }
    if (include_admin_role !== undefined)         { updates.push('include_admin_role = ?');         values.push(include_admin_role ? 1 : 0); }
    if (include_order_manager_role !== undefined) { updates.push('include_order_manager_role = ?'); values.push(include_order_manager_role ? 1 : 0); }
    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED('No changes provided.');
    await connection.query(`UPDATE contact_distribution_settings SET ${updates.join(', ')}, updated_by_admin = ?, updated_at = NOW() WHERE id = 1`, [...values, adminInfo.id]);

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPDATE_CONTACT_DISTRIBUTION_SETTINGS', 'contact_distribution_settings', 1, ?)`,
      [adminInfo.id, JSON.stringify(req.typed.body)]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    return { success: true, message: 'Contact distribution settings updated.' };
  })
);

// â”€â”€â”€ Eligible Admins for Pool UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getContactEligibleAdmins = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const admins = await connection.query(`
      SELECT a.id,
        CONCAT(a.first_name, ' ', IFNULL(a.last_name,'')) AS admin_name,
        a.email, a.profile_img_path, a.is_active,
        r.name AS role_name, r.id AS role_id,
        cda.id AS pool_id, cda.serial, cda.max_active_messages,
        cda.auto_assign_enabled AS pool_auto_assign, cda.status AS pool_status,
        /* active messages currently in queue (status=1, not archived/deleted) */
        IFNULL(amc.active_msg_count,    0) AS active_message_count,
        /* messages assigned into this admin's queue today */
        IFNULL(tac.today_assigned_count, 0) AS today_assigned_count,
        /* messages this admin completed today (replied OR archived) */
        IFNULL(tcc.today_completed_count, 0) AS today_completed_count,
        /* lifetime total messages ever assigned to this admin */
        IFNULL(tot.total_assigned_count,  0) AS total_assigned_count
      FROM admins a
      JOIN admin_roles ar ON ar.admin_id = a.id
      JOIN roles r ON r.id = ar.role_id
      LEFT JOIN contact_distribution_agents cda ON cda.admin_id = a.id
      /* unreplied active messages — the real pending work for this admin */
      LEFT JOIN (
        SELECT assigned_to_admin_id, COUNT(*) AS active_msg_count
        FROM contact_messages
        WHERE status=1 AND is_replied=0 AND assigned_to_admin_id IS NOT NULL AND deleted_at IS NULL
        GROUP BY assigned_to_admin_id
      ) amc ON amc.assigned_to_admin_id = a.id
      /* messages assigned to this admin today */
      LEFT JOIN (
        SELECT assigned_to_admin_id, COUNT(*) AS today_assigned_count
        FROM contact_messages
        WHERE DATE(assigned_at)=CURDATE() AND assigned_to_admin_id IS NOT NULL AND deleted_at IS NULL
        GROUP BY assigned_to_admin_id
      ) tac ON tac.assigned_to_admin_id = a.id
      /* messages this admin replied to today (via contact_replies — most precise) */
      LEFT JOIN (
        SELECT cr.admin_id, COUNT(DISTINCT cr.message_id) AS today_completed_count
        FROM contact_replies cr
        WHERE cr.admin_id IS NOT NULL AND DATE(cr.created_at) = CURDATE() AND cr.deleted_at IS NULL
        GROUP BY cr.admin_id
      ) tcc ON tcc.admin_id = a.id
      /* lifetime total messages ever assigned */
      LEFT JOIN (
        SELECT assigned_to_admin_id, COUNT(*) AS total_assigned_count
        FROM contact_messages
        WHERE assigned_to_admin_id IS NOT NULL AND deleted_at IS NULL
        GROUP BY assigned_to_admin_id
      ) tot ON tot.assigned_to_admin_id = a.id
      WHERE a.is_active=1 AND a.deleted_at IS NULL AND (r.name IN ('ADMIN','ORDER_MANAGER') OR a.id=?)
      ORDER BY r.name ASC, a.first_name ASC
    `, [adminInfo.id]);

    return { success: true, data: admins };
  })
);

// â”€â”€â”€ Pool Agents CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.upsertContactAgent = api(
  { params: { admin_id: { type: 'int', required: true } }, body: { serial: { type: 'int', required: false, default: 1 }, max_active_messages: { type: 'int', required: false }, auto_assign_enabled: { type: 'bool', required: false }, status: { type: 'bool', required: false } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();
    const targetAdminId = req.typed.params.admin_id;
    const { serial, max_active_messages, auto_assign_enabled, status } = req.typed.body;
    const admin = await connection.queryOne(`SELECT id FROM admins WHERE id=? AND is_active=1 AND deleted_at IS NULL`, [targetAdminId]);
    if (!admin) throw new errors.NOT_FOUND('Admin not found or inactive.');
    const existing = await connection.queryOne(`SELECT id FROM contact_distribution_agents WHERE admin_id=?`, [targetAdminId]);
    if (existing) {
      const updates = [], values = [];
      if (serial !== undefined)              { updates.push('serial=?');              values.push(serial); }
      if (max_active_messages !== undefined) { updates.push('max_active_messages=?'); values.push(max_active_messages || null); }
      if (auto_assign_enabled !== undefined) { updates.push('auto_assign_enabled=?'); values.push(auto_assign_enabled ? 1 : 0); }
      if (status !== undefined)              { updates.push('status=?');              values.push(status ? 1 : 0); }
      if (updates.length) { values.push(existing.id); await connection.query(`UPDATE contact_distribution_agents SET ${updates.join(',')} WHERE id=?`, values); }

      // ── Admin audit log ───────────────────────────────────────────────────────
      connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'EDIT_CONTACT_DISTRIBUTION_AGENT', 'contact_distribution_agents', ?, ?)`,
        [adminInfo.id, existing.id, JSON.stringify({ target_admin_id: targetAdminId, ...req.typed.body })]
      ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

      return { success: true, message: 'Contact agent updated.', pool_id: existing.id };
    } else {
      const result = await connection.query(`INSERT INTO contact_distribution_agents (admin_id,serial,max_active_messages,auto_assign_enabled,status) VALUES (?,?,?,?,?)`,
        [targetAdminId, serial||1, max_active_messages||null, auto_assign_enabled!==undefined?(auto_assign_enabled?1:0):1, status!==undefined?(status?1:0):1]);

      // ── Admin audit log ───────────────────────────────────────────────────────
      connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'ADD_CONTACT_DISTRIBUTION_AGENT', 'contact_distribution_agents', ?, ?)`,
        [adminInfo.id, result.insertId, JSON.stringify({ target_admin_id: targetAdminId, ...req.typed.body })]
      ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

      return { success: true, message: 'Contact agent added.', pool_id: result.insertId };
    }
  })
);

exports.removeContactAgent = api(
  { params: { admin_id: { type: 'int', required: true } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();
    const targetAdminId = req.typed.params.admin_id;
    const result = await connection.query(`DELETE FROM contact_distribution_agents WHERE admin_id=?`, [targetAdminId]);
    if (!result.affectedRows) throw new errors.NOT_FOUND('Agent not in contact distribution pool.');

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'REMOVE_CONTACT_DISTRIBUTION_AGENT', 'contact_distribution_agents', ?, ?)`,
      [adminInfo.id, targetAdminId, JSON.stringify({ removed_admin_id: targetAdminId })]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    return { success: true, message: 'Agent removed from contact distribution pool.' };
  })
);

// â”€â”€â”€ Redistribute Unassigned Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.redistributeContactMessages = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();
    const messages = await connection.query(`SELECT id FROM contact_messages WHERE assigned_to_admin_id IS NULL AND status=1 AND deleted_at IS NULL ORDER BY id ASC`);
    if (!messages.length) return { success: true, message: 'No unassigned messages to redistribute.', assigned: 0, skipped: 0 };
    let assigned = 0, skipped = 0;
    for (const msg of messages) {
      const adminId = await autoAssignContactMessage(connection, msg.id);
      if (adminId) { sendAdminContactNotification(null, msg.id, 'contact_assigned'); assigned++; } else { skipped++; }
    }

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'REDISTRIBUTE_CONTACT_MESSAGES', 'contact_messages', NULL, ?)`,
      [adminInfo.id, JSON.stringify({ assigned, skipped })]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    return { success: true, message: `Redistribution complete. Assigned: ${assigned}, Skipped: ${skipped}`, assigned, skipped };
  })
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// V2-038: MANUAL ASSIGN / UNASSIGN / LOGS â€” CONTACT MESSAGES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

exports.assignContactMessageManual = api(
  { body: {
    message_id: { type: 'int', required: true },
    admin_id:   { type: 'int', required: true },
  }},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED.includes(r))) throw new errors.UNAUTHORIZED();

    const { message_id, admin_id } = req.typed.body;
    const isSuperAdmin = adminInfo.roles.includes('SUPER_ADMIN');

    const msg = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM contact_messages WHERE id = ? AND deleted_at IS NULL AND status = 1`,
      [message_id]
    );
    if (!msg) throw new errors.NOT_FOUND('Contact message not found.');

    if (!isSuperAdmin) {
      if (msg.assigned_to_admin_id !== adminInfo.id) {
        throw new errors.UNAUTHORIZED('You can only reassign messages assigned to you.');
      }
    }

    const targetAdmin = await connection.queryOne(
      `SELECT a.id, r.name AS role_name
       FROM admins a
       JOIN admin_roles ar ON ar.admin_id = a.id
       JOIN roles r ON r.id = ar.role_id
       WHERE a.id = ? AND a.is_active = 1 AND a.deleted_at IS NULL LIMIT 1`,
      [admin_id]
    );
    if (!targetAdmin) throw new errors.NOT_FOUND('Target admin not found or inactive.');

    if (!isSuperAdmin && targetAdmin.role_name === 'SUPER_ADMIN') {
      throw new errors.UNAUTHORIZED('Admins cannot assign messages to Super Admins.');
    }

    if (msg.assigned_to_admin_id === admin_id) {
      throw new errors.INVALID_FIELDS_PROVIDED('Message is already assigned to this admin.');
    }

    const fromAdminId = msg.assigned_to_admin_id;
    const actionType  = fromAdminId ? 'redistribute' : 'manual';

    await connection.query(
      `UPDATE contact_messages SET assigned_to_admin_id = ?, assigned_by_admin_id = ?, assigned_at = NOW() WHERE id = ?`,
      [admin_id, adminInfo.id, message_id]
    );

    await connection.query(
      `INSERT INTO contact_assignment_logs (message_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id) VALUES (?, ?, ?, ?, ?)`,
      [message_id, actionType, fromAdminId || null, admin_id, adminInfo.id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'ASSIGN_CONTACT_MESSAGE', 'contact_messages', ?, ?)`,
      [adminInfo.id, message_id, JSON.stringify({ action_type: actionType, from_admin_id: fromAdminId || null, to_admin_id: admin_id })]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    sendAdminContactNotification(null, message_id, 'contact_assigned');

    return {
      success: true,
      message: actionType === 'redistribute' ? 'Message reassigned successfully.' : 'Message assigned successfully.',
    };
  })
);

exports.unassignContactMessage = api(
  { params: { message_id: { type: 'int', required: true } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();

    const message_id = req.typed.params.message_id;
    const msg = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM contact_messages WHERE id = ? AND deleted_at IS NULL`,
      [message_id]
    );
    if (!msg) throw new errors.NOT_FOUND('Contact message not found.');
    if (!msg.assigned_to_admin_id) throw new errors.INVALID_FIELDS_PROVIDED('Message is not currently assigned.');

    await connection.query(
      `UPDATE contact_messages SET assigned_to_admin_id = NULL, assigned_by_admin_id = NULL, assigned_at = NULL WHERE id = ?`,
      [message_id]
    );

    await connection.query(
      `INSERT INTO contact_assignment_logs (message_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id) VALUES (?, 'unassign', ?, NULL, ?)`,
      [message_id, msg.assigned_to_admin_id, adminInfo.id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UNASSIGN_CONTACT_MESSAGE', 'contact_messages', ?, ?)`,
      [adminInfo.id, message_id, JSON.stringify({ from_admin_id: msg.assigned_to_admin_id })]
    ).catch(e => console.error('[Contact] admin_audit_log failed:', e.message));

    return { success: true, message: 'Message unassigned.' };
  })
);

exports.getContactAssignmentLogs = api(
  { query: {
    message_id: { type: 'int', required: false },
    limit:      { type: 'int', required: false, default: 20 },
    offset:     { type: 'int', required: false, default: 0 },
  }},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED.includes(r))) throw new errors.UNAUTHORIZED();

    const { message_id, limit, offset } = req.typed.query;
    const conditions = [], values = [];
    if (message_id) { conditions.push('al.message_id = ?'); values.push(message_id); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const logs = await connection.query(
      `SELECT al.*,
              CONCAT(fa.first_name, ' ', IFNULL(fa.last_name,'')) AS from_admin_name,
              CONCAT(ta.first_name, ' ', IFNULL(ta.last_name,'')) AS to_admin_name,
              CONCAT(ca.first_name, ' ', IFNULL(ca.last_name,'')) AS changed_by_name
       FROM contact_assignment_logs al
       LEFT JOIN admins fa ON fa.id = al.from_admin_id
       LEFT JOIN admins ta ON ta.id = al.to_admin_id
       LEFT JOIN admins ca ON ca.id = al.changed_by_admin_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return { success: true, data: logs };
  })
);

// ── V2: Mark all contact messages as read (bell clear button) ─────────────────
exports.markAllContactMessagesRead = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED('Access denied.');
    }

    const isSuperAdmin = adminInfo.roles.includes('SUPER_ADMIN');

    // SUPER_ADMIN marks all unread as read; others only their assigned messages
    if (isSuperAdmin) {
      await connection.query(
        `UPDATE contact_messages SET is_read = 1, updated_at = NOW()
         WHERE is_read = 0 AND deleted_at IS NULL AND status = 1`
      );
    } else {
      await connection.query(
        `UPDATE contact_messages SET is_read = 1, updated_at = NOW()
         WHERE is_read = 0 AND deleted_at IS NULL AND status = 1
         AND assigned_to_admin_id = ?`,
        [adminInfo.id]
      );
    }

    return { success: true, message: 'All contact messages marked as read.' };
  })
);
