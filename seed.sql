-- Service
INSERT INTO services (id, slug, display_name, success_url, fail_url, cancel_url, is_sandbox, is_active)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'trialvo-shop', 'Trialvo Shop', 'https://shop.trialvo.com/checkout/success', 'https://shop.trialvo.com/checkout/failed', 'https://shop.trialvo.com/checkout/cancel', false, true)
ON CONFLICT (slug) DO NOTHING;

-- Key
INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'd993b07ed2ff09d89a7095a47759a17cd2b9a1c8e6c7fcc7bb8bab105acfa90e', convert_to('6334cd107f044ce09eb00ee906015eff91907c31cfe4d49aa8fa575399e0c5451f34dd83631ef74a003774343ed7d0c4faffcdbed22d78a443f94d9edac3a76a04fa1817d126bf72feb8c8282bee9b7cc686d272a5f2afe8bf7a9843', 'UTF8'), '57359b20', true);

-- IPN
INSERT INTO ipn_endpoints (service_id, url, secret)
VALUES ('28280023-008f-4307-83de-5e4eabb57562', 'https://shop-api.trialvo.com/api/payment/webhook', '2119d2d37b84fbbe2f405404818940b70b0729f4cb76ea5b980fff42b242fcd6');
