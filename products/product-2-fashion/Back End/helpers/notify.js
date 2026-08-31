/**
 * helpers/notify.js  — V2-034 / V2-036 Centralised Admin Notification Dispatcher
 *
 * Public functions:
 *   sendAdminOrderNotification(connection, orderId, eventType)
 *     → Unicast to assigned admin (or broadcast to pool if unassigned).
 *       Gated by: order__notification_admin perm config + per-admin row.
 *       eventType: 'new_order' | 'order_assigned' | string
 *
 *   sendPersonalNotification(connection, adminId, subject, bodyText, extraData)
 *     → Unicast to ONE admin. Gated by: personal_notification_admin perm config.
 *       Used for: password change, pool add/remove, role changes.
 *
 *   sendAdminContactNotification(connection, messageId, eventType)   [V2-036]
 *     → Unicast to the admin assigned to a contact_message.
 *       Gated by: contact__notification_admin perm config + per-admin row.
 *       eventType: 'contact_assigned'
 *
 *   sendAdminReportNotification(connection, reportId, eventType)     [V2-036]
 *     → Unicast to the admin assigned to a report.
 *       Gated by: report__notification_admin perm config + per-admin row.
 *       eventType: 'report_assigned'
 *
 *   sendUserFirebasePush(conn, userId, title, body, data)            [V2-036 EXPORT]
 *     → Send Firebase push to a logged-in customer's registered devices.
 *       Used when an admin replies to a report.
 *
 * All functions are NON-BLOCKING — they fire an async IIFE internally and
 * never throw.  The caller does NOT need to await them.
 */

'use strict';

const nodemailer  = require('nodemailer');
const database    = require('../utils/connection');
const { sendSMS } = require('./sms');
const { resolveFrom } = require('./mailFrom');
const { getConfig }           = require('../config/ApplicationSettingsDB');
const { getPermissionConfig } = require('../config/PermissionSettingsDB');

// V2-040: Notification history logging helper (lazy-imported to avoid circular dep)
let _logNotification;
function getLogger() {
  if (!_logNotification) {
    _logNotification = require('../controllers/notification_history').logNotification;
  }
  return _logNotification;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Parse a permission_config value string to boolean. */
function parseBool(v) {
  return v === 'true' || v === true || v === 1 || v === '1';
}

/** Build a simple nodemailer transporter from DB email config rows. */
async function buildTransporter(conn) {
  const rows = await getConfig(conn, false, 'email');
  const cfg  = {};
  (rows || []).forEach(r => { if (r.is_active) cfg[r.key_name] = r.value; });

  // DB stores keys as MAIL_HOST / MAIL_PORT / MAIL_USER / MAIL_PASS
  const host = cfg.MAIL_HOST || cfg.EMAIL_HOST;
  const user = cfg.MAIL_USER || cfg.EMAIL_USER;
  const pass = cfg.MAIL_PASS || cfg.EMAIL_PASS;
  const port = Number(cfg.MAIL_PORT || cfg.EMAIL_PORT || 587);
  const secure = String(cfg.MAIL_SECURE || cfg.EMAIL_SECURE || (port === 465 ? 'true' : 'false')) === 'true';

  if (!host || !user || !pass) {
    console.warn('[Notify] buildTransporter: missing MAIL_HOST/MAIL_USER/MAIL_PASS in email config. Email will not send.');
    return null;
  }

  // Preserve EMAIL_* aliases and the existing per-product default display name.
  const from = resolveFrom({
    MAIL_FROM: cfg.MAIL_FROM || cfg.EMAIL_FROM,
    MAIL_FROM_NAME: cfg.MAIL_FROM_NAME || cfg.EMAIL_FROM_NAME,
    MAIL_USER: user,
  }, 'Vellora');

  return {
    transporter: nodemailer.createTransport({
      host, port, secure,
      requireTLS: !secure && port === 587,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    }),
    from,
  };
}


/**
 * Send push notification(s) to an admin via Firebase Admin SDK.
 * Silently skips if no active credential or no registered tokens.
 * Automatically deactivates invalid/expired tokens.
 */
async function sendFirebasePush(conn, adminId, title, body, data = {}) {
  try {
    const cred = await conn.queryOne(
      `SELECT credential_json FROM firebase_push_credentials WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
    );
    if (!cred?.credential_json) return;

    let serviceAccount;
    try {
      serviceAccount = typeof cred.credential_json === 'string'
        ? JSON.parse(cred.credential_json)
        : cred.credential_json;
    } catch { return; }

    const firebaseAdmin = require('firebase-admin');
    const appName = 'admin_notif_v2';
    let fbApp;
    try { fbApp = firebaseAdmin.app(appName); }
    catch { fbApp = firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) }, appName); }

    // Fetch active FCM tokens for this admin
    let tokens = [];
    try {
      const rows = await conn.query(
        `SELECT id, fcm_token FROM admin_push_tokens WHERE admin_id = ? AND is_active = 1`,
        [adminId]
      );
      tokens = rows || [];
    } catch { return; } // table may not exist yet

    if (!tokens.length) {
      console.log(`[Notify] sendFirebasePush: NO active tokens for admin #${adminId} — skipping`);
      return;
    }

    console.log(`[Notify] sendFirebasePush: ${tokens.length} token(s) for admin #${adminId}, sending...`);
    const fcmTokens = tokens.map(t => t.fcm_token);
    const stringData = {};
    Object.entries(data).forEach(([k, v]) => { stringData[k] = String(v); });
    // Include title/body in data so the SW can read them
    stringData.title = title;
    stringData.body  = body;

    // DATA-ONLY message: no top-level `notification` key.
    // This prevents Firebase from auto-displaying a notification (which
    // would duplicate the one the SW shows via onBackgroundMessage).
    // Both admin and shop SWs read data.title / data.body as fallback.
    const response = await fbApp.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      data: stringData,
    });

    console.log(`[Notify] sendFirebasePush result: success=${response.successCount}, fail=${response.failureCount}`);
    // Deactivate stale tokens
    const staleIds = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        console.log(`[Notify]   token#${tokens[idx].id} FAILED: ${code || resp.error?.message}`);
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleIds.push(tokens[idx].id);
        }
      } else {
        console.log(`[Notify]   token#${tokens[idx].id} OK ✅`);
      }
    });
    if (staleIds.length) {
      console.log(`[Notify]   Deactivating ${staleIds.length} stale token(s):`, staleIds);
      await conn.query(
        `UPDATE admin_push_tokens SET is_active = 0 WHERE id IN (${staleIds.map(() => '?').join(',')})`,
        staleIds
      );
    }
  } catch (err) {
    console.error('[Notify] Firebase push error for admin', adminId, err.message);
  }
}

/** Load global flag map for a given perm section. */
async function loadGlobalFlags(conn, section) {
  const rows = await getPermissionConfig(conn, true, section);
  const map  = {};
  // Only use rows that are active (is_active = 1 or NULL means active by default)
  (rows || []).forEach(r => {
    if (r.is_active === 0 || r.is_active === '0' || r.is_active === false) return;
    map[r.key_name] = parseBool(r.value);
  });
  const flags = {
    email: map['email']                       ?? true,
    sms:   map['sms']                         ?? true,
    push:  map['firebase_push_notification']  ?? true,
  };
  console.log(`[Notify] Global flags for "${section}":`, flags);
  return flags;
}


// ─── Public: order broadcast ───────────────────────────�
function sendAdminOrderNotification(connection, orderId, eventType = 'new_order') {
  (async () => {
    let conn;
    try {
      conn = await database.getConnection();

      // 1. Global flags
      const global = await loadGlobalFlags(conn, 'order__notification_admin');
      if (!global.email && !global.sms && !global.push) {
        console.log(`[Notify] Admin order notif SKIPPED (all channels off) for order #${orderId}`);
        return;
      }

      // 2. Fetch order  — include assigned_to_admin_id
      let order = await conn.queryOne(
        `SELECT id, order_status, customer_name, grand_total, placed_at, assigned_to_admin_id
           FROM orders WHERE id = ?`,
        [orderId]
      );
      if (!order) {
        console.warn(`[Notify] Admin order notif: order #${orderId} not found`);
        return;
      }

      // 3. For new_order the auto-assign runs concurrently — wait once and retry
      if (eventType === 'new_order' && !order.assigned_to_admin_id) {
        await new Promise((r) => setTimeout(r, 900));
        order = await conn.queryOne(
          `SELECT id, order_status, customer_name, grand_total, placed_at, assigned_to_admin_id
             FROM orders WHERE id = ?`,
          [orderId]
        );
      }

      // ── Skip new_order broadcast when order is auto-assigned ──────────────
      // autoAssignOrder() already fires sendAssignmentNotification() to the
      // assigned admin.  Broadcasting a second "New Order" email on top of that
      // would double-notify the same person.  Only broadcast when the order is
      // still unassigned (needs a pool agent to pick it up manually).
      if (eventType === 'new_order' && order.assigned_to_admin_id) {
        console.log(`[Notify] Order #${orderId} is auto-assigned → skipping new_order broadcast (assignment notification handles it)`);
        return;
      }

      const subject  = eventType === 'new_order'
        ? `🛒 New Order #${orderId} — Vellora`
        : eventType === 'order_assigned'
        ? `📋 Order #${orderId} Assigned to You — Vellora`
        : `📦 Order #${orderId} Status Updated to "${order.order_status}"`;
      const bodyText = eventType === 'new_order'
        ? `A new order (#${orderId}) has been placed by ${order.customer_name || 'a customer'} for BDT ${order.grand_total}. Please review and process it.`
        : eventType === 'order_assigned'
        ? `Order #${orderId} has been assigned to you. Please log in to the admin panel and process it at your earliest convenience.`
        : `Order #${orderId} status has been changed to "${order.order_status}".`;


      // 4. Determine WHO to notify
      //    → If assigned: only that admin
      //    → If still unassigned: all active pool agents (so no notification is lost)
      let targetAdminIds = [];
      if (order.assigned_to_admin_id) {
        targetAdminIds = [order.assigned_to_admin_id];
        console.log(`[Notify] Order #${orderId} → assigned to admin #${order.assigned_to_admin_id}`);
      } else {
        // Fallback: notify all active pool agents
        const agents = await conn.query(
          `SELECT admin_id FROM order_distribution_agents WHERE status = 1`
        ).catch(() => []);
        targetAdminIds = agents.map(a => a.admin_id);
        console.log(`[Notify] Order #${orderId} unassigned → broadcasting to ${targetAdminIds.length} pool agent(s)`);
      }

      if (!targetAdminIds.length) {
        console.warn(`[Notify] No target admins for order #${orderId} — skipping`);
        return;
      }

      // 5. Fetch admin details + per-admin perms for target admins only
      const placeholders = targetAdminIds.map(() => '?').join(',');
      const admins = await conn.query(`
        SELECT
          a.id, a.email, a.phone,
          CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
          IFNULL(anp.order_notification_email, 1)            AS want_email,
          IFNULL(anp.order_notification_sms, 1)              AS want_sms,
          IFNULL(anp.order_notification_firebase_push, 1)    AS want_push
        FROM admins a
        LEFT JOIN admin_notification_permissions anp ON anp.admin_id = a.id
        WHERE a.id IN (${placeholders}) AND a.is_active = 1 AND a.deleted_at IS NULL
      `, targetAdminIds);

      console.log(`[Notify] Admin order notif for #${orderId}: ${admins.length} target admin(s), channels: email=${global.email} sms=${global.sms} push=${global.push}`);
      if (!admins.length) return;

      // 6. Build mailer once (shared across all recipients)
      const mailerInfo = global.email ? await buildTransporter(conn) : null;
      if (global.email && !mailerInfo) {
        console.warn('[Notify] Email transporter could not be built — check email config in Application Settings.');
      }

      for (const admin of admins) {
        console.log(`[Notify]  → Admin #${admin.id} (${admin.email}): want_email=${admin.want_email} want_sms=${admin.want_sms} want_push=${admin.want_push}`);

        // ── Firebase Push (fire FIRST — instant delivery) ─────────────────
        if (global.push && admin.want_push) {
          console.log(`[Notify] 🔔 Sending push to admin #${admin.id}...`);
          await sendFirebasePush(conn, admin.id, subject, bodyText, {
            order_id:   String(orderId),
            event_type: eventType,
            type:       'order_notification',
          });
          await getLogger()(conn, { channel: 'push', category: 'order_admin', recipientType: 'admin', recipientAdminId: admin.id, title: subject, message: bodyText, status: 'sent', relatedOrderId: orderId });
        } else if (global.push && !admin.want_push) {
          console.log(`[Notify] ⏭️  Push skipped for admin #${admin.id} (want_push=0 in DB)`);
        }

        // ── Email ──────────────────────────────────────────────────────────
        if (global.email && admin.want_email && admin.email && mailerInfo) {
          let emailStatus = 'sent'; let emailErr = null;
          try {
            const html = `
              <div style="font-family:sans-serif;max-width:540px;padding:24px;">
                <h2 style="color:#111;">${subject}</h2>
                <p>Hi <strong>${admin.admin_name}</strong>,</p>
                <p>${bodyText}</p>
                <p style="margin-top:16px;">
                  <a href="#" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
                    View Order #${orderId}
                  </a>
                </p>
                <hr style="margin-top:24px;"/>
                <p style="font-size:11px;color:#999;">Vellora Admin System</p>
              </div>`;
            await mailerInfo.transporter.sendMail({
              from: mailerInfo.from, to: admin.email, subject, html,
            });
            console.log(`[Notify] ✅ Admin email sent to #${admin.id} (${admin.email})`);
          } catch (e) {
            emailStatus = 'failed'; emailErr = e.message;
            console.error(`[Notify] ❌ Admin email failed for #${admin.id}:`, e.message);
          } finally {
            await getLogger()(conn, { channel: 'email', category: 'order_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientEmail: admin.email, title: subject, message: bodyText, status: emailStatus, errorMessage: emailErr, relatedOrderId: orderId });
          }
        }

        // ── SMS ────────────────────────────────────────────────────────────
        if (global.sms && admin.want_sms && admin.phone) {
          let smsStatus = 'sent'; let smsErr = null;
          try {
            const smsText = `[Vellora] ${bodyText}`;
            await sendSMS(conn, admin.phone, smsText);
            console.log(`[Notify] ✅ Admin SMS sent to #${admin.id} (${admin.phone})`);
          } catch (e) {
            smsStatus = 'failed'; smsErr = e.message;
            console.error(`[Notify] ❌ Admin SMS failed for #${admin.id} (${admin.phone}):`, e.message);
          } finally {
            await getLogger()(conn, { channel: 'sms', category: 'order_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientPhone: admin.phone, title: subject, message: bodyText, status: smsStatus, errorMessage: smsErr, relatedOrderId: orderId });
          }
        } else if (global.sms && admin.want_sms && !admin.phone) {
          console.warn(`[Notify] ⏭️  SMS skipped for admin #${admin.id} — no phone number on record`);
        }
      }
    } catch (err) {
      console.error('[Notify] sendAdminOrderNotification error:', err.message);
    } finally {
      if (conn) await conn.release();
    }
  })();
}


// ─── Public: direct assignment notification (bypasses DB re-read) ─────────────
/**
 * Send all notification channels (email, SMS, Firebase push) directly to a
 * specific admin when an order is manually or automatically assigned to them.
 *
 * KEY DIFFERENCE from sendAdminOrderNotification:
 *   This function does NOT re-read assigned_to_admin_id from the DB.
 *   It uses the adminId passed as a parameter, making it safe to call while
 *   the caller's transaction is still open (avoids MySQL REPEATABLE READ
 *   race condition where a fresh connection would see stale pre-commit data).
 *
 * Non-blocking — never throws.
 *
 * @param {number} adminId  - The admin who was assigned the order
 * @param {number} orderId  - The order that was assigned
 */
function sendOrderAssignmentNotification(adminId, orderId) {
  (async () => {
    let conn;
    try {
      // Wait for the caller's transaction to commit — this function opens its
      // own connection, but the order INSERT is still uncommitted when we're
      // called from inside autoAssignOrder (which runs within the handler's tx).
      await new Promise((r) => setTimeout(r, 1200));
      conn = await database.getConnection();

      // 1. Global flags
      const global = await loadGlobalFlags(conn, 'order__notification_admin');
      if (!global.email && !global.sms && !global.push) {
        console.log(`[Notify] Assignment notif SKIPPED (all channels off) order #${orderId}`);
        return;
      }

      // 2. Fetch order info for message body (read-only, no assigned_to check)
      const order = await conn.queryOne(
        `SELECT id, order_status, customer_name, grand_total FROM orders WHERE id = ?`,
        [orderId]
      );
      if (!order) {
        console.warn(`[Notify] Assignment notif: order #${orderId} not found`);
        return;
      }

      const subject  = `📋 Order #${orderId} Assigned to You — Vellora`;
      const bodyText = `Order #${orderId} has been assigned to you. Please log in to the admin panel and process it at your earliest convenience.`;

      // 3. Fetch target admin + per-admin notification perms
      const admin = await conn.queryOne(`
        SELECT
          a.id, a.email, a.phone,
          CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
          IFNULL(anp.order_notification_email, 1)            AS want_email,
          IFNULL(anp.order_notification_sms, 1)              AS want_sms,
          IFNULL(anp.order_notification_firebase_push, 1)    AS want_push
        FROM admins a
        LEFT JOIN admin_notification_permissions anp ON anp.admin_id = a.id
        WHERE a.id = ? AND a.is_active = 1 AND a.deleted_at IS NULL
      `, [adminId]);

      if (!admin) {
        console.warn(`[Notify] Assignment notif: admin #${adminId} not found or inactive`);
        return;
      }

      console.log(`[Notify] Assignment notif order #${orderId} → admin #${admin.id} (${admin.email}) | push=${global.push && !!admin.want_push}`);

      // ── Email ────────────────────────────────────────────────────────────────
      if (global.email && admin.want_email && admin.email) {
        let emailStatus = 'sent'; let emailErr = null;
        try {
          const mailerInfo = await buildTransporter(conn);
          if (mailerInfo) {
            const html = `
              <div style="font-family:sans-serif;max-width:540px;padding:24px;">
                <h2 style="color:#111;">${subject}</h2>
                <p>Hi <strong>${admin.admin_name}</strong>,</p>
                <p>${bodyText}</p>
                <p style="margin-top:16px;">
                  <a href="#" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
                    View Order #${orderId}
                  </a>
                </p>
                <hr style="margin-top:24px;"/>
                <p style="font-size:11px;color:#999;">Vellora Admin System</p>
              </div>`;
            await mailerInfo.transporter.sendMail({ from: mailerInfo.from, to: admin.email, subject, html });
            console.log(`[Notify] ✅ Assignment email → #${admin.id} (${admin.email})`);
          } else { emailStatus = 'failed'; emailErr = 'Transporter unavailable'; }
        } catch (e) {
          emailStatus = 'failed'; emailErr = e.message;
          console.error(`[Notify] ❌ Assignment email failed #${admin.id}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'email', category: 'order_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientEmail: admin.email, title: subject, message: bodyText, status: emailStatus, errorMessage: emailErr, relatedOrderId: orderId });
        }
      }

      // ── SMS ──────────────────────────────────────────────────────────────────
      if (global.sms && admin.want_sms && admin.phone) {
        let smsStatus = 'sent'; let smsErr = null;
        try {
          await sendSMS(conn, admin.phone, `[Vellora] ${bodyText}`);
          console.log(`[Notify] ✅ Assignment SMS → #${admin.id} (${admin.phone})`);
        } catch (e) {
          smsStatus = 'failed'; smsErr = e.message;
          console.error(`[Notify] ❌ Assignment SMS failed #${admin.id}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'sms', category: 'order_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientPhone: admin.phone, title: subject, message: bodyText, status: smsStatus, errorMessage: smsErr, relatedOrderId: orderId });
        }
      } else if (global.sms && admin.want_sms && !admin.phone) {
        console.warn(`[Notify] ⏭️ Assignment SMS skipped for admin #${admin.id} — no phone`);
      }

      // ── Firebase Push ────────────────────────────────────────────────────────
      if (global.push && admin.want_push) {
        console.log(`[Notify] 🔔 Sending assignment push to admin #${admin.id}...`);
        await sendFirebasePush(conn, admin.id, subject, bodyText, {
          order_id:   String(orderId),
          event_type: 'order_assigned',
          type:       'order_notification',
        });
        console.log(`[Notify] ✅ Assignment push sent to admin #${admin.id}`);
        await getLogger()(conn, { channel: 'push', category: 'order_admin', recipientType: 'admin', recipientAdminId: admin.id, title: subject, message: bodyText, status: 'sent', relatedOrderId: orderId });
      } else if (global.push && !admin.want_push) {
        console.log(`[Notify] ⏭️ Assignment push skipped admin #${admin.id} (want_push=0)`);
      }

    } catch (err) {
      console.error('[Notify] sendOrderAssignmentNotification error:', err.message);
    } finally {
      if (conn) await conn.release();
    }
  })();
}


// ─── Public: personal unicast ─────────────────────────────────────────────────


/**
 * Notify ONE admin via personal channels.
 * Gated by: global personal_notification_admin flags AND per-admin flags.
 * Non-blocking.
 *
 * @param {object}  connection  - Caller's DB connection (used only to look up
 *                                admin; a fresh pool conn is opened internally)
 * @param {number}  adminId     - Target admin
 * @param {string}  subject     - Email subject / push title
 * @param {string}  bodyText    - Plain-text body (also used for SMS)
 * @param {object}  [extraData] - Additional key-value data for push payload
 * @param {string}  [htmlBody]  - Optional rich HTML email body; falls back to bodyText
 */
function sendPersonalNotification(connection, adminId, subject, bodyText, extraData = {}, htmlBody = null) {
  (async () => {
    let conn;
    try {
      conn = await database.getConnection();

      // 1. Global channel flags
      const global = await loadGlobalFlags(conn, 'personal_notification_admin');
      if (!global.email && !global.sms && !global.push) return;

      // 2. Admin details + per-admin perm row
      const admin = await conn.queryOne(`
        SELECT
          a.id, a.email, a.phone,
          CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
          IFNULL(anp.personal_notification_email, 1)           AS want_email,
          IFNULL(anp.personal_notification_sms, 1)             AS want_sms,
          IFNULL(anp.personal_notification_firebase_push, 1)   AS want_push
        FROM admins a
        LEFT JOIN admin_notification_permissions anp ON anp.admin_id = a.id
        WHERE a.id = ? AND a.is_active = 1 AND a.deleted_at IS NULL
      `, [adminId]);

      if (!admin) return;

      // ── Email ──────────────────────────────────────────────────────────
      if (global.email && admin.want_email && admin.email) {
        let emailSt = 'sent'; let emailEr = null;
        try {
          const mailerInfo = await buildTransporter(conn);
          if (mailerInfo) {
            const html = htmlBody || `
              <div style="font-family:sans-serif;max-width:520px;padding:24px;">
                <h2 style="color:#111;">${subject}</h2>
                <p>Hi <strong>${admin.admin_name}</strong>,</p>
                <p>${bodyText}</p>
                <hr/><p style="font-size:11px;color:#999;">Vellora Admin System</p>
              </div>`;
            await mailerInfo.transporter.sendMail({
              from: mailerInfo.from, to: admin.email, subject, html,
            });
            console.log(`[Notify] Personal email sent to admin #${adminId}`);
          } else { emailSt = 'failed'; emailEr = 'Transporter unavailable'; }
        } catch (e) {
          emailSt = 'failed'; emailEr = e.message;
          console.error(`[Notify] Personal email failed for admin #${adminId}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'email', category: 'personal', recipientType: 'admin', recipientAdminId: admin.id, recipientEmail: admin.email, title: subject, message: bodyText, status: emailSt, errorMessage: emailEr });
        }
      }

      // ── SMS ────────────────────────────────────────────────────────────
      if (global.sms && admin.want_sms && admin.phone) {
        let smsSt = 'sent'; let smsEr = null;
        try {
          await sendSMS(conn, admin.phone, `[Vellora] ${bodyText}`);
          console.log(`[Notify] Personal SMS sent to admin #${adminId}`);
        } catch (e) {
          smsSt = 'failed'; smsEr = e.message;
          console.error(`[Notify] Personal SMS failed for admin #${adminId}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'sms', category: 'personal', recipientType: 'admin', recipientAdminId: admin.id, recipientPhone: admin.phone, title: subject, message: bodyText, status: smsSt, errorMessage: smsEr });
        }
      }

      // ── Firebase Push ──────────────────────────────────────────────────
      if (global.push && admin.want_push) {
        await sendFirebasePush(conn, adminId, subject, bodyText, {
          type: 'personal_notification',
          ...extraData,
        });
        await getLogger()(conn, { channel: 'push', category: 'personal', recipientType: 'admin', recipientAdminId: admin.id, title: subject, message: bodyText, status: 'sent' });
        console.log(`[Notify] Personal push sent to admin #${adminId}`);
      }
    } catch (err) {
      console.error('[Notify] sendPersonalNotification error:', err.message);
    } finally {
      if (conn) await conn.release();
    }
  })();
}

// ─── Internal: user Firebase push ────────────────────────────────────────────

/**
 * Send Firebase push notification(s) to a customer's registered browser sessions.
 * Uses user_push_tokens table. Automatically deactivates stale tokens.
 */
async function sendUserFirebasePush(conn, userId, title, body, data = {}) {
  try {
    const cred = await conn.queryOne(
      `SELECT credential_json FROM firebase_push_credentials WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
    );
    if (!cred?.credential_json) return;

    let serviceAccount;
    try {
      serviceAccount = typeof cred.credential_json === 'string'
        ? JSON.parse(cred.credential_json)
        : cred.credential_json;
    } catch { return; }

    const firebaseAdmin = require('firebase-admin');
    const appName = 'admin_notif_v2'; // reuse the same named app
    let fbApp;
    try { fbApp = firebaseAdmin.app(appName); }
    catch { fbApp = firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) }, appName); }

    // Fetch active FCM tokens for this user
    let tokens = [];
    try {
      const rows = await conn.query(
        `SELECT id, fcm_token FROM user_push_tokens WHERE user_id = ? AND is_active = 1`,
        [userId]
      );
      tokens = rows || [];
    } catch { return; } // table may not exist yet

    if (!tokens.length) return;

    const fcmTokens = tokens.map(t => t.fcm_token);
    const stringData = {};
    Object.entries(data).forEach(([k, v]) => { stringData[k] = String(v); });
    // Include title/body in data so the SW can read them
    stringData.title = title;
    stringData.body  = body;

    // DATA-ONLY message — same rationale as sendFirebasePush above.
    const response = await fbApp.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      data: stringData,
    });

    // Deactivate stale tokens
    const staleIds = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleIds.push(tokens[idx].id);
        }
      }
    });
    if (staleIds.length) {
      await conn.query(
        `UPDATE user_push_tokens SET is_active = 0 WHERE id IN (${staleIds.map(() => '?').join(',')})`,
        staleIds
      );
    }
  } catch (err) {
    console.error('[Notify] Firebase push error for user', userId, err.message);
  }
}

// ─── Public: customer order notification ──────────────────────────────────────

/**
 * Notify a CUSTOMER about their order status change.
 *
 * Channels used: Email, SMS, Firebase Push — all gated by global
 * order_status_notification_user permission flags.
 *
 * Statuses that trigger notification to customer:
 *   approved, shipped, out_for_delivery, delivered,
 *   cancelled, returned, on_hold
 *
 * Non-blocking — never throws.
 *
 * @param {object} connection   - Caller's active DB connection (for context only)
 * @param {number} orderId      - The order ID
 * @param {string} newStatus    - The new order_status value
 */
function sendCustomerOrderNotification(connection, orderId, newStatus) {
  // Only notify for customer-facing statuses
  const NOTIFIABLE_STATUSES = new Set([
    'approved', 'shipped', 'out_for_delivery', 'delivered',
    'cancelled', 'returned', 'on_hold',
  ]);
  if (!NOTIFIABLE_STATUSES.has(newStatus)) return;

  (async () => {
    let conn;
    try {
      conn = await database.getConnection();

      // 1. Global channel flags for customer notifications
      const global = await loadGlobalFlags(conn, 'order_status_notification_user');
      if (!global.email && !global.sms && !global.push) return;

      // 2. Fetch order + customer contact
      const order = await conn.queryOne(
        `SELECT id, order_status, customer_name, customer_email, customer_phone,
                grand_total, placed_at, customer_id
         FROM orders WHERE id = ?`,
        [orderId]
      );
      if (!order) return;

      // 3. Build message content per status
      const STATUS_MESSAGES = {
        approved:         { title: '✅ Order Approved!',              body: `Your order #${orderId} has been approved and is now being prepared for you.` },
        shipped:          { title: '📦 Order Shipped!',               body: `Great news! Your order #${orderId} has been shipped and is on its way.` },
        out_for_delivery: { title: '🚚 Out for Delivery!',            body: `Your order #${orderId} is out for delivery today. Keep an eye out!` },
        delivered:        { title: '🎉 Order Delivered!',             body: `Your order #${orderId} has been delivered. Thank you for shopping with us!` },
        cancelled:        { title: '❌ Order Cancelled',              body: `Your order #${orderId} has been cancelled. Contact us if you have any questions.` },
        returned:         { title: '↩️ Return Processed',            body: `Your return for order #${orderId} has been processed successfully.` },
        on_hold:          { title: '⏸️ Order on Hold',               body: `Your order #${orderId} is temporarily on hold. We\'ll update you shortly.` },
      };
      const { title, body: bodyText } = STATUS_MESSAGES[newStatus] || {
        title: `Order #${orderId} Update`,
        body: `Your order status has been updated to: ${newStatus}.`,
      };

      // ── Email ─────────────────────────────────────────────────────────────
      if (global.email && order.customer_email) {
        let emailSt = 'sent'; let emailEr = null;
        try {
          const { sendOrdermail } = require('../mail-templates/ordercreate');
          const [items, address, orderCoupons] = await Promise.all([
            conn.query(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]),
            conn.queryOne(`SELECT * FROM order_addresses WHERE order_id = ?`, [orderId]),
            conn.query(`SELECT SUM(discount_amount) as total FROM order_coupons WHERE order_id = ?`, [orderId]),
          ]);
          const { SHOP_URL } = require('../config/ApplicationSettings');
          const formatBDT = (v) => `BDT ${Number(v || 0).toLocaleString('en-BD')}`;
          const couponDiscount = Number(orderCoupons[0]?.total || 0);
          const orderContext = {
            id:             orderId,
            date:           new Date(order.placed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            status:         newStatus,
            payment_method: order.payment_type === 'cod' ? 'Cash on Delivery' : 'Online Payment',
            shipping_address: address ? `${address.full_address}, ${address.city}` : 'N/A',
            track_url:      `${SHOP_URL}/account/my-order/${orderId}`,
            subtotal:       formatBDT(order.subtotal),
            shipping_fee:   formatBDT(order.delivery_charge),
            item_discount:  Number(order.sku_discount_total)   > 0 ? formatBDT(order.sku_discount_total)   : null,
            bulk_discount:  Number(order.bulk_discount_total)  > 0 ? formatBDT(order.bulk_discount_total)  : null,
            combo_discount: Number(order.combo_discount_total) > 0 ? formatBDT(order.combo_discount_total) : null,
            coupon_discount: couponDiscount > 0 ? formatBDT(couponDiscount) : null,
            total:          formatBDT(order.grand_total),
            items:          (items || []).map(item => ({
              name:    item.product_name,
              variant: `${item.color_name || ''} ${item.variant_name || ''}`.trim() || 'Default',
              qty:     item.quantity,
              price:   formatBDT(item.final_unit_price),
              subtotal: formatBDT(item.line_total),
            })),
          };
          await sendOrdermail(conn, {
            name:  order.customer_name || 'Customer',
            email: order.customer_email,
            order: orderContext,
          });
          console.log(`[Notify] Customer email sent for order #${orderId} (${newStatus})`);
        } catch (e) {
          emailSt = 'failed'; emailEr = e.message;
          console.error(`[Notify] Customer email failed for order #${orderId}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'email', category: 'order_status', recipientType: order.customer_id ? 'user' : 'guest', recipientUserId: order.customer_id || null, recipientEmail: order.customer_email, title, message: bodyText, status: emailSt, errorMessage: emailEr, relatedOrderId: orderId });
        }
      }

      // ── SMS ───────────────────────────────────────────────────────────────
      if (global.sms && order.customer_phone) {
        let smsSt = 'sent'; let smsEr = null;
        try {
          const { BRAND_NAME } = require('../config/ApplicationSettings');
          const smsText = `[${BRAND_NAME}] ${bodyText}`;
          await sendSMS(conn, order.customer_phone, smsText);
          console.log(`[Notify] Customer SMS sent for order #${orderId} (${newStatus})`);
        } catch (e) {
          smsSt = 'failed'; smsEr = e.message;
          console.error(`[Notify] Customer SMS failed for order #${orderId}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'sms', category: 'order_status', recipientType: order.customer_id ? 'user' : 'guest', recipientUserId: order.customer_id || null, recipientPhone: order.customer_phone, title, message: bodyText, status: smsSt, errorMessage: smsEr, relatedOrderId: orderId });
        }
      }

      // ── Firebase Push ─────────────────────────────────────────────────────
      if (global.push && order.customer_id) {
        await sendUserFirebasePush(conn, order.customer_id, title, bodyText, {
          order_id:   String(orderId),
          new_status: newStatus,
          type:       'order_status_update',
        });
        await getLogger()(conn, { channel: 'push', category: 'order_status', recipientType: 'user', recipientUserId: order.customer_id, title, message: bodyText, status: 'sent', relatedOrderId: orderId });
        console.log(`[Notify] Customer push sent for order #${orderId} (${newStatus})`);
      }

    } catch (err) {
      console.error('[Notify] sendCustomerOrderNotification error:', err.message);
    } finally {
      if (conn) await conn.release();
    }
  })();
}


// ─── V2-036: Contact Us notification ──────────────────────────────────────────

/**
 * Notify the admin assigned to a contact_message.
 * Gated by: global contact__notification_admin flags AND per-admin
 * contact_notification_email / sms / firebase_push columns.
 * Non-blocking.
 *
 * @param {object|null} connection - Caller's connection (not used directly;
 *                                   a fresh pool conn is opened internally)
 * @param {number}      messageId  - contact_messages.id
 * @param {string}      [eventType] - e.g. 'contact_assigned'
 */
function sendAdminContactNotification(connection, messageId, eventType = 'contact_assigned') {
  (async () => {
    let conn;
    try {
      // Wait for the caller's transaction to commit — this function opens its
      // own connection which can't see uncommitted assigned_to_admin_id updates.
      await new Promise((r) => setTimeout(r, 1200));
      conn = await database.getConnection();

      // 1. Global flags
      const global = await loadGlobalFlags(conn, 'contact__notification_admin');
      if (!global.email && !global.sms && !global.push) {
        console.log(`[Notify] Contact notif SKIPPED (all channels off) for message #${messageId}`);
        return;
      }

      // 2. Fetch the contact message + assigned admin
      const msg = await conn.queryOne(
        `SELECT id, subject, assigned_to_admin_id FROM contact_messages WHERE id = ?`,
        [messageId]
      );
      if (!msg || !msg.assigned_to_admin_id) {
        console.warn(`[Notify] Contact notif: message #${messageId} not found or not assigned`);
        return;
      }

      // 3. Fetch target admin + per-admin permissions
      const admin = await conn.queryOne(`
        SELECT
          a.id, a.email, a.phone,
          CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
          IFNULL(anp.contact_notification_email, 1)         AS want_email,
          IFNULL(anp.contact_notification_sms, 0)           AS want_sms,
          IFNULL(anp.contact_notification_firebase_push, 1) AS want_push
        FROM admins a
        LEFT JOIN admin_notification_permissions anp ON anp.admin_id = a.id
        WHERE a.id = ? AND a.is_active = 1 AND a.deleted_at IS NULL
      `, [msg.assigned_to_admin_id]);

      if (!admin) {
        console.warn(`[Notify] Contact notif: assigned admin #${msg.assigned_to_admin_id} not found`);
        return;
      }

      const subject  = `💬 New Contact Message Assigned #${messageId} — Vellora`;
      const bodyText = `A contact message (Subject: "${msg.subject || 'N/A'}") has been assigned to you. Please log in to the admin panel to review and respond.`;

      // ── Push (fire first — instantaneous) ─────────────────────────────────
      if (global.push && admin.want_push) {
        await sendFirebasePush(conn, admin.id, subject, bodyText, {
          message_id: String(messageId),
          event_type: eventType,
          type:       'contact_notification',
        });
        await getLogger()(conn, { channel: 'push', category: 'contact_admin', recipientType: 'admin', recipientAdminId: admin.id, title: subject, message: bodyText, status: 'sent', relatedContactMessageId: messageId });
        console.log(`[Notify] 🔔 Contact push sent to admin #${admin.id}`);
      }

      // ── Email ──────────────────────────────────────────────────────────────
      if (global.email && admin.want_email && admin.email) {
        let emailSt = 'sent'; let emailEr = null;
        try {
          const mailerInfo = await buildTransporter(conn);
          if (mailerInfo) {
            const html = `
              <div style="font-family:sans-serif;max-width:540px;padding:24px;">
                <h2 style="color:#111;">${subject}</h2>
                <p>Hi <strong>${admin.admin_name}</strong>,</p>
                <p>${bodyText}</p>
                <hr style="margin-top:24px;"/>
                <p style="font-size:11px;color:#999;">Vellora Admin System</p>
              </div>`;
            await mailerInfo.transporter.sendMail({
              from: mailerInfo.from, to: admin.email, subject, html,
            });
            console.log(`[Notify] ✅ Contact email sent to admin #${admin.id}`);
          } else { emailSt = 'failed'; emailEr = 'Transporter unavailable'; }
        } catch (e) {
          emailSt = 'failed'; emailEr = e.message;
          console.error(`[Notify] ❌ Contact email failed for admin #${admin.id}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'email', category: 'contact_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientEmail: admin.email, title: subject, message: bodyText, status: emailSt, errorMessage: emailEr, relatedContactMessageId: messageId });
        }
      }

      // ── SMS ────────────────────────────────────────────────────────────────
      if (global.sms && admin.want_sms && admin.phone) {
        let smsSt = 'sent'; let smsEr = null;
        try {
          await sendSMS(conn, admin.phone, `[Vellora] ${bodyText}`);
          console.log(`[Notify] ✅ Contact SMS sent to admin #${admin.id}`);
        } catch (e) {
          smsSt = 'failed'; smsEr = e.message;
          console.error(`[Notify] ❌ Contact SMS failed for admin #${admin.id}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'sms', category: 'contact_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientPhone: admin.phone, title: subject, message: bodyText, status: smsSt, errorMessage: smsEr, relatedContactMessageId: messageId });
        }
      }

    } catch (err) {
      console.error('[Notify] sendAdminContactNotification error:', err.message);
    } finally {
      if (conn) await conn.release();
    }
  })();
}


// ─── V2-036: Report notification ───────────────────────────────────────────────

/**
 * Notify the admin assigned to a report.
 * Gated by: global report__notification_admin flags AND per-admin
 * report_notification_email / sms / firebase_push columns.
 * Non-blocking.
 *
 * @param {object|null} connection - Caller's connection (not used; fresh conn opened internally)
 * @param {number}      reportId   - reports.id
 * @param {string}      [eventType] - e.g. 'report_assigned'
 */
function sendAdminReportNotification(connection, reportId, eventType = 'report_assigned') {
  (async () => {
    let conn;
    try {
      // Wait for the caller's transaction to commit — this function opens its
      // own connection which can't see uncommitted assigned_to_admin_id updates.
      await new Promise((r) => setTimeout(r, 1200));
      conn = await database.getConnection();

      // 1. Global flags
      const global = await loadGlobalFlags(conn, 'report__notification_admin');
      if (!global.email && !global.sms && !global.push) {
        console.log(`[Notify] Report notif SKIPPED (all channels off) for report #${reportId}`);
        return;
      }

      // 2. Fetch the report + assigned admin
      const report = await conn.queryOne(
        `SELECT id, subject, category, assigned_to_admin_id FROM reports WHERE id = ? AND deleted_at IS NULL`,
        [reportId]
      );
      if (!report || !report.assigned_to_admin_id) {
        console.warn(`[Notify] Report notif: report #${reportId} not found or not assigned`);
        return;
      }

      // 3. Fetch target admin + per-admin permissions
      const admin = await conn.queryOne(`
        SELECT
          a.id, a.email, a.phone,
          CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
          IFNULL(anp.report_notification_email, 1)         AS want_email,
          IFNULL(anp.report_notification_sms, 0)           AS want_sms,
          IFNULL(anp.report_notification_firebase_push, 1) AS want_push
        FROM admins a
        LEFT JOIN admin_notification_permissions anp ON anp.admin_id = a.id
        WHERE a.id = ? AND a.is_active = 1 AND a.deleted_at IS NULL
      `, [report.assigned_to_admin_id]);

      if (!admin) {
        console.warn(`[Notify] Report notif: assigned admin #${report.assigned_to_admin_id} not found`);
        return;
      }

      const subject  = `🚩 Report #${reportId} Assigned to You — Vellora`;
      const bodyText = `A customer report (Subject: "${report.subject || 'N/A'}", Category: ${report.category || 'general'}) has been assigned to you. Please log in to the admin panel to review and respond.`;

      // ── Push (fire FIRST — instant delivery, don't block on email/SMS) ────
      if (global.push && admin.want_push) {
        try {
          await sendFirebasePush(conn, admin.id, subject, bodyText, {
            report_id:  String(reportId),
            event_type: eventType,
            type:       'report_notification',
          });
          await getLogger()(conn, { channel: 'push', category: 'report_admin', recipientType: 'admin', recipientAdminId: admin.id, title: subject, message: bodyText, status: 'sent' });
          console.log(`[Notify] 🔔 Report push sent to admin #${admin.id}`);
        } catch (pushErr) {
          console.error(`[Notify] ❌ Report push failed for admin #${admin.id}:`, pushErr.message);
        }
      }

      // ── Email ──────────────────────────────────────────────────────────────
      if (global.email && admin.want_email && admin.email) {
        let emailSt = 'sent'; let emailEr = null;
        try {
          const mailerInfo = await buildTransporter(conn);
          if (mailerInfo) {
            const html = `
              <div style="font-family:sans-serif;max-width:540px;padding:24px;">
                <h2 style="color:#111;">${subject}</h2>
                <p>Hi <strong>${admin.admin_name}</strong>,</p>
                <p>${bodyText}</p>
                <p style="margin-top:16px;">
                  <a href="#" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
                    View Report #${reportId}
                  </a>
                </p>
                <hr style="margin-top:24px;"/>
                <p style="font-size:11px;color:#999;">Vellora Admin System</p>
              </div>`;
            await mailerInfo.transporter.sendMail({
              from: mailerInfo.from, to: admin.email, subject, html,
            });
            console.log(`[Notify] ✅ Report email sent to admin #${admin.id}`);
          } else { emailSt = 'failed'; emailEr = 'Transporter unavailable'; }
        } catch (e) {
          emailSt = 'failed'; emailEr = e.message;
          console.error(`[Notify] ❌ Report email failed for admin #${admin.id}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'email', category: 'report_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientEmail: admin.email, title: subject, message: bodyText, status: emailSt, errorMessage: emailEr });
        }
      }

      // ── SMS ────────────────────────────────────────────────────────────────
      if (global.sms && admin.want_sms && admin.phone) {
        let smsSt = 'sent'; let smsEr = null;
        try {
          await sendSMS(conn, admin.phone, `[Vellora] ${bodyText}`);
          console.log(`[Notify] ✅ Report SMS sent to admin #${admin.id}`);
        } catch (e) {
          smsSt = 'failed'; smsEr = e.message;
          console.error(`[Notify] ❌ Report SMS failed for admin #${admin.id}:`, e.message);
        } finally {
          await getLogger()(conn, { channel: 'sms', category: 'report_admin', recipientType: 'admin', recipientAdminId: admin.id, recipientPhone: admin.phone, title: subject, message: bodyText, status: smsSt, errorMessage: smsEr });
        }
      }

    } catch (err) {
      console.error('[Notify] sendAdminReportNotification error:', err.message);
    } finally {
      if (conn) await conn.release();
    }
  })();
}


module.exports = {
  sendAdminOrderNotification,
  sendOrderAssignmentNotification,  // V2: Direct assignment notif (transaction-safe)
  sendPersonalNotification,
  sendCustomerOrderNotification,
  sendAdminContactNotification,   // V2-036: Contact Us assignment
  sendAdminReportNotification,    // V2-036: Report assignment
  sendUserFirebasePush,           // V2-036: Customer push on report reply
};

