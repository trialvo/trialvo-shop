const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

/**
 * V2-040: Notification History — Full Repair
 *
 * API Endpoints:
 *   GET /admin/notifications/batches         — Announcement batch list (functional)
 *   GET /admin/notifications/logs            — Unified filterable log (NEW)
 *   GET /admin/notifications/email-logs      — Email-only (legacy compat)
 *   GET /admin/notifications/sms-logs        — SMS-only (legacy compat)
 *   GET /admin/notifications/push-logs       — Push-only (legacy compat)
 *
 * Helper (exported):
 *   logNotification(connection, opts)        — Insert one row into notification_histories
 *   createNotificationBatch(connection, opts) — Create a batch and return batchId
 *   finalizeNotificationBatch(connection, batchId, sent, failed) — Update batch totals
 */

// ─────────────────────────────────────────────────────────────────────────────
// READ: Notification Batches
// ─────────────────────────────────────────────────────────────────────────────

exports.getNotificationBatches = api(
  {
    query: {
      source_type: { type: 'string', required: false },
      status:      { type: 'string', required: false },
      limit:       { type: 'int',    required: false, default: 50 },
      offset:      { type: 'int',    required: false, default: 0  },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const { source_type, status, limit, offset } = req.typed.query;
    const conditions = [];
    const values = [];

    if (source_type) { conditions.push('nb.source_type = ?'); values.push(source_type); }
    if (status)      { conditions.push('nb.status = ?');      values.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [batches, countResult] = await Promise.all([
      connection.query(
        `SELECT
           nb.id, nb.source_type, nb.source_id, nb.channel, nb.audience_type,
           nb.title, nb.message,
           nb.status, nb.total_target, nb.total_sent, nb.total_failed,
           nb.started_at, nb.finished_at, nb.created_at,
           -- Enrich with announcement headline if linked
           a.headline AS announcement_headline,
           CONCAT(adm.first_name, ' ', IFNULL(adm.last_name,'')) AS initiated_by_admin_name
         FROM notification_batches nb
         LEFT JOIN announcements a   ON nb.source_type IN ('announcement','manual_announcement') AND nb.source_id = CAST(a.id AS CHAR)
         LEFT JOIN admins adm ON adm.id = nb.initiated_by_admin
         ${where}
         ORDER BY nb.created_at DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      connection.queryOne(
        `SELECT COUNT(*) AS total FROM notification_batches nb ${where}`,
        values
      ),
    ]);

    return { success: true, total: countResult?.total || 0, data: batches };
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// READ: Unified Notification Logs (NEW — main endpoint for the new UI)
// ─────────────────────────────────────────────────────────────────────────────

exports.getNotificationLogs = api(
  {
    query: {
      channel:        { type: 'string', required: false }, // email|sms|push
      category:       { type: 'string', required: false }, // order_admin|order_status|contact_admin|...
      recipient_type: { type: 'string', required: false }, // user|admin|subscriber|guest|manual|other
      status:         { type: 'string', required: false }, // queued|sent|failed|delivered|read|cancelled
      batch_id:       { type: 'int',    required: false },
      search:         { type: 'string', required: false }, // search in recipient_email, recipient_phone, title
      date_from:      { type: 'string', required: false }, // YYYY-MM-DD
      date_to:        { type: 'string', required: false }, // YYYY-MM-DD
      limit:          { type: 'int',    required: false, default: 50 },
      offset:         { type: 'int',    required: false, default: 0  },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const {
      channel, category, recipient_type, status, batch_id, search,
      date_from, date_to, limit, offset,
    } = req.typed.query;

    const VALID_CHANNELS  = ['email', 'sms', 'push'];
    const VALID_CATS      = ['order_status','order_admin','forgot_password','welcome','announcement',
                             'contact_reply','contact_admin','report_admin','report_reply',
                             'personal','otp','system','other'];
    const VALID_REC_TYPES = ['user','admin','subscriber','guest','manual','other'];
    const VALID_STATUSES  = ['queued','sent','failed','delivered','read','cancelled'];

    const conditions = [];
    const values     = [];

    if (channel && VALID_CHANNELS.includes(channel)) {
      conditions.push('nh.channel = ?'); values.push(channel);
    }
    if (category) {
      // Support comma-separated multi-category (e.g. "order_admin,order_status")
      const cats = category.split(',').map(s => s.trim()).filter(s => VALID_CATS.includes(s));
      if (cats.length === 1) { conditions.push('nh.category = ?'); values.push(cats[0]); }
      else if (cats.length > 1) { conditions.push(`nh.category IN (${cats.map(() => '?').join(',')})`); values.push(...cats); }
    }
    if (recipient_type && VALID_REC_TYPES.includes(recipient_type)) {
      conditions.push('nh.recipient_type = ?'); values.push(recipient_type);
    }
    if (status && VALID_STATUSES.includes(status)) {
      conditions.push('nh.status = ?'); values.push(status);
    }
    if (batch_id) {
      conditions.push('nh.batch_id = ?'); values.push(batch_id);
    }
    if (search) {
      conditions.push(`(nh.recipient_email LIKE ? OR nh.recipient_phone LIKE ? OR nh.title LIKE ? OR nh.message LIKE ?)`);
      const like = `%${search}%`;
      values.push(like, like, like, like);
    }
    if (date_from) {
      conditions.push('DATE(nh.created_at) >= ?'); values.push(date_from);
    }
    if (date_to) {
      conditions.push('DATE(nh.created_at) <= ?'); values.push(date_to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [logs, countResult] = await Promise.all([
      connection.query(
        `SELECT
           nh.id, nh.batch_id, nh.channel, nh.category, nh.recipient_type,
           nh.recipient_user_id, nh.recipient_admin_id,
           nh.recipient_email, nh.recipient_phone, nh.device_token,
           nh.title, nh.message, nh.provider, nh.status, nh.error_message,
           nh.related_order_id, nh.related_announcement_id, nh.related_contact_message_id,
           nh.triggered_by_admin_id, nh.sent_at, nh.created_at,
           -- Enrich with admin name
           CONCAT(adm.first_name,' ',IFNULL(adm.last_name,'')) AS recipient_admin_name,
           -- Enrich with user name
           CONCAT(u.first_name,' ',IFNULL(u.last_name,'')) AS recipient_user_name
         FROM notification_histories nh
         LEFT JOIN admins adm ON adm.id = nh.recipient_admin_id
         LEFT JOIN users u    ON u.id   = nh.recipient_user_id
         ${where}
         ORDER BY nh.created_at DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      connection.queryOne(
        `SELECT COUNT(*) AS total FROM notification_histories nh ${where}`,
        values
      ),
    ]);

    return { success: true, total: countResult?.total || 0, data: logs };
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// READ: Channel-specific logs (kept for legacy compat, delegate to unified)
// ─────────────────────────────────────────────────────────────────────────────

exports.getEmailLogs = api(
  {
    query: {
      batch_id: { type: 'int',    required: false },
      status:   { type: 'string', required: false },
      category: { type: 'string', required: false },
      limit:    { type: 'int',    required: false, default: 50 },
      offset:   { type: 'int',    required: false, default: 0  },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const { batch_id, status, category, limit, offset } = req.typed.query;
    const conditions = ["nh.channel = 'email'"];
    const values = [];

    if (batch_id)  { conditions.push('nh.batch_id = ?');  values.push(batch_id); }
    if (status)    { conditions.push('nh.status = ?');    values.push(status); }
    if (category)  { conditions.push('nh.category = ?'); values.push(category); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [logs, countResult] = await Promise.all([
      connection.query(
        `SELECT nh.id, nh.category, nh.recipient_type, nh.recipient_email AS \`to\`,
                nh.title AS subject, nh.message, nh.status, nh.error_message,
                nh.related_order_id, nh.created_at
         FROM notification_histories nh ${where}
         ORDER BY nh.created_at DESC LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      connection.queryOne(`SELECT COUNT(*) AS total FROM notification_histories nh ${where}`, values),
    ]);

    return { success: true, total: countResult?.total || 0, data: logs };
  })
);

exports.getSmsLogs = api(
  {
    query: {
      batch_id: { type: 'int',    required: false },
      status:   { type: 'string', required: false },
      category: { type: 'string', required: false },
      limit:    { type: 'int',    required: false, default: 50 },
      offset:   { type: 'int',    required: false, default: 0  },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const { batch_id, status, category, limit, offset } = req.typed.query;
    const conditions = ["nh.channel = 'sms'"];
    const values = [];

    if (batch_id)  { conditions.push('nh.batch_id = ?');  values.push(batch_id); }
    if (status)    { conditions.push('nh.status = ?');    values.push(status); }
    if (category)  { conditions.push('nh.category = ?'); values.push(category); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [logs, countResult] = await Promise.all([
      connection.query(
        `SELECT nh.id, nh.category, nh.recipient_type, nh.recipient_phone AS \`to\`,
                nh.message, nh.provider, nh.status, nh.error_message,
                nh.related_order_id, nh.created_at
         FROM notification_histories nh ${where}
         ORDER BY nh.created_at DESC LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      connection.queryOne(`SELECT COUNT(*) AS total FROM notification_histories nh ${where}`, values),
    ]);

    return { success: true, total: countResult?.total || 0, data: logs };
  })
);

exports.getPushLogs = api(
  {
    query: {
      batch_id: { type: 'int',    required: false },
      status:   { type: 'string', required: false },
      category: { type: 'string', required: false },
      limit:    { type: 'int',    required: false, default: 50 },
      offset:   { type: 'int',    required: false, default: 0  },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const { batch_id, status, category, limit, offset } = req.typed.query;
    const conditions = ["nh.channel = 'push'"];
    const values = [];

    if (batch_id)  { conditions.push('nh.batch_id = ?');  values.push(batch_id); }
    if (status)    { conditions.push('nh.status = ?');    values.push(status); }
    if (category)  { conditions.push('nh.category = ?'); values.push(category); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [logs, countResult] = await Promise.all([
      connection.query(
        `SELECT nh.id, nh.category, nh.recipient_type,
                nh.recipient_user_id, nh.recipient_admin_id,
                nh.title, nh.message AS body, nh.status, nh.error_message,
                nh.related_order_id, nh.created_at
         FROM notification_histories nh ${where}
         ORDER BY nh.created_at DESC LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      connection.queryOne(`SELECT COUNT(*) AS total FROM notification_histories nh ${where}`, values),
    ]);

    return { success: true, total: countResult?.total || 0, data: logs };
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: logNotification — Insert one row into notification_histories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log a single notification dispatch into notification_histories.
 *
 * @param {object} connection  - Active DB connection
 * @param {object} opts
 * @param {number|null}  opts.batchId                - FK to notification_batches (null if standalone)
 * @param {string}       opts.channel                - 'email' | 'sms' | 'push'
 * @param {string}       [opts.category]             - enum value (see DB schema, default 'other')
 * @param {string}       [opts.recipientType]        - 'user'|'admin'|'subscriber'|'guest'|'manual'|'other'
 * @param {number|null}  [opts.recipientUserId]      - FK users.id
 * @param {number|null}  [opts.recipientAdminId]     - FK admins.id
 * @param {number|null}  [opts.recipientSubscriberId]
 * @param {string|null}  [opts.recipientGuestOrderId]
 * @param {string|null}  [opts.recipientEmail]
 * @param {string|null}  [opts.recipientPhone]
 * @param {string|null}  [opts.deviceToken]
 * @param {string|null}  [opts.title]                - Email subject / push title
 * @param {string|null}  [opts.message]              - Body text / SMS message
 * @param {string|null}  [opts.templateKey]
 * @param {string|null}  [opts.provider]             - e.g. 'bulksms','alphasms','firebase'
 * @param {string|null}  [opts.providerMessageId]
 * @param {string}       [opts.status]               - 'sent'|'failed'|'queued' etc (default 'sent')
 * @param {string|null}  [opts.errorMessage]
 * @param {number|null}  [opts.relatedOrderId]       - FK orders.id
 * @param {number|null}  [opts.relatedAnnouncementId]
 * @param {number|null}  [opts.relatedContactMessageId]
 * @param {number|null}  [opts.triggeredByAdminId]   - FK admins.id
 * @param {Date|null}    [opts.sentAt]
 * @returns {Promise<number>} insertId
 */
exports.logNotification = async (connection, {
  batchId                 = null,
  channel,
  category                = 'other',
  recipientType           = 'other',
  recipientUserId         = null,
  recipientAdminId        = null,
  recipientSubscriberId   = null,
  recipientGuestOrderId   = null,
  recipientEmail          = null,
  recipientPhone          = null,
  deviceToken             = null,
  title                   = null,
  message                 = null,
  templateKey             = null,
  provider                = null,
  providerMessageId       = null,
  status                  = 'sent',
  errorMessage            = null,
  relatedOrderId          = null,
  relatedAnnouncementId   = null,
  relatedContactMessageId = null,
  triggeredByAdminId      = null,
  sentAt                  = null,
} = {}) => {
  try {
    const result = await connection.query(
      `INSERT INTO notification_histories
         (batch_id, channel, category, recipient_type,
          recipient_user_id, recipient_admin_id, recipient_subscriber_id, recipient_guest_order_id,
          recipient_email, recipient_phone, device_token,
          title, message, template_key,
          provider, provider_message_id,
          status, error_message,
          related_order_id, related_announcement_id, related_contact_message_id,
          triggered_by_admin_id, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batchId, channel, category, recipientType,
        recipientUserId, recipientAdminId, recipientSubscriberId, recipientGuestOrderId,
        recipientEmail, recipientPhone, deviceToken,
        title
          ? (title.length > 255 ? title.substring(0, 252) + '...' : title)
          : null,
        message
          ? (message.length > 65535 ? message.substring(0, 65532) + '...' : message)
          : null,
        templateKey,
        provider ? (provider.length > 60 ? provider.substring(0, 60) : provider) : null,
        providerMessageId,
        status,
        errorMessage
          ? (errorMessage.length > 500 ? errorMessage.substring(0, 497) + '...' : errorMessage)
          : null,
        relatedOrderId, relatedAnnouncementId, relatedContactMessageId,
        triggeredByAdminId,
        sentAt || (status === 'sent' ? new Date() : null),
      ]
    );
    return result.insertId;
  } catch (err) {
    // Never throw — logging should never break the caller
    console.error('[logNotification] DB error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Batch management (for announcements)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a notification_batches row and return its id.
 * @param {object} connection
 * @param {object} opts
 */
exports.createNotificationBatch = async (connection, {
  sourceType        = 'announcement',
  sourceId          = null,
  channel           = 'email',
  audienceType      = 'mixed',
  title             = null,
  message           = null,
  initiatedByAdmin  = null,
  totalTarget       = 0,
  status            = 'processing',
  startedAt         = new Date(),
} = {}) => {
  try {
    const result = await connection.query(
      `INSERT INTO notification_batches
         (source_type, source_id, channel, audience_type, title, message,
          initiated_by_admin, total_target, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sourceType, sourceId != null ? String(sourceId) : null, channel, audienceType,
       title, message, initiatedByAdmin, totalTarget, status, startedAt]
    );
    return result.insertId;
  } catch (err) {
    console.error('[createNotificationBatch] DB error:', err.message);
    return null;
  }
};

/**
 * Finalize a notification_batches row with sent/failed counts.
 */
exports.finalizeNotificationBatch = async (connection, batchId, totalSent, totalFailed) => {
  if (!batchId) return;
  try {
    await connection.query(
      `UPDATE notification_batches
       SET total_sent = ?, total_failed = ?,
           status = IF(total_failed = 0, 'completed', IF(? = 0, 'failed', 'completed')),
           finished_at = NOW()
       WHERE id = ?`,
      [totalSent, totalFailed, totalSent, batchId]
    );
  } catch (err) {
    console.error('[finalizeNotificationBatch] DB error:', err.message);
  }
};
