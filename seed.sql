-- ═══════════════════════════════════════════════════════════════════
-- Trialvo Pay Seed SQL — Auto-generated
-- Generated at: 2026-06-27T19:43:57.753Z
-- Mode: SANDBOX
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Admin User ────────────────────────────────────────────────
-- Email: antorboss.bd@gmail.com
-- Password: Antor@8010
INSERT INTO admins (email, password_hash, display_name, role, is_active)
VALUES ('antorboss.bd@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$6EkUbtOYF31+trvap+hQJA$luYkwWC8guDW7tupr/SDFytpgRYz4aYsuCnMUQNiwME', 'Antor Boss', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  role = 'super_admin',
  is_active = true;

-- ─── 2. Service Registration ─────────────────────────────────────
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active, meta)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'trialvo-shop', 'Trialvo Shop',
  'https://shop.trialvo.com/order-success',
  'https://shop.trialvo.com/checkout?error=payment_failed',
  'https://shop.trialvo.com/checkout?error=payment_cancelled',
  true, true, '{"skip_preview": true}')
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  success_url = EXCLUDED.success_url,
  fail_url = EXCLUDED.fail_url,
  cancel_url = EXCLUDED.cancel_url,
  meta = EXCLUDED.meta,
  is_sandbox = true,
  is_active = true;

-- ─── 3. API Key (AES-256-GCM encrypted) ──────────────────────────
-- Raw API Key: daf90c493bf0c883fc5d766ffd3033a6bce160dfcd8dceee9e6e514e0ac6e9a9
-- Key Hash: 5b5e5c798ddf332cde6c450a8be264395f8c5dd78897a36a4154a42098bb4918
DELETE FROM service_keys WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', '5b5e5c798ddf332cde6c450a8be264395f8c5dd78897a36a4154a42098bb4918', decode('f6cb4b04f76b46c41e2eed7de32af9dbe5218cd1b9699671e7fd5aa6d131684f63ba4bcbc6bf4734f2de5d5a07a64b27046f8b0f87c656f93e093c4eed2fc0726717960881959fa10c68bd3d61ec28897f522ad9efddb22b33665091', 'hex'), 'daf90c49', true, true);

-- ─── 4. IPN Endpoint ─────────────────────────────────────────────
DELETE FROM ipn_endpoints WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';
INSERT INTO ipn_endpoints (service_id, url, secret, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'http://backend:5000/api/payments/ipn', '41215d634fe61aa1693bebbd9e85b935b84a7a4d2be0d4718aca335e3570177b', true);

-- ─── 5. EPS Gateway — Sandbox Mode ───────────────────────────────
-- Sandbox URL: https://sandboxpgapi.eps.com.bd/v1
-- Sandbox Merchant ID: 29e86e70-0ac6-45eb-ba04-9fcb0aaed12a
-- Sandbox Store ID: d44e705f-9e3a-41de-98b1-1674631637da
-- Sandbox Username: Epsdemo@gmail.com
-- Sandbox Password: Epsdemo258@
-- Sandbox Hash Key: FHZxyzeps56789gfhg678ygu876o=
UPDATE system_config SET value = 'c53cb72c21b4feb0209d3fce5f3aa66ff90e27289e47335c6e6a571c7da836368d04601dafa3a3475e80452078' WHERE category = 'eps' AND key_name = 'sandbox_username';
UPDATE system_config SET value = '0482974675e5a41d663b0ccac4a16955954a7714f0f7c0bcb3d582895129eb20cbeac5a4006be5' WHERE category = 'eps' AND key_name = 'sandbox_password';
UPDATE system_config SET value = '89a898ecf89eed7fbe494717ff96d2257ecbe4b04be880d1f1e3c2b505409e5775454811f0470cf33eea816c70c2ecc294fcaf284ffa34146a' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';
UPDATE system_config SET value = '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a' WHERE category = 'eps' AND key_name = 'sandbox_merchant_id';
UPDATE system_config SET value = 'd44e705f-9e3a-41de-98b1-1674631637da' WHERE category = 'eps' AND key_name = 'sandbox_store_id';
UPDATE system_config SET value = 'https://sandboxpgapi.eps.com.bd/v1' WHERE category = 'eps' AND key_name = 'sandbox_base_url';

-- Set mode to SANDBOX
UPDATE system_config SET value = 'sandbox' WHERE category = 'eps' AND key_name = 'mode';

-- ═══════════════════════════════════════════════════════════════════
-- Backend env:
--   TRIALVO_PAY_API_KEY=daf90c493bf0c883fc5d766ffd3033a6bce160dfcd8dceee9e6e514e0ac6e9a9
--   TRIALVO_PAY_IPN_SECRET=41215d634fe61aa1693bebbd9e85b935b84a7a4d2be0d4718aca335e3570177b
--
-- Admin login:
--   Email: antorboss.bd@gmail.com
--   Password: Antor@8010
-- ═══════════════════════════════════════════════════════════════════
