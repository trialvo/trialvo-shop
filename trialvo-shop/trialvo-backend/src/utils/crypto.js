const crypto = require('crypto');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const INSECURE_DEV_KEY = 'local-dev-master-key';

// Resolve the at-rest master key. Priority: dedicated BACKUP_MASTER_KEY, then a
// legacy JWT_SECRET fallback (kept only so existing dev data stays decryptable),
// then an insecure hardcoded dev key. In production we refuse the weak fallbacks
// outright — encrypting agent secrets / backup keys with a predictable value
// would let anyone with DB access decrypt them.
function resolveMasterKey() {
    if (process.env.BACKUP_MASTER_KEY) return process.env.BACKUP_MASTER_KEY;

    if (IS_PRODUCTION) {
        throw new Error(
            'BACKUP_MASTER_KEY is required in production. Refusing to encrypt secrets with a weak fallback key.'
        );
    }

    if (process.env.JWT_SECRET) {
        console.warn(
            '[crypto] BACKUP_MASTER_KEY not set — falling back to JWT_SECRET for at-rest encryption (dev only). ' +
            'Set a dedicated BACKUP_MASTER_KEY before production.'
        );
        return process.env.JWT_SECRET;
    }

    console.warn(
        '[crypto] No BACKUP_MASTER_KEY/JWT_SECRET set — using an insecure hardcoded dev key. NEVER use this in production.'
    );
    return INSECURE_DEV_KEY;
}

const MASTER_KEY = resolveMasterKey();

function getMasterKey() {
    return crypto.createHash('sha256').update(MASTER_KEY).digest();
}

/**
 * Constant-time comparison for two hex-encoded strings (e.g. HMAC signatures,
 * tokens). Returns false on any length/format mismatch without leaking timing
 * information about where the mismatch occurred.
 */
function safeEqualHex(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    // Reject malformed hex or length mismatch (timingSafeEqual throws on unequal length).
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Constant-time comparison for arbitrary UTF-8 strings (e.g. bootstrap tokens
 * that may not be hex). Length differences are handled without early return.
 */
function safeEqualUtf8(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function encrypt(plaintext) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
    const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decrypt(payload) {
    const [ivHex, tagHex, dataHex] = String(payload).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

function hmacSign(secret, message) {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function randomHex(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

function randomToken(bytes = 24) {
    return crypto.randomBytes(bytes).toString('base64url');
}

module.exports = { encrypt, decrypt, hmacSign, randomHex, randomToken, safeEqualHex, safeEqualUtf8 };
