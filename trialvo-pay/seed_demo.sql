-- ============================================================
-- PayVault Demo Seed Data
-- Run this after migrations to set up all demo data
-- ============================================================

-- ─── EPS Gateway Configuration (Sandbox) ─────────────────────
INSERT INTO system_config (id, category, key_name, value, is_active)
VALUES
  (gen_random_uuid(), 'eps', 'mode', 'sandbox', true),
  (gen_random_uuid(), 'eps', 'sandbox_base_url', 'https://sandboxpgapi.eps.com.bd/v1', true),
  (gen_random_uuid(), 'eps', 'sandbox_merchant_id', '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a', true),
  (gen_random_uuid(), 'eps', 'sandbox_store_id', 'd44e705f-9e3a-41de-98b1-1674631637da', true),
  (gen_random_uuid(), 'eps', 'sandbox_username', '9d175c0edd38a4d7c5b70d7a54b8b05379dbf3ab577f01d6adb785377708875607ee2ae87f526e4df718e7bba1', true),
  (gen_random_uuid(), 'eps', 'sandbox_password', '2b35c7b6d22a861c28c425c3c5881f9921170a79a94f7ddbab087e6d7617b0a5f7fef852062ddf', true),
  (gen_random_uuid(), 'eps', 'sandbox_hash_key', '6ff3a62d2e26ed13e03779a6efe8a26b77686988c0b3b28d1a3abe1e1beea514b5acf265f01b2113e3125b19082e2aceb74a7c31e3877f754a', true)
ON CONFLICT DO NOTHING;

-- ─── Admin User ──────────────────────────────────────────────
-- Email: admin@payvault.trialvo.com  |  Password: admin123
INSERT INTO admins (id, email, password_hash, created_at, updated_at)
VALUES (
  '4f47a709-0682-4722-8e98-ceefd0f426e3',
  'admin@payvault.trialvo.com',
  '$argon2id$v=19$m=65536,t=3,p=4$0P4HeVtJqXRl0elB0OTRgw$U8APHsUZADXcWXH4kT7otSDRJfrOTDBDpH9U7OEThWo',
  NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ─── Test E-Commerce Service ─────────────────────────────────
INSERT INTO services (id, slug, display_name, description, is_active, is_sandbox)
VALUES (
  'fbd43229-7298-4ca1-9d6f-648619eb639a',
  'test-ecom',
  'Test E-Commerce Shop',
  'Demo e-commerce store for testing PayVault payment integration',
  true, true
)
ON CONFLICT (id) DO NOTHING;

-- ─── Service API Key ─────────────────────────────────────────
-- API Key: e7e57de54d29fc9f45d1f803414a08b692b7936cd3c40f5703fe07b6e5a1f0bb
INSERT INTO service_keys (id, service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
VALUES (
  '499f684e-7855-4c07-a35d-90f41f57510d',
  'fbd43229-7298-4ca1-9d6f-648619eb639a',
  '864a75e010651f2257750c14c5cdffaf88773de9919b91753e174742cac7a70c',
  decode('34643137323333636637393163373030333833313335643539626664636332656135373162316438646636383139666130386130613231386461643939346533376666393637326262663237306438326333636634623737346636366331313539353931383634616363386232396361646338353464356464333733643031376336396232343236336665623162663666386562653932343936343833653437356164646561616438376437616366643136366165613933', 'hex'),
  'pvk_e7e57de5',
  true, true
)
ON CONFLICT (id) DO NOTHING;

-- ─── IPN Webhook Endpoint ────────────────────────────────────
-- IPN Secret: eb410d012dc57424a97fe154ee839fea1ceecc67f0fc6af872084711cb9ad4dc
INSERT INTO ipn_endpoints (id, service_id, url, secret, events, is_active)
VALUES (
  'b4dcdc51-bf97-4b53-bb3b-b18b27a25ece',
  'fbd43229-7298-4ca1-9d6f-648619eb639a',
  'http://localhost:3456/webhooks/payvault',
  'eb410d012dc57424a97fe154ee839fea1ceecc67f0fc6af872084711cb9ad4dc',
  ARRAY['payment.success','payment.failed','payment.cancelled','payment.expired','refund.success','refund.failed'],
  true
)
ON CONFLICT (id) DO NOTHING;

-- ─── Merchant User ───────────────────────────────────────────
-- Email: merchant@test.com  |  Password: Merchant123!
INSERT INTO merchant_users (id, email, display_name, service_id, password_hash, is_active, created_at, updated_at)
VALUES (
  'd4b57687-ecdc-4ccb-a4d3-b40430d71b04',
  'merchant@test.com',
  'Test E-Commerce Merchant',
  'fbd43229-7298-4ca1-9d6f-648619eb639a',
  '$argon2id$v=19$m=65536,t=3,p=4$d9sVfmQXB2dK98H2phwT8g$0VJPazlmZkrgpbZXAbEgy5KdFmMTToWx+dNE5J4myc8',
  true, NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;
