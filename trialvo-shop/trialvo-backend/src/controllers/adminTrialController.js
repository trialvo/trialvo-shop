const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { decrypt, encrypt } = require('../utils/crypto');
const { sendMail } = require('../services/mailer');
const { provisionFromRequest } = require('../services/provisioner');
const { logEvent } = require('../services/trialEvents');
const {
    getTrialSettings, defaultDaysForType, clampDays, clampMonths, monthsToDays, expiresAtForMonths,
} = require('../services/trialSettings');
const {
    STAGES, HOST_KINDS, setStage, parseHistory, normaliseDomain,
} = require('../services/trialFulfillment');
const { domainTrialLiveEmail, FRONTEND } = require('../services/trialEmails');
const { listBackups, getBackupForInstance, openStoredBackup, backupKeepCount } = require('../services/backupService');
const { buildMigrationZip } = require('../services/trialBackupCodec');
const { buildInstallerZip, buildTrialInstallerZip } = require('../services/packager');

/** Strip secrets from admin list/detail JSON (credentials via dedicated endpoints only). */
function sanitizeInstanceForAdminList(row) {
    if (!row || typeof row !== 'object') return row;
    const out = { ...row };
    for (const key of Object.keys(out)) {
        if (key.endsWith('_enc')) delete out[key];
    }
    let meta = out.meta;
    if (typeof meta === 'string') {
        try {
            meta = JSON.parse(meta);
        } catch {
            meta = {};
        }
    }
    if (meta && typeof meta === 'object') {
        const next = { ...meta };
        if (next.registry && typeof next.registry === 'object') {
            const { token, ...regRest } = next.registry;
            next.registry = {
                ...regRest,
                hasToken: Boolean(token),
            };
        }
        out.meta = next;
    }
    return out;
}

/**
 * GET /api/admin/trial-requests?type=hosted|self_hosted&stage=&status=&product=&q=
 * Joins the latest instance + source demo so the queue can render hosting chips,
 * aging and "came from demo" without N+1 calls.
 */
async function listTrialRequests(req, res, next) {
    try {
        const { status, product, q, type, stage } = req.query;
        let sql = `SELECT tr.*, p.slug AS product_slug, p.name AS product_name,
                          ti.id AS instance_id, ti.status AS instance_status, ti.expires_at AS instance_expires,
                          ti.shop_url AS instance_shop_url, ti.provision_mode,
                          src.created_at AS source_demo_started_at,
                          TIMESTAMPDIFF(HOUR, tr.created_at, NOW()) AS age_hours,
                          a.full_name AS assigned_admin_name
                   FROM trial_requests tr
                   JOIN products p ON p.id = tr.product_id
                   LEFT JOIN trial_instances ti ON ti.id = (
                       SELECT id FROM trial_instances WHERE request_id = tr.id ORDER BY created_at DESC LIMIT 1
                   )
                   LEFT JOIN trial_requests src ON src.id = tr.source_request_id
                   LEFT JOIN admin_profiles a ON a.id = tr.assigned_admin_id
                   WHERE 1=1`;
        const params = [];
        if (status) { params.push(status); sql += ` AND tr.status = $${params.length}`; }
        if (type && ['hosted', 'self_hosted'].includes(type)) { params.push(type); sql += ` AND tr.trial_type = $${params.length}`; }
        if (stage) { params.push(stage); sql += ` AND tr.fulfillment_stage = $${params.length}`; }
        if (product) { params.push(product); sql += ` AND p.slug = $${params.length}`; }
        if (q) {
            params.push(`%${q}%`);
            sql += ` AND (LOWER(tr.customer_name) LIKE LOWER($${params.length}) OR LOWER(tr.email) LIKE LOWER($${params.length}) OR LOWER(COALESCE(tr.desired_domain,'')) LIKE LOWER($${params.length}))`;
        }
        sql += ' ORDER BY tr.created_at DESC LIMIT 300';
        const { rows } = await pool.query(sql, params);
        res.json(rows.map((r) => ({ ...r, stage_history: parseHistory(r.stage_history) })));
    } catch (err) { next(err); }
}

/** Counts per stage / type for the queue header badges. */
async function getTrialRequestCounts(req, res, next) {
    try {
        const { rows } = await pool.query(`
            SELECT trial_type, status, fulfillment_stage, COUNT(*) AS n,
                   SUM(TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24
                       AND status = 'pending') AS overdue
              FROM trial_requests
             GROUP BY trial_type, status, fulfillment_stage
        `);
        const out = { demo: { total: 0, pending: 0, active: 0 }, domain: { total: 0, byStage: {}, overdue: 0 } };
        for (const r of rows) {
            const n = Number(r.n || 0);
            if (r.trial_type === 'hosted') {
                out.demo.total += n;
                if (r.status === 'pending') out.demo.pending += n;
                if (r.status === 'active') out.demo.active += n;
            } else {
                out.domain.total += n;
                const key = r.fulfillment_stage || 'received';
                out.domain.byStage[key] = (out.domain.byStage[key] || 0) + n;
                out.domain.overdue += Number(r.overdue || 0);
            }
        }
        res.json(out);
    } catch (err) { next(err); }
}

async function loadRequestWithProduct(id) {
    const { rows } = await pool.query(
        `SELECT tr.*, p.slug AS product_slug, p.name AS product_name
           FROM trial_requests tr JOIN products p ON p.id = tr.product_id WHERE tr.id = $1`,
        [id]
    );
    return rows[0] || null;
}

function stageError(res, err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
}

/** Staff takes ownership: received|hosting_pending → deploying. */
async function pickupTrialRequest(req, res, next) {
    try {
        const request = await loadRequestWithProduct(req.params.id);
        if (!request) return res.status(404).json({ error: 'Not found' });
        if (request.trial_type !== 'self_hosted') return res.status(400).json({ error: 'Only own-domain trials use the fulfillment pipeline' });

        await pool.query('UPDATE trial_requests SET assigned_admin_id = $1 WHERE id = $2', [req.admin?.id || null, request.id]);
        const updated = await setStage(request.id, STAGES.DEPLOYING, { by: req.admin?.id || null, note: req.body?.note || 'picked up' });
        res.json({ ok: true, request: { ...updated, stage_history: parseHistory(updated.stage_history) } });
    } catch (err) {
        try { stageError(res, err); } catch (e) { next(e); }
    }
}

/** Hosting sold/ready for buy_from_trialvo requests. Staff may record host kind now. */
async function confirmTrialHosting(req, res, next) {
    try {
        const request = await loadRequestWithProduct(req.params.id);
        if (!request) return res.status(404).json({ error: 'Not found' });
        if (request.hosting_source !== 'buy_from_trialvo') {
            return res.status(400).json({ error: 'This request already has its own hosting' });
        }
        const kind = String(req.body?.hostKind || '').toLowerCase();
        if (!HOST_KINDS.includes(kind)) return res.status(400).json({ error: 'hostKind must be vps or cpanel' });
        const domain = req.body?.domain ? normaliseDomain(req.body.domain) : request.desired_domain;

        await pool.query(
            `UPDATE trial_requests
                SET host_kind = $1, has_hosting = 1, desired_domain = COALESCE($2, desired_domain),
                    assigned_admin_id = COALESCE(assigned_admin_id, $3), updated_at = NOW()
              WHERE id = $4`,
            [kind, domain, req.admin?.id || null, request.id]
        );
        const updated = await setStage(request.id, STAGES.DEPLOYING, { by: req.admin?.id || null, note: req.body?.note || 'hosting confirmed' });
        res.json({ ok: true, request: { ...updated, stage_history: parseHistory(updated.stage_history) } });
    } catch (err) {
        try { stageError(res, err); } catch (e) { next(e); }
    }
}

/** Something went wrong mid-deploy — push it back to the queue. */
async function reopenTrialRequest(req, res, next) {
    try {
        const request = await loadRequestWithProduct(req.params.id);
        if (!request) return res.status(404).json({ error: 'Not found' });
        const updated = await setStage(request.id, STAGES.RECEIVED, { by: req.admin?.id || null, note: req.body?.note || 'reopened' });
        res.json({ ok: true, request: { ...updated, stage_history: parseHistory(updated.stage_history) } });
    } catch (err) {
        try { stageError(res, err); } catch (e) { next(e); }
    }
}

/**
 * POST /api/admin/trial-requests/:id/fulfill
 * Staff finished deploying on the customer's server. Creates a `manual`
 * instance (no agent, no remote commands), activates the request, emails the
 * customer. Body: { shopUrl, adminUrl, adminEmail?, adminPassword?, months?, notes? }
 */
async function fulfillTrialRequest(req, res, next) {
    try {
        const request = await loadRequestWithProduct(req.params.id);
        if (!request) return res.status(404).json({ error: 'Not found' });
        if (request.trial_type !== 'self_hosted') return res.status(400).json({ error: 'Only own-domain trials can be fulfilled manually' });
        if (request.status === 'rejected') return res.status(400).json({ error: 'Request was rejected' });

        const existingInst = await pool.query(
            'SELECT id FROM trial_instances WHERE request_id = $1 AND status NOT IN (\'destroyed\', \'failed\') LIMIT 1',
            [request.id]
        );
        if (existingInst.rows.length) return res.status(409).json({ error: 'This request already has a live instance' });

        const shopUrl = String(req.body?.shopUrl || '').trim();
        const adminUrl = String(req.body?.adminUrl || '').trim();
        if (!/^https?:\/\/\S+/.test(shopUrl) || !/^https?:\/\/\S+/.test(adminUrl)) {
            return res.status(400).json({ error: 'shopUrl and adminUrl must be full URLs (https://...)' });
        }
        if (request.hosting_source === 'buy_from_trialvo' && !request.has_hosting && !req.body?.hostKind) {
            return res.status(400).json({ error: 'Confirm hosting (VPS/cPanel) before fulfilling', code: 'HOSTING_NOT_CONFIRMED' });
        }

        const settings = await getTrialSettings();
        const months = clampMonths(req.body?.months, request.requested_months || settings.defaultMonths);
        const expiresAt = expiresAtForMonths(months);
        const adminEmail = String(req.body?.adminEmail || request.email).trim().toLowerCase();
        const adminPassword = req.body?.adminPassword ? String(req.body.adminPassword) : null;
        const notes = req.body?.notes ? String(req.body.notes).slice(0, 2000) : null;
        const hostKind = req.body?.hostKind ? String(req.body.hostKind).toLowerCase() : request.host_kind;

        const instanceId = uuidv4();
        const installId = uuidv4().replace(/-/g, '');
        let domain = null;
        try { domain = new URL(shopUrl).hostname.replace(/^www\./, ''); } catch { domain = request.desired_domain; }

        const meta = {
            note: 'Staff-deployed own-domain trial (no agent)',
            provisionMode: 'manual',
            hostKind,
            hostingSource: request.hosting_source,
            months,
            fulfilledBy: req.admin?.id || null,
            staffNotes: notes,
        };

        await pool.query(
            `INSERT INTO trial_instances (
               id, install_id, request_id, product_id, trial_type, status, provision_mode,
               domain, shop_url, admin_url, admin_email, admin_password_enc,
               started_at, expires_at, meta
             ) VALUES ($1,$2,$3,$4,'self_hosted','active','manual',$5,$6,$7,$8,$9,NOW(),$10,$11)`,
            [
                instanceId, installId, request.id, request.product_id,
                domain, shopUrl, adminUrl, adminEmail, adminPassword ? encrypt(adminPassword) : null,
                expiresAt, JSON.stringify(meta),
            ]
        );

        await pool.query(
            `UPDATE trial_requests
                SET status = 'active', approved_at = COALESCE(approved_at, NOW()), requested_months = $1,
                    requested_days = $2, host_kind = COALESCE($3, host_kind), has_hosting = 1,
                    admin_notes = CASE WHEN $4 IS NULL THEN admin_notes ELSE CONCAT(COALESCE(admin_notes,''), '\n[fulfill] ', $4) END,
                    assigned_admin_id = COALESCE(assigned_admin_id, $5), updated_at = NOW()
              WHERE id = $6`,
            [months, monthsToDays(months), hostKind, notes, req.admin?.id || null, request.id]
        );
        const updated = await setStage(request.id, STAGES.LIVE, { by: req.admin?.id || null, note: notes || 'deployed', force: true });

        await logEvent(instanceId, 'manual_fulfilled', { by: req.admin?.id, months, shopUrl, adminUrl, hostKind });

        const statusUrl = `${FRONTEND}/trial-status/${request.public_token}`;
        const productName = typeof request.product_name === 'object'
            ? (request.product_name?.en || request.product_name?.bn)
            : request.product_name;
        const mail = domainTrialLiveEmail({
            name: request.customer_name, productName, shopUrl, adminUrl,
            adminEmail: adminPassword ? adminEmail : null, expiresAt, notes, statusUrl,
        });
        sendMail({ to: request.email, ...mail }).catch((e) => console.error('[fulfill] live email failed:', e.message));

        res.json({
            ok: true,
            instanceId,
            expiresAt,
            months,
            request: { ...updated, stage_history: parseHistory(updated.stage_history) },
        });
    } catch (err) {
        try { stageError(res, err); } catch (e) { next(e); }
    }
}

async function getTrialRequest(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT tr.*, p.slug AS product_slug, p.name AS product_name
             FROM trial_requests tr JOIN products p ON p.id = tr.product_id WHERE tr.id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json({ ...rows[0], stage_history: parseHistory(rows[0].stage_history) });
    } catch (err) { next(err); }
}

async function approveTrialRequest(req, res, next) {
    try {
        const { days, notes } = req.body || {};
        const { rows } = await pool.query('SELECT * FROM trial_requests WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const request = rows[0];
        if (request.status !== 'pending') {
            return res.status(400).json({ error: `Cannot approve status: ${request.status}` });
        }
        if (notes) {
            await pool.query('UPDATE trial_requests SET admin_notes = $1 WHERE id = $2', [notes, request.id]);
        }

        const settings = await getTrialSettings();
        const defaultDays = defaultDaysForType(settings, request.trial_type);
        const trialDays = days ? clampDays(days, defaultDays) : clampDays(request.requested_days, defaultDays);

        const result = await provisionFromRequest(request, trialDays);
        res.json({ ok: true, trialDays, ...result });
    } catch (err) { next(err); }
}

async function rejectTrialRequest(req, res, next) {
    try {
        const { reason } = req.body || {};
        const { rows } = await pool.query('SELECT * FROM trial_requests WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        await pool.query(
            "UPDATE trial_requests SET status = 'rejected', admin_notes = COALESCE($1, admin_notes), updated_at = NOW() WHERE id = $2",
            [reason || null, req.params.id]
        );
        if (rows[0].trial_type === 'self_hosted') {
            await setStage(req.params.id, STAGES.REJECTED, { by: req.admin?.id || null, note: reason || null, force: true });
        }
        const { trialRejectedEmail } = require('../services/trialEmails');
        const mail = trialRejectedEmail({
            name: rows[0].customer_name,
            reason: reason || null,
        });
        await sendMail({ to: rows[0].email, ...mail });
        res.json({ ok: true });
    } catch (err) { next(err); }
}

async function patchTrialRequest(req, res, next) {
    try {
        const { admin_notes } = req.body || {};
        await pool.query('UPDATE trial_requests SET admin_notes = $1, updated_at = NOW() WHERE id = $2', [admin_notes, req.params.id]);
        const { rows } = await pool.query('SELECT * FROM trial_requests WHERE id = $1', [req.params.id]);
        res.json(rows[0]);
    } catch (err) { next(err); }
}

async function listInstances(req, res, next) {
    try {
        const { status, type, kind, scope } = req.query;
        let sql = `SELECT ti.*, p.slug AS product_slug, p.name AS product_name,
                          tr.customer_name, tr.email AS request_email,
                          le.customer_email AS entitlement_email,
                          le.license_key_hint, le.max_installs AS entitlement_max_installs
                   FROM trial_instances ti
                   JOIN products p ON p.id = ti.product_id
                   LEFT JOIN trial_requests tr ON tr.id = ti.request_id
                   LEFT JOIN license_entitlements le ON le.id = ti.entitlement_id
                   WHERE 1=1`;
        const params = [];

        // scope=deployments → paid + unlicensed only (separate admin dashboard)
        // scope=trials → trial only (default for legacy Trial Instances page)
        if (scope === 'deployments') {
            sql += ` AND ti.instance_kind IN ('paid', 'unlicensed')`;
        } else if (scope === 'trials' || (!scope && !kind)) {
            sql += ` AND (ti.instance_kind = 'trial' OR ti.instance_kind IS NULL)`;
        }
        if (kind) {
            params.push(kind);
            sql += ` AND ti.instance_kind = $${params.length}`;
        }
        if (status) { params.push(status); sql += ` AND ti.status = $${params.length}`; }
        if (type) { params.push(type); sql += ` AND ti.trial_type = $${params.length}`; }
        sql += ' ORDER BY ti.created_at DESC LIMIT 200';
        const { rows } = await pool.query(sql, params);
        res.json(rows.map(sanitizeInstanceForAdminList));
    } catch (err) { next(err); }
}

async function getInstance(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT ti.*, p.slug AS product_slug, p.name AS product_name,
                    tr.customer_name, tr.email AS request_email
             FROM trial_instances ti
             JOIN products p ON p.id = ti.product_id
             LEFT JOIN trial_requests tr ON tr.id = ti.request_id
             WHERE ti.id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(sanitizeInstanceForAdminList(rows[0]));
    } catch (err) { next(err); }
}

async function getInstanceEvents(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM instance_events WHERE instance_id = $1 ORDER BY created_at DESC LIMIT 100',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
}

async function enqueueCommand(instanceId, command, payload, adminId) {
    const id = uuidv4();
    await pool.query(
        `INSERT INTO remote_commands (id, instance_id, command, payload, created_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, instanceId, command, payload ? JSON.stringify(payload) : null, adminId || null]
    );
    return id;
}

async function setInstanceStatus(id, status) {
    const extra = status === 'frozen' ? ', frozen_at = NOW()' : '';
    await pool.query(`UPDATE trial_instances SET status = $1, updated_at = NOW()${extra} WHERE id = $2`, [status, id]);
}

/**
 * Staff-deployed instances have no agent: remote commands would sit in the
 * queue forever. For them, admin actions only record intent + status; the
 * actual server work happens by hand.
 */
function isManualInstance(inst) {
    if (!inst) return false;
    if (inst.provision_mode === 'manual') return true;
    const { parseInstanceMeta } = require('../services/sharedDemoProvisioner');
    return parseInstanceMeta(inst.meta).provisionMode === 'manual';
}

async function freezeInstance(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT admin_email, meta, trial_type, provision_mode FROM trial_instances WHERE id = $1',
            [req.params.id]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, revokeTrialAdmin } = require('../services/sharedDemoProvisioner');

        if (isManualInstance(inst)) {
            await setInstanceStatus(req.params.id, 'frozen');
            await logEvent(req.params.id, 'manual_frozen', { by: req.admin?.id, note: 'staff must disable on server' });
            return res.json({ ok: true, status: 'frozen', manual: true, message: 'Marked frozen. Disable the deployment on the customer server by hand.' });
        }

        if (inst && isSharedDemoInstance(inst)) {
            // Per-product demo: freeze = revoke ADMIN login on that product's demo DB
            const rev = await revokeTrialAdmin({ email: inst.admin_email, instance: inst });
            await setInstanceStatus(req.params.id, 'frozen');
            await logEvent(req.params.id, 'shared_demo_frozen', { by: req.admin?.id, revoke: rev });
            return res.json({ ok: true, status: 'frozen', sharedDemo: true });
        }

        await setInstanceStatus(req.params.id, 'frozen');
        await enqueueCommand(req.params.id, 'freeze', null, req.admin?.id);
        await logEvent(req.params.id, 'freeze', { by: req.admin?.id });
        res.json({ ok: true, status: 'frozen' });
    } catch (err) { next(err); }
}

async function unfreezeInstance(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT admin_email, admin_password_enc, meta, trial_type, provision_mode FROM trial_instances WHERE id = $1',
            [req.params.id]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, reactivateTrialAdmin } = require('../services/sharedDemoProvisioner');

        if (isManualInstance(inst)) {
            await setInstanceStatus(req.params.id, 'active');
            await logEvent(req.params.id, 'manual_unfrozen', { by: req.admin?.id });
            return res.json({ ok: true, status: 'active', manual: true });
        }

        if (inst && isSharedDemoInstance(inst)) {
            const password = inst.admin_password_enc ? decrypt(inst.admin_password_enc) : null;
            const act = await reactivateTrialAdmin({ email: inst.admin_email, password, instance: inst });
            await setInstanceStatus(req.params.id, 'active');
            await logEvent(req.params.id, 'shared_demo_unfrozen', { by: req.admin?.id, reactivate: act });
            return res.json({ ok: true, status: 'active', sharedDemo: true });
        }

        await setInstanceStatus(req.params.id, 'active');
        await enqueueCommand(req.params.id, 'unfreeze', null, req.admin?.id);
        await logEvent(req.params.id, 'unfreeze', { by: req.admin?.id });
        res.json({ ok: true, status: 'active' });
    } catch (err) { next(err); }
}

async function extendInstance(req, res, next) {
    try {
        const days = parseInt(req.body?.days, 10) || 7;
        const { rows } = await pool.query(
            'SELECT admin_email, admin_password_enc, meta, status, provision_mode, request_id FROM trial_instances WHERE id = $1',
            [req.params.id]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, reactivateTrialAdmin } = require('../services/sharedDemoProvisioner');

        await pool.query(
            'UPDATE trial_instances SET expires_at = DATE_ADD(COALESCE(expires_at, NOW()), INTERVAL ? DAY), status = \'active\', updated_at = NOW() WHERE id = ?',
            [days, req.params.id]
        );

        if (isManualInstance(inst)) {
            // Extending a live domain trial pulls it back out of "expiring"/"expired".
            if (inst.request_id) {
                await setStage(inst.request_id, STAGES.LIVE, { by: req.admin?.id || null, note: `extended ${days}d`, force: true });
            }
            await logEvent(req.params.id, 'manual_extended', { days, by: req.admin?.id });
            return res.json({ ok: true, days, manual: true });
        }

        if (inst && isSharedDemoInstance(inst)) {
            const password = inst.admin_password_enc ? decrypt(inst.admin_password_enc) : null;
            await reactivateTrialAdmin({ email: inst.admin_email, password, instance: inst });
            await logEvent(req.params.id, 'shared_demo_extended', { days });
            return res.json({ ok: true, days, sharedDemo: true });
        }

        await enqueueCommand(req.params.id, 'extend', { days }, req.admin?.id);
        await logEvent(req.params.id, 'extend', { days });
        res.json({ ok: true, days });
    } catch (err) { next(err); }
}

async function destroyInstance(req, res, next) {
    try {
        const instanceId = req.params.id;
        const mode = req.body?.mode === 'hard' ? 'destroy_hard' : 'destroy_soft';
        const hard = req.body?.mode === 'hard';

        const { rows } = await pool.query(
            'SELECT admin_email, meta, trial_type, provision_mode FROM trial_instances WHERE id = $1',
            [instanceId]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, revokeTrialAdmin } = require('../services/sharedDemoProvisioner');

        if (isManualInstance(inst)) {
            await setInstanceStatus(instanceId, 'destroyed');
            await logEvent(instanceId, 'manual_destroyed', { mode, by: req.admin?.id, note: 'staff removed deployment by hand' });
            return res.json({ ok: true, status: 'destroyed', mode, manual: true, message: 'Marked destroyed. Remove the deployment from the customer server by hand.' });
        }

        // Shared demo Option 1: revoke ADMIN only — never compose down
        if (inst && isSharedDemoInstance(inst)) {
            await setInstanceStatus(instanceId, 'destroying');
            const rev = await revokeTrialAdmin({ email: inst.admin_email, instance: inst });
            await setInstanceStatus(instanceId, 'destroyed');
            await logEvent(instanceId, 'shared_demo_revoked', { mode, revoke: rev, by: req.admin?.id });
            return res.json({
                ok: true,
                status: 'destroyed',
                mode,
                sharedDemo: true,
                message: 'Revoked demo admin access. Shared stack was not shut down.',
            });
        }

        await setInstanceStatus(instanceId, 'destroying');
        await enqueueCommand(instanceId, mode, { mode: hard ? 'hard' : 'soft' }, req.admin?.id);
        await logEvent(instanceId, 'destroy_requested', { mode });

        // Return immediately so the admin UI does not spin while Docker tears down
        res.json({ ok: true, status: 'destroying', mode });

        // Opt1 legacy docker stacks / Opt2 agent path
        setImmediate(() => {
            tearDownHostedDocker(instanceId, hard).catch((err) => {
                console.error(`[destroy] background teardown failed for ${instanceId}:`, err.message || err);
            });
        });
    } catch (err) { next(err); }
}

/**
 * Hosted stacks removed by Control Plane (legacy per-trial Docker only).
 * Shared demo grants never reach here for teardown.
 */
async function tearDownHostedDocker(instanceId, hard) {
    const { rows } = await pool.query(
        'SELECT trial_type, meta FROM trial_instances WHERE id = $1',
        [instanceId]
    );
    if (!rows.length) return;
    if (rows[0].trial_type !== 'hosted') return;

    const { isSharedDemoInstance, parseInstanceMeta } = require('../services/sharedDemoProvisioner');
    if (isSharedDemoInstance(rows[0])) {
        await logEvent(instanceId, 'docker_destroy_skipped', { reason: 'shared_demo' });
        return;
    }

    const meta = parseInstanceMeta(rows[0].meta);
    const projectDir = meta.docker?.projectDir;
    if (!projectDir) {
        await logEvent(instanceId, 'docker_destroy_skipped', { reason: 'no_projectDir' });
        return;
    }

    const { destroyDockerStack } = require('../services/dockerProvisioner');
    const tear = await destroyDockerStack(projectDir, { hard });
    await logEvent(instanceId, tear.ok ? 'docker_destroyed' : 'docker_destroy_failed', { hard, ...tear });
    if (tear.ok) {
        await setInstanceStatus(instanceId, 'destroyed');
    }
}

/**
 * Download Opt2 installer zip for an instance (admin).
 */
async function downloadInstaller(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT ti.*, tr.desired_domain, p.slug AS product_slug, p.deploy_config
             FROM trial_instances ti
             LEFT JOIN trial_requests tr ON tr.id = ti.request_id
             LEFT JOIN products p ON p.id = ti.product_id
             WHERE ti.id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const inst = rows[0];
        if (inst.trial_type !== 'self_hosted') {
            return res.status(400).json({ error: 'Installer only for self_hosted trials' });
        }
        if (!inst.agent_secret_enc || !inst.bootstrap_token_enc) {
            return res.status(400).json({ error: 'Instance secrets missing' });
        }

        const meta = (typeof inst.meta === 'object' && inst.meta) ? inst.meta : {};
        if (meta.registry?.revoked) {
            return res.status(410).json({ error: 'Registry token revoked — trial ended' });
        }

        let registry = meta.registry;
        if (!registry?.token) {
            const { issueRegistryCredentials } = require('../services/packager');
            registry = issueRegistryCredentials({ installId: inst.install_id, expiresAt: inst.expires_at });
            await pool.query(
                `UPDATE trial_instances SET meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), ?) WHERE id = ?`,
                [JSON.stringify({ registry }), inst.id]
            );
        }

        const zip = buildTrialInstallerZip({
            installId: inst.install_id,
            agentSecret: decrypt(inst.agent_secret_enc),
            bootstrapToken: decrypt(inst.bootstrap_token_enc),
            domain: inst.domain || inst.desired_domain,
            backupKey: inst.backup_key_enc ? decrypt(inst.backup_key_enc) : '',
            registryCreds: registry,
            adminEmail: inst.admin_email || '',
            adminPassword: inst.admin_password_enc ? decrypt(inst.admin_password_enc) : '',
            productSlug: inst.product_slug || 'lifestyle-ecommerce',
            deployConfig: inst.deploy_config,
        });

        await logEvent(inst.id, 'installer_downloaded', { by: req.admin?.id, admin: true });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zip.filename}"`);
        res.send(zip.buffer);
    } catch (err) { next(err); }
}

async function backupInstance(req, res, next) {
    try {
        const cmdId = await enqueueCommand(req.params.id, 'backup_now', null, req.admin?.id);
        res.json({ ok: true, commandId: cmdId });
    } catch (err) { next(err); }
}

async function listInstanceBackups(req, res, next) {
    try {
        const rows = await listBackups(req.params.id);
        res.setHeader('X-Backup-Keep-Count', String(backupKeepCount()));
        res.json(rows);
    } catch (err) { next(err); }
}

/**
 * Production migration export: decrypt latest/chosen backup → ZIP with
 * database.sql + uploads/ + README (lossless). Customer imports into prod DB.
 */
async function exportInstanceBackup(req, res, next) {
    try {
        const instanceId = req.params.id;
        let backupId = req.params.backupId || req.query.backupId;

        if (!backupId || backupId === 'latest') {
            const rows = await listBackups(instanceId);
            const latest = rows.find((b) => b.status === 'completed');
            if (!latest) return res.status(404).json({ error: 'No completed backup to export' });
            backupId = latest.id;
        }

        const stored = await openStoredBackup(instanceId, backupId);
        if (!stored) return res.status(404).json({ error: 'Completed backup not found' });

        const { rows: instRows } = await pool.query(
            'SELECT install_id, domain FROM trial_instances WHERE id = $1',
            [instanceId]
        );
        const inst = instRows[0] || {};

        const zip = buildMigrationZip(stored.opened, {
            domain: inst.domain,
            installId: inst.install_id,
        });

        await logEvent(instanceId, 'backup_exported', {
            backupId,
            format: stored.opened.type || stored.opened.version,
            sizeBytes: zip.length,
            by: req.admin?.id,
        });

        const short = String(backupId).slice(0, 8);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="trial-migration-${short}.zip"`
        );
        res.setHeader('X-Backup-Id', backupId);
        res.setHeader('X-Backup-Format', String(stored.opened.type || stored.opened.version));
        res.send(zip);
    } catch (err) { next(err); }
}

async function restoreInstance(req, res, next) {
    try {
        const backupId = req.body?.backupId;
        if (!backupId) return res.status(400).json({ error: 'backupId required' });

        const backup = await getBackupForInstance(req.params.id, backupId);
        if (!backup) return res.status(404).json({ error: 'Completed backup not found for this instance' });

        const cmdId = await enqueueCommand(
            req.params.id,
            'restore',
            { backupId, storageKey: backup.storage_key },
            req.admin?.id
        );
        await logEvent(req.params.id, 'restore_requested', { backupId, by: req.admin?.id });
        res.json({ ok: true, commandId: cmdId, backupId });
    } catch (err) { next(err); }
}

async function getInstanceCredentials(req, res, next) {
    try {
        const { rows } = await pool.query('SELECT admin_email, admin_password_enc FROM trial_instances WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        await logEvent(req.params.id, 'credentials_viewed', { by: req.admin?.id });
        res.json({
            adminEmail: rows[0].admin_email,
            adminPassword: rows[0].admin_password_enc ? decrypt(rows[0].admin_password_enc) : null,
        });
    } catch (err) { next(err); }
}

/**
 * Download paid Docker or cPanel pack for a paid/unlicensed→paid instance.
 * GET /:id/pack?format=docker|cpanel
 */
async function downloadPaidPack(req, res, next) {
    try {
        const format = (req.query.format || 'docker').toLowerCase();
        const { rows } = await pool.query(
            `SELECT ti.*, p.slug AS product_slug, p.deploy_config
             FROM trial_instances ti
             LEFT JOIN products p ON p.id = ti.product_id
             WHERE ti.id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const inst = rows[0];
        if (inst.instance_kind === 'trial') {
            return res.status(400).json({ error: 'Use installer endpoint for trial instances' });
        }
        if (!inst.agent_secret_enc || !inst.bootstrap_token_enc) {
            return res.status(400).json({ error: 'Instance secrets missing' });
        }

        const { buildPaidDockerZip, buildPaidCpanelZip, issueRegistryCredentials } = require('../services/packager');
        const ctx = {
            installId: inst.install_id,
            agentSecret: decrypt(inst.agent_secret_enc),
            bootstrapToken: decrypt(inst.bootstrap_token_enc),
            domain: inst.domain || '',
            backupKey: inst.backup_key_enc ? decrypt(inst.backup_key_enc) : '',
            adminEmail: inst.admin_email || '',
            expiresAt: inst.expires_at,
            productSlug: inst.product_slug || 'lifestyle-ecommerce',
            deployConfig: inst.deploy_config,
        };

        let zip;
        if (format === 'cpanel') {
            zip = buildPaidCpanelZip(ctx);
        } else {
            let meta = typeof inst.meta === 'object' && inst.meta ? inst.meta : {};
            if (typeof inst.meta === 'string') {
                try { meta = JSON.parse(inst.meta); } catch { meta = {}; }
            }
            let registry = meta.registry;
            if (!registry?.token) {
                registry = issueRegistryCredentials({ installId: inst.install_id, expiresAt: inst.expires_at });
                await pool.query(
                    `UPDATE trial_instances SET meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), ?) WHERE id = ?`,
                    [JSON.stringify({ registry, hostMode: 'docker' }), inst.id]
                );
            }
            zip = buildPaidDockerZip({ ...ctx, registryCreds: registry });
        }

        await logEvent(inst.id, 'paid_pack_downloaded', { format, by: req.admin?.id });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zip.filename}"`);
        res.send(zip.buffer);
    } catch (err) { next(err); }
}

async function transferInstanceDomain(req, res, next) {
    try {
        const newDomain = String(req.body?.domain || '').trim();
        if (!newDomain) return res.status(400).json({ error: 'domain required' });
        const { transferDomain } = require('../services/licenseEntitlements');
        const result = await transferDomain(req.params.id, newDomain, { by: req.admin?.id });
        await enqueueCommand(req.params.id, 'unfreeze', null, req.admin?.id);
        // Clear conflict flag
        await pool.query(
            `UPDATE trial_instances SET meta = JSON_REMOVE(COALESCE(meta, '{}'), '$.domain_conflict', '$.alert'), updated_at = NOW() WHERE id = $1`,
            [req.params.id]
        );
        res.json(result);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
}

async function convertInstanceToPaid(req, res, next) {
    try {
        const entitlementId = req.body?.entitlementId;
        if (!entitlementId) return res.status(400).json({ error: 'entitlementId required' });
        const { convertUnlicensedToPaid } = require('../services/licenseEntitlements');
        const result = await convertUnlicensedToPaid(req.params.id, entitlementId, { by: req.admin?.id });
        await enqueueCommand(req.params.id, 'unfreeze', null, req.admin?.id);
        res.json(result);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
}

/** Lightweight counts for Deployments dashboard header. */
async function getDeploymentAnalytics(req, res, next) {
    try {
        const { rows } = await pool.query(`
            SELECT
              SUM(instance_kind = 'paid' AND status = 'active') AS paid_active,
              SUM(instance_kind = 'paid' AND status = 'frozen') AS paid_frozen,
              SUM(instance_kind = 'unlicensed') AS unlicensed,
              SUM(instance_kind IN ('paid','unlicensed')
                  AND JSON_UNQUOTE(JSON_EXTRACT(meta, '$.alert')) = 'domain_conflict') AS domain_conflicts,
              SUM(instance_kind IN ('paid','unlicensed') AND last_heartbeat_at IS NOT NULL
                  AND last_heartbeat_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
                  AND status NOT IN ('destroyed','destroying')) AS stale_heartbeat
            FROM trial_instances
            WHERE instance_kind IN ('paid', 'unlicensed')
        `);
        const r = rows[0] || {};
        res.json({
            paidActive: Number(r.paid_active || 0),
            paidFrozen: Number(r.paid_frozen || 0),
            unlicensed: Number(r.unlicensed || 0),
            domainConflicts: Number(r.domain_conflicts || 0),
            staleHeartbeat: Number(r.stale_heartbeat || 0),
        });
    } catch (err) { next(err); }
}

module.exports = {
    listTrialRequests, getTrialRequest, approveTrialRequest, rejectTrialRequest, patchTrialRequest,
    getTrialRequestCounts, pickupTrialRequest, confirmTrialHosting, reopenTrialRequest, fulfillTrialRequest,
    listInstances, getInstance, getInstanceEvents,
    freezeInstance, unfreezeInstance, extendInstance, destroyInstance,
    backupInstance, restoreInstance, listInstanceBackups, getInstanceCredentials,
    downloadInstaller, exportInstanceBackup,
    downloadPaidPack, transferInstanceDomain, convertInstanceToPaid, getDeploymentAnalytics,
};
