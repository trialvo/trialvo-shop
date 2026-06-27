/**
 * Trialvo Shop ↔ Trialvo Pay Credential Seeder
 * 
 * This script generates proper AES-256-GCM encrypted credentials
 * for the trialvo-pay database. It uses the same MASTER_KEY and
 * crypto algorithms as the Rust service.
 * 
 * Usage: node generate_seed.js
 */

const crypto = require('crypto');

// ─── Configuration ────────────────────────────────────────────────────────────

// MASTER_KEY must match docker-compose.prod.yml → trialvo-pay → MASTER_KEY
const MASTER_KEY = '45c11faf4c682130ba6610a471e76a5f5bbc4d9028b9d9ef7354d6beae681778';

// Service config
const SERVICE_ID = '28280023-008f-4307-83de-5e4eabb57562';
const SERVICE_SLUG = 'trialvo-shop';
const SERVICE_NAME = 'Trialvo Shop';

// EPS Live Gateway credentials (provided by user)
const EPS_LIVE_USERNAME = 'antorboss.bd@gmail.com';
const EPS_LIVE_PASSWORD = 'Antor@8010';
const EPS_LIVE_HASH_KEY = 'FHZxyzeps56789gfhg678ygu876o='; // From EPS docs — update if you have a different one

// EPS Sandbox Gateway credentials
const EPS_SANDBOX_USERNAME = 'Epsdemo@gmail.com';
const EPS_SANDBOX_PASSWORD = 'Epsdemo258@';
const EPS_SANDBOX_HASH_KEY = 'FHZxyzeps56789gfhg678ygu876o=';

// ─── Crypto Functions (must match Rust implementation exactly) ─────────────────

/**
 * AES-256-GCM encrypt (matches trialvo-pay's crypto::aes::encrypt)
 * Output: hex(nonce_12_bytes + ciphertext_with_tag)
 */
function aesEncrypt(masterKeyHex, plaintext) {
  const keyBytes = Buffer.from(masterKeyHex, 'hex');
  if (keyBytes.length !== 32) throw new Error('Master key must be 32 bytes');

  const nonce = crypto.randomBytes(12); // 12-byte nonce for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes, nonce);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte auth tag

  // Combine: nonce + ciphertext + tag (this is what Rust's aes-gcm produces)
  const combined = Buffer.concat([nonce, encrypted, tag]);
  return combined.toString('hex');
}

/**
 * AES-256-GCM decrypt (verify our encryption matches Rust's decryption)
 */
function aesDecrypt(masterKeyHex, encryptedHex) {
  const keyBytes = Buffer.from(masterKeyHex, 'hex');
  const combined = Buffer.from(encryptedHex, 'hex');

  if (combined.length < 28) throw new Error('Encrypted data too short'); // 12 nonce + 16 tag minimum

  const nonce = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12, combined.length - 16);
  const tag = combined.subarray(combined.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes, nonce);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * SHA-256 hash for key lookup (matches hmac::hash_key_for_lookup)
 */
function hashKeyForLookup(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generate a 32-byte random hex key (matches hmac::generate_service_secret)
 */
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Generate Credentials ─────────────────────────────────────────────────────

// Generate the API key that the shop backend will use
const apiKey = generateSecret();
const apiKeyHash = hashKeyForLookup(apiKey);
const apiKeyPrefix = apiKey.substring(0, 8);

// The API key is used as both the "key sent in header" AND the "secret for HMAC signing"
// In trialvo-pay, the decrypted_key from encrypted_key is compared against the HMAC
const encryptedApiKey = aesEncrypt(MASTER_KEY, apiKey);

// IPN secret for webhook signature verification
const ipnSecret = generateSecret();

// Encrypt EPS credentials
const encLiveUsername = aesEncrypt(MASTER_KEY, EPS_LIVE_USERNAME);
const encLivePassword = aesEncrypt(MASTER_KEY, EPS_LIVE_PASSWORD);
const encLiveHashKey = aesEncrypt(MASTER_KEY, EPS_LIVE_HASH_KEY);
const encSandboxUsername = aesEncrypt(MASTER_KEY, EPS_SANDBOX_USERNAME);
const encSandboxPassword = aesEncrypt(MASTER_KEY, EPS_SANDBOX_PASSWORD);
const encSandboxHashKey = aesEncrypt(MASTER_KEY, EPS_SANDBOX_HASH_KEY);

// ─── Verify Encryption Works ──────────────────────────────────────────────────

console.log('=== Verifying AES encryption/decryption ===');
const testDecrypt = aesDecrypt(MASTER_KEY, encryptedApiKey);
console.log(`API Key matches after decrypt: ${testDecrypt === apiKey ? '✅ YES' : '❌ NO'}`);
const testUsername = aesDecrypt(MASTER_KEY, encLiveUsername);
console.log(`Live username matches: ${testUsername === EPS_LIVE_USERNAME ? '✅ YES' : '❌ NO'}`);
console.log();

// ─── Print Credentials for .env ───────────────────────────────────────────────

console.log('=== Backend .env / docker-compose credentials ===');
console.log(`TRIALVO_PAY_SERVICE_ID=${SERVICE_ID}`);
console.log(`TRIALVO_PAY_API_KEY=${apiKey}`);
console.log(`TRIALVO_PAY_IPN_SECRET=${ipnSecret}`);
console.log();

// ─── Generate SQL ─────────────────────────────────────────────────────────────

const sql = `-- ═══════════════════════════════════════════════════════════════════
-- Trialvo Pay Seed SQL — Auto-generated
-- Generated at: ${new Date().toISOString()}
-- MASTER_KEY: ${MASTER_KEY.substring(0, 8)}...
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Service Registration ──────────────────────────────────────
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active)
VALUES ('${SERVICE_ID}', '${SERVICE_SLUG}', '${SERVICE_NAME}',
  'https://shop.trialvo.com/order-success',
  'https://shop.trialvo.com/checkout?error=payment_failed',
  'https://shop.trialvo.com/checkout?error=payment_cancelled',
  false, true)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  success_url = EXCLUDED.success_url,
  fail_url = EXCLUDED.fail_url,
  cancel_url = EXCLUDED.cancel_url,
  is_active = true;

-- ─── 2. API Key (AES-256-GCM encrypted) ──────────────────────────
-- Raw API Key: ${apiKey}
-- Key Hash (SHA-256): ${apiKeyHash}
-- Key Prefix: ${apiKeyPrefix}
DELETE FROM service_keys WHERE service_id = '${SERVICE_ID}';
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
VALUES ('${SERVICE_ID}', '${apiKeyHash}', decode('${encryptedApiKey}', 'hex'), '${apiKeyPrefix}', true, true);

-- ─── 3. IPN Endpoint ─────────────────────────────────────────────
-- Uses internal Docker hostname for reliability
DELETE FROM ipn_endpoints WHERE service_id = '${SERVICE_ID}';
INSERT INTO ipn_endpoints (service_id, url, secret, is_active)
VALUES ('${SERVICE_ID}', 'http://backend:5000/api/payments/ipn', '${ipnSecret}', true);

-- ─── 4. EPS Gateway Credentials (AES-256-GCM encrypted) ──────────
-- Sandbox credentials
UPDATE system_config SET value = '${encSandboxUsername}' WHERE category = 'eps' AND key_name = 'sandbox_username';
UPDATE system_config SET value = '${encSandboxPassword}' WHERE category = 'eps' AND key_name = 'sandbox_password';
UPDATE system_config SET value = '${encSandboxHashKey}' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';

-- Live credentials (antorboss.bd@gmail.com)
UPDATE system_config SET value = '${encLiveUsername}' WHERE category = 'eps' AND key_name = 'live_username';
UPDATE system_config SET value = '${encLivePassword}' WHERE category = 'eps' AND key_name = 'live_password';
UPDATE system_config SET value = '${encLiveHashKey}' WHERE category = 'eps' AND key_name = 'live_hash_key';

-- Set mode to live (use sandbox for testing)
UPDATE system_config SET value = 'live' WHERE category = 'eps' AND key_name = 'mode';

-- ═══════════════════════════════════════════════════════════════════
-- IMPORTANT: Update your backend environment with these values:
--   TRIALVO_PAY_API_KEY=${apiKey}
--   TRIALVO_PAY_IPN_SECRET=${ipnSecret}
-- ═══════════════════════════════════════════════════════════════════
`;

console.log('=== Generated seed.sql ===');
console.log(sql);

// Write to file
const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql);
console.log('✅ seed.sql written successfully');

// Also output the env values needed for docker-compose
const envUpdate = {
  TRIALVO_PAY_API_KEY: apiKey,
  TRIALVO_PAY_IPN_SECRET: ipnSecret,
  TRIALVO_PAY_SERVICE_ID: SERVICE_ID,
};
fs.writeFileSync(
  path.join(__dirname, '.generated_credentials.json'),
  JSON.stringify(envUpdate, null, 2)
);
console.log('✅ .generated_credentials.json written');
