/// PayVault Integration Test: Security Module
/// Tests the full auth chain: password hash → verify, HMAC replay protection,
/// encrypted credential management, and cross-module security flows

mod security_tests {
    use payvault::crypto::{aes, argon, hmac, totp};

    // ═══════════════════════════════════════════════════════════════════════════
    // Admin Authentication Flow
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn full_admin_auth_flow() {
        // 1. Admin creates account with password
        let password = "S3cureP@ssw0rd!";
        let hash = argon::hash_password(password).unwrap();

        // 2. Admin logs in - correct password
        assert!(argon::verify_password(password, &hash).unwrap());

        // 3. Wrong password rejected
        assert!(!argon::verify_password("WrongP@ss", &hash).unwrap());
    }

    #[test]
    fn admin_2fa_setup_flow() {
        // 1. Generate TOTP secret
        let secret = totp::generate_totp_secret().unwrap();
        assert!(!secret.is_empty());

        // 2. Encrypt the secret for DB storage
        let master_key = aes::generate_master_key();
        let encrypted = aes::encrypt(&master_key, &secret).unwrap();

        // 3. Later, decrypt to verify codes
        let decrypted = aes::decrypt(&master_key, &encrypted).unwrap();
        assert_eq!(secret, decrypted);

        // 4. Generate and verify a code with the decrypted secret
        let code = totp::get_current_code(&decrypted).unwrap();
        assert!(totp::verify_code(&decrypted, &code).unwrap());

        // 5. Generate backup codes
        let backup_codes = totp::generate_backup_codes();
        assert_eq!(backup_codes.len(), 10);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Service API Authentication Flow
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn full_service_api_auth_flow() {
        // 1. Generate a service secret key
        let raw_secret = hmac::generate_service_secret();

        // 2. Store lookup hash in DB (not the raw key)
        let lookup_hash = hmac::hash_key_for_lookup(&raw_secret);
        assert_eq!(lookup_hash.len(), 64);

        // 3. Service sends a request with HMAC signature
        let service_id = "svc_graduate_fashion";
        let timestamp = 1719475200u64;
        let nonce = "unique_nonce_abc123";
        let body_hash = hmac::sha256_body(b"{\"amount\":1500}");

        let signature = hmac::compute_service_signature(
            raw_secret.as_bytes(),
            service_id,
            timestamp,
            nonce,
            &body_hash,
        );

        // 4. Server verifies the signature
        assert!(
            hmac::verify_service_signature(
                raw_secret.as_bytes(), service_id, timestamp, nonce, &body_hash, &signature
            ),
            "Valid signature must pass"
        );

        // 5. Tampered body fails
        let tampered_hash = hmac::sha256_body(b"{\"amount\":9999}");
        assert!(
            !hmac::verify_service_signature(
                raw_secret.as_bytes(), service_id, timestamp, nonce, &tampered_hash, &signature
            ),
            "Tampered body must be rejected"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IPN Webhook Signing Flow
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn ipn_webhook_signing_flow() {
        // 1. IPN endpoint has a secret
        let ipn_secret = "whsec_1234567890abcdef";

        // 2. PayVault signs the payload
        let payload = r#"{"event":"payment.success","bill_token":"tok_abc","amount":"1500.00"}"#;
        let signature = hmac::sign_ipn_payload(ipn_secret, payload);

        // 3. Receiving service can verify by computing the same HMAC
        let expected = hmac::sign_ipn_payload(ipn_secret, payload);
        assert_eq!(signature, expected, "Signature must be reproducible");

        // 4. Tampered payload produces different signature
        let tampered = r#"{"event":"payment.success","bill_token":"tok_abc","amount":"9999.00"}"#;
        let tampered_sig = hmac::sign_ipn_payload(ipn_secret, tampered);
        assert_ne!(signature, tampered_sig, "Tampered payload must produce different signature");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EPS Credential Lifecycle
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn eps_credential_encrypt_store_retrieve_use() {
        let master_key = aes::generate_master_key();

        // Simulate storing EPS credentials
        let username = "Epsdemo@gmail.com";
        let password = "Epsdemo258@";
        let hash_key = "FHZxyzeps56789gfhg678ygu876o=";

        let enc_username = aes::encrypt(&master_key, username).unwrap();
        let enc_password = aes::encrypt(&master_key, password).unwrap();
        let enc_hash_key = aes::encrypt(&master_key, hash_key).unwrap();

        // Retrieve and decrypt
        let dec_username = aes::decrypt(&master_key, &enc_username).unwrap();
        let dec_password = aes::decrypt(&master_key, &enc_password).unwrap();
        let dec_hash_key = aes::decrypt(&master_key, &enc_hash_key).unwrap();

        assert_eq!(dec_username, username);
        assert_eq!(dec_password, password);
        assert_eq!(dec_hash_key, hash_key);

        // Use decrypted hash_key for EPS authentication
        let x_hash = hmac::compute_eps_x_hash(&dec_hash_key, &dec_username);
        let expected = hmac::compute_eps_x_hash(hash_key, username);
        assert_eq!(x_hash, expected, "Decrypted credentials must work correctly");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Edge Cases & Security Properties
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn password_timing_safety() {
        // Ensure very similar passwords don't bypass (testing logic, not actual timing)
        let hash = argon::hash_password("password1").unwrap();
        assert!(!argon::verify_password("password2", &hash).unwrap());
        assert!(!argon::verify_password("password", &hash).unwrap());
        assert!(!argon::verify_password("password1 ", &hash).unwrap());
    }

    #[test]
    fn hmac_empty_body_handling() {
        let secret = b"test_secret_32_bytes_pad________";
        let sig = hmac::compute_service_signature(secret, "svc", 100, "n", "");
        assert!(!sig.is_empty());
        assert!(hmac::verify_service_signature(secret, "svc", 100, "n", "", &sig));
    }

    #[test]
    fn aes_large_payload() {
        let master_key = aes::generate_master_key();
        // 10KB payload
        let large_text = "A".repeat(10_000);
        let encrypted = aes::encrypt(&master_key, &large_text).unwrap();
        let decrypted = aes::decrypt(&master_key, &encrypted).unwrap();
        assert_eq!(large_text, decrypted);
    }
}
