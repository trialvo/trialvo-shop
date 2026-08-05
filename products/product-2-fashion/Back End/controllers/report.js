/**
 * controllers/report.js — V2-036
 * Report System: public submission + tracking, admin management, distribution pool.
 */

'use strict';

const crypto = require('crypto');
const { api, auth } = require('../helpers/common');
const { saveReportImage, reportUploadApi } = require('../helpers/img');
const errors = require('../helpers/errors');
const database = require('../utils/connection');
const { sendAdminReportNotification, sendUserFirebasePush } = require('../helpers/notify');
const { sendSMS } = require('../helpers/sms');
const nodemailer = require('nodemailer');
const { getConfig } = require('../config/ApplicationSettingsDB');
const { logNotification } = require('./notification_history'); // V2-040

// ─── Internals ──────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = `'resolved','closed'`;

/** Generate a 32-char hex tracking token. */
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

/** Build email transporter from DB config. */
async function buildTransporter(conn) {
  const rows = await getConfig(conn, false, 'email');
  const cfg = {};
  (rows || []).forEach(r => { if (r.is_active) cfg[r.key_name] = r.value; });
  const host = cfg.MAIL_HOST || cfg.EMAIL_HOST;
  const user = cfg.MAIL_USER || cfg.EMAIL_USER;
  const pass = cfg.MAIL_PASS || cfg.EMAIL_PASS;
  const port = Number(cfg.MAIL_PORT || cfg.EMAIL_PORT || 587);
  const secure = String(cfg.MAIL_SECURE || cfg.EMAIL_SECURE || (port === 465 ? 'true' : 'false')) === 'true';
  if (!host || !user || !pass) return null;
  const fromName = cfg.MAIL_FROM_NAME || cfg.EMAIL_FROM_NAME || 'Graduate Fashion';
  const fromAddr = cfg.MAIL_FROM || cfg.EMAIL_FROM || user;
  return {
    transporter: nodemailer.createTransport({ host, port, secure, auth: { user, pass } }),
    from: `"${fromName}" <${fromAddr}>`,
  };
}

/**
 * Auto-assign a report to the least-loaded active pool agent.
 * Returns the assigned admin_id or null if no agent available.
 */
async function autoAssignReport(connection, reportId) {
  const settings = await connection.queryOne(
    `SELECT auto_assign_enabled, assign_on_report_create FROM report_distribution_settings WHERE id = 1`
  );
  if (!settings || !settings.auto_assign_enabled || !settings.assign_on_report_create) {
    return null;
  }

  // Least-loaded-first: sort by active (non-terminal) report count ASC, serial ASC
  const agents = await connection.query(`
    SELECT
      rda.admin_id,
      rda.max_active_reports,
      rda.serial,
      COUNT(CASE WHEN r.status NOT IN (${TERMINAL_STATUSES}) THEN 1 END) AS active_count
    FROM report_distribution_agents rda
    JOIN admins a ON a.id = rda.admin_id AND a.is_active = 1 AND a.deleted_at IS NULL
    LEFT JOIN reports r ON r.assigned_to_admin_id = rda.admin_id AND r.deleted_at IS NULL
    WHERE rda.status = 1 AND rda.auto_assign_enabled = 1
    GROUP BY rda.admin_id, rda.max_active_reports, rda.serial, rda.id
    ORDER BY active_count ASC, rda.serial ASC, rda.id ASC
  `);

  if (!agents.length) return null;

  let chosen = null;
  for (const agent of agents) {
    if (agent.max_active_reports && agent.max_active_reports > 0) {
      if (agent.active_count >= agent.max_active_reports) continue;
    }
    chosen = agent;
    break;
  }

  if (!chosen) return null;

  await connection.query(
    `UPDATE reports
     SET assigned_to_admin_id = ?, assigned_by_admin_id = NULL,
         assignment_method = 'auto', assigned_at = NOW()
     WHERE id = ?`,
    [chosen.admin_id, reportId]
  );

  await connection.query(
    `UPDATE report_distribution_settings SET last_assigned_admin_id = ? WHERE id = 1`,
    [chosen.admin_id]
  );

  return chosen.admin_id;
}

// ─── PUBLIC: Submit Report ───────────────────────────────────────────────────

exports.createReport = reportUploadApi(
  {
    body: {
      reporter_name:  { type: 'string', required: false },
      reporter_email: { type: 'string', required: false },
      reporter_phone: { type: 'string', required: false },
      category:       { type: 'string', required: false },
      subject:        { type: 'string', required: true  },
      description:    { type: 'string', required: true  },
      order_id:       { type: 'int',    required: false },
      user_id:        { type: 'int',    required: false },
    }
  },
  async (req, connection) => {
    const {
      reporter_name, reporter_email, reporter_phone,
      category, subject, description, order_id, user_id
    } = req.typed.body;

    if (!subject || !subject.trim()) throw new errors.INVALID_FIELDS_PROVIDED('Subject is required.');
    if (!description || !description.trim()) throw new errors.INVALID_FIELDS_PROVIDED('Description is required.');
    if (!reporter_email && !reporter_phone) {
      throw new errors.INVALID_FIELDS_PROVIDED('At least one of email or phone is required.');
    }

    const validCategories = ['product_issue', 'order_issue', 'fraud', 'general', 'other'];
    const normalizedCategory = validCategories.includes(category) ? category : 'general';

    const token = generateToken();

    const result = await connection.query(
      `INSERT INTO reports
       (tracking_token, user_id, reporter_name, reporter_email, reporter_phone,
        category, subject, description, order_id, status, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'normal')`,
      [
        token,
        user_id || null,
        reporter_name || null,
        reporter_email || null,
        reporter_phone || null,
        normalizedCategory,
        subject.trim(),
        description.trim(),
        order_id || null
      ]
    );

    const reportId = result.insertId;

    // ── Process uploaded images (up to 4) ──────────────────────────────────────
    const uploadedFiles = (req.files && req.files.report_images) || [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      try {
        const imgPath = await saveReportImage(uploadedFiles[i].path, `reports/${reportId}`);
        await connection.query(
          `INSERT INTO report_images (report_id, reply_id, image_path, serial) VALUES (?, NULL, ?, ?)`,
          [reportId, imgPath, i + 1]
        );
      } catch (e) {
        console.error(`[Report] Image ${i + 1} save failed:`, e.message);
      }
    }

    // ── User audit log (if submitted by a logged-in user) ─────────────────────
    if (user_id) {
      connection.query(
        `INSERT INTO user_audit_logs (user_id, action, ip_address, new_values)
         VALUES (?, 'SUBMIT_REPORT', ?, ?)`,
        [
          user_id,
          req.ip || req.headers['x-forwarded-for'] || null,
          JSON.stringify({ report_id: reportId, subject: subject.trim(), category: normalizedCategory })
        ]
      ).catch(e => console.error('[Report] user_audit_log failed:', e.message));
    }

    // Auto-assign (non-blocking: fire and forget, then notify)
    const assignedAdminId = await autoAssignReport(connection, reportId);
    if (assignedAdminId) {
      sendAdminReportNotification(null, reportId, 'report_assigned');
    }

    return {
      success: true,
      message: 'Report submitted successfully.',
      report_id: reportId,
      tracking_token: token,
    };
  }
);

// ─── PUBLIC: Track Report ────────────────────────────────────────────────────

exports.trackReport = api(
  {
    query: { token: { type: 'string', required: true } }
  },
  async (req, connection) => {
    const { token } = req.typed.query;

    const report = await connection.queryOne(
      `SELECT id, category, subject, status, priority, is_replied,
              reporter_name, created_at, updated_at
       FROM reports
       WHERE tracking_token = ? AND deleted_at IS NULL`,
      [token]
    );

    if (!report) throw new errors.NOT_FOUND('Report not found. Please check your tracking token.');

    const replies = await connection.query(
      `SELECT id, reply_text, reply_via, created_at
       FROM report_replies
       WHERE report_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [report.id]
    );

    // Fetch images for report + all replies
    const allImages = await connection.query(
      `SELECT id, reply_id, image_path, serial
       FROM report_images
       WHERE report_id = ?
       ORDER BY serial ASC`,
      [report.id]
    );

    const reportImages = (allImages || []).filter(img => !img.reply_id).map(img => img.image_path);
    const replyImageMap = {};
    (allImages || []).filter(img => img.reply_id).forEach(img => {
      if (!replyImageMap[img.reply_id]) replyImageMap[img.reply_id] = [];
      replyImageMap[img.reply_id].push(img.image_path);
    });

    return {
      success: true,
      data: {
        id:           report.id,
        category:     report.category,
        subject:      report.subject,
        status:       report.status,
        priority:     report.priority,
        is_replied:   Boolean(report.is_replied),
        reporter_name: report.reporter_name,
        created_at:   report.created_at,
        updated_at:   report.updated_at,
        images:       reportImages,
        replies:      (replies || []).map(r => ({
          text:      r.reply_text,
          via:       r.reply_via,
          sent_at:   r.created_at,
          images:    replyImageMap[r.id] || [],
        })),
      }
    };
  }
);

// ─── ADMIN: List Reports ─────────────────────────────────────────────────────

exports.adminListReports = api(
  {
    query: {
      status:         { type: 'string', required: false },
      priority:       { type: 'string', required: false },
      assigned_to_me: { type: 'bool',   required: false },
      is_replied:     { type: 'bool',   required: false },
      search:         { type: 'string', required: false },
      limit:          { type: 'int',    required: false, default: 20 },
      offset:         { type: 'int',    required: false, default: 0  },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const { status, priority, assigned_to_me, is_replied, search, limit, offset } = req.typed.query;
    const isSuperAdmin = adminInfo.roles.includes('SUPER_ADMIN');

    const conditions = ['r.deleted_at IS NULL'];
    const params = [];

    // Non-super-admins only see their assigned reports by default
    if (!isSuperAdmin || assigned_to_me === true) {
      conditions.push('r.assigned_to_admin_id = ?');
      params.push(adminInfo.id);
    }

    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (priority) { conditions.push('r.priority = ?'); params.push(priority); }
    if (is_replied !== undefined) { conditions.push('r.is_replied = ?'); params.push(is_replied ? 1 : 0); }
    if (search) {
      conditions.push('(r.subject LIKE ? OR r.reporter_name LIKE ? OR r.reporter_email LIKE ? OR r.reporter_phone LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [reports, countResult] = await Promise.all([
      connection.query(
        `SELECT
           r.id, r.tracking_token, r.category, r.subject, r.status, r.priority,
           r.reporter_name, r.reporter_email, r.reporter_phone,
           r.is_read, r.is_replied, r.assigned_at, r.assignment_method, r.created_at,
           CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS assigned_to_admin_name,
           a.profile_img_path AS assigned_to_admin_img
         FROM reports r
         LEFT JOIN admins a ON a.id = r.assigned_to_admin_id
         ${where}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      connection.queryOne(
        `SELECT COUNT(*) AS total FROM reports r ${where}`,
        params
      )
    ]);

    return {
      success: true,
      data: reports,
      pagination: { total: countResult?.total || 0, limit, offset }
    };
  })
);

// ─── ADMIN: Report Badge Counts ──────────────────────────────────────────────

exports.adminReportCounts = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const isSuperAdmin = adminInfo.roles.includes('SUPER_ADMIN');
    const scopeCondition = isSuperAdmin
      ? ''
      : 'AND r.assigned_to_admin_id = ' + Number(adminInfo.id);

    const [
      cTotal, cOpen, cInProgress, cResolved, cClosed,
      cUnread, cUnresolved, cUnreplied,
    ] = await Promise.all([
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.status = 'open'        AND r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.status = 'in_progress' AND r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.status = 'resolved'    AND r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.status = 'closed'      AND r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.is_read = 0 AND r.status NOT IN (${TERMINAL_STATUSES}) AND r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.status IN ('open','in_progress') AND r.deleted_at IS NULL ${scopeCondition}`),
      connection.queryOne(`SELECT COUNT(*) AS c FROM reports r WHERE r.is_replied = 0 AND r.status NOT IN (${TERMINAL_STATUSES}) AND r.deleted_at IS NULL ${scopeCondition}`),
    ]);

    return {
      success: true,
      data: {
        total:       cTotal?.c       || 0,
        open:        cOpen?.c        || 0,
        in_progress: cInProgress?.c  || 0,
        resolved:    cResolved?.c    || 0,
        closed:      cClosed?.c      || 0,
        unread:      cUnread?.c      || 0,
        unresolved:  cUnresolved?.c  || 0,
        unreplied:   cUnreplied?.c   || 0,
      }
    };
  })
);

// ─── ADMIN: Get Single Report ────────────────────────────────────────────────

exports.adminGetReport = api(
  { params: { id: { type: 'int', required: true } } },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const reportId = req.typed.params.id;

    const report = await connection.queryOne(
      `SELECT
         r.*,
         CONCAT(aa.first_name,' ',IFNULL(aa.last_name,'')) AS assigned_to_admin_name,
         aa.email AS assigned_to_admin_email,
         aa.profile_img_path AS assigned_to_admin_img,
         CONCAT(ab.first_name,' ',IFNULL(ab.last_name,'')) AS assigned_by_admin_name
       FROM reports r
       LEFT JOIN admins aa ON aa.id = r.assigned_to_admin_id
       LEFT JOIN admins ab ON ab.id = r.assigned_by_admin_id
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [reportId]
    );

    if (!report) throw new errors.NOT_FOUND('Report not found.');

    // Non-super-admins can only view their own assigned reports
    if (!adminInfo.roles.includes('SUPER_ADMIN') && report.assigned_to_admin_id !== adminInfo.id) {
      throw new errors.UNAUTHORIZED();
    }

    // Mark as read
    if (!report.is_read) {
      await connection.query(`UPDATE reports SET is_read = 1 WHERE id = ?`, [reportId]);
      report.is_read = 1;
    }

    const replies = await connection.query(
      `SELECT
         rr.id, rr.reply_text, rr.reply_via, rr.created_at,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
         a.profile_img_path
       FROM report_replies rr
       LEFT JOIN admins a ON a.id = rr.admin_id
       WHERE rr.report_id = ? AND rr.deleted_at IS NULL
       ORDER BY rr.created_at ASC`,
      [reportId]
    );

    // Fetch all images (report-level + reply-level)
    const allImages = await connection.query(
      `SELECT id, reply_id, image_path, serial
       FROM report_images
       WHERE report_id = ?
       ORDER BY serial ASC`,
      [reportId]
    );

    const reportImages = (allImages || []).filter(img => !img.reply_id).map(img => img.image_path);
    const replyImageMap = {};
    (allImages || []).filter(img => img.reply_id).forEach(img => {
      if (!replyImageMap[img.reply_id]) replyImageMap[img.reply_id] = [];
      replyImageMap[img.reply_id].push(img.image_path);
    });

    // Attach images to each reply
    const repliesWithImages = (replies || []).map(r => ({
      ...r,
      images: replyImageMap[r.id] || [],
    }));

    return {
      success: true,
      data: { ...report, images: reportImages, replies: repliesWithImages }
    };
  })
);

// ─── ADMIN: Reply to Report ──────────────────────────────────────────────────

exports.adminReplyReport = reportUploadApi(
  {
    params: { id: { type: 'int', required: true } },
    body: {
      reply_text: { type: 'string', required: true },
      via: { type: 'string', required: false } // comma-separated: "email", "sms", "email,sms"
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const reportId = req.typed.params.id;
    const { reply_text, via } = req.typed.body;

    if (!reply_text || !reply_text.trim()) throw new errors.INVALID_FIELDS_PROVIDED('Reply text is required.');

    const report = await connection.queryOne(
      `SELECT id, subject, reporter_name, reporter_email, reporter_phone, user_id, assigned_to_admin_id
       FROM reports WHERE id = ? AND deleted_at IS NULL`,
      [reportId]
    );
    if (!report) throw new errors.NOT_FOUND('Report not found.');

    // Permission: non-super-admin can only reply to their assigned reports
    if (!adminInfo.roles.includes('SUPER_ADMIN') && report.assigned_to_admin_id !== adminInfo.id) {
      throw new errors.UNAUTHORIZED();
    }

    // Parse channels from 'via' field
    const channels = new Set((via || 'email').split(',').map(s => s.trim().toLowerCase()));
    const wantEmail = channels.has('email');
    const wantSms   = channels.has('sms');
    const replyVia  = [...channels].filter(c => ['email','sms'].includes(c)).join(',') || 'email';

    // Insert reply record
    const replyResult = await connection.query(
      `INSERT INTO report_replies (report_id, admin_id, reply_text, reply_via)
       VALUES (?, ?, ?, ?)`,
      [reportId, adminInfo.id, reply_text.trim(), replyVia]
    );
    const replyId = replyResult.insertId;

    // ── Process uploaded reply images (up to 4) ───────────────────────────────
    const uploadedFiles = (req.files && req.files.report_images) || [];
    const savedImagePaths = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      try {
        const imgPath = await saveReportImage(uploadedFiles[i].path, `reports/${reportId}`);
        await connection.query(
          `INSERT INTO report_images (report_id, reply_id, image_path, serial) VALUES (?, ?, ?, ?)`,
          [reportId, replyId, imgPath, i + 1]
        );
        savedImagePaths.push(imgPath);
      } catch (e) {
        console.error(`[Report] Reply image ${i + 1} save failed:`, e.message);
      }
    }

    // Mark report as replied
    await connection.query(
      `UPDATE reports SET is_replied = 1, status = IF(status = 'open', 'in_progress', status)
       WHERE id = ?`,
      [reportId]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'REPLY_REPORT', 'reports', ?, ?)`,
      [adminInfo.id, reportId, JSON.stringify({ via: replyVia, reply_preview: reply_text.trim().substring(0, 100), images: savedImagePaths.length })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    // ── Send reply via chosen channels ───────────────────────────────────────
    const mailerInfo = wantEmail ? await buildTransporter(connection) : null;

    if (wantEmail && report.reporter_email && mailerInfo) {
      let emailSt = 'sent'; let emailEr = null;
      try {
        const subject = `Re: Your Report #${reportId} — Graduate Fashion`;

        // Build inline image CIDs for email
        const attachments = [];
        const inlineHtml = [];
        const { STORAGE_URL } = require('../config/ApplicationSettings');
        for (let i = 0; i < savedImagePaths.length; i++) {
          const cid = `report_img_${i}_${Date.now()}`;
          const imgUrl = `${STORAGE_URL}${savedImagePaths[i]}`;
          attachments.push({ filename: `attachment_${i + 1}.webp`, path: imgUrl, cid });
          inlineHtml.push(`<img src="cid:${cid}" alt="Attachment ${i + 1}" style="max-width:400px;margin:8px 0;border:1px solid #eee;border-radius:4px;" />`);
        }

        const html = `
          <div style="font-family:sans-serif;max-width:540px;padding:24px;">
            <h2 style="color:#111;">Re: Your Report #${reportId}</h2>
            <p>Hi <strong>${report.reporter_name || 'Customer'}</strong>,</p>
            <p>We have a response to your report regarding <em>"${report.subject}"</em>:</p>
            <blockquote style="border-left:4px solid #6366f1;padding:12px 16px;margin:16px 0;background:#f9f9ff;">
              ${reply_text.replace(/\n/g, '<br>')}
            </blockquote>
            ${inlineHtml.length ? '<p style="font-size:12px;color:#666;">Attachments:</p>' + inlineHtml.join('') : ''}
            <p>You can check your report status anytime using your tracking token.</p>
            <hr style="margin-top:24px;"/>
            <p style="font-size:11px;color:#999;">Graduate Fashion · Automated reply from support team</p>
          </div>`;
        await mailerInfo.transporter.sendMail({
          from: mailerInfo.from, to: report.reporter_email, subject, html, attachments,
        });
        console.log(`[Report] ✅ Reply email sent to ${report.reporter_email} for report #${reportId}`);
      } catch (e) {
        emailSt = 'failed'; emailEr = e.message;
        console.error(`[Report] ❌ Reply email failed for report #${reportId}:`, e.message);
      } finally {
        await logNotification(connection, { channel: 'email', category: 'report_reply', recipientType: report.user_id ? 'user' : 'guest', recipientUserId: report.user_id || null, recipientEmail: report.reporter_email, title: `Re: Your Report #${reportId}`, message: reply_text, status: emailSt, errorMessage: emailEr, triggeredByAdminId: adminInfo.id });
      }
    }

    if (wantSms && report.reporter_phone) {
      let smsSt = 'sent'; let smsEr = null;
      try {
        const smsText = `[Graduate Fashion] Re: Report #${reportId}: ${reply_text.substring(0, 140)}`;
        await sendSMS(connection, report.reporter_phone, smsText);
        console.log(`[Report] ✅ Reply SMS sent to ${report.reporter_phone} for report #${reportId}`);
      } catch (e) {
        smsSt = 'failed'; smsEr = e.message;
        console.error(`[Report] ❌ Reply SMS failed for report #${reportId}:`, e.message);
      } finally {
        await logNotification(connection, { channel: 'sms', category: 'report_reply', recipientType: report.user_id ? 'user' : 'guest', recipientUserId: report.user_id || null, recipientPhone: report.reporter_phone, message: `Re: Report #${reportId}: ${reply_text.substring(0, 140)}`, status: smsSt, errorMessage: smsEr, triggeredByAdminId: adminInfo.id });
      }
    }

    // ── Firebase push to customer if logged in ────────────────────────────────
    if (report.user_id) {
      try {
        const conn2 = await database.getConnection();
        await sendUserFirebasePush(
          conn2,
          report.user_id,
          `📬 Reply to Your Report #${reportId}`,
          `A support agent has responded to your report: "${report.subject}"`,
          { report_id: String(reportId), type: 'report_reply' }
        );
        await logNotification(conn2, { channel: 'push', category: 'report_reply', recipientType: 'user', recipientUserId: report.user_id, title: `📬 Reply to Your Report #${reportId}`, message: `A support agent has responded to your report: "${report.subject}"`, status: 'sent', triggeredByAdminId: adminInfo.id });
        await conn2.release();
      } catch (e) {
        console.error(`[Report] ❌ User push failed for report #${reportId}:`, e.message);
      }
    }

    return { success: true, message: 'Reply sent successfully.' };
  })
);

// ─── ADMIN: Assign / Reassign Report ────────────────────────────────────────

exports.adminAssignReport = api(
  {
    params: { id: { type: 'int', required: true } },
    body: { admin_id: { type: 'int', required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const reportId = req.typed.params.id;
    const { admin_id } = req.typed.body;

    const report = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM reports WHERE id = ? AND deleted_at IS NULL`,
      [reportId]
    );
    if (!report) throw new errors.NOT_FOUND('Report not found.');

    const targetAdmin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [admin_id]
    );
    if (!targetAdmin) throw new errors.NOT_FOUND('Target admin not found or inactive.');

    if (report.assigned_to_admin_id === admin_id) {
      throw new errors.INVALID_FIELDS_PROVIDED('Report is already assigned to this admin.');
    }

    await connection.query(
      `UPDATE reports
       SET assigned_to_admin_id = ?, assigned_by_admin_id = ?,
           assignment_method = 'manual', assigned_at = NOW(), is_read = 0
       WHERE id = ?`,
      [admin_id, adminInfo.id, reportId]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'ASSIGN_REPORT', 'reports', ?, ?)`,
      [adminInfo.id, reportId, JSON.stringify({ assigned_to: admin_id })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    // Notify newly assigned admin
    sendAdminReportNotification(null, reportId, 'report_assigned');

    return { success: true, message: 'Report assigned successfully.' };
  })
);

// ─── ADMIN: Update Report Status ─────────────────────────────────────────────

exports.adminUpdateReportStatus = api(
  {
    params: { id: { type: 'int', required: true } },
    body: { status: { type: 'string', required: true } }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const reportId = req.typed.params.id;
    const { status } = req.typed.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new errors.INVALID_FIELDS_PROVIDED(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    const report = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM reports WHERE id = ? AND deleted_at IS NULL`,
      [reportId]
    );
    if (!report) throw new errors.NOT_FOUND('Report not found.');

    if (!adminInfo.roles.includes('SUPER_ADMIN') && report.assigned_to_admin_id !== adminInfo.id) {
      throw new errors.UNAUTHORIZED();
    }

    await connection.query(
      `UPDATE reports SET status = ? WHERE id = ?`,
      [status, reportId]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPDATE_REPORT_STATUS', 'reports', ?, ?)`,
      [adminInfo.id, reportId, JSON.stringify({ new_status: status })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    return { success: true, message: `Report status updated to "${status}".` };
  })
);

// ─── ADMIN: Soft-delete Report ───────────────────────────────────────────────

exports.adminDeleteReport = api(
  { params: { id: { type: 'int', required: true } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) {
      throw new errors.UNAUTHORIZED();
    }

    const reportId = req.typed.params.id;
    const result = await connection.query(
      `UPDATE reports SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [reportId]
    );

    if (!result.affectedRows) throw new errors.NOT_FOUND('Report not found.');

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id)
       VALUES (?, 'DELETE_REPORT', 'reports', ?)`,
      [adminInfo.id, reportId]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    return { success: true, message: 'Report deleted.' };
  })
);

// ─── ADMIN: Get My Reports (for logged-in customer from account dashboard) ───

exports.getMyReports = api(
  {
    query: {
      user_id: { type: 'int',    required: false },
      limit:   { type: 'int',    required: false, default: 20 },
      offset:  { type: 'int',    required: false, default: 0  },
    }
  },
  async (req, connection) => {
    const { user_id, limit, offset } = req.typed.query;
    if (!user_id) throw new errors.BAD_REQUEST('user_id is required.');

    const reports = await connection.query(
      `SELECT id, tracking_token, category, subject, status, priority,
              is_read, is_replied, created_at, updated_at
       FROM reports
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );

    return { success: true, data: reports };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT DISTRIBUTION POOL
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Settings ────────────────────────────────────────────────────────────────

exports.getReportDistributionSettings = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();
    const settings = await connection.queryOne(
      `SELECT * FROM report_distribution_settings WHERE id = 1`
    );
    return { success: true, data: settings || null };
  })
);

exports.updateReportDistributionSettings = api(
  {
    body: {
      auto_assign_enabled:        { type: 'bool', required: false },
      assign_on_report_create:    { type: 'bool', required: false },
      include_admin_role:         { type: 'bool', required: false },
      include_order_manager_role: { type: 'bool', required: false },
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();

    const { auto_assign_enabled, assign_on_report_create, include_admin_role, include_order_manager_role } = req.typed.body;

    const updates = [];
    const values = [];

    if (auto_assign_enabled !== undefined)        { updates.push('auto_assign_enabled = ?');        values.push(auto_assign_enabled ? 1 : 0); }
    if (assign_on_report_create !== undefined)    { updates.push('assign_on_report_create = ?');    values.push(assign_on_report_create ? 1 : 0); }
    if (include_admin_role !== undefined)         { updates.push('include_admin_role = ?');         values.push(include_admin_role ? 1 : 0); }
    if (include_order_manager_role !== undefined) { updates.push('include_order_manager_role = ?'); values.push(include_order_manager_role ? 1 : 0); }

    if (!updates.length) throw new errors.INVALID_FIELDS_PROVIDED('No changes provided.');

    await connection.query(
      `UPDATE report_distribution_settings SET ${updates.join(', ')}, updated_by_admin = ?, updated_at = NOW() WHERE id = 1`,
      [...values, adminInfo.id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPDATE_REPORT_DISTRIBUTION_SETTINGS', 'report_distribution_settings', 1, ?)`,
      [adminInfo.id, JSON.stringify(req.typed.body)]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    return { success: true, message: 'Report distribution settings updated.' };
  })
);

// ─── Pool Agents ──────────────────────────────────────────────────────────────

exports.getReportDistributionAgents = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const agents = await connection.query(`
      SELECT
        rda.*,
        CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
        a.email AS admin_email,
        a.profile_img_path,
        /* active (unresolved) reports admin still has work on */
        (
          SELECT COUNT(*) FROM reports r
          WHERE r.assigned_to_admin_id = rda.admin_id
            AND r.status NOT IN (${TERMINAL_STATUSES})
            AND r.deleted_at IS NULL
        ) AS active_report_count,
        /* reports assigned into this admin's queue today */
        (
          SELECT COUNT(*) FROM reports r
          WHERE r.assigned_to_admin_id = rda.admin_id
            AND DATE(r.assigned_at) = CURDATE()
            AND r.deleted_at IS NULL
        ) AS today_assigned_count,
        /* reports this admin resolved or closed today */
        (
          SELECT COUNT(*) FROM reports r
          WHERE r.assigned_to_admin_id = rda.admin_id
            AND r.status IN (${TERMINAL_STATUSES})
            AND r.deleted_at IS NULL
            AND DATE(r.updated_at) = CURDATE()
        ) AS today_completed_count,
        /* lifetime total reports ever assigned to this admin */
        (
          SELECT COUNT(*) FROM reports r
          WHERE r.assigned_to_admin_id = rda.admin_id
            AND r.deleted_at IS NULL
        ) AS total_assigned_count
      FROM report_distribution_agents rda
      JOIN admins a ON a.id = rda.admin_id AND a.deleted_at IS NULL AND a.is_active = 1
      ORDER BY rda.serial ASC, rda.id ASC
    `);

    return { success: true, data: agents };
  })
);

exports.upsertReportAgent = api(
  {
    params: { admin_id: { type: 'int', required: true } },
    body: {
      serial:              { type: 'int',  required: false, default: 1 },
      max_active_reports:  { type: 'int',  required: false },
      auto_assign_enabled: { type: 'bool', required: false },
      status:              { type: 'bool', required: false },
    }
  },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();

    const targetAdminId  = req.typed.params.admin_id;
    const { serial, max_active_reports, auto_assign_enabled, status } = req.typed.body;

    const admin = await connection.queryOne(
      `SELECT id FROM admins WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [targetAdminId]
    );
    if (!admin) throw new errors.NOT_FOUND('Admin not found or inactive.');

    const existing = await connection.queryOne(
      `SELECT id FROM report_distribution_agents WHERE admin_id = ?`,
      [targetAdminId]
    );

    if (existing) {
      const updates = [];
      const values = [];
      if (serial !== undefined)              { updates.push('serial = ?');              values.push(serial); }
      if (max_active_reports !== undefined)  { updates.push('max_active_reports = ?');  values.push(max_active_reports || null); }
      if (auto_assign_enabled !== undefined) { updates.push('auto_assign_enabled = ?'); values.push(auto_assign_enabled ? 1 : 0); }
      if (status !== undefined)              { updates.push('status = ?');              values.push(status ? 1 : 0); }

      if (updates.length) {
        values.push(existing.id);
        await connection.query(
          `UPDATE report_distribution_agents SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // ── Admin audit log ─────────────────────────────────────────────────────
      connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'EDIT_REPORT_DISTRIBUTION_AGENT', 'report_distribution_agents', ?, ?)`,
        [adminInfo.id, existing.id, JSON.stringify({ target_admin_id: targetAdminId, ...req.typed.body })]
      ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

      return { success: true, message: 'Report distribution agent updated.', pool_id: existing.id };
    } else {
      const result = await connection.query(
        `INSERT INTO report_distribution_agents
         (admin_id, serial, max_active_reports, auto_assign_enabled, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          targetAdminId,
          serial || 1,
          max_active_reports || null,
          auto_assign_enabled !== undefined ? (auto_assign_enabled ? 1 : 0) : 1,
          status !== undefined ? (status ? 1 : 0) : 1,
        ]
      );

      // ── Admin audit log ─────────────────────────────────────────────────────
      connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
         VALUES (?, 'ADD_REPORT_DISTRIBUTION_AGENT', 'report_distribution_agents', ?, ?)`,
        [adminInfo.id, result.insertId, JSON.stringify({ target_admin_id: targetAdminId, ...req.typed.body })]
      ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

      return { success: true, message: 'Report distribution agent added.', pool_id: result.insertId };
    }
  })
);

exports.removeReportAgent = api(
  { params: { admin_id: { type: 'int', required: true } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();

    const targetAdminId = req.typed.params.admin_id;
    const result = await connection.query(
      `DELETE FROM report_distribution_agents WHERE admin_id = ?`,
      [targetAdminId]
    );
    if (!result.affectedRows) throw new errors.NOT_FOUND('Agent not in report distribution pool.');

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'REMOVE_REPORT_DISTRIBUTION_AGENT', 'report_distribution_agents', ?, ?)`,
      [adminInfo.id, targetAdminId, JSON.stringify({ removed_admin_id: targetAdminId })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    return { success: true, message: 'Agent removed from report distribution pool.' };
  })
);

// ─── Redistribute Unassigned Reports ─────────────────────────────────────────

exports.redistributeReports = api(
  {},
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();

    const reports = await connection.query(
      `SELECT id FROM reports
       WHERE assigned_to_admin_id IS NULL
         AND status NOT IN (${TERMINAL_STATUSES})
         AND deleted_at IS NULL
       ORDER BY id ASC`
    );

    if (!reports.length) {
      return { success: true, message: 'No unassigned reports to redistribute.', assigned: 0, skipped: 0 };
    }

    let assigned = 0;
    let skipped = 0;

    for (const report of reports) {
      const agents = await connection.query(`
        SELECT
          rda.admin_id, rda.max_active_reports, rda.serial,
          COUNT(CASE WHEN r.status NOT IN (${TERMINAL_STATUSES}) THEN 1 END) AS active_count
        FROM report_distribution_agents rda
        JOIN admins a ON a.id = rda.admin_id AND a.is_active = 1 AND a.deleted_at IS NULL
        LEFT JOIN reports r ON r.assigned_to_admin_id = rda.admin_id AND r.deleted_at IS NULL
        WHERE rda.status = 1 AND rda.auto_assign_enabled = 1
        GROUP BY rda.admin_id, rda.max_active_reports, rda.serial, rda.id
        ORDER BY active_count ASC, rda.serial ASC, rda.id ASC
      `);

      if (!agents.length) { skipped++; continue; }

      let chosen = null;
      for (const agent of agents) {
        if (agent.max_active_reports && agent.max_active_reports > 0 && agent.active_count >= agent.max_active_reports) continue;
        chosen = agent;
        break;
      }

      if (!chosen) { skipped++; continue; }

      await connection.query(
        `UPDATE reports
         SET assigned_to_admin_id = ?, assigned_by_admin_id = ?,
             assignment_method = 'redistribute', assigned_at = NOW()
         WHERE id = ?`,
        [chosen.admin_id, adminInfo.id, report.id]
      );

      sendAdminReportNotification(null, report.id, 'report_assigned');
      assigned++;
    }

    await connection.query(
      `UPDATE report_distribution_settings SET last_assigned_admin_id = ? WHERE id = 1`,
      [adminInfo.id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'REDISTRIBUTE_REPORTS', 'reports', NULL, ?)`,
      [adminInfo.id, JSON.stringify({ assigned, skipped })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    return {
      success: true,
      message: `Redistribution complete. Assigned: ${assigned}, Skipped: ${skipped}`,
      assigned,
      skipped
    };
  })
);

// ─── ADMIN: Eligible Admins for Report Pool UI ───────────────────────────────
// Mirrors order_assignment.getEligibleAdmins — returns all ADMIN+ORDER_MANAGER
// accounts PLUS the requesting SUPER_ADMIN (so they can add themselves to the pool).

exports.getReportEligibleAdmins = api(
  {},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED();
    }

    const admins = await connection.query(`
      SELECT
        a.id,
        CONCAT(a.first_name, ' ', IFNULL(a.last_name,'')) AS admin_name,
        a.email,
        a.profile_img_path,
        a.is_active,
        r.name  AS role_name,
        r.id    AS role_id,
        rda.id   AS pool_id,
        rda.serial,
        rda.max_active_reports,
        rda.auto_assign_enabled AS pool_auto_assign,
        rda.status              AS pool_status,
        /* active (open/in_progress) reports currently held by this admin */
        IFNULL(arc.active_report_count,  0) AS active_report_count,
        /* reports assigned into this admin's queue today */
        IFNULL(tac.today_assigned_count, 0) AS today_assigned_count,
        /* reports this admin resolved or closed today */
        IFNULL(tcc.today_completed_count, 0) AS today_completed_count,
        /* lifetime total reports ever assigned to this admin */
        IFNULL(tot.total_assigned_count, 0) AS total_assigned_count
      FROM admins a
      JOIN admin_roles ar ON ar.admin_id = a.id
      JOIN roles r        ON r.id = ar.role_id
      LEFT JOIN report_distribution_agents rda ON rda.admin_id = a.id
      /* active (non-terminal) reports */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS active_report_count
        FROM   reports
        WHERE  status NOT IN (${TERMINAL_STATUSES})
          AND  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
        GROUP  BY assigned_to_admin_id
      ) arc ON arc.assigned_to_admin_id = a.id
      /* reports assigned to this admin today */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS today_assigned_count
        FROM   reports
        WHERE  DATE(assigned_at) = CURDATE()
          AND  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
        GROUP  BY assigned_to_admin_id
      ) tac ON tac.assigned_to_admin_id = a.id
      /* reports this admin moved to a terminal status (resolved/closed) today */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS today_completed_count
        FROM   reports
        WHERE  status IN (${TERMINAL_STATUSES})
          AND  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
          AND  DATE(updated_at) = CURDATE()
        GROUP  BY assigned_to_admin_id
      ) tcc ON tcc.assigned_to_admin_id = a.id
      /* lifetime total reports ever assigned to this admin */
      LEFT JOIN (
        SELECT assigned_to_admin_id,
               COUNT(*) AS total_assigned_count
        FROM   reports
        WHERE  assigned_to_admin_id IS NOT NULL
          AND  deleted_at IS NULL
        GROUP  BY assigned_to_admin_id
      ) tot ON tot.assigned_to_admin_id = a.id
      WHERE a.is_active = 1
        AND a.deleted_at IS NULL
        AND (
          r.name IN ('ADMIN', 'ORDER_MANAGER')
          OR a.id = ?
        )
      ORDER BY r.name ASC, a.first_name ASC
    `, [adminInfo.id]);

    return { success: true, data: admins };
  })
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// V2-038: MANUAL ASSIGN / UNASSIGN / LOGS â€” REPORT
// Pattern mirrors order_assignment.js exactly.
// SUPER_ADMIN: can assign any report to any admin.
// ADMIN: can only reassign a report currently assigned TO themselves.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

exports.assignReport = api(
  { body: {
    report_id: { type: 'int', required: true },
    admin_id:  { type: 'int', required: true },
  }},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED.includes(r))) throw new errors.UNAUTHORIZED();

    const { report_id, admin_id } = req.typed.body;
    const isSuperAdmin = adminInfo.roles.includes('SUPER_ADMIN');

    const report = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM reports WHERE id = ? AND deleted_at IS NULL`,
      [report_id]
    );
    if (!report) throw new errors.NOT_FOUND('Report not found.');

    // ADMIN can only reassign if the report is currently assigned to them
    if (!isSuperAdmin) {
      if (report.assigned_to_admin_id !== adminInfo.id) {
        throw new errors.UNAUTHORIZED('You can only reassign reports assigned to you.');
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

    // ADMIN cannot assign to SUPER_ADMIN
    if (!isSuperAdmin && targetAdmin.role_name === 'SUPER_ADMIN') {
      throw new errors.UNAUTHORIZED('Admins cannot assign reports to Super Admins.');
    }

    if (report.assigned_to_admin_id === admin_id) {
      throw new errors.INVALID_FIELDS_PROVIDED('Report is already assigned to this admin.');
    }

    const fromAdminId = report.assigned_to_admin_id;
    const actionType  = fromAdminId ? 'redistribute' : 'manual';

    await connection.query(
      `UPDATE reports SET assigned_to_admin_id = ?, assigned_by_admin_id = ?, assignment_method = ?, assigned_at = NOW() WHERE id = ?`,
      [admin_id, adminInfo.id, actionType, report_id]
    );

    await connection.query(
      `INSERT INTO report_assignment_logs (report_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id) VALUES (?, ?, ?, ?, ?)`,
      [report_id, actionType, fromAdminId || null, admin_id, adminInfo.id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'ASSIGN_REPORT', 'reports', ?, ?)`,
      [adminInfo.id, report_id, JSON.stringify({ action_type: actionType, from_admin_id: fromAdminId || null, to_admin_id: admin_id })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    sendAdminReportNotification(null, report_id, 'report_assigned');

    return {
      success: true,
      message: actionType === 'redistribute' ? 'Report reassigned successfully.' : 'Report assigned successfully.',
    };
  })
);

exports.unassignReport = api(
  { params: { report_id: { type: 'int', required: true } } },
  auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.includes('SUPER_ADMIN')) throw new errors.UNAUTHORIZED();

    const report_id = req.typed.params.report_id;
    const report = await connection.queryOne(
      `SELECT id, assigned_to_admin_id FROM reports WHERE id = ? AND deleted_at IS NULL`,
      [report_id]
    );
    if (!report) throw new errors.NOT_FOUND('Report not found.');
    if (!report.assigned_to_admin_id) throw new errors.INVALID_FIELDS_PROVIDED('Report is not currently assigned.');

    await connection.query(
      `UPDATE reports SET assigned_to_admin_id = NULL, assigned_by_admin_id = NULL, assignment_method = NULL, assigned_at = NULL WHERE id = ?`,
      [report_id]
    );

    await connection.query(
      `INSERT INTO report_assignment_logs (report_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id) VALUES (?, 'unassign', ?, NULL, ?)`,
      [report_id, report.assigned_to_admin_id, adminInfo.id]
    );

    // ── Admin audit log ───────────────────────────────────────────────────────
    connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UNASSIGN_REPORT', 'reports', ?, ?)`,
      [adminInfo.id, report_id, JSON.stringify({ from_admin_id: report.assigned_to_admin_id })]
    ).catch(e => console.error('[Report] admin_audit_log failed:', e.message));

    return { success: true, message: 'Report unassigned.' };
  })
);

exports.getReportAssignmentLogs = api(
  { query: {
    report_id: { type: 'int', required: false },
    limit:     { type: 'int', required: false, default: 20 },
    offset:    { type: 'int', required: false, default: 0 },
  }},
  auth(async (req, connection, adminInfo) => {
    const ALLOWED = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminInfo.roles.some(r => ALLOWED.includes(r))) throw new errors.UNAUTHORIZED();

    const { report_id, limit, offset } = req.typed.query;
    const conditions = [], values = [];
    if (report_id) { conditions.push('al.report_id = ?'); values.push(report_id); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const logs = await connection.query(
      `SELECT al.*,
              CONCAT(fa.first_name, ' ', IFNULL(fa.last_name,'')) AS from_admin_name,
              CONCAT(ta.first_name, ' ', IFNULL(ta.last_name,'')) AS to_admin_name,
              CONCAT(ca.first_name, ' ', IFNULL(ca.last_name,'')) AS changed_by_name
       FROM report_assignment_logs al
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

