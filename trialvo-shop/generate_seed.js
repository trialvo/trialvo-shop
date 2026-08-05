/**
 * Trialvo Shop ↔ Trialvo Pay Credential Seeder
 * 
 * Generates proper AES-256-GCM encrypted credentials + Argon2id admin hash.
 * Uses the same MASTER_KEY and crypto algorithms as the Rust service.
 * 
 * Usage: node generate_seed.js
 */

const crypto = require('crypto');
const argon2 = require('argon2');

// ─── Configuration ────────────────────────────────────────────────────────────

// MASTER_KEY must match docker-compose.prod.yml → trialvo-pay → MASTER_KEY
const MASTER_KEY = '45c11faf4c682130ba6610a471e76a5f5bbc4d9028b9d9ef7354d6beae681778';

// Service config
const SERVICE_ID = '28280023-008f-4307-83de-5e4eabb57562';
const SERVICE_SLUG = 'trialvo-shop';
const SERVICE_NAME = 'Trialvo Shop';

// Trialvo Pay Admin credentials
const ADMIN_EMAIL = 'antorboss.bd@gmail.com';
const ADMIN_PASSWORD = 'Antor@8010';
const ADMIN_DISPLAY_NAME = 'Antor Boss';

// ─── EPS SANDBOX Credentials (from EPS documentation) ─────────────────────────
// Source: trialvo-pay/Trialvo 12/Trialvo/Trialvo/SandBox_Credentials(Eps_Demo)
const EPS_SANDBOX_BASE_URL = 'https://sandboxpgapi.eps.com.bd/v1';
const EPS_SANDBOX_MERCHANT_ID = '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a';
const EPS_SANDBOX_STORE_ID = 'd44e705f-9e3a-41de-98b1-1674631637da';
const EPS_SANDBOX_USERNAME = 'Epsdemo@gmail.com';
const EPS_SANDBOX_PASSWORD = 'Epsdemo258@';
const EPS_SANDBOX_HASH_KEY = 'FHZxyzeps56789gfhg678ygu876o=';

// ─── Crypto Functions (must match Rust implementation exactly) ─────────────────

/**
 * AES-256-GCM encrypt (matches trialvo-pay's crypto::aes::encrypt)
 * Output: hex(nonce_12_bytes + ciphertext + tag_16_bytes)
 */
function aesEncrypt(masterKeyHex, plaintext) {
  const keyBytes = Buffer.from(masterKeyHex, 'hex');
  if (keyBytes.length !== 32) throw new Error('Master key must be 32 bytes');

  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // nonce + ciphertext + tag (matches Rust aes-gcm crate output)
  return Buffer.concat([nonce, encrypted, tag]).toString('hex');
}

/**
 * AES-256-GCM decrypt (verify roundtrip)
 */
function aesDecrypt(masterKeyHex, encryptedHex) {
  const keyBytes = Buffer.from(masterKeyHex, 'hex');
  const combined = Buffer.from(encryptedHex, 'hex');
  const nonce = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12, combined.length - 16);
  const tag = combined.subarray(combined.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function hashKeyForLookup(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Generate API key
  const apiKey = generateSecret();
  const apiKeyHash = hashKeyForLookup(apiKey);
  const apiKeyPrefix = apiKey.substring(0, 8);
  const encryptedApiKey = aesEncrypt(MASTER_KEY, apiKey);

  // IPN secret
  const ipnSecret = generateSecret();

  // Encrypt EPS sandbox credentials
  const encSandboxUsername = aesEncrypt(MASTER_KEY, EPS_SANDBOX_USERNAME);
  const encSandboxPassword = aesEncrypt(MASTER_KEY, EPS_SANDBOX_PASSWORD);
  const encSandboxHashKey = aesEncrypt(MASTER_KEY, EPS_SANDBOX_HASH_KEY);

  // Hash admin password with Argon2id (same params as Rust: m=65536, t=3, p=4)
  const adminHash = await argon2.hash(ADMIN_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MiB
    timeCost: 3,
    parallelism: 4,
  });

  // ─── Verify ─────────────────────────────────────────────────────────────
  console.log('=== Verification ===');
  console.log(`AES roundtrip: ${aesDecrypt(MASTER_KEY, encryptedApiKey) === apiKey ? '✅' : '❌'}`);
  console.log(`Sandbox username: ${aesDecrypt(MASTER_KEY, encSandboxUsername) === EPS_SANDBOX_USERNAME ? '✅' : '❌'}`);
  const argonOk = await argon2.verify(adminHash, ADMIN_PASSWORD);
  console.log(`Argon2 verify: ${argonOk ? '✅' : '❌'}`);
  console.log();

  // ─── Backend env values ─────────────────────────────────────────────────
  console.log('=== Backend environment values ===');
  console.log(`TRIALVO_PAY_SERVICE_ID=${SERVICE_ID}`);
  console.log(`TRIALVO_PAY_API_KEY=${apiKey}`);
  console.log(`TRIALVO_PAY_IPN_SECRET=${ipnSecret}`);
  console.log();

  // ─── Generate SQL ───────────────────────────────────────────────────────
  const sql = `-- ═══════════════════════════════════════════════════════════════════
-- Trialvo Pay Seed SQL — Auto-generated
-- Generated at: ${new Date().toISOString()}
-- Mode: SANDBOX
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Admin User ────────────────────────────────────────────────
-- Email: ${ADMIN_EMAIL}
-- Password: ${ADMIN_PASSWORD}
INSERT INTO admins (email, password_hash, display_name, role, is_active)
VALUES ('${ADMIN_EMAIL}', '${adminHash}', '${ADMIN_DISPLAY_NAME}', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  role = 'super_admin',
  is_active = true;

-- ─── 2. Service Registration ─────────────────────────────────────
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active)
VALUES ('${SERVICE_ID}', '${SERVICE_SLUG}', '${SERVICE_NAME}',
  'https://shop.trialvo.com/order-success',
  'https://shop.trialvo.com/checkout?error=payment_failed',
  'https://shop.trialvo.com/checkout?error=payment_cancelled',
  true, true)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  success_url = EXCLUDED.success_url,
  fail_url = EXCLUDED.fail_url,
  cancel_url = EXCLUDED.cancel_url,
  is_sandbox = true,
  is_active = true;

-- ─── 3. API Key (AES-256-GCM encrypted) ──────────────────────────
-- Raw API Key: ${apiKey}
-- Key Hash: ${apiKeyHash}
DELETE FROM service_keys WHERE service_id = '${SERVICE_ID}';
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
VALUES ('${SERVICE_ID}', '${apiKeyHash}', decode('${encryptedApiKey}', 'hex'), '${apiKeyPrefix}', true, true);

-- ─── 4. IPN Endpoint ─────────────────────────────────────────────
DELETE FROM ipn_endpoints WHERE service_id = '${SERVICE_ID}';
INSERT INTO ipn_endpoints (service_id, url, secret, is_active)
VALUES ('${SERVICE_ID}', 'http://backend:5000/api/payments/ipn', '${ipnSecret}', true);

-- ─── 5. EPS Gateway — Sandbox Mode ───────────────────────────────
-- Sandbox URL: ${EPS_SANDBOX_BASE_URL}
-- Sandbox Merchant ID: ${EPS_SANDBOX_MERCHANT_ID}
-- Sandbox Store ID: ${EPS_SANDBOX_STORE_ID}
-- Sandbox Username: ${EPS_SANDBOX_USERNAME}
-- Sandbox Password: ${EPS_SANDBOX_PASSWORD}
-- Sandbox Hash Key: ${EPS_SANDBOX_HASH_KEY}
UPDATE system_config SET value = '${encSandboxUsername}' WHERE category = 'eps' AND key_name = 'sandbox_username';
UPDATE system_config SET value = '${encSandboxPassword}' WHERE category = 'eps' AND key_name = 'sandbox_password';
UPDATE system_config SET value = '${encSandboxHashKey}' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';
UPDATE system_config SET value = '${EPS_SANDBOX_MERCHANT_ID}' WHERE category = 'eps' AND key_name = 'sandbox_merchant_id';
UPDATE system_config SET value = '${EPS_SANDBOX_STORE_ID}' WHERE category = 'eps' AND key_name = 'sandbox_store_id';
UPDATE system_config SET value = '${EPS_SANDBOX_BASE_URL}' WHERE category = 'eps' AND key_name = 'sandbox_base_url';

-- Set mode to SANDBOX
UPDATE system_config SET value = 'sandbox' WHERE category = 'eps' AND key_name = 'mode';

-- ═══════════════════════════════════════════════════════════════════
-- Backend env:
--   TRIALVO_PAY_API_KEY=${apiKey}
--   TRIALVO_PAY_IPN_SECRET=${ipnSecret}
--
-- Admin login:
--   Email: ${ADMIN_EMAIL}
--   Password: ${ADMIN_PASSWORD}
-- ═══════════════════════════════════════════════════════════════════
`;

  console.log(sql);

  // Write files
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql);
  console.log('✅ seed.sql written');

  const creds = { TRIALVO_PAY_API_KEY: apiKey, TRIALVO_PAY_IPN_SECRET: ipnSecret, TRIALVO_PAY_SERVICE_ID: SERVICE_ID };
  fs.writeFileSync(path.join(__dirname, '.generated_credentials.json'), JSON.stringify(creds, null, 2));
  console.log('✅ .generated_credentials.json written');
}

main().catch(console.error);
