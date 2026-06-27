/// Seed script: Creates the initial super admin account.
/// Usage: cargo run --example seed_admin

use trialvo_pay::crypto::argon;

fn main() {
    let password = "Admin@Trialvo Pay2026!";
    let hash = argon::hash_password(password).expect("Failed to hash password");
    
    println!("-- Trialvo Pay Admin Seed SQL --");
    println!("-- Email: admin@pay.trialvo.com");
    println!("-- Password: {}", password);
    println!();
    println!(
        "INSERT INTO admins (id, email, password_hash, role, is_2fa_enabled, created_at) \
         VALUES (gen_random_uuid(), 'admin@pay.trialvo.com', '{}', 'super_admin', false, NOW()) \
         ON CONFLICT (email) DO NOTHING;",
        hash
    );
}
