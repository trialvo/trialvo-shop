const crypto = require('crypto');
const fs = require('fs');

const MASTER_KEY_HEX = '7cdf6bc0d46db841e18b19727e6f2476ee89569bc333df23142d0e136f1e5e1b';
const masterKey = Buffer.from(MASTER_KEY_HEX, 'hex');

function generateServiceSecret() {
    return crypto.randomBytes(32).toString('hex');
}

function hashKeyForLookup(rawKey) {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function encryptAesGcm(plaintext) {
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, nonce);
    
    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    // Result format: nonce (12) + ciphertext + tag (16)
    const combined = Buffer.concat([nonce, ciphertext, tag]);
    return combined.toString('hex');
}

const serviceId = crypto.randomUUID();
const apiKey = generateServiceSecret();
const keyHash = hashKeyForLookup(apiKey);
const encryptedKey = encryptAesGcm(apiKey);
const ipnSecret = generateServiceSecret();

const sql = `
-- Service
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active)
VALUES ('${serviceId}', 'trialvo-shop', 'Trialvo Shop', 'https://shop.trialvo.com/checkout/success', 'https://shop.trialvo.com/checkout/failed', 'https://shop.trialvo.com/checkout/cancel', false, true)
ON CONFLICT (slug) DO NOTHING;

-- Key
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary)
VALUES ('${serviceId}', '${keyHash}', convert_to('${encryptedKey}', 'UTF8'), '${apiKey.substring(0, 8)}', true);

-- IPN
INSERT INTO ipn_endpoints (service_id, url, secret)
VALUES ('${serviceId}', 'https://shop-api.trialvo.com/api/payment/webhook', '${ipnSecret}');
`;

console.log("=== SQL SEED ===");
console.log(sql);
console.log("=== ENV VARS FOR BACKEND ===");
console.log(`TRIALVO_PAY_SERVICE_ID=${serviceId}`);
console.log(`TRIALVO_PAY_API_KEY=${apiKey}`);
console.log(`TRIALVO_PAY_IPN_SECRET=${ipnSecret}`);
