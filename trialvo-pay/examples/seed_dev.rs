/// Seed script: Sets up the complete dev environment.
/// - EPS sandbox config in system_config table
/// - Test service (Graduate Fashion) with API key
/// Usage: cargo run --example seed_dev

use trialvo_pay::crypto::{aes, hmac};

fn main() {
    let master_key = std::env::var("MASTER_KEY")
        .unwrap_or_else(|_| "45c11faf4c682130ba6610a471e76a5f5bbc4d9028b9d9ef7354d6beae681778".to_string());

    // ─── Encrypt EPS sandbox credentials ────────────────────────────────────
    let enc_username = aes::encrypt(&master_key, "Epsdemo@gmail.com").unwrap();
    let enc_password = aes::encrypt(&master_key, "Epsdemo258@").unwrap();
    let enc_hash_key = aes::encrypt(&master_key, "FHZxyzeps56789gfhg678ygu876o=").unwrap();

    // ─── Generate service API credentials ───────────────────────────────────
    let api_secret = hmac::generate_service_secret();
    let api_key = format!("pk_test_{}", &api_secret[..16]);
    let key_hash = hmac::hash_key_for_lookup(&api_key);
    let encrypted_secret = aes::encrypt(&master_key, &api_secret).unwrap();

    // ─── Print credentials ──────────────────────────────────────────────────
    eprintln!("╔═══════════════════════════════════════════════════╗");
    eprintln!("║  Trialvo Pay Dev Seed — SAVE THESE CREDENTIALS!     ║");
    eprintln!("╠═══════════════════════════════════════════════════╣");
    eprintln!("║ Admin Login:                                     ║");
    eprintln!("║   Email:    admin@pay.trialvo.com            ║");
    eprintln!("║   Password: Admin@Trialvo Pay2026!                   ║");
    eprintln!("╠═══════════════════════════════════════════════════╣");
    eprintln!("║ Test Service API:                                 ║");
    eprintln!("║   API Key:    {}  ║", api_key);
    eprintln!("║   API Secret: {}  ║", &api_secret[..24]);
    eprintln!("║   (Full secret in SQL output)                     ║");
    eprintln!("╚═══════════════════════════════════════════════════╝");

    // ─── SQL Output ─────────────────────────────────────────────────────────
    println!("-- Trialvo Pay Dev Seed SQL");
    println!("-- Generated at build time. Run with: docker exec ... psql ...");
    println!();

    // EPS mode
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'mode', 'sandbox') ON CONFLICT DO NOTHING;");
    
    // EPS sandbox credentials
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_base_url', 'https://sandboxpgapi.eps.com.bd/v1') ON CONFLICT DO NOTHING;");
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_merchant_id', '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a') ON CONFLICT DO NOTHING;");
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_store_id', 'd44e705f-9e3a-41de-98b1-1674631637da') ON CONFLICT DO NOTHING;");
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_username', '{}') ON CONFLICT DO NOTHING;", enc_username);
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_password', '{}') ON CONFLICT DO NOTHING;", enc_password);
    println!("INSERT INTO system_config (id, section, key, value) VALUES (gen_random_uuid(), 'eps', 'sandbox_hash_key', '{}') ON CONFLICT DO NOTHING;", enc_hash_key);
    println!();

    // Test service
    println!("-- Test Service: Graduate Fashion");
    println!("DO $$ DECLARE svc_id UUID := gen_random_uuid(); BEGIN");
    println!("  INSERT INTO services (id, slug, display_name, description, is_active, is_sandbox)");
    println!("  VALUES (svc_id, 'graduate-fashion', 'Graduate Fashion', 'E-commerce test service', true, true);");
    println!();
    println!("  INSERT INTO service_keys (id, service_id, key_hash, encrypted_key, key_prefix, is_primary, is_active)");
    println!("  VALUES (gen_random_uuid(), svc_id, '{}', decode('{}', 'hex'), '{}', true, true);", 
        key_hash, encrypted_secret, &api_key[..12]);
    println!("END $$;");
    println!();

    // IPN endpoint for the test service
    println!("-- IPN endpoint (optional, for webhook testing)");
    println!("-- INSERT INTO ipn_endpoints (id, service_id, url, events, is_active)");
    println!("-- VALUES (gen_random_uuid(), (SELECT id FROM services WHERE slug='graduate-fashion'), 'https://httpbin.org/post', ARRAY['payment.success','payment.failed'], true);");

    // Print the full secret for reference
    eprintln!();
    eprintln!("Full API Secret: {}", api_secret);
}
