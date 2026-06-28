/// Re-encrypt all seed credentials with the current MASTER_KEY
/// Usage: cargo run --example reencrypt_all

use trialvo_pay::crypto::aes;

fn main() {
    let master_key = std::env::var("MASTER_KEY")
        .unwrap_or_else(|_| "7cdf6bc0d46db841e18b19727e6f2476ee89569bc333df23142d0e136f1e5e1b".to_string());

    let api_key = "daf90c493bf0c883fc5d766ffd3033a6bce160dfcd8dceee9e6e514e0ac6e9a9";
    let eps_username = "Epsdemo@gmail.com";
    let eps_password = "Epsdemo258@";
    let eps_hash_key = "FHZxyzeps56789gfhg678ygu876o=";

    let enc_api = aes::encrypt(&master_key, api_key).unwrap();
    let enc_user = aes::encrypt(&master_key, eps_username).unwrap();
    let enc_pass = aes::encrypt(&master_key, eps_password).unwrap();
    let enc_hash = aes::encrypt(&master_key, eps_hash_key).unwrap();

    println!("-- Update service key:");
    println!("UPDATE service_keys SET encrypted_key = convert_to('{}', 'UTF8') WHERE service_id = '28280023-008f-4307-83de-5e4eabb57562';", enc_api);
    println!();
    println!("-- Update EPS sandbox credentials:");
    println!("UPDATE system_config SET value = '{}' WHERE category = 'eps' AND key_name = 'sandbox_username';", enc_user);
    println!("UPDATE system_config SET value = '{}' WHERE category = 'eps' AND key_name = 'sandbox_password';", enc_pass);
    println!("UPDATE system_config SET value = '{}' WHERE category = 'eps' AND key_name = 'sandbox_hash_key';", enc_hash);
}
