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

async function registerAgent(req, res, next) {
    try {
        const { installId, domain, agentVersion, productVersion } = req.body;
        const outdated = isAgentOutdated(agentVersion);
        await pool.query(
            `UPDATE trial_instances SET
              status = 'active', domain = COALESCE($1, domain),
              agent_version = $2, started_at = COALESCE(started_at, NOW()),
              updated_at = NOW(),
              meta = COALESCE(meta, '{}'::jsonb) || $3::jsonb
             WHERE id = $4`,
            [
                domain || null,
                agentVersion || null,
                JSON.stringify({
                    productVersion,
                    agent_outdated: outdated,
                    required_agent_version: CURRENT_AGENT_VERSION,
                }),
                req.instance.id,
            ]
        );
        await logEvent(req.instance.id, 'agent_register', { domain, agentVersion, outdated });
        res.json({
            ok: true,
            heartbeatInterval: 900,
            leaseInterval: 1800,
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

        await pool.query(
            `UPDATE trial_instances SET
              last_heartbeat_at = NOW(),
              updated_at = NOW(),
              agent_version = COALESCE($2, agent_version),
              meta = COALESCE(meta, '{}'::jsonb) || $3::jsonb
             WHERE id = $1`,
            [
                inst.id,
                reportedVersion,
                JSON.stringify({
                    agent_outdated: outdated,
                    required_agent_version: CURRENT_AGENT_VERSION,
                    last_reported_agent_version: reportedVersion,
                }),
            ]
        );
        await logEvent(inst.id, 'heartbeat', {
            ...(req.body?.metrics || {}),
            agentVersion: reportedVersion,
            outdated,
        });

        const pending = await pool.query(
            "SELECT id, command, payload FROM remote_commands WHERE instance_id = $1 AND status = 'pending' ORDER BY created_at ASC LIMIT 10",
            [inst.id]
        );
        if (pending.rows.length) {
            const ids = pending.rows.map((r) => r.id);
            await pool.query(
                `UPDATE remote_commands SET status = 'sent', sent_at = NOW() WHERE id = ANY($1::text[])`,
                [ids]
            );
        }

        res.json({
            ok: true,
            commands: pending.rows.map((r) => ({
                id: r.id,
                command: r.command,
                payload: r.payload,
            })),
            agentUpdate: outdated
                ? {
                    required: CURRENT_AGENT_VERSION,
                    current: reportedVersion,
                    message: 'Please upgrade the trial license agent',
                }
                : null,
        });
    } catch (err) { next(err); }
}

async function requestLease(req, res, next) {
    try {
        const inst = req.instance;
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
            await logEvent(inst.id, 'lease_issued', null);
        }
        res.json({ state, lease, expiresIn: lease ? 7200 : 0 });
    } catch (err) { next(err); }
}

async function ackCommand(req, res, next) {
    try {
        const { status, result } = req.body;
        const cmdStatus = status === 'succeeded' ? 'succeeded' : 'failed';
        const { rows: cmdRows } = await pool.query(
            `UPDATE remote_commands SET status = $1, result = $2, acknowledged_at = NOW(), completed_at = NOW()
             WHERE id = $3 AND instance_id = $4
             RETURNING command`,
            [cmdStatus, result ? JSON.stringify(result) : null, req.params.id, req.instance.id]
        );

        const command = cmdRows[0]?.command;
        if (cmdStatus === 'succeeded' && (command === 'destroy_soft' || command === 'destroy_hard')) {
            // Finalize destroy + revoke Opt2 registry pull token (TS-5.4)
            await pool.query(
                `UPDATE trial_instances SET
                   status = 'destroyed',
                   meta = COALESCE(meta, '{}'::jsonb)
                     || jsonb_build_object(
                          'registry',
                          COALESCE(meta->'registry', '{}'::jsonb) || jsonb_build_object('revoked', true, 'revoked_at', to_jsonb(NOW()::text))
                        ),
                   updated_at = NOW()
                 WHERE id = $1`,
                [req.instance.id]
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

        const checksumSha256 = req.body?.checksumSha256
            || crypto.createHash('sha256').update(req.file.buffer).digest('hex');

        const stored = await storeBackupBlob(req.instance.id, backupId, req.file.buffer, { checksumSha256 });
        res.json({ ok: true, ...stored, checksumSha256 });
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
