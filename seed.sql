-- ═══════════════════════════════════════════════════════════════════
-- Trialvo Pay Seed SQL — Auto-generated
-- Generated at: 2026-06-27T19:37:15.934Z
-- MASTER_KEY: 45c11faf...
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Service Registration ──────────────────────────────────────
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'trialvo-shop', 'Trialvo Shop',
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
-- Raw API Key: bc6e7275e856e4533b00ff66e9f8404dec7648c30361060ba947f75208eec7b6
-- Key Hash (SHA-256): 2609a0b738c1bc2f87ac853dd0a14b1a50275a2517b9e58310d1049856d0f829
-- Key Prefix: bc6e7275
DELETE FROM service_keys WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', '2609a0b738c1bc2f87ac853dd0a14b1a50275a2517b9e58310d1049856d0f829', decode('b3e5dffb62c95366a4d53117844de14a866d0252bfe6700194ee0dbf25bc3375d7ac7ca1585e47c0214c065b0b99eca6d62b2081ba5d23c8c8beaf7d07390fb47cc7cb8f4d7b279a42b2116fda707aaae3226713cceea974f450e858', 'hex'), 'bc6e7275', true, true);

-- ─── 3. IPN Endpoint ─────────────────────────────────────────────
-- Uses internal Docker hostname for reliability
DELETE FROM ipn_endpoints WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';
INSERT INTO ipn_endpoints (service_id, url, secret, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'http://backend:5000/api/payments/ipn', 'fb2b6a3f3b465fc09b7e3f17f6c4d98082ed0e93f9393467e8ca1d687d2abd01', true);

-- ─── 4. EPS Gateway Credentials (AES-256-GCM encrypted) ──────────
-- Sandbox credentials
UPDATE system_config SET value = '34929f47ac9c3d0bab3769843a1ee5fc61618f1180db8d24ad5441dca508a4184a2b7407520cdb65a5a1372c2b' WHERE category = 'eps' AND key_name = 'sandbox_username';
UPDATE system_config SET value = 'd22472bb493fecd347f6f3eecb1eb9ab1010d1b0cd07c4662c98b25fb5981124f3343982bdbcf8' WHERE category = 'eps' AND key_name = 'sandbox_password';
UPDATE system_config SET value = '616048eb08892cf15223f90a9a47f4258ec65b60300390720ce5e92300a6a2b66ce3908e12e19cef3e7599baaf5c0e103bce2656a7eedf1339' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';

-- Live credentials (antorboss.bd@gmail.com)
UPDATE system_config SET value = '1b96918b63d6b3bf01bbb6f3b2b232ade0ff51cdafa3525e5de2c94112ea4e8b285876a52efdc8520d62739375fdb823b08d' WHERE category = 'eps' AND key_name = 'live_username';
UPDATE system_config SET value = 'b7f17a0d1bfb8c6593270848bd4038887908ec97107ffdda53d1fc62c2aaaa65f38d0ef7ea4f' WHERE category = 'eps' AND key_name = 'live_password';
UPDATE system_config SET value = 'eaf018376d4b8bc25133891b27f6ad3e5773ffbe9c66b6d4cfa41c020de33c4dfcf8231990106de840d4651c22d0ac0746dc01588e27ec7a24' WHERE category = 'eps' AND key_name = 'live_hash_key';

-- Set mode to live (use sandbox for testing)
UPDATE system_config SET value = 'live' WHERE category = 'eps' AND key_name = 'mode';

-- ═══════════════════════════════════════════════════════════════════
-- IMPORTANT: Update your backend environment with these values:
--   TRIALVO_PAY_API_KEY=bc6e7275e856e4533b00ff66e9f8404dec7648c30361060ba947f75208eec7b6
--   TRIALVO_PAY_IPN_SECRET=fb2b6a3f3b465fc09b7e3f17f6c4d98082ed0e93f9393467e8ca1d687d2abd01
-- ═══════════════════════════════════════════════════════════════════
