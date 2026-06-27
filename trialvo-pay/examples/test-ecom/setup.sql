-- ═══════════════════════════════════════════════════════════════
-- Trialvo Pay — Test E-Commerce Setup Script
-- Run this ONCE after Trialvo Pay starts to set up:
--   1. A test admin account
--   2. EPS sandbox credentials
--   3. A test e-commerce service
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Create a test admin (password: admin123) ──────────────
-- Argon2id hash for "admin123"
INSERT INTO admins (email, password_hash, display_name, role, is_active, is_2fa_enabled)
VALUES (
    'admin@test.com',
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRoZXJl$Y5FZP3RTVIpGFM3M9VsMCJYxXOwjYfaIZwlV1NsmjGU',
    'Test Admin',
    'superadmin',
    TRUE,
    FALSE
)
ON CONFLICT (email) DO NOTHING;

-- ─── 2. Set EPS sandbox credentials ──────────────────────────
-- These are the sandbox credentials from EPS docs
UPDATE system_config SET value = 'sandbox' WHERE category = 'eps' AND key_name = 'mode';
UPDATE system_config SET value = 'Epsdemo@gmail.com' WHERE category = 'eps' AND key_name = 'sandbox_username';
UPDATE system_config SET value = 'Epsdemo258@' WHERE category = 'eps' AND key_name = 'sandbox_password';
UPDATE system_config SET value = 'FHZxyzeps56789gfhg678ygu876o=' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';

-- Ensure base URL for Trialvo Pay is localhost for testing
UPDATE system_config SET value = 'http://localhost:8080' WHERE category = 'general' AND key_name = 'base_url';

-- ─── Done ─────────────────────────────────────────────────────
-- Now:
-- 1. Log into admin panel: http://localhost:8080/admin
--    Email: admin@test.com  Password: admin123
-- 2. Create a service (slug: test_ecom)
-- 3. Generate an API key for the service
-- 4. Create an IPN endpoint: http://localhost:3456/webhooks/trialvo_pay
-- 5. Copy Service ID, API key, and IPN secret to the test shop
