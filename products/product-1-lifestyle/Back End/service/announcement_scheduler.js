/**
 * Announcement Auto-Send Scheduler
 *
 * Lightweight in-process timer that checks for due scheduled announcements
 * and dispatches them automatically. Designed to work on cPanel without
 * external dependencies (no cron, no message broker).
 *
 * Cost profile:
 *  - When auto_send is OFF (default): zero DB queries — only reads an
 *    in-memory boolean every 60s.
 *  - When auto_send is ON: one indexed SELECT every 60s + dispatch
 *    queries only when announcements are actually due.
 */

const database = require('../utils/connection');
const { dispatchAnnouncementById } = require('../controllers/announcement');

// ── Local config cache ─────────────────────────────────────────────────────
// We maintain our own lightweight cache instead of touching the shared
// PermissionSettingsDB cache. This keeps us completely isolated from the
// existing permission system.
let _autoSendEnabled = false;
let _lastConfigCheck = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // re-read DB every 5 minutes

// ── Concurrency guard ──────────────────────────────────────────────────────
let _running = false;

/**
 * Check if auto-send is enabled. Uses a local cache that refreshes from DB
 * every 5 minutes. Between refreshes, returns the cached boolean instantly
 * (zero DB cost).
 */
async function isAutoSendEnabled(connection) {
    const now = Date.now();
    if (now - _lastConfigCheck < CONFIG_CACHE_TTL) {
        return _autoSendEnabled;
    }

    try {
        const row = await connection.queryOne(
            `SELECT value FROM permission_config
             WHERE section = 'announcement'
               AND scope = 'default'
               AND key_name = 'auto_send_scheduled_announcement'
             LIMIT 1`
        );
        _autoSendEnabled = row?.value === 'true';
    } catch (err) {
        // On error, keep the previous cached value — don't crash the timer
        console.error('[AnnouncementScheduler] Config check failed:', err.message);
    }

    _lastConfigCheck = now;
    return _autoSendEnabled;
}

/**
 * Main tick: find due scheduled announcements and dispatch each one.
 */
async function processDueAnnouncements() {
    if (_running) return; // previous tick still in progress
    _running = true;

    let connection;
    try {
        connection = await database.getConnection();

        // 1. Check permission (uses local cache — usually zero DB cost)
        const enabled = await isAutoSendEnabled(connection);
        if (!enabled) return;

        // 2. Find due announcements (hits idx_announcement_delivery index)
        const dueAnnouncements = await connection.query(
            `SELECT id, headline
             FROM announcements
             WHERE status = 'scheduled'
               AND scheduled_at <= NOW()
               AND deleted_at IS NULL
             ORDER BY scheduled_at ASC
             LIMIT 5`
        );

        if (!dueAnnouncements || dueAnnouncements.length === 0) return;

        console.log(`[AnnouncementScheduler] Found ${dueAnnouncements.length} due announcement(s).`);

        // 3. Dispatch each one sequentially
        for (const ann of dueAnnouncements) {
            let dispatchConn;
            try {
                // Use a fresh connection per dispatch so each is independent
                dispatchConn = await database.getConnection();

                const result = await dispatchAnnouncementById(dispatchConn, ann.id);

                // Audit log (admin_id = NULL for auto-dispatched)
                await dispatchConn.query(
                    `INSERT INTO admin_audit_logs
                     (admin_id, action, resource, resource_id, meta)
                     VALUES (NULL, 'AUTO_SEND_ANNOUNCEMENT', 'announcements', ?, ?)`,
                    [
                        ann.id,
                        JSON.stringify({
                            channel: result.channel,
                            email_recipients: result.emailRecipientCount,
                            sms_recipients: result.smsRecipientCount,
                            triggered_by: 'scheduler'
                        })
                    ]
                );

                console.log(
                    `[AnnouncementScheduler] Auto-sent announcement #${ann.id} "${ann.headline}" ` +
                    `(email: ${result.emailRecipientCount}, sms: ${result.smsRecipientCount})`
                );
            } catch (dispatchErr) {
                // Log but don't stop processing remaining announcements
                console.error(
                    `[AnnouncementScheduler] Failed to auto-send announcement #${ann.id}:`,
                    dispatchErr.message || dispatchErr
                );
            } finally {
                if (dispatchConn) await dispatchConn.release();
            }
        }
    } catch (err) {
        console.error('[AnnouncementScheduler] Tick error:', err.message || err);
    } finally {
        if (connection) await connection.release();
        _running = false;
    }
}

/**
 * Start the announcement scheduler. Call once at server boot.
 * Runs every 60 seconds.
 */
function startAnnouncementScheduler() {
    const INTERVAL_MS = 60 * 1000; // 60 seconds

    // Run the first check after a short startup delay (10s) to let the
    // server fully initialize and permission defaults seed
    setTimeout(() => {
        processDueAnnouncements();
        setInterval(processDueAnnouncements, INTERVAL_MS);
    }, 10 * 1000);

    console.log('[AnnouncementScheduler] Started (interval: 60s, first check in 10s).');
}

module.exports = { startAnnouncementScheduler };
