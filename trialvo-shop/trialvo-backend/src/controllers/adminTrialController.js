const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { decrypt } = require('../utils/crypto');
const { sendMail } = require('../services/mailer');
const { provisionFromRequest } = require('../services/provisioner');
const { logEvent } = require('../services/trialEvents');
const { getTrialSettings, defaultDaysForType, clampDays } = require('../services/trialSettings');
const { listBackups, getBackupForInstance, openStoredBackup, backupKeepCount } = require('../services/backupService');
const { buildMigrationZip } = require('../services/trialBackupCodec');
const { buildInstallerZip } = require('../services/packager');

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

async function listTrialRequests(req, res, next) {
    try {
        const { status, product, q } = req.query;
        let sql = `SELECT tr.*, p.slug AS product_slug, p.name AS product_name
                   FROM trial_requests tr JOIN products p ON p.id = tr.product_id WHERE 1=1`;
        const params = [];
        if (status) { params.push(status); sql += ` AND tr.status = $${params.length}`; }
        if (product) { params.push(product); sql += ` AND p.slug = $${params.length}`; }
        if (q) {
            params.push(`%${q}%`);
            sql += ` AND (LOWER(tr.customer_name) LIKE LOWER($${params.length}) OR LOWER(tr.email) LIKE LOWER($${params.length}))`;
        }
        sql += ' ORDER BY tr.created_at DESC LIMIT 200';
        const { rows } = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
}

async function getTrialRequest(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT tr.*, p.slug AS product_slug, p.name AS product_name
             FROM trial_requests tr JOIN products p ON p.id = tr.product_id WHERE tr.id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
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

async function freezeInstance(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT admin_email, meta, trial_type FROM trial_instances WHERE id = $1',
            [req.params.id]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, revokeTrialAdmin } = require('../services/sharedDemoProvisioner');

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
            'SELECT admin_email, admin_password_enc, meta, trial_type FROM trial_instances WHERE id = $1',
            [req.params.id]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, reactivateTrialAdmin } = require('../services/sharedDemoProvisioner');

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
            'SELECT admin_email, admin_password_enc, meta, status FROM trial_instances WHERE id = $1',
            [req.params.id]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, reactivateTrialAdmin } = require('../services/sharedDemoProvisioner');

        await pool.query(
            'UPDATE trial_instances SET expires_at = DATE_ADD(COALESCE(expires_at, NOW()), INTERVAL ? DAY), status = \'active\', updated_at = NOW() WHERE id = ?',
            [days, req.params.id]
        );

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
            'SELECT admin_email, meta, trial_type FROM trial_instances WHERE id = $1',
            [instanceId]
        );
        const inst = rows[0];
        const { isSharedDemoInstance, revokeTrialAdmin } = require('../services/sharedDemoProvisioner');

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

        const zip = buildInstallerZip({
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
    listInstances, getInstance, getInstanceEvents,
    freezeInstance, unfreezeInstance, extendInstance, destroyInstance,
    backupInstance, restoreInstance, listInstanceBackups, getInstanceCredentials,
    downloadInstaller, exportInstanceBackup,
    downloadPaidPack, transferInstanceDomain, convertInstanceToPaid, getDeploymentAnalytics,
};
