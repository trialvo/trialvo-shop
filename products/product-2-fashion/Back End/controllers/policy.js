const { api, auth } = require('../helpers/common');
const errors = require('../helpers/errors');

/**
 * V2-013: Dynamic Policies CRUD
 * Manages `dynamic_policies` table for privacy, terms, refund, return, copyright etc.
 */

/**
 * Surgical HTML safety strip — only removes genuinely dangerous content.
 * Does NOT re-parse or re-serialize, so it never mangles valid admin HTML.
 *
 * Strips:
 *   - <script>...</script>  blocks (with content)
 *   - <iframe>, <object>, <embed>, <form>  blocks (with content)
 *   - on* event handler attributes  (onclick=, onerror=, etc.)
 *   - javascript: URLs in href / src / action attributes
 */
function stripDangerousHtml(html) {
  return html
    // Remove script blocks (and their content)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove iframe / object / embed / form blocks (and their content)
    .replace(/<(iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove self-closing / void versions of dangerous tags
    .replace(/<(iframe|object|embed)\b[^>]*\/>/gi, '')
    // Strip on* event handler attributes  e.g.  onclick="..." onerror='...'
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>"']+)/gi, '')
    // Neutralise javascript: in href / src / action
    .replace(/(href|src|action)\s*=\s*(["']?)\s*javascript:[^"'\s>]*/gi, '$1=$2#');
}

// ─────────────── Admin: Get All Policies ───────────────
exports.getPolicies = api(
  {
    query: {
      status: { type: "int", required: false },
      include_deleted: { type: "bool", required: false, default: false }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { status, include_deleted } = req.typed.query;
    const conditions = [];
    const values = [];

    if (!include_deleted) {
      conditions.push("deleted_at IS NULL");
    }

    if (status !== undefined) {
      conditions.push("status = ?");
      values.push(status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const policies = await connection.query(
      `SELECT id, policy_key, title, bd_title, content_type, status, updated_by_admin, created_at, updated_at, deleted_at
       FROM dynamic_policies
       ${whereClause}
       ORDER BY created_at ASC`,
      values
    );

    return {
      success: true,
      data: policies
    };
  })
);

// ─────────────── Admin: Get Policy by Key ───────────────
exports.getPolicyByKey = api(
  {
    params: {
      key: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Access denied.");
    }

    const policy = await connection.queryOne(
      `SELECT * FROM dynamic_policies WHERE policy_key = ? AND deleted_at IS NULL`,
      [req.typed.params.key]
    );

    if (!policy) {
      throw new errors.NOT_FOUND("Policy not found.");
    }

    return {
      success: true,
      data: policy
    };
  })
);

// ─────────────── Admin: Create/Update Policy ───────────────
exports.upsertPolicy = api(
  {
    body: {
      policy_key:   { type: "string", required: true },
      title:        { type: "string", required: true },
      bd_title:     { type: "string", required: false },
      content:      { type: "string", required: true },
      content_type: { type: "string", required: false, default: "html" },
      status:       { type: "int",    required: false, default: 1 }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { policy_key, title, bd_title, content, content_type, status } = req.typed.body;

    // Validation
    if (!['html', 'text'].includes(content_type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("content_type must be 'html' or 'text'.");
    }

    if (title.length > 255) {
      throw new errors.INVALID_FIELDS_PROVIDED("Title too long.");
    }

    // ─── Strip dangerous HTML (surgical — does not re-parse/mangle structure) ───
    let safeContent = content;
    if (content_type === 'html' && content) {
      safeContent = stripDangerousHtml(content);
    }

    const existing = await connection.queryOne(
      `SELECT id, deleted_at FROM dynamic_policies WHERE policy_key = ?`,
      [policy_key]
    );

    let policyId;
    let action;

    if (existing) {
      // Update existing (restore if soft-deleted)
      await connection.query(
        `UPDATE dynamic_policies
         SET title = ?, bd_title = ?, content = ?, content_type = ?, status = ?,
             updated_by_admin = ?, deleted_at = NULL, updated_at = NOW()
         WHERE policy_key = ?`,
        [title, bd_title ?? null, safeContent, content_type, status, adminInfo.id, policy_key]
      );
      policyId = existing.id;
      action = existing.deleted_at ? 'RESTORE_POLICY' : 'UPDATE_POLICY';
    } else {
      // Create new
      const result = await connection.query(
        `INSERT INTO dynamic_policies (policy_key, title, bd_title, content, content_type, status, updated_by_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [policy_key, title, bd_title ?? null, safeContent, content_type, status, adminInfo.id]
      );
      policyId = result.insertId;
      action = 'CREATE_POLICY';
    }

    // Audit log
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, ?, 'dynamic_policies', ?, ?)`,
      [adminInfo.id, action, policyId, JSON.stringify({ policy_key, title })]
    );

    return {
      success: true,
      message: `Policy ${action === 'CREATE_POLICY' ? 'created' : 'updated'} successfully.`,
      data: { id: policyId, policy_key }
    };
  })
);

// ─────────────── Admin: Soft Delete Policy ───────────────
exports.deletePolicy = api(
  {
    params: {
      key: { type: "string", required: true }
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Only super admins can delete policies.");
    }

    const policy = await connection.queryOne(
      `SELECT id FROM dynamic_policies WHERE policy_key = ? AND deleted_at IS NULL`,
      [req.typed.params.key]
    );

    if (!policy) {
      throw new errors.NOT_FOUND("Policy not found.");
    }

    await connection.query(
      `UPDATE dynamic_policies SET deleted_at = NOW(), status = 0 WHERE id = ?`,
      [policy.id]
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'DELETE_POLICY', 'dynamic_policies', ?, ?)`,
      [adminInfo.id, policy.id, JSON.stringify({ policy_key: req.typed.params.key })]
    );

    return {
      success: true,
      message: "Policy deleted successfully."
    };
  })
);

// ─────────────── Admin: Patch Policy (partial update) ───────────────
exports.patchPolicy = api(
  {
    params: {
      key: { type: "string", required: true }
    },
    body: {
      title:        { type: "string", required: false },
      bd_title:     { type: "string", required: false },
      content:      { type: "string", required: false },
      content_type: { type: "string", required: false },
      status:       { type: "int",    required: false },
    }
  },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) {
      throw new errors.UNAUTHORIZED("Access denied.");
    }

    const { key } = req.typed.params;
    const { title, bd_title, content, content_type, status } = req.typed.body;

    const policy = await connection.queryOne(
      `SELECT id FROM dynamic_policies WHERE policy_key = ? AND deleted_at IS NULL`,
      [key]
    );

    if (!policy) {
      throw new errors.NOT_FOUND("Policy not found.");
    }

    // Validate optional fields when provided
    if (content_type !== undefined && !['html', 'text'].includes(content_type)) {
      throw new errors.INVALID_FIELDS_PROVIDED("content_type must be 'html' or 'text'.");
    }
    if (title !== undefined && title.length > 150) {
      throw new errors.INVALID_FIELDS_PROVIDED("Title too long (max 150 chars).");
    }

    // Build dynamic SET clause from only the provided fields
    const sets = [];
    const values = [];

    if (title !== undefined)        { sets.push('title = ?');        values.push(title); }
    if (bd_title !== undefined)     { sets.push('bd_title = ?');     values.push(bd_title || null); }
    if (content_type !== undefined) { sets.push('content_type = ?'); values.push(content_type); }
    if (status !== undefined)       { sets.push('status = ?');       values.push(status); }
    if (content !== undefined) {
      const safeContent = content_type === 'text'
        ? content
        : stripDangerousHtml(content);
      sets.push('content = ?');
      values.push(safeContent);
    }

    if (sets.length === 0) {
      throw new errors.INVALID_FIELDS_PROVIDED("No fields provided to update.");
    }

    sets.push('updated_by_admin = ?', 'updated_at = NOW()');
    values.push(adminInfo.id, key);

    await connection.query(
      `UPDATE dynamic_policies SET ${sets.join(', ')} WHERE policy_key = ?`,
      values
    );

    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta)
       VALUES (?, 'UPDATE_POLICY', 'dynamic_policies', ?, ?)`,
      [adminInfo.id, policy.id, JSON.stringify({ policy_key: key, changed: Object.keys(req.typed.body) })]
    );

    return {
      success: true,
      message: "Policy updated successfully.",
      data: { policy_key: key }
    };
  })
);

exports.getPublicPolicyByKey = api(
  {
    params: {
      key: { type: "string", required: true }
    }
  },
  async (req, connection) => {
    const policy = await connection.queryOne(
      `SELECT policy_key, title, bd_title, content, content_type, updated_at
       FROM dynamic_policies
       WHERE policy_key = ? AND status = 1 AND deleted_at IS NULL`,
      [req.typed.params.key]
    );

    if (!policy) {
      throw new errors.NOT_FOUND("Policy not found.");
    }

    return {
      success: true,
      data: policy
    };
  }
);

// ─────────────── Public: Get All Active Policies ───────────────
exports.getPublicPolicies = api(
  {},
  async (req, connection) => {
    const policies = await connection.query(
      `SELECT policy_key, title, bd_title, content, content_type, updated_at
       FROM dynamic_policies
       WHERE status = 1 AND deleted_at IS NULL
       ORDER BY created_at ASC`
    );

    return {
      success: true,
      data: policies
    };
  }
);
