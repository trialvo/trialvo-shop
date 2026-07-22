const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '..', '..', 'deploy', 'keys');
const PRIV_PATH = path.join(KEYS_DIR, 'license_private.pem');
const PUB_PATH = path.join(KEYS_DIR, 'license_public.pem');

function ensureKeyPair() {
    if (fs.existsSync(PRIV_PATH) && fs.existsSync(PUB_PATH)) return;
    fs.mkdirSync(KEYS_DIR, { recursive: true });
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    fs.writeFileSync(PRIV_PATH, privateKey);
    fs.writeFileSync(PUB_PATH, publicKey);
    console.log('[leaseIssuer] Generated RSA key pair at deploy/keys/');
}

function getPrivateKey() {
    if (process.env.LICENSE_PRIVATE_KEY) return process.env.LICENSE_PRIVATE_KEY;
    ensureKeyPair();
    return fs.readFileSync(PRIV_PATH, 'utf8');
}

function getPublicKey() {
    if (process.env.LICENSE_PUBLIC_KEY) return process.env.LICENSE_PUBLIC_KEY;
    ensureKeyPair();
    return fs.readFileSync(PUB_PATH, 'utf8');
}

function issueLease({ installId, domain, state = 'active', ttlSeconds = 7200 }) {
    if (state !== 'active') return null;
    return jwt.sign(
        { install_id: installId, domain, state, features: ['catalog', 'orders', 'admin'] },
        getPrivateKey(),
        { algorithm: 'RS256', expiresIn: ttlSeconds }
    );
}

module.exports = { issueLease, getPublicKey, getPrivateKey, ensureKeyPair };
