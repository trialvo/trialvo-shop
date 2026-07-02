-- ═══════════════════════════════════════════════════════════════════
-- Trialvo Pay Seed SQL — Auto-generated
-- Generated at: 2026-07-02T20:47:11.984Z
-- Mode: SANDBOX
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Admin User ────────────────────────────────────────────────
-- Email: antorboss.bd@gmail.com
-- Password: Antor@8010
INSERT INTO admins (email, password_hash, display_name, role, is_active)
VALUES ('antorboss.bd@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$4KthEQlDz8G9kjl5wWlKCg$PSSQEdKDPuXPF8ODWUHw99pUJEiUuh5mkFNgKQ5fjAU', 'Antor Boss', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  role = 'super_admin',
  is_active = true;

-- ─── 2. Service Registration ─────────────────────────────────────
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'trialvo-shop', 'Trialvo Shop',
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
-- Raw API Key: 0aedfa5c0374153aa3453d06fa3b5a402eb069165742774aeaf8fec9fedc5a70
-- Key Hash: 137a3e3c6bf1df82f82b9d7e0c328b2c864dfb69bff5c43538487eb206194dae
DELETE FROM service_keys WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', '137a3e3c6bf1df82f82b9d7e0c328b2c864dfb69bff5c43538487eb206194dae', decode('d0da439193dc5e052f9f7321ffcaf0ea97677aea13c3ace1db61d9b136af6591b4f260b7f8f1df965fd30cfe16d26b09848e01ea7ff2dcc44e1fad36217be3b2a867a18d5a6b8ec10e68c556c8604cff015fe8cca451ff8bd2c4d408', 'hex'), '0aedfa5c', true, true);

-- ─── 4. IPN Endpoint ─────────────────────────────────────────────
DELETE FROM ipn_endpoints WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';
INSERT INTO ipn_endpoints (service_id, url, secret, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'http://backend:5000/api/payments/ipn', 'dee0b047cc6e964335880eef1d98f1f41b4006f4d9faba894c8ebabb14714558', true);

-- ─── 5. EPS Gateway — Sandbox Mode ───────────────────────────────
-- Sandbox URL: https://sandboxpgapi.eps.com.bd/v1
-- Sandbox Merchant ID: 29e86e70-0ac6-45eb-ba04-9fcb0aaed12a
-- Sandbox Store ID: d44e705f-9e3a-41de-98b1-1674631637da
-- Sandbox Username: Epsdemo@gmail.com
-- Sandbox Password: Epsdemo258@
-- Sandbox Hash Key: FHZxyzeps56789gfhg678ygu876o=
UPDATE system_config SET value = 'ab23a78570f72692e147d7407800d00744e79d620a304b580358446b589c0bfbd9d93fbfc016c9bf5b4fc628ef' WHERE category = 'eps' AND key_name = 'sandbox_username';
UPDATE system_config SET value = '757e2f7f14bd4d2ad3ca722b66cdd4e9b16eb2329c0f50a547f91db59d1e57df522d9bdc7f31cd' WHERE category = 'eps' AND key_name = 'sandbox_password';
UPDATE system_config SET value = '18950300cdb191ffc6424c908bc4f0679eaa19727351e8555ebac6678e8fa215e9f432015dabda87f45a7d9a94c6bcf71dc58dbbc522160338' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';
UPDATE system_config SET value = '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a' WHERE category = 'eps' AND key_name = 'sandbox_merchant_id';
UPDATE system_config SET value = 'd44e705f-9e3a-41de-98b1-1674631637da' WHERE category = 'eps' AND key_name = 'sandbox_store_id';
UPDATE system_config SET value = 'https://sandboxpgapi.eps.com.bd/v1' WHERE category = 'eps' AND key_name = 'sandbox_base_url';

-- Set mode to SANDBOX
UPDATE system_config SET value = 'sandbox' WHERE category = 'eps' AND key_name = 'mode';

-- ═══════════════════════════════════════════════════════════════════
-- Backend env:
--   TRIALVO_PAY_API_KEY=0aedfa5c0374153aa3453d06fa3b5a402eb069165742774aeaf8fec9fedc5a70
--   TRIALVO_PAY_IPN_SECRET=dee0b047cc6e964335880eef1d98f1f41b4006f4d9faba894c8ebabb14714558
--
-- Admin login:
--   Email: antorboss.bd@gmail.com
--   Password: Antor@8010
-- ═══════════════════════════════════════════════════════════════════
