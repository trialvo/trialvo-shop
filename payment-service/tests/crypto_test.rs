/// PayVault Integration Test: Crypto Layer
/// Tests AES-256-GCM, HMAC-SHA512/SHA256, Argon2id, TOTP, and cross-module interactions

mod crypto_tests {
    use base64::Engine;
    use payvault::crypto::aes;
    use payvault::crypto::hmac;
    use payvault::crypto::argon;
    use payvault::crypto::totp;

    // ═══════════════════════════════════════════════════════════════════════════
    // AES-256-GCM
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn aes_encrypt_decrypt_roundtrip() {
        let key = aes::generate_master_key();
        let plaintext = "EPS_SANDBOX_PASSWORD_Epsdemo258@!";
        let encrypted = aes::encrypt(&key, plaintext).expect("encryption failed");
        let decrypted = aes::decrypt(&key, &encrypted).expect("decryption failed");
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn aes_unique_nonces_per_encryption() {
        let key = aes::generate_master_key();
        let e1 = aes::encrypt(&key, "same_text").unwrap();
        let e2 = aes::encrypt(&key, "same_text").unwrap();
        // Nonce is random → ciphertexts must differ
        assert_ne!(e1, e2, "Two encryptions of the same plaintext must produce different ciphertexts");
    }

    #[test]
    fn aes_wrong_key_fails_decryption() {
        let key1 = aes::generate_master_key();
        let key2 = aes::generate_master_key();
        let encrypted = aes::encrypt(&key1, "secret").unwrap();
        let result = aes::decrypt(&key2, &encrypted);
        assert!(result.is_err(), "Decryption with wrong key must fail");
    }

    #[test]
    fn aes_rejects_short_key() {
        let result = aes::encrypt("deadbeef", "text");
        assert!(result.is_err(), "Key shorter than 32 bytes must be rejected");
    }

    #[test]
    fn aes_rejects_truncated_ciphertext() {
        let key = aes::generate_master_key();
        let result = aes::decrypt(&key, "aabbcc");
        assert!(result.is_err(), "Truncated ciphertext must fail");
    }

    #[test]
    fn aes_empty_plaintext_roundtrip() {
        let key = aes::generate_master_key();
        let encrypted = aes::encrypt(&key, "").unwrap();
        let decrypted = aes::decrypt(&key, &encrypted).unwrap();
        assert_eq!("", decrypted);
    }

    #[test]
    fn aes_unicode_plaintext_roundtrip() {
        let key = aes::generate_master_key();
        let text = "মূল্য: ৳১,০০০ • Payment 🎉";
        let encrypted = aes::encrypt(&key, text).unwrap();
        let decrypted = aes::decrypt(&key, &encrypted).unwrap();
        assert_eq!(text, decrypted);
    }

    #[test]
    fn aes_master_key_length() {
        let key = aes::generate_master_key();
        // 32 bytes → 64 hex chars
        assert_eq!(key.len(), 64, "Master key must be 64 hex chars (32 bytes)");
        assert!(hex::decode(&key).is_ok(), "Master key must be valid hex");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HMAC — EPS x-hash (SHA-512)
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn eps_x_hash_is_valid_base64() {
        let hash = hmac::compute_eps_x_hash("FHZxyzeps56789gfhg678ygu876o=", "Epsdemo@gmail.com");
        assert!(!hash.is_empty());
        assert!(
            base64::engine::general_purpose::STANDARD.decode(&hash).is_ok(),
            "EPS x-hash must be valid base64"
        );
    }

    #[test]
    fn eps_x_hash_deterministic() {
        let h1 = hmac::compute_eps_x_hash("key123", "data456");
        let h2 = hmac::compute_eps_x_hash("key123", "data456");
        assert_eq!(h1, h2, "Same key+data must produce same hash");
    }

    #[test]
    fn eps_x_hash_different_keys_differ() {
        let h1 = hmac::compute_eps_x_hash("key_a", "data");
        let h2 = hmac::compute_eps_x_hash("key_b", "data");
        assert_ne!(h1, h2, "Different keys must produce different hashes");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HMAC — Service auth (SHA-256)
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn service_signature_roundtrip() {
        let secret = b"32_byte_secret_for_hmac_testing!";
        let sig = hmac::compute_service_signature(secret, "svc_test", 1719475200, "nonce_abc", "body_hash_123");
        assert!(
            hmac::verify_service_signature(secret, "svc_test", 1719475200, "nonce_abc", "body_hash_123", &sig),
            "Valid signature must verify"
        );
    }

    #[test]
    fn service_signature_rejects_tampered_timestamp() {
        let secret = b"32_byte_secret_for_hmac_testing!";
        let sig = hmac::compute_service_signature(secret, "svc_test", 1719475200, "nonce_abc", "hash");
        assert!(
            !hmac::verify_service_signature(secret, "svc_test", 1719475201, "nonce_abc", "hash", &sig),
            "Tampered timestamp must be rejected"
        );
    }

    #[test]
    fn service_signature_rejects_tampered_nonce() {
        let secret = b"32_byte_secret_for_hmac_testing!";
        let sig = hmac::compute_service_signature(secret, "svc_test", 1719475200, "nonce_abc", "hash");
        assert!(
            !hmac::verify_service_signature(secret, "svc_test", 1719475200, "nonce_xyz", "hash", &sig),
            "Tampered nonce must be rejected"
        );
    }

    #[test]
    fn service_signature_rejects_wrong_secret() {
        let sig = hmac::compute_service_signature(b"secret_a_32_bytes_padding______!", "svc", 100, "n", "h");
        assert!(
            !hmac::verify_service_signature(b"secret_b_32_bytes_padding______!", "svc", 100, "n", "h", &sig),
            "Wrong secret key must be rejected"
        );
    }

    #[test]
    fn service_signature_rejects_garbage_hex() {
        let secret = b"32_byte_secret_for_hmac_testing!";
        assert!(
            !hmac::verify_service_signature(secret, "svc", 100, "n", "h", "not_hex_at_all!"),
            "Non-hex signature must be rejected"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HMAC — IPN signing
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn ipn_signing_deterministic() {
        let s1 = hmac::sign_ipn_payload("webhook_secret", r#"{"event":"payment.success"}"#);
        let s2 = hmac::sign_ipn_payload("webhook_secret", r#"{"event":"payment.success"}"#);
        assert_eq!(s1, s2);
    }

    #[test]
    fn ipn_signing_is_valid_hex() {
        let sig = hmac::sign_ipn_payload("secret", "payload");
        assert!(hex::decode(&sig).is_ok(), "IPN signature must be valid hex");
        // SHA-256 → 32 bytes → 64 hex chars
        assert_eq!(sig.len(), 64);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HMAC — Utility functions
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn sha256_body_hash() {
        let hash = hmac::sha256_body(b"hello world");
        assert_eq!(hash.len(), 64, "SHA-256 hash must be 64 hex chars");
        // Known SHA-256 of "hello world"
        assert_eq!(hash, "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
    }

    #[test]
    fn generate_service_secret_format() {
        let secret = hmac::generate_service_secret();
        assert_eq!(secret.len(), 64, "Service secret must be 64 hex chars (32 bytes)");
        assert!(hex::decode(&secret).is_ok());
    }

    #[test]
    fn hash_key_for_lookup_deterministic() {
        let h1 = hmac::hash_key_for_lookup("api_key_abc123");
        let h2 = hmac::hash_key_for_lookup("api_key_abc123");
        assert_eq!(h1, h2);
        assert_eq!(h1.len(), 64);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Argon2id
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn argon2_hash_and_verify() {
        let password = "Trialvo_SecureP@ss!";
        let hash = argon::hash_password(password).expect("hash failed");
        assert!(hash.starts_with("$argon2id$"), "Hash must be Argon2id format");
        assert!(argon::verify_password(password, &hash).unwrap());
    }

    #[test]
    fn argon2_wrong_password_rejected() {
        let hash = argon::hash_password("correct_password").unwrap();
        assert!(!argon::verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn argon2_unique_salts() {
        let h1 = argon::hash_password("same").unwrap();
        let h2 = argon::hash_password("same").unwrap();
        assert_ne!(h1, h2, "Different salts must produce different hashes");
    }

    #[test]
    fn argon2_invalid_hash_format_errors() {
        let result = argon::verify_password("pass", "not_a_valid_hash");
        assert!(result.is_err());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOTP
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn totp_generate_and_verify() {
        let secret = totp::generate_totp_secret().unwrap();
        let code = totp::get_current_code(&secret).unwrap();
        assert_eq!(code.len(), 6, "TOTP code must be 6 digits");
        assert!(code.chars().all(|c| c.is_ascii_digit()), "TOTP code must be all digits");
        assert!(totp::verify_code(&secret, &code).unwrap(), "Current code must verify");
    }

    #[test]
    fn totp_wrong_code_rejected() {
        let secret = totp::generate_totp_secret().unwrap();
        assert!(!totp::verify_code(&secret, "000000").unwrap_or(false));
    }

    #[test]
    fn totp_backup_codes_format() {
        let codes = totp::generate_backup_codes();
        assert_eq!(codes.len(), 10, "Must generate 10 backup codes");
        for code in &codes {
            assert_eq!(code.len(), 8, "Each backup code must be 8 chars");
            assert!(code.chars().all(|c| c.is_ascii_alphanumeric()), "Backup code must be alphanumeric");
        }
    }

    #[test]
    fn totp_backup_codes_unique() {
        let codes = totp::generate_backup_codes();
        let mut seen = std::collections::HashSet::new();
        for code in &codes {
            assert!(seen.insert(code), "Backup codes must be unique");
        }
    }

    #[test]
    fn totp_secret_is_valid_base32() {
        let secret = totp::generate_totp_secret().unwrap();
        assert!(!secret.is_empty());
        // base32 chars: A-Z, 2-7
        assert!(secret.chars().all(|c| c.is_ascii_uppercase() || ('2'..='7').contains(&c)));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Cross-module: Encrypt credentials → decrypt → use for HMAC
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn encrypted_credentials_flow() {
        let master_key = aes::generate_master_key();
        let hash_key = "FHZxyzeps56789gfhg678ygu876o=";

        // Encrypt the EPS hash key
        let encrypted = aes::encrypt(&master_key, hash_key).unwrap();

        // Decrypt it
        let decrypted = aes::decrypt(&master_key, &encrypted).unwrap();
        assert_eq!(hash_key, decrypted);

        // Use decrypted key to compute EPS x-hash
        let x_hash = hmac::compute_eps_x_hash(&decrypted, "Epsdemo@gmail.com");
        assert!(!x_hash.is_empty());

        // Should match directly computed hash
        let x_hash_direct = hmac::compute_eps_x_hash(hash_key, "Epsdemo@gmail.com");
        assert_eq!(x_hash, x_hash_direct, "Decrypted key must produce same hash as original");
    }
}

