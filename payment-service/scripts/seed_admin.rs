/// Standalone script to generate Argon2id hash for admin seeding.
/// Compile: rustc --edition 2021 seed_admin.rs (won't work standalone — use the approach below)

// Instead, we'll use the payvault binary itself.
// This file documents the approach.
//
// The actual seeding is done via a SQL INSERT with a pre-generated hash.
// Hash is generated using: cargo run --example hash_password -- "Antor@8010"
