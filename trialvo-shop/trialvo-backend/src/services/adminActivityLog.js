const { pool } = require('../config/db');

/** Keys that must never land in the audit meta blob. */
const SECRET_KEY_RE = /password|secret|apiKey|api_key|token|smtp_password/i;

const ACTION_CATALOG = [
  'auth.login',
  'auth.login_failed',
  'auth.profile_update',
  'auth.password_change',
  'staff.create',
  'staff.update',
  'staff.deactivate',
  'staff.reset_password',
  'notify.global_update',
  'notify.admin_update',
  'settings.smtp_update',
  'settings.sms_update',
  'settings.sms_test',
  'settings.trial_update',
  'settings.pay_update',
  'trial.request_approve',
  'trial.request_reject',
  'trial.request_fulfill',
  'trial.instance_freeze',
  'trial.instance_unfreeze',
  'trial.instance_extend',
  'trial.instance_destroy',
  'trial.instance_mark_live',
  'trial.installer_issue',
  'product.create',
  'product.update',
  'product.delete',
  'product.bulk',
  'order.status_update',
  'message.delete',
  'category.create',
  'category.update',
  'category.delete',
];

const RESOURCE_CATALOG = [
  'auth',
  'staff',
  'notify',
  'settings',
  'trial_request',
  'trial_instance',
  'product',
  'order',
  'message',
  'category',
];

function clientIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 45);
  }
  const ip = req.ip || req.socket?.remoteAddress || null;
  return ip ? String(ip).slice(0, 45) : null;
}

function clientUa(req) {
  if (!req) return null;
  const ua = req.get?.('user-agent') || req.headers?.['user-agent'];
  return ua ? String(ua).slice(0, 255) : null;
}

function scrubMeta(value) {
  if (Array.isArray(value)) return value.map(scrubMeta);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = SECRET_KEY_RE.test(key) ? '[redacted]' : scrubMeta(nested);
    }
    return out;
  }
  return value;
}

function parseMeta(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function clip(value, max) {
  if (value == null) return null;
  const text = String(value);
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * Write one audit row. Never throws — a logging failure must not break
 * the mutation the admin just completed.
 */
async function logAdminActivity({
  req,
  adminId,
  action,
  resource,
  resourceId,
  summary,
  meta,
} = {}) {
  try {
    if (!action) return;

    const actorId = adminId !== undefined
      ? adminId
      : (req?.admin?.id || null);

    await pool.query(
      `INSERT INTO admin_activity_logs
         (admin_id, action, resource, resource_id, summary, meta, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actorId || null,
        clip(action, 80),
        clip(resource, 80),
        clip(resourceId, 64),
        clip(summary, 255),
        meta != null ? scrubMeta(meta) : null,
        clientIp(req),
        clientUa(req),
      ]
    );
  } catch (err) {
    console.error('[adminActivityLog] insert failed:', err.message || err);
  }
}

function ymd(value) {
  if (!value) return null;
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

async function listAdminActivity({
  adminId,
  action,
  resource,
  search,
  dateFrom,
  dateTo,
  page = 1,
  limit = 50,
} = {}) {
  const filters = [];
  const params = [];

  if (adminId) {
    params.push(adminId);
    filters.push(`l.admin_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    filters.push(`l.action = $${params.length}`);
  }
  if (resource) {
    params.push(resource);
    filters.push(`l.resource = $${params.length}`);
  }

  const from = ymd(dateFrom);
  if (from) {
    params.push(`${from} 00:00:00.000`);
    filters.push(`l.created_at >= $${params.length}`);
  }
  const to = ymd(dateTo);
  if (to) {
    params.push(`${to} 23:59:59.999`);
    filters.push(`l.created_at <= $${params.length}`);
  }

  const q = search ? String(search).trim() : '';
  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    filters.push(
      `(l.summary LIKE $${idx} OR l.action LIKE $${idx} OR a.email LIKE $${idx} OR a.full_name LIKE $${idx})`
    );
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (safePage - 1) * safeLimit;

  const countSql = `
    SELECT COUNT(*) AS total
      FROM admin_activity_logs l
      LEFT JOIN admin_profiles a ON a.id = l.admin_id
      ${where}
  `;
  const { rows: countRows } = await pool.query(countSql, params);
  const total = Number(countRows[0]?.total || 0);

  params.push(safeLimit, offset);
  const listSql = `
    SELECT l.id, l.admin_id, l.action, l.resource, l.resource_id, l.summary,
           l.meta, l.ip_address, l.user_agent, l.created_at,
           a.email AS admin_email, a.full_name AS admin_name, a.role AS admin_role
      FROM admin_activity_logs l
      LEFT JOIN admin_profiles a ON a.id = l.admin_id
      ${where}
     ORDER BY l.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const { rows } = await pool.query(listSql, params);

  return {
    items: rows.map((row) => ({
      ...row,
      meta: parseMeta(row.meta),
    })),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

async function listDistinctActions() {
  const { rows } = await pool.query(
    'SELECT DISTINCT action FROM admin_activity_logs WHERE action IS NOT NULL ORDER BY action ASC'
  );
  const used = rows.map((r) => r.action).filter(Boolean);
  return Array.from(new Set([...ACTION_CATALOG, ...used]));
}

async function listDistinctResources() {
  const { rows } = await pool.query(
    'SELECT DISTINCT resource FROM admin_activity_logs WHERE resource IS NOT NULL AND resource <> \'\' ORDER BY resource ASC'
  );
  const used = rows.map((r) => r.resource).filter(Boolean);
  return Array.from(new Set([...RESOURCE_CATALOG, ...used]));
}

/** Actors that have at least one log row — used when /staff is super-only. */
async function listActivityActors() {
  const { rows } = await pool.query(`
    SELECT l.admin_id AS id, a.email, a.full_name, a.role
      FROM admin_activity_logs l
      LEFT JOIN admin_profiles a ON a.id = l.admin_id
     WHERE l.admin_id IS NOT NULL
     GROUP BY l.admin_id, a.email, a.full_name, a.role
     ORDER BY a.full_name IS NULL, a.full_name, a.email
  `);
  return rows;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '****';
  if (digits.length <= 4) return `****${digits}`;
  return `****${digits.slice(-4)}`;
}

module.exports = {
  ACTION_CATALOG,
  RESOURCE_CATALOG,
  logAdminActivity,
  listAdminActivity,
  listDistinctActions,
  listDistinctResources,
  listActivityActors,
  scrubMeta,
  maskPhone,
};
