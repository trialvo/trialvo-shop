const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const {
    packV3Archive,
    sealArchive,
    openSealedBackup,
} = require('./trialBackupCodec');

const CP = (process.env.CONTROL_PLANE_URL || '').replace(/\/$/, '');
const INSTALL_ID = process.env.TRIAL_INSTALL_ID || '';
const AGENT_SECRET = process.env.TRIAL_AGENT_SECRET || '';
const BOOTSTRAP = process.env.TRIAL_BOOTSTRAP_TOKEN || '';
const DOMAIN = process.env.TRIAL_DOMAIN || '';
// 1.5: LICENSE_ENFORCE + configurable heartbeat (paid/cPanel)
const AGENT_VERSION = 'node-embedded-1.5';
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const MAX_UPLOAD_FILES = 40;
const MAX_UPLOAD_FILE_BYTES = 512 * 1024; // 512KB per file in-band
const MAX_TOTAL_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB total uploads in-band
const MAX_SQL_BYTES = 40 * 1024 * 1024;

let cachedLease = null;
let frozen = false;
/** After destroy_* succeeds, refuse unfreeze even if CP still has lease. */
let permanentlyDestroyed = false;
/**
 * Fail closed until the first CP register/lease attempt finishes.
 * Otherwise a stale Go-gate JWT can unlock the API for minutes after a remote freeze
 * while startup refreshLease is still in flight (or failed once).
 */
let initialSyncDone = false;
/** D6: last time we saw a cryptographically valid lease (ms). */
let lastGoodLeaseAt = 0;
const GRACE_MS = parseInt(process.env.TRIAL_GRACE_HOURS || '24', 10) * 3600 * 1000;
const AGENT_GATE_URL = (process.env.AGENT_GATE_URL || 'http://127.0.0.1:9099/gate').replace(/\/$/, '');
const USE_AGENT_GATE = process.env.USE_AGENT_GATE === '1' || process.env.USE_AGENT_GATE === 'true';
/** Paid/cPanel: license client on without TRIAL_MODE. */
const LICENSE_ENFORCE =
    process.env.LICENSE_ENFORCE === '1' || process.env.LICENSE_ENFORCE === 'true';
const LICENSE_ACTIVE = process.env.TRIAL_MODE === '1' || LICENSE_ENFORCE;
/** Heartbeat interval ms — CP may override via register response. */
let heartbeatIntervalMs = parseInt(process.env.AGENT_HEARTBEAT_MS || '600000', 10);
let leaseIntervalMs = parseInt(process.env.AGENT_LEASE_MS || '1800000', 10);
let heartbeatTimer = null;
let leaseTimer = null;

function getPublicKey() {
    if (process.env.LICENSE_PUBLIC_KEY) return process.env.LICENSE_PUBLIC_KEY;
    const p = path.join(__dirname, '..', 'config', 'license_public.pem');
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    return null;
}

function destroyMarkerPath() {
    return path.join(__dirname, '..', 'uploads', 'trial-state', 'destroyed.json');
}

function loadDestroyMarker() {
    try {
        const p = destroyMarkerPath();
        if (fs.existsSync(p)) {
            permanentlyDestroyed = true;
            frozen = true;
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
    } catch { /* ignore */ }
    return null;
}

function hmacSign(secret, message) {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function agentHeaders(body = {}) {
    const timestamp = String(Date.now());
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    return {
        'X-Install-Id': INSTALL_ID,
        'X-Timestamp': timestamp,
        'X-Signature': hmacSign(AGENT_SECRET, `${INSTALL_ID}.${timestamp}.${bodyHash}`),
        'X-Nonce': nonce,
        'Content-Type': 'application/json',
    };
}

/** Headers for multipart upload — HMAC over empty JSON `{}`. */
function agentHeadersEmptyBody() {
    const timestamp = String(Date.now());
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify({})).digest('hex');
    return {
        'X-Install-Id': INSTALL_ID,
        'X-Timestamp': timestamp,
        'X-Signature': hmacSign(AGENT_SECRET, `${INSTALL_ID}.${timestamp}.${bodyHash}`),
        'X-Nonce': nonce,
    };
}

function verifyLease(token) {
    const pub = getPublicKey();
    if (!pub || !token) return false;
    try {
        // Signature + exp are verified by jwt.verify (RS256, throws on expiry).
        const payload = jwt.verify(token, pub, { algorithms: ['RS256'] });

        // §5.1: a valid signature is not enough — the lease must be for THIS
        // instance and in an active state, otherwise a signed-but-frozen or
        // wrong-domain lease could be replayed to keep panels unlocked.
        if (payload.state && payload.state !== 'active') return false;
        if (DOMAIN && payload.domain && payload.domain !== DOMAIN) return false;
        if (INSTALL_ID && payload.install_id && payload.install_id !== INSTALL_ID) return false;

        lastGoodLeaseAt = Date.now();
        return true;
    } catch {
        return false;
    }
}

async function fetchGateLease() {
    if (!USE_AGENT_GATE) return null;
    try {
        const res = await axios.get(AGENT_GATE_URL.endsWith('/gate') ? AGENT_GATE_URL : `${AGENT_GATE_URL}/gate`, {
            timeout: 2000,
        });
        return res.data?.lease || null;
    } catch {
        return null;
    }
}

/**
 * True when panels must lock.
 * Order: permanent destroy → remote freeze → invalid lease (with 24h grace after last good lease).
 */
async function isTrialLocked() {
    if (!LICENSE_ACTIVE) return false;
    if (permanentlyDestroyed) return true;
    if (frozen) return true;
    // Do not serve protected routes until we have talked to the Control Plane once
    if (!initialSyncDone) return true;

    let token = cachedLease;
    if (USE_AGENT_GATE) {
        const gateLease = await fetchGateLease();
        if (gateLease) token = gateLease;
    }

    if (verifyLease(token)) {
        cachedLease = token;
        return false;
    }

    // D6 grace: if we recently had a valid lease, allow traffic while agent/network recovers
    if (lastGoodLeaseAt && (Date.now() - lastGoodLeaseAt) < GRACE_MS) {
        return false;
    }
    return true;
}

async function registerIfNeeded() {
    if (!CP || !BOOTSTRAP || !INSTALL_ID) return;
    try {
        const res = await axios.post(`${CP}/api/agent/register`, {
            installId: INSTALL_ID,
            domain: DOMAIN,
            agentVersion: AGENT_VERSION,
            productVersion: process.env.PRODUCT_CODE || 'lifestyle',
        }, { headers: { Authorization: `Bearer ${BOOTSTRAP}` } });
        if (res.data?.heartbeatInterval) {
            heartbeatIntervalMs = Math.max(30, parseInt(res.data.heartbeatInterval, 10)) * 1000;
        }
        if (res.data?.leaseInterval) {
            leaseIntervalMs = Math.max(60, parseInt(res.data.leaseInterval, 10)) * 1000;
        }
        if (res.data?.code === 'DOMAIN_CONFLICT') {
            frozen = true;
            cachedLease = null;
        }
        console.log('[licenseClient] Registered with control plane');
    } catch (e) {
        // Bootstrap is one-shot — Go gate often consumes it first. HMAC lease/heartbeat still work.
        const status = e.response?.status;
        if (status === 401 || status === 409) {
            console.log('[licenseClient] Register skipped (bootstrap already used) — continuing with lease');
            return;
        }
        throw e;
    }
}

async function tryMysqldump() {
    const host = process.env.DB_HOST || process.env.MYSQL_HOST;
    const user = process.env.DB_USER || process.env.MYSQL_USER;
    const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
    const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'ecom';
    const port = process.env.DB_PORT || process.env.MYSQL_PORT || '3306';
    if (!host || !user) {
        return { sql: null, error: 'DB_HOST/DB_USER not set — skip mysqldump' };
    }
    const mysqldumpBin = process.env.MYSQLDUMP_PATH || 'mysqldump';
    try {
        const { stdout } = await execFileAsync(
            mysqldumpBin,
            [
                `-h${host}`,
                `-P${port}`,
                `-u${user}`,
                ...(password ? [`-p${password}`] : []),
                '--single-transaction',
                '--routines',
                '--triggers',
                // --hex-blob renders binary/blob columns (e.g. packed IPs in
                // page_view_logs) as ASCII hex literals so the dump survives the
                // UTF-8 string round-trip and re-imports without corruption.
                '--hex-blob',
                '--default-character-set=utf8mb4',
                // Compact dump: less comment noise, smaller sealed backup on VPS.
                '--compact',
                '--skip-comments',
                database,
            ],
            { maxBuffer: MAX_SQL_BYTES, windowsHide: true }
        );
        const sql = typeof stdout === 'string' ? stdout : stdout.toString('utf8');
        if (Buffer.byteLength(sql, 'utf8') > MAX_SQL_BYTES) {
            return { sql: null, error: 'mysqldump exceeded size cap' };
        }
        return { sql, error: null, bytes: Buffer.byteLength(sql, 'utf8') };
    } catch (e) {
        return { sql: null, error: e.message || String(e) };
    }
}

function collectUploadsSnapshot() {
    const uploadsRoot = path.join(__dirname, '..', 'uploads');
    const files = [];
    let total = 0;
    if (!fs.existsSync(uploadsRoot)) return { files, skipped: [], note: 'no uploads dir' };

    const skipped = [];
    function walk(dir, relBase = '') {
        if (files.length >= MAX_UPLOAD_FILES || total >= MAX_TOTAL_UPLOAD_BYTES) return;
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const ent of entries) {
            if (files.length >= MAX_UPLOAD_FILES || total >= MAX_TOTAL_UPLOAD_BYTES) break;
            // Skip restore audit + trial-state (transient)
            if (!relBase && (ent.name === 'trial-restores' || ent.name === 'trial-state')) continue;
            const full = path.join(dir, ent.name);
            const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
            if (ent.isDirectory()) {
                walk(full, rel);
                continue;
            }
            try {
                const st = fs.statSync(full);
                if (st.size > MAX_UPLOAD_FILE_BYTES) {
                    skipped.push({ path: rel, reason: 'too_large', size: st.size });
                    continue;
                }
                if (total + st.size > MAX_TOTAL_UPLOAD_BYTES) {
                    skipped.push({ path: rel, reason: 'budget', size: st.size });
                    continue;
                }
                const buf = fs.readFileSync(full);
                // Keep raw Buffer for v3 binary pack (base64 bloated v2 ~33%).
                files.push({
                    path: rel.replace(/\\/g, '/'),
                    size: buf.length,
                    buffer: buf,
                });
                total += buf.length;
            } catch (e) {
                skipped.push({ path: rel, reason: e.message });
            }
        }
    }
    walk(uploadsRoot);
    return { files, skipped, totalBytes: total };
}

async function runBackupNow(cmd, opts = {}) {
    let effectiveTrigger = opts.trigger;
    if (!effectiveTrigger) {
        effectiveTrigger = cmd?.payload?.trigger
            || (cmd?.payload?.scheduled ? 'scheduled' : 'command');
    }

    const urlRes = await axios.get(`${CP}/api/agent/backup/upload-url?trigger=${encodeURIComponent(effectiveTrigger)}`, {
        headers: agentHeadersEmptyBody(),
    });
    const { backupId, uploadUrl, backupKey, driver } = urlRes.data || {};
    if (!backupId || !uploadUrl || !backupKey) {
        throw new Error('Invalid upload-url response');
    }

    // For the local driver the Control Plane builds an absolute uploadUrl from
    // its OWN port (e.g. http://localhost:5000/...), which is not reachable from
    // inside the trial container — there localhost is the trial itself. We know
    // the correct Control Plane host via CONTROL_PLANE_URL, so upload the blob
    // there. Presigned URLs (S3 driver) are host-independent and used as-is.
    const blobUploadUrl = driver === 'local' ? `${CP}/api/agent/backup/blob` : uploadUrl;

    const dump = await tryMysqldump();
    const uploads = collectUploadsSnapshot();

    // v3: binary archive (gzip SQL once + raw upload bytes) → outer gzip → AES-GCM.
    // Lossless round-trip; restores trial and exports cleanly for production migrate.
    const archive = packV3Archive({
        installId: INSTALL_ID,
        domain: DOMAIN,
        sqlText: dump.sql || null,
        sqlError: dump.error || null,
        uploadFiles: uploads.files || [],
        skipped: uploads.skipped || [],
        trigger: effectiveTrigger,
        commandId: cmd?.id || null,
    });
    const encrypted = sealArchive(archive, backupKey);
    const checksumSha256 = crypto.createHash('sha256').update(encrypted).digest('hex');

    const form = new FormData();
    form.append('backupId', backupId);
    form.append('checksumSha256', checksumSha256);
    form.append('file', encrypted, { filename: `${backupId}.enc`, contentType: 'application/octet-stream' });

    await axios.post(blobUploadUrl, form, {
        headers: { ...agentHeadersEmptyBody(), ...form.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });

    const completeBody = { backupId, checksumSha256, sizeBytes: encrypted.length };
    await axios.post(`${CP}/api/agent/backup/complete`, completeBody, {
        headers: agentHeaders(completeBody),
    });

    return {
        backupId,
        sizeBytes: encrypted.length,
        checksumSha256,
        trigger: effectiveTrigger,
        hasSql: Boolean(dump.sql),
        uploadFiles: uploads.files.length,
    };
}

async function tryMysqlImport(sqlPath) {
    const host = process.env.DB_HOST || process.env.MYSQL_HOST;
    const user = process.env.DB_USER || process.env.MYSQL_USER;
    const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
    const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'ecom';
    const port = process.env.DB_PORT || process.env.MYSQL_PORT || '3306';
    if (!host || !user) return { ok: false, error: 'DB env missing' };
    const mysqlBin = process.env.MYSQL_PATH || 'mysql';
    const args = [
        `-h${host}`,
        `-P${port}`,
        `-u${user}`,
        ...(password ? [`-p${password}`] : []),
        database,
    ];
    // NOTE: async execFile has no `input` option (that is execFileSync only) —
    // passing one is silently ignored and mysql blocks forever waiting on stdin.
    // Stream the dump into stdin via spawn and close it on EOF instead.
    return new Promise((resolve) => {
        const child = spawn(mysqlBin, args, { windowsHide: true });
        let stderr = '';
        child.stderr.on('data', (d) => { stderr += d.toString(); });
        child.on('error', (e) => resolve({ ok: false, error: e.message || String(e) }));
        child.on('close', (code) => {
            if (code === 0) return resolve({ ok: true });
            resolve({ ok: false, error: `mysql import exited ${code}: ${stderr.slice(0, 2000)}` });
        });
        // If mysql closes stdin early (e.g. it exits before consuming the whole
        // dump), writing the rest raises EPIPE. Without this handler the error
        // event is unhandled and crashes the ENTIRE API process — so swallow it
        // and let the child's exit code decide success/failure.
        child.stdin.on('error', () => { /* EPIPE on early close — ignored */ });
        const rs = fs.createReadStream(sqlPath);
        rs.on('error', (e) => resolve({ ok: false, error: e.message || String(e) }));
        rs.pipe(child.stdin);
    });
}

async function runRestore(cmd) {
    const backupId = cmd.payload?.backupId;
    if (!backupId) throw new Error('restore payload missing backupId');

    const res = await axios.get(`${CP}/api/agent/backup/${backupId}/download`, {
        headers: agentHeadersEmptyBody(),
        responseType: 'arraybuffer',
    });
    const backupKey = res.headers['x-backup-key'];
    if (!backupKey) throw new Error('Missing X-Backup-Key on download');

    // openSealedBackup handles v3 binary and legacy v2/v1 JSON losslessly.
    const opened = openSealedBackup(Buffer.from(res.data), backupKey);

    const outDir = path.join(__dirname, '..', 'uploads', 'trial-restores');
    fs.mkdirSync(outDir, { recursive: true });
    const metaPath = path.join(outDir, `${backupId}.json`);
    const metaSafe = {
        type: opened.type,
        version: opened.version,
        installId: opened.meta?.installId,
        domain: opened.meta?.domain,
        createdAt: opened.meta?.createdAt,
        trigger: opened.meta?.trigger,
        sql: opened.sqlText
            ? { present: true, bytes: Buffer.byteLength(opened.sqlText, 'utf8') }
            : { present: false, error: opened.meta?.sql?.error || null },
        uploads: {
            count: opened.files.length,
            files: opened.files.map((f) => ({ path: f.path, size: f.size })),
        },
    };
    fs.writeFileSync(metaPath, JSON.stringify(metaSafe, null, 2));

    let sqlImport = { ok: false, skipped: true };
    if (opened.sqlText) {
        const sqlPath = path.join(outDir, `${backupId}.sql`);
        fs.writeFileSync(sqlPath, opened.sqlText);
        sqlImport = await tryMysqlImport(sqlPath);
        if (!sqlImport.ok) {
            sqlImport.file = sqlPath;
            sqlImport.note = 'SQL saved to disk; import failed or mysql CLI missing';
        }
    }

    let restoredUploads = 0;
    const uploadsRoot = path.join(__dirname, '..', 'uploads');
    for (const file of opened.files) {
        if (!file?.path || !file.buffer) continue;
        const safeRel = String(file.path).replace(/\.\./g, '').replace(/^[/\\]+/, '');
        const dest = path.join(uploadsRoot, safeRel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, file.buffer);
        restoredUploads += 1;
    }

    return {
        backupId,
        version: opened.type || `v${opened.version}`,
        restoredManifest: true,
        path: metaPath,
        sqlImport,
        restoredUploads,
    };
}

/**
 * L-5.3: mandatory pre-destroy backup, then soft/hard local teardown.
 * Soft = permanent L1 lock (marker file). Hard = also wipe local trial restore artifacts.
 * Full docker compose down is deferred (L-4.4 Go agent / Docker socket).
 */
async function runDestroy(cmd) {
    const mode = cmd.command === 'destroy_hard' ? 'hard' : 'soft';

    const backup = await runBackupNow(cmd, { trigger: 'pre_destroy' });

    frozen = true;
    permanentlyDestroyed = true;
    cachedLease = null;

    const markerDir = path.dirname(destroyMarkerPath());
    fs.mkdirSync(markerDir, { recursive: true });
    const marker = {
        mode,
        destroyedAt: new Date().toISOString(),
        commandId: cmd.id,
        backupId: backup.backupId,
        installId: INSTALL_ID,
    };
    fs.writeFileSync(destroyMarkerPath(), JSON.stringify(marker, null, 2));

    let wiped = [];
    if (mode === 'hard') {
        const restoreDir = path.join(__dirname, '..', 'uploads', 'trial-restores');
        if (fs.existsSync(restoreDir)) {
            for (const name of fs.readdirSync(restoreDir)) {
                fs.unlinkSync(path.join(restoreDir, name));
                wiped.push(name);
            }
        }
        const leaseCache = path.join(__dirname, '..', 'uploads', 'trial-state', 'lease.jwt');
        if (fs.existsSync(leaseCache)) {
            fs.unlinkSync(leaseCache);
            wiped.push('lease.jwt');
        }
    }

    console.warn(`[licenseClient] Destroy ${mode} complete; pre_destroy backup=${backup.backupId}`);
    return {
        ok: true,
        mode,
        preDestroyBackupId: backup.backupId,
        wiped,
        note: 'L1 permanent lock applied; compose/volume wipe deferred without Docker agent',
    };
}

async function ack(cmdId, status, result) {
    const body = { installId: INSTALL_ID, status, result };
    await axios.post(`${CP}/api/agent/commands/${cmdId}/ack`, body, {
        headers: agentHeaders(body),
    });
}

async function heartbeat() {
    if (!CP || !INSTALL_ID || !AGENT_SECRET) return;
    const body = {
        installId: INSTALL_ID,
        domain: DOMAIN,
        status: frozen || permanentlyDestroyed ? 'frozen' : 'running',
        localState: permanentlyDestroyed ? 'destroyed' : (frozen ? 'frozen' : 'active'),
        agentVersion: AGENT_VERSION,
    };
    const res = await axios.post(`${CP}/api/agent/heartbeat`, body, { headers: agentHeaders(body) });
    if (res.data?.heartbeatInterval) {
        const next = Math.max(30, parseInt(res.data.heartbeatInterval, 10)) * 1000;
        if (next !== heartbeatIntervalMs && heartbeatTimer) {
            heartbeatIntervalMs = next;
            clearInterval(heartbeatTimer);
            heartbeatTimer = setInterval(
                () => heartbeat().catch((e) => console.error('[licenseClient] heartbeat', e.message)),
                heartbeatIntervalMs
            );
        }
    }
    if (res.data?.agentUpdate) {
        console.warn('[licenseClient] Agent update recommended:', res.data.agentUpdate);
    }
    if (res.data?.code === 'DOMAIN_CONFLICT') {
        frozen = true;
        cachedLease = null;
    }
    const commands = res.data?.commands || [];
    for (const cmd of commands) {
        try {
            let result = { ok: true };
            if (permanentlyDestroyed && (cmd.command === 'unfreeze' || cmd.command === 'extend')) {
                result = { ok: false, skipped: true, reason: 'instance permanently destroyed' };
                await ack(cmd.id, 'failed', result);
                continue;
            }
            if (cmd.command === 'freeze') {
                frozen = true;
            } else if (cmd.command === 'unfreeze' || cmd.command === 'extend') {
                frozen = false;
            } else if (cmd.command === 'backup_now') {
                result = await runBackupNow(cmd);
            } else if (cmd.command === 'restore') {
                result = await runRestore(cmd);
            } else if (cmd.command === 'destroy_soft' || cmd.command === 'destroy_hard') {
                result = await runDestroy(cmd);
            }
            await ack(cmd.id, 'succeeded', result);
        } catch (e) {
            console.error('[licenseClient] command failed', cmd.command, e.message);
            try {
                await ack(cmd.id, 'failed', { error: e.message });
            } catch { /* best effort */ }
        }
    }
}

async function refreshLease() {
    if (!CP || !INSTALL_ID || !AGENT_SECRET) return;
    if (permanentlyDestroyed) {
        cachedLease = null;
        frozen = true;
        return;
    }
    const body = { installId: INSTALL_ID, domain: DOMAIN };
    const res = await axios.post(`${CP}/api/agent/lease`, body, { headers: agentHeaders(body) });
    if (res.data?.state === 'frozen' || !res.data?.lease) {
        cachedLease = null;
        frozen = true;
        return;
    }
    cachedLease = res.data.lease;
    verifyLease(cachedLease);
    frozen = false;
}

function isTrialLockedSync() {
    if (!LICENSE_ACTIVE) return false;
    if (permanentlyDestroyed || frozen) return true;
    if (verifyLease(cachedLease)) return false;
    if (lastGoodLeaseAt && (Date.now() - lastGoodLeaseAt) < GRACE_MS) return false;
    return true;
}

function startLicenseClient() {
    if (!LICENSE_ACTIVE) {
        console.log('[licenseClient] TRIAL_MODE/LICENSE_ENFORCE off — license enforcement disabled');
        return;
    }
    if (!CP || !INSTALL_ID || !AGENT_SECRET) {
        console.warn('[licenseClient] Missing CONTROL_PLANE_URL / TRIAL_INSTALL_ID / TRIAL_AGENT_SECRET');
        return;
    }
    loadDestroyMarker();
    (async () => {
        try {
            // Retries: brief CP/network blips right after container start must not leave us
            // unlocked forever behind a stale gate JWT (next lease tick is ~30m).
            let lastErr = null;
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    // register is best-effort (bootstrap may already be consumed by Go agent)
                    await registerIfNeeded();
                    await refreshLease();
                    await heartbeat();
                    lastErr = null;
                    break;
                } catch (e) {
                    lastErr = e;
                    console.error(`[licenseClient] startup sync attempt ${attempt}/5 failed:`, e.message);
                    if (e.response?.status === 403 || e.response?.data?.code === 'DOMAIN_CONFLICT') {
                        frozen = true;
                        cachedLease = null;
                        lastErr = null;
                        break;
                    }
                    await new Promise((r) => setTimeout(r, 2000 * attempt));
                }
            }
            if (lastErr) {
                // Fail closed only when lease/heartbeat never succeeded — not on register alone
                frozen = true;
                cachedLease = null;
            }
        } finally {
            initialSyncDone = true;
        }
    })();
    leaseTimer = setInterval(
        () => refreshLease().catch((e) => console.error('[licenseClient] lease', e.message)),
        leaseIntervalMs
    );
    heartbeatTimer = setInterval(
        () => heartbeat().catch((e) => console.error('[licenseClient] heartbeat', e.message)),
        heartbeatIntervalMs
    );
    console.log(
        `[licenseClient] Started (${AGENT_VERSION}; heartbeat=${heartbeatIntervalMs}ms; gate=${USE_AGENT_GATE ? 'on' : 'off'})`
    );
}

module.exports = { startLicenseClient, isTrialLocked, isTrialLockedSync, refreshLease };
