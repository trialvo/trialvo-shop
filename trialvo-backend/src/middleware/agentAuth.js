const crypto = require('crypto');
const { pool } = require('../config/db');
const { decrypt, hmacSign, safeEqualHex, safeEqualUtf8 } = require('../utils/crypto');

async function loadInstance(installId) {
    const { rows } = await pool.query(
        'SELECT * FROM trial_instances WHERE install_id = $1',
        [installId]
    );
    return rows[0] || null;
}

function verifyAgentSignature(instance, installId, timestamp, signature, bodyForHash) {
    const ts = parseInt(timestamp, 10);
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
        return { ok: false, error: 'Timestamp out of range' };
    }
    if (!instance.agent_secret_enc) {
        return { ok: false, error: 'Instance has no agent secret' };
    }
    const secret = decrypt(instance.agent_secret_enc);
    const bodyHash = crypto.createHash('sha256')
        .update(typeof bodyForHash === 'string' ? bodyForHash : JSON.stringify(bodyForHash ?? {}))
        .digest('hex');
    const expected = hmacSign(secret, `${installId}.${timestamp}.${bodyHash}`);
    // Constant-time compare to avoid signature timing side-channels.
    if (!safeEqualHex(String(signature), expected)) {
        return { ok: false, error: 'Invalid signature' };
    }
    return { ok: true };
}

async function agentAuth(req, res, next) {
    try {
        const installId = req.headers['x-install-id'];
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];

        if (!installId || !timestamp || !signature) {
            return res.status(401).json({ error: 'Missing agent auth headers' });
        }

        const instance = await loadInstance(installId);
        if (!instance) return res.status(401).json({ error: 'Unknown install' });

        const verified = verifyAgentSignature(instance, installId, timestamp, signature, req.body ?? {});
        if (!verified.ok) return res.status(401).json({ error: verified.error });

        req.instance = instance;
        next();
    } catch (err) {
        next(err);
    }
}

/** Multipart/blob routes: HMAC over empty JSON `{}` (file bytes are not signed). */
async function agentAuthEmptyBody(req, res, next) {
    try {
        const installId = req.headers['x-install-id'];
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];

        if (!installId || !timestamp || !signature) {
            return res.status(401).json({ error: 'Missing agent auth headers' });
        }

        const instance = await loadInstance(installId);
        if (!instance) return res.status(401).json({ error: 'Unknown install' });

        const verified = verifyAgentSignature(instance, installId, timestamp, signature, {});
        if (!verified.ok) return res.status(401).json({ error: verified.error });

        req.instance = instance;
        next();
    } catch (err) {
        next(err);
    }
}

async function bootstrapAuth(req, res, next) {
    try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        const installId = req.body?.installId;
        if (!token || !installId) return res.status(401).json({ error: 'Bootstrap auth required' });

        const instance = await loadInstance(installId);
        if (!instance) return res.status(401).json({ error: 'Unknown install' });

        if (!instance.bootstrap_token_enc) {
            return res.status(401).json({ error: 'Bootstrap token not set' });
        }
        const bootstrap = decrypt(instance.bootstrap_token_enc);
        // Constant-time compare (bootstrap token is base64url, not hex).
        if (!safeEqualUtf8(String(token), bootstrap)) {
            return res.status(401).json({ error: 'Invalid bootstrap token' });
        }

        req.instance = instance;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { agentAuth, agentAuthEmptyBody, bootstrapAuth };
