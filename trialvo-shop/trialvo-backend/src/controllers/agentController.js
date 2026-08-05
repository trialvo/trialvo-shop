const { pool } = require('../config/db');
const { issueLease } = require('../services/leaseIssuer');
const { logEvent } = require('../services/trialEvents');
const crypto = require('crypto');
const { hmacSign } = require('../utils/crypto');
const {
    getUploadInstructions,
    storeBackupBlob,
    completeBackup,
    getBackupForInstance,
    ensureBackupKey,
} = require('../services/backupService');
const { openReadStreamAsync } = require('../services/storage');
const { CURRENT_AGENT_VERSION, isAgentOutdated } = require('../services/agentVersion');
const { parseMeta, normalizeDomain, handleDomainConflict } = require('../services/licenseEntitlements');

/** Default steady-state poll (seconds). Override with AGENT_HEARTBEAT_INTERVAL_SEC. */
const HEARTBEAT_INTERVAL_SEC = parseInt(process.env.AGENT_HEARTBEAT_INTERVAL_SEC || '600', 10);
/** When remote commands are pending, ask agents to poll faster for snappy control. */
const HEARTBEAT_FAST_SEC = parseInt(process.env.AGENT_HEARTBEAT_FAST_SEC || '30', 10);
const LEASE_INTERVAL_SEC = parseInt(process.env.AGENT_LEASE_INTERVAL_SEC || '1800', 10);

async function registerAgent(req, res, next) {
    try {
        const { installId, domain, agentVersion, productVersion, fingerprint } = req.body;
        const outdated = isAgentOutdated(agentVersion);
        const inst = req.instance;

        const conflict = await handleDomainConflict(inst, domain);
        if (conflict.conflict) {
            return res.status(403).json({
                ok: false,
                error: 'Domain conflict — this install is licensed to another domain',
                code: 'DOMAIN_CONFLICT',
                previousDomain: conflict.previous,
                heartbeatInterval: HEARTBEAT_INTERVAL_SEC,
                leaseInterval: LEASE_INTERVAL_SEC,
            });
        }

        const metaPatch = {
            productVersion,
            agent_outdated: outdated,
            required_agent_version: CURRENT_AGENT_VERSION,
            ...(fingerprint ? { fingerprint } : {}),
            last_register_at: new Date().toISOString(),
        };

        if (inst.domain) {
            await pool.query(
                `UPDATE trial_instances SET
                  agent_version = $1,
                  started_at = COALESCE(started_at, NOW()),
                  updated_at = NOW(),
                  meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), $2),
                  status = CASE
                    WHEN instance_kind = 'unlicensed' THEN 'frozen'
                    WHEN status IN ('destroyed','destroying','frozen') THEN status
                    WHEN JSON_UNQUOTE(JSON_EXTRACT(COALESCE(meta,'{}'), '$.alert')) = 'domain_conflict' THEN 'frozen'
                    ELSE 'active'
                  END,
                  frozen_at = CASE
                    WHEN instance_kind = 'unlicensed' THEN COALESCE(frozen_at, NOW())
                    WHEN status = 'frozen' THEN frozen_at
                    ELSE frozen_at
                  END
                 WHERE id = $3`,
                [agentVersion || null, JSON.stringify(metaPatch), inst.id]
            );
        } else {
            await pool.query(
                `UPDATE trial_instances SET
                  domain = COALESCE($1, domain),
                  agent_version = $2,
                  started_at = COALESCE(started_at, NOW()),
                  updated_at = NOW(),
                  meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), $3),
                  status = CASE
                    WHEN instance_kind = 'unlicensed' THEN 'frozen'
                    WHEN status IN ('destroyed','destroying','frozen') THEN status
                    ELSE 'active'
                  END,
                  frozen_at = CASE WHEN instance_kind = 'unlicensed' THEN COALESCE(frozen_at, NOW()) ELSE frozen_at END
                 WHERE id = $4`,
                [domain || null, agentVersion || null, JSON.stringify(metaPatch), inst.id]
            );
        }

        await logEvent(inst.id, 'agent_register', {
            domain,
            agentVersion,
            outdated,
            kind: inst.instance_kind || 'trial',
            authVia: req.authVia || 'agent',
        });

        // One-shot bootstrap: clear after first successful register so stolen ZIPs cannot re-bootstrap
        if (inst.bootstrap_token_enc) {
            await pool.query(
                `UPDATE trial_instances SET
                   bootstrap_token_enc = NULL,
                   meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), $1),
                   updated_at = NOW()
                 WHERE id = $2`,
                [JSON.stringify({ bootstrap_consumed_at: new Date().toISOString() }), inst.id]
            );
        }

        res.json({
            ok: true,
            instanceKind: inst.instance_kind || 'trial',
            heartbeatInterval: HEARTBEAT_INTERVAL_SEC,
            leaseInterval: LEASE_INTERVAL_SEC,
            requiredAgentVersion: CURRENT_AGENT_VERSION,
            agentUpdate: outdated
                ? { required: CURRENT_AGENT_VERSION, current: agentVersion }
                : null,
        });
    } catch (err) { next(err); }
}

async function heartbeat(req, res, next) {
    try {
        const inst = req.instance;
        const reportedVersion = req.body?.agentVersion || inst.agent_version || null;
        const outdated = isAgentOutdated(reportedVersion);
        const reportedDomain = req.body?.domain;

        if (reportedDomain) {
            const conflict = await handleDomainConflict(inst, reportedDomain);
            if (conflict.conflict) {
                return res.json({
                    ok: true,
                    commands: [{ id: 'local-freeze', command: 'freeze', payload: { reason: 'domain_conflict' } }],
                    agentUpdate: null,
                    code: 'DOMAIN_CONFLICT',
                });
            }
        }

        // Heartbeat updates row only — do not write instance_events (scale: N×poll/day).
        await pool.query(
            `UPDATE trial_instances SET
              last_heartbeat_at = NOW(),
              updated_at = NOW(),
              agent_version = COALESCE($2, agent_version),
              meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), $3)
             WHERE id = $1`,
            [
                inst.id,
                reportedVersion,
                JSON.stringify({
                    agent_outdated: outdated,
                    required_agent_version: CURRENT_AGENT_VERSION,
                    last_reported_agent_version: reportedVersion,
                    last_reported_domain: reportedDomain || null,
                }),
            ]
        );

        const pending = await pool.query(
            "SELECT id, command, payload FROM remote_commands WHERE instance_id = $1 AND status = 'pending' ORDER BY created_at ASC LIMIT 10",
            [inst.id]
        );
        if (pending.rows.length) {
            const ids = pending.rows.map((r) => r.id);
            const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
            await pool.query(
                `UPDATE remote_commands SET status = 'sent', sent_at = NOW() WHERE id IN (${placeholders})`,
                ids
            );
        }

        const nextInterval = pending.rows.length
            ? Math.max(15, HEARTBEAT_FAST_SEC)
            : Math.max(60, HEARTBEAT_INTERVAL_SEC);

        res.json({
            ok: true,
            commands: pending.rows.map((r) => ({
                id: r.id,
                command: r.command,
                payload: r.payload,
            })),
            heartbeatInterval: nextInterval,
            agentUpdate: outdated
                ? {
                    required: CURRENT_AGENT_VERSION,
                    current: reportedVersion,
                    message: 'Please upgrade the license agent',
                }
                : null,
        });
    } catch (err) { next(err); }
}

async function requestLease(req, res, next) {
    try {
        let inst = req.instance;

        // Fresh read for status/kind
        const { rows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [inst.id]);
        inst = rows[0] || inst;

        if (inst.instance_kind === 'unlicensed') {
            return res.json({ state: 'frozen', lease: null, code: 'UNLICENSED' });
        }

        const meta = parseMeta(inst.meta);
        if (meta.domain_conflict) {
            return res.json({ state: 'frozen', lease: null, code: 'DOMAIN_CONFLICT' });
        }

        const incoming = normalizeDomain(req.body?.domain);
        const bound = normalizeDomain(inst.domain);
        if (bound && incoming && bound !== incoming) {
            await handleDomainConflict(inst, req.body.domain);
            return res.json({ state: 'frozen', lease: null, code: 'DOMAIN_CONFLICT' });
        }

        const state = ['active'].includes(inst.status) ? 'active' : 'frozen';
        let lease = null;
        if (state === 'active' && inst.expires_at && new Date(inst.expires_at) < new Date()) {
            await pool.query("UPDATE trial_instances SET status = 'expired' WHERE id = $1", [inst.id]);
            return res.json({ state: 'frozen', lease: null });
        }
        if (state === 'active') {
            lease = issueLease({
                installId: inst.install_id,
                domain: inst.domain || req.body?.domain,
                state: 'active',
            });
            await pool.query('UPDATE trial_instances SET last_lease_issued_at = NOW() WHERE id = $1', [inst.id]);
            await logEvent(inst.id, 'lease_issued', { kind: inst.instance_kind || 'trial' });
        }
        res.json({ state, lease, expiresIn: lease ? 7200 : 0 });
    } catch (err) { next(err); }
}

async function ackCommand(req, res, next) {
    try {
        const { status, result } = req.body;
        const cmdStatus = status === 'succeeded' ? 'succeeded' : 'failed';
        await pool.query(
            `UPDATE remote_commands SET status = $1, result = $2, acknowledged_at = NOW(), completed_at = NOW()
             WHERE id = $3 AND instance_id = $4`,
            [cmdStatus, result ? JSON.stringify(result) : null, req.params.id, req.instance.id]
        );
        const { rows: cmdRows } = await pool.query(
            'SELECT command FROM remote_commands WHERE id = $1 AND instance_id = $2',
            [req.params.id, req.instance.id]
        );

        const command = cmdRows[0]?.command;
        if (cmdStatus === 'succeeded' && (command === 'destroy_soft' || command === 'destroy_hard')) {
            const { rows: instRows } = await pool.query(
                'SELECT meta FROM trial_instances WHERE id = $1',
                [req.instance.id]
            );
            let meta = instRows[0]?.meta;
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch { meta = {}; }
            }
            meta = meta && typeof meta === 'object' ? meta : {};
            meta.registry = {
                ...(meta.registry && typeof meta.registry === 'object' ? meta.registry : {}),
                revoked: true,
                revoked_at: new Date().toISOString(),
            };
            await pool.query(
                `UPDATE trial_instances SET
                   status = 'destroyed',
                   meta = $1,
                   updated_at = NOW()
                 WHERE id = $2`,
                [JSON.stringify(meta), req.instance.id]
            );
            await logEvent(req.instance.id, 'destroy_completed', {
                command,
                backupId: result?.preDestroyBackupId || null,
            });
        }

        res.json({ ok: true });
    } catch (err) { next(err); }
}

async function getBackupUploadUrl(req, res, next) {
    try {
        const trigger = req.query.trigger || req.body?.trigger || 'manual';
        const instructions = await getUploadInstructions(req.instance, { trigger });
        res.json({ ok: true, ...instructions });
    } catch (err) { next(err); }
}

async function uploadBackupBlob(req, res, next) {
    try {
        const backupId = req.body?.backupId || req.query?.backupId;
        if (!backupId) return res.status(400).json({ error: 'backupId required' });
        if (!req.file?.buffer) return res.status(400).json({ error: 'file required' });
        const checksumSha256 = req.body?.checksumSha256 || null;
        const stored = await storeBackupBlob(req.instance.id, backupId, req.file.buffer, { checksumSha256 });
        res.json(stored);
    } catch (err) {
        if (err.status === 404) return res.status(404).json({ error: err.message });
        next(err);
    }
}

async function completeBackupUpload(req, res, next) {
    try {
        const { backupId, checksumSha256, sizeBytes } = req.body || {};
        if (!backupId) return res.status(400).json({ error: 'backupId required' });
        const row = await completeBackup(req.instance.id, backupId, { checksumSha256, sizeBytes });
        res.json({ ok: true, backup: row });
    } catch (err) {
        if (err.status === 404) return res.status(404).json({ error: err.message });
        next(err);
    }
}

async function downloadBackupBlob(req, res, next) {
    try {
        const { backupId } = req.params;
        const row = await getBackupForInstance(req.instance.id, backupId);
        if (!row) return res.status(404).json({ error: 'Backup not found' });

        const key = await ensureBackupKey(req.instance.id);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('X-Backup-Key', key);
        res.setHeader('Content-Disposition', `attachment; filename="${backupId}.enc"`);
        const stream = await openReadStreamAsync(row.storage_key);
        stream.pipe(res);
    } catch (err) { next(err); }
}

function buildAgentHeaders(installId, secret, body = {}) {
    const timestamp = String(Date.now());
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const signature = hmacSign(secret, `${installId}.${timestamp}.${bodyHash}`);
    return {
        'X-Install-Id': installId,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'Content-Type': 'application/json',
    };
}

module.exports = {
    registerAgent,
    heartbeat,
    requestLease,
    ackCommand,
    getBackupUploadUrl,
    uploadBackupBlob,
    completeBackupUpload,
    downloadBackupBlob,
    buildAgentHeaders,
};
