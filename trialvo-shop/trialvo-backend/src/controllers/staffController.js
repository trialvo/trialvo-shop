const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { EVENTS, CHANNELS } = require('../services/staffAlerts');
const { logAdminActivity } = require('../services/adminActivityLog');

const ROLES = new Set(['super_admin', 'admin', 'editor']);
const STAFF_FIELDS = 'id, email, full_name, role, phone, is_active, created_at';

const MATRIX_COLUMNS = [
  'purchase_email', 'purchase_sms',
  'extend_email', 'extend_sms',
  'domain_trial_email', 'domain_trial_sms',
  'manual_expiry_email', 'manual_expiry_sms',
];

function toBool(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function asActiveFlag(value) {
  return Number(value) === 1 || value === true;
}

function publicAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    phone: row.phone || null,
    is_active: asActiveFlag(row.is_active),
    created_at: row.created_at,
  };
}

function matrixFromRow(row) {
  const out = {};
  for (const event of EVENTS) {
    out[event] = {
      email: asActiveFlag(row[`${event}_email`]),
      sms: asActiveFlag(row[`${event}_sms`]),
    };
  }
  return out;
}

async function countOtherActiveSupers(excludeId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS c FROM admin_profiles
     WHERE role = 'super_admin' AND is_active = 1 AND id <> $1`,
    [excludeId]
  );
  return Number(rows[0]?.c || 0);
}

// Nobody may mutate another super_admin via staff/admin APIs — self-edit only.
function assertCanMutateTarget(actor, targetRow) {
  if (targetRow && targetRow.role === 'super_admin' && targetRow.id !== actor?.id) {
    return { status: 403, error: 'Super admin accounts can only be edited by themselves' };
  }
  return {};
}

async function assertLastSuperSafe(adminId, { nextRole, nextActive }) {
  const { rows } = await pool.query(
    'SELECT id, role, is_active FROM admin_profiles WHERE id = $1',
    [adminId]
  );
  if (!rows.length) return { notFound: true };
  const current = rows[0];
  const role = nextRole !== undefined ? nextRole : current.role;
  const active = nextActive !== undefined ? nextActive : asActiveFlag(current.is_active);
  const stillActiveSuper = role === 'super_admin' && active;
  if (stillActiveSuper) return {};
  if (current.role === 'super_admin' && asActiveFlag(current.is_active)) {
    const others = await countOtherActiveSupers(adminId);
    if (others === 0) {
      return { error: 'Cannot deactivate or demote the last remaining active super admin' };
    }
  }
  return {};
}

async function listStaff(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${STAFF_FIELDS} FROM admin_profiles ORDER BY created_at ASC`
    );
    res.json({ staff: rows.map(publicAdmin) });
  } catch (error) {
    next(error);
  }
}

async function createStaff(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.full_name || '').trim();
    const role = String(req.body?.role || '').trim();
    const phone = req.body?.phone != null ? String(req.body.phone).trim() || null : null;
    const password = req.body?.password;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!fullName) return res.status(400).json({ error: 'Full name is required' });
    if (!ROLES.has(role)) {
      return res.status(400).json({ error: 'Role must be super_admin, admin, or editor' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const dup = await pool.query(
      'SELECT id FROM admin_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    if (dup.rows.length) {
      return res.status(409).json({ error: 'Email is already in use' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(String(password), 12);
    await pool.query(
      `INSERT INTO admin_profiles
         (id, email, password_hash, full_name, avatar_url, role, phone, is_active)
       VALUES ($1, $2, $3, $4, '', $5, $6, 1)`,
      [id, email, passwordHash, fullName, role, phone]
    );
    await pool.query(
      'INSERT IGNORE INTO admin_notification_permissions (admin_id) VALUES ($1)',
      [id]
    );

    const { rows } = await pool.query(
      `SELECT ${STAFF_FIELDS} FROM admin_profiles WHERE id = $1`,
      [id]
    );
    await logAdminActivity({
      req,
      action: 'staff.create',
      resource: 'staff',
      resourceId: id,
      summary: `Created staff ${email}`,
      meta: { email, role, full_name: fullName },
    });
    res.status(201).json({ staff: publicAdmin(rows[0]) });
  } catch (error) {
    next(error);
  }
}

async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: existing } = await pool.query(
      `SELECT ${STAFF_FIELDS} FROM admin_profiles WHERE id = $1`,
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Staff member not found' });

    const blocked = assertCanMutateTarget(req.admin, existing[0]);
    if (blocked.status) return res.status(blocked.status).json({ error: blocked.error });

    const updates = [];
    const values = [];
    let idx = 1;
    let nextRole;
    let nextActive;

    if (req.body?.full_name !== undefined) {
      const name = String(req.body.full_name || '').trim();
      if (!name) return res.status(400).json({ error: 'Full name is required' });
      updates.push(`full_name = $${idx++}`);
      values.push(name);
    }

    if (req.body?.email !== undefined) {
      const email = String(req.body.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      const dup = await pool.query(
        'SELECT id FROM admin_profiles WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1',
        [email, id]
      );
      if (dup.rows.length) {
        return res.status(409).json({ error: 'Email is already in use' });
      }
      updates.push(`email = $${idx++}`);
      values.push(email);
    }

    if (req.body?.role !== undefined) {
      const role = String(req.body.role || '').trim();
      if (!ROLES.has(role)) {
        return res.status(400).json({ error: 'Role must be super_admin, admin, or editor' });
      }
      nextRole = role;
      updates.push(`role = $${idx++}`);
      values.push(role);
    }

    if (req.body?.phone !== undefined) {
      const phone = req.body.phone == null ? null : String(req.body.phone).trim() || null;
      updates.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (req.body?.is_active !== undefined) {
      const flag = toBool(req.body.is_active);
      if (flag === undefined) return res.status(400).json({ error: 'is_active must be a boolean' });
      if (flag === false && id === req.admin.id) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }
      nextActive = flag;
      updates.push(`is_active = $${idx++}`);
      values.push(flag ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const guard = await assertLastSuperSafe(id, { nextRole, nextActive });
    if (guard.notFound) return res.status(404).json({ error: 'Staff member not found' });
    if (guard.error) return res.status(400).json({ error: guard.error });

    values.push(id);
    await pool.query(
      `UPDATE admin_profiles SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    const { rows } = await pool.query(
      `SELECT ${STAFF_FIELDS} FROM admin_profiles WHERE id = $1`,
      [id]
    );
    const changed = [];
    if (req.body?.full_name !== undefined) changed.push('full_name');
    if (req.body?.email !== undefined) changed.push('email');
    if (req.body?.role !== undefined) changed.push('role');
    if (req.body?.phone !== undefined) changed.push('phone');
    if (req.body?.is_active !== undefined) changed.push('is_active');
    const deactivated = nextActive === false;
    await logAdminActivity({
      req,
      action: deactivated ? 'staff.deactivate' : 'staff.update',
      resource: 'staff',
      resourceId: id,
      summary: deactivated ? `Deactivated staff ${rows[0].email}` : `Updated staff ${rows[0].email}`,
      meta: { changed, is_active: rows[0].is_active },
    });
    res.json({ staff: publicAdmin(rows[0]) });
  } catch (error) {
    next(error);
  }
}

async function resetStaffPassword(req, res, next) {
  try {
    const { id } = req.params;
    const password = req.body?.password;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { rows } = await pool.query(
      'SELECT id, role FROM admin_profiles WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Staff member not found' });

    const blocked = assertCanMutateTarget(req.admin, rows[0]);
    if (blocked.status) return res.status(blocked.status).json({ error: blocked.error });

    const passwordHash = await bcrypt.hash(String(password), 12);
    await pool.query(
      'UPDATE admin_profiles SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
    await logAdminActivity({
      req,
      action: 'staff.reset_password',
      resource: 'staff',
      resourceId: id,
      summary: 'Reset staff password',
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
}

async function loadGlobalFlags() {
  const keys = [];
  for (const event of EVENTS) {
    for (const channel of CHANNELS) keys.push(`notify.${event}.${channel}`);
  }
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await pool.query(
    `SELECT \`key\`, value FROM system_config WHERE \`key\` IN (${placeholders})`,
    keys
  );
  const map = {};
  rows.forEach((r) => { map[r.key] = r.value; });

  const global = {};
  for (const event of EVENTS) {
    global[event] = {
      email: map[`notify.${event}.email`] === 'true',
      sms: map[`notify.${event}.sms`] === 'true',
    };
  }
  return global;
}

async function getNotificationPermissions(req, res, next) {
  try {
    const global = await loadGlobalFlags();
    const { rows } = await pool.query(`
      SELECT a.id, a.email, a.full_name, a.role, a.phone, a.is_active, a.created_at,
             p.purchase_email, p.purchase_sms, p.extend_email, p.extend_sms,
             p.domain_trial_email, p.domain_trial_sms,
             p.manual_expiry_email, p.manual_expiry_sms
      FROM admin_profiles a
      LEFT JOIN admin_notification_permissions p ON p.admin_id = a.id
      WHERE a.is_active = 1
      ORDER BY a.created_at ASC
    `);

    const admins = [];
    for (const row of rows) {
      if (row.purchase_email == null) {
        await pool.query(
          'INSERT IGNORE INTO admin_notification_permissions (admin_id) VALUES ($1)',
          [row.id]
        );
      }
      admins.push({
        ...publicAdmin(row),
        permissions: matrixFromRow({
          purchase_email: row.purchase_email ?? 1,
          purchase_sms: row.purchase_sms ?? 0,
          extend_email: row.extend_email ?? 1,
          extend_sms: row.extend_sms ?? 0,
          domain_trial_email: row.domain_trial_email ?? 1,
          domain_trial_sms: row.domain_trial_sms ?? 1,
          manual_expiry_email: row.manual_expiry_email ?? 1,
          manual_expiry_sms: row.manual_expiry_sms ?? 0,
        }),
      });
    }

    res.json({ global, admins });
  } catch (error) {
    next(error);
  }
}

function collectFlagUpdates(body) {
  const updates = [];
  if (!body || typeof body !== 'object') return updates;

  for (const event of EVENTS) {
    const nested = body[event];
    if (nested && typeof nested === 'object') {
      for (const channel of CHANNELS) {
        const flag = toBool(nested[channel]);
        if (flag !== undefined) updates.push({ event, channel, flag });
      }
    }
    for (const channel of CHANNELS) {
      const flat = toBool(body[`${event}_${channel}`]);
      if (flat !== undefined) updates.push({ event, channel, flag: flat });
    }
  }
  return updates;
}

async function updateGlobalPermissions(req, res, next) {
  try {
    const updates = collectFlagUpdates(req.body);
    if (!updates.length) {
      return res.status(400).json({ error: 'No notification flags to update' });
    }

    for (const { event, channel, flag } of updates) {
      await pool.query(
        'UPDATE system_config SET value = $1, updated_at = NOW() WHERE `key` = $2',
        [flag ? 'true' : 'false', `notify.${event}.${channel}`]
      );
    }

    await logAdminActivity({
      req,
      action: 'notify.global_update',
      resource: 'notify',
      summary: 'Updated global notification flags',
      meta: { flags: updates.map(({ event, channel, flag }) => ({ event, channel, flag })) },
    });
    res.json({ global: await loadGlobalFlags() });
  } catch (error) {
    next(error);
  }
}

async function updateAdminPermissions(req, res, next) {
  try {
    const { adminId } = req.params;
    const { rows } = await pool.query(
      'SELECT id, role FROM admin_profiles WHERE id = $1',
      [adminId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Staff member not found' });

    const blocked = assertCanMutateTarget(req.admin, rows[0]);
    if (blocked.status) return res.status(blocked.status).json({ error: blocked.error });

    await pool.query(
      'INSERT IGNORE INTO admin_notification_permissions (admin_id) VALUES ($1)',
      [adminId]
    );

    const updates = collectFlagUpdates(req.body);
    if (!updates.length) {
      return res.status(400).json({ error: 'No notification flags to update' });
    }

    const sets = [];
    const values = [];
    let idx = 1;
    const seen = new Set();
    for (const { event, channel, flag } of updates) {
      const col = `${event}_${channel}`;
      if (!MATRIX_COLUMNS.includes(col) || seen.has(col)) continue;
      seen.add(col);
      sets.push(`\`${col}\` = $${idx++}`);
      values.push(flag ? 1 : 0);
    }

    values.push(adminId);
    await pool.query(
      `UPDATE admin_notification_permissions SET ${sets.join(', ')} WHERE admin_id = $${idx}`,
      values
    );

    const { rows: next } = await pool.query(
      `SELECT a.id, a.email, a.full_name, a.role, a.phone, a.is_active, a.created_at,
              p.purchase_email, p.purchase_sms, p.extend_email, p.extend_sms,
              p.domain_trial_email, p.domain_trial_sms,
              p.manual_expiry_email, p.manual_expiry_sms
       FROM admin_profiles a
       JOIN admin_notification_permissions p ON p.admin_id = a.id
       WHERE a.id = $1`,
      [adminId]
    );

    await logAdminActivity({
      req,
      action: 'notify.admin_update',
      resource: 'notify',
      resourceId: adminId,
      summary: `Updated notification matrix for ${next[0].email}`,
      meta: { flags: updates.map(({ event, channel, flag }) => ({ event, channel, flag })) },
    });
    res.json({
      admin: {
        ...publicAdmin(next[0]),
        permissions: matrixFromRow(next[0]),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStaff,
  createStaff,
  updateStaff,
  resetStaffPassword,
  getNotificationPermissions,
  updateGlobalPermissions,
  updateAdminPermissions,
};
