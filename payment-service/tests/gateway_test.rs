/// PayVault Integration Test: EPS Gateway Structures & Hash Computation
/// Tests the EPS x-hash computation that's critical for gateway authentication

mod gateway_tests {
    use payvault::crypto::hmac::compute_eps_x_hash;

    // ═══════════════════════════════════════════════════════════════════════════
    // EPS x-hash (HMAC-SHA512 → Base64)
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn eps_x_hash_for_get_token() {
        // Simulate: HMAC-SHA512(hash_key, username)
        let hash_key = "FHZxyzeps56789gfhg678ygu876o=";
        let username = "Epsdemo@gmail.com";
        let x_hash = compute_eps_x_hash(hash_key, username);
        assert!(!x_hash.is_empty(), "x-hash must not be empty");
        // Base64 output length for SHA-512 (64 bytes) is 88 chars
        assert_eq!(x_hash.len(), 88, "Base64 of SHA-512 should be 88 chars");
    }

    #[test]
    fn eps_x_hash_for_initialize() {
        // Simulate: HMAC-SHA512(hash_key, merchant_tx_id + "|" + amount)
        let hash_key = "LiveHashKey123456789=";
        let data = "TXID_20241001_001|1500.00";
        let x_hash = compute_eps_x_hash(hash_key, data);
        assert_eq!(x_hash.len(), 88);
    }

    #[test]
    fn eps_x_hash_consistent_across_calls() {
        let key = "TestHashKey=";
        let data = "test_data";
        let results: Vec<String> = (0..10).map(|_| compute_eps_x_hash(key, data)).collect();
        for h in &results {
            assert_eq!(h, &results[0], "x-hash must be deterministic");
        }
    }

    #[test]
    fn eps_x_hash_varies_with_key() {
        let data = "same_data";
        let h1 = compute_eps_x_hash("key_alpha", data);
        let h2 = compute_eps_x_hash("key_beta", data);
        assert_ne!(h1, h2, "Different keys must produce different hashes");
    }

    #[test]
    fn eps_x_hash_varies_with_data() {
        let key = "same_key";
        let h1 = compute_eps_x_hash(key, "data_a");
        let h2 = compute_eps_x_hash(key, "data_b");
        assert_ne!(h1, h2, "Different data must produce different hashes");
    }

    #[test]
    fn eps_x_hash_empty_data() {
        let hash = compute_eps_x_hash("key", "");
        assert!(!hash.is_empty(), "Must handle empty data");
        assert_eq!(hash.len(), 88);
    }

    #[test]
    fn eps_x_hash_unicode_data() {
        // Bengali text in data field should be handled
        let hash = compute_eps_x_hash("key", "মূল্য ৳১০০০");
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 88);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Full credential encryption → hash flow
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn encrypted_hash_key_produces_correct_x_hash() {
        use payvault::crypto::aes;

        let master_key = aes::generate_master_key();
        let eps_hash_key = "LiveHashKey_RealValue123=";

        // Encrypt the EPS hash key (as stored in DB)
        let encrypted = aes::encrypt(&master_key, eps_hash_key).unwrap();

        // Decrypt it (as done during payment init)
        let decrypted = aes::decrypt(&master_key, &encrypted).unwrap();

        // Compute x-hash with both keys
        let direct_hash = compute_eps_x_hash(eps_hash_key, "test_username");
        let decrypted_hash = compute_eps_x_hash(&decrypted, "test_username");

        assert_eq!(direct_hash, decrypted_hash, "Encrypt→decrypt must preserve key integrity");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Service secret generation & lookup hash
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn service_secret_generation_unique() {
        use payvault::crypto::hmac::generate_service_secret;
        let secrets: Vec<String> = (0..100).map(|_| generate_service_secret()).collect();
        let unique: std::collections::HashSet<&String> = secrets.iter().collect();
        assert_eq!(unique.len(), 100, "All generated secrets must be unique");
    }

    #[test]
    fn key_lookup_hash_collision_resistance() {
        use payvault::crypto::hmac::hash_key_for_lookup;
        let h1 = hash_key_for_lookup("key_aaa");
        let h2 = hash_key_for_lookup("key_aab");
        assert_ne!(h1, h2, "Similar keys must produce different lookup hashes");
    }
}
