/// Seed script: Creates a test service with API credentials and EPS sandbox config.
/// Usage: cargo run --example seed_test_service

use payvault::crypto::hmac;
use payvault::crypto::aes;

fn main() {
    let master_key = std::env::var("MASTER_KEY")
        .unwrap_or_else(|_| "45c11faf4c682130ba6610a471e76a5f5bbc4d9028b9d9ef7354d6beae681778".to_string());

    // Generate service API key and secret
    let api_key = format!("pk_test_{}", hmac::generate_service_secret());
    let api_secret = hmac::generate_service_secret();
    let key_hash = hmac::hash_key_for_lookup(&api_key);

    // Encrypt the API secret for DB storage
    let encrypted_secret = aes::encrypt(&master_key, &api_secret).expect("AES encrypt failed");

    // EPS Sandbox credentials (from documentation)
    let eps_merchant_id = "29e86e70-0ac6-45eb-ba04-9fcb0aaed12a";
    let eps_store_id = "d44e705f-9e3a-41de-98b1-1674631637da";
    let eps_username = "Epsdemo@gmail.com";
    let eps_password = "Epsdemo258@";
    let eps_hash_key = "FHZxyzeps56789gfhg678ygu876o=";

    // Encrypt EPS credentials
    let enc_username = aes::encrypt(&master_key, eps_username).expect("encrypt username");
    let enc_password = aes::encrypt(&master_key, eps_password).expect("encrypt password");
    let enc_hash_key = aes::encrypt(&master_key, eps_hash_key).expect("encrypt hash_key");

    println!("-- ═══════════════════════════════════════════════════════════");
    println!("-- PayVault Test Service Seed");
    println!("-- ═══════════════════════════════════════════════════════════");
    println!("-- Service: Graduate Fashion (test)");
    println!("-- API Key:    {}", api_key);
    println!("-- API Secret: {}", api_secret);
    println!("-- SAVE THESE — the secret cannot be recovered from the DB!");
    println!("-- ═══════════════════════════════════════════════════════════");
    println!();

    // Insert service
    println!(
        "INSERT INTO services (id, name, slug, api_key_hash, api_secret_encrypted, \
         eps_mode, eps_merchant_id, eps_store_id, \
         eps_username_encrypted, eps_password_encrypted, eps_hash_key_encrypted, \
         ipn_secret, is_active, created_at) \
         VALUES (\
         gen_random_uuid(), \
         'Graduate Fashion', \
         'graduate-fashion', \
         '{}', \
         decode('{}', 'hex'), \
         'sandbox', \
         '{}', \
         '{}', \
         decode('{}', 'hex'), \
         decode('{}', 'hex'), \
         decode('{}', 'hex'), \
         '{}', \
         true, \
         NOW()\
         );",
        key_hash,
        encrypted_secret,
        eps_merchant_id,
        eps_store_id,
        enc_username,
        enc_password,
        enc_hash_key,
        hmac::generate_service_secret(),
    );
}
