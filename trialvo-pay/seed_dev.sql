-- PayVault Dev Seed SQL
-- Generated at build time. Run with: docker exec ... psql ...

INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'mode', 'sandbox') ON CONFLICT DO NOTHING;
INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_base_url', 'https://sandboxpgapi.eps.com.bd/v1') ON CONFLICT DO NOTHING;
INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_merchant_id', '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a') ON CONFLICT DO NOTHING;
INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_store_id', 'd44e705f-9e3a-41de-98b1-1674631637da') ON CONFLICT DO NOTHING;
INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_username', '9d175c0edd38a4d7c5b70d7a54b8b05379dbf3ab577f01d6adb785377708875607ee2ae87f526e4df718e7bba1') ON CONFLICT DO NOTHING;
INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_password', '2b35c7b6d22a861c28c425c3c5881f9921170a79a94f7ddbab087e6d7617b0a5f7fef852062ddf') ON CONFLICT DO NOTHING;
INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_hash_key', '6ff3a62d2e26ed13e03779a6efe8a26b77686988c0b3b28d1a3abe1e1beea514b5acf265f01b2113e3125b19082e2aceb74a7c31e3877f754a') ON CONFLICT DO NOTHING;

-- Test Service: Graduate Fashion
DO $$ DECLARE svc_id UUID := gen_random_uuid(); BEGIN
  INSERT INTO services (id, slug, display_name, description, is_active, is_sandbox)
  VALUES (svc_id, 'graduate-fashion', 'Graduate Fashion', 'E-commerce test service', true, true);

  INSERT INTO service_keys (id, service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)
  VALUES (gen_random_uuid(), svc_id, 'b1b055bec536822bc979e0dfd263bd3cce3c6ae1b6dc8b948960d49106c1d5f6', decode('4942a5f482aa141270036f3a5b080d877d2fb69cba8f87e48beed03e563c05a7a1a0315e3f0e82934f2569f85655d174182e5fd966026907e7a1580934b5c3cc754330993fc852a6be73bad47969d171f8ceceefb0599791d55dc36c', 'hex'), 'pk_test_a3df', true, true);
END $$;

-- IPN endpoint (optional, for webhook testing)
-- INSERT INTO ipn_endpoints (id, service_id, url, events, is_active)
-- VALUES (gen_random_uuid(), (SELECT id FROM services WHERE slug='graduate-fashion'), 'https://httpbin.org/post', ARRAY['payment.success','payment.failed'], true);
