/// Trialvo Pay Integration Test: Customer & Billing Logic
/// Tests phone normalization, email normalization, identity hashing, and IPN retry delays

mod billing_tests {
    use trialvo_pay::db::customers::{normalize_phone, normalize_email, compute_identity_hash};
    use trialvo_pay::db::ipn::next_retry_delay_seconds;

    // ═══════════════════════════════════════════════════════════════════════════
    // Phone Normalization (Bangladesh E.164)
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn phone_full_international_format() {
        assert_eq!(normalize_phone("+8801712345678"), "+8801712345678");
    }

    #[test]
    fn phone_without_plus() {
        assert_eq!(normalize_phone("8801712345678"), "+8801712345678");
    }

    #[test]
    fn phone_local_with_zero_prefix() {
        assert_eq!(normalize_phone("01712345678"), "+8801712345678");
    }

    #[test]
    fn phone_ten_digit_local() {
        // 10-digit starting with 1 → prepend +880
        assert_eq!(normalize_phone("1712345678"), "+8801712345678");
    }

    #[test]
    fn phone_strips_non_digit_chars() {
        assert_eq!(normalize_phone("+880-171-234-5678"), "+8801712345678");
        assert_eq!(normalize_phone("(01712) 345678"), "+8801712345678");
        assert_eq!(normalize_phone("017 1234 5678"), "+8801712345678");
    }

    #[test]
    fn phone_unusual_format_passthrough() {
        // An unusual number that doesn't match any BD pattern
        let result = normalize_phone("123456");
        assert!(result.starts_with("+"), "Must always prepend +");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Email Normalization
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn email_lowercased() {
        assert_eq!(normalize_email("Admin@Trialvo Pay.com"), "admin@trialvo_pay.com");
    }

    #[test]
    fn email_trimmed() {
        assert_eq!(normalize_email("  user@example.com  "), "user@example.com");
    }

    #[test]
    fn email_already_normalized() {
        assert_eq!(normalize_email("test@example.com"), "test@example.com");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Identity Hash (Cross-service customer dedup)
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn identity_hash_deterministic() {
        let phones = vec!["+8801712345678".to_string()];
        let emails = vec!["user@example.com".to_string()];
        let h1 = compute_identity_hash(&phones, &emails, None);
        let h2 = compute_identity_hash(&phones, &emails, None);
        assert_eq!(h1, h2);
    }

    #[test]
    fn identity_hash_order_independent() {
        let phones = vec!["+8801712345678".to_string(), "+8801887654321".to_string()];
        let emails = vec!["a@x.com".to_string(), "b@x.com".to_string()];
        // Reversed order should produce the same hash (because we sort internally)
        let phones_rev = vec!["+8801887654321".to_string(), "+8801712345678".to_string()];
        let emails_rev = vec!["b@x.com".to_string(), "a@x.com".to_string()];
        assert_eq!(
            compute_identity_hash(&phones, &emails, None),
            compute_identity_hash(&phones_rev, &emails_rev, None),
            "Identity hash must be order-independent"
        );
    }

    #[test]
    fn identity_hash_with_nid() {
        let phones = vec!["+8801712345678".to_string()];
        let emails = vec!["x@y.com".to_string()];
        let h_without = compute_identity_hash(&phones, &emails, None);
        let h_with = compute_identity_hash(&phones, &emails, Some("NID_HASH_ABC"));
        assert_ne!(h_without, h_with, "Adding NID must change the hash");
    }

    #[test]
    fn identity_hash_is_sha256_hex() {
        let hash = compute_identity_hash(
            &["+8801712345678".to_string()],
            &["user@x.com".to_string()],
            None,
        );
        assert_eq!(hash.len(), 64, "SHA-256 hex must be 64 chars");
        assert!(hex::decode(&hash).is_ok(), "Must be valid hex");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IPN Retry Delays (exponential backoff)
    // ═══════════════════════════════════════════════════════════════════════════

    #[test]
    fn ipn_retry_delay_schedule() {
        assert_eq!(next_retry_delay_seconds(0), 30,   "Attempt 0 → 30s");
        assert_eq!(next_retry_delay_seconds(1), 120,  "Attempt 1 → 2min");
        assert_eq!(next_retry_delay_seconds(2), 480,  "Attempt 2 → 8min");
        assert_eq!(next_retry_delay_seconds(3), 1800, "Attempt 3 → 30min");
        assert_eq!(next_retry_delay_seconds(4), 7200, "Attempt 4 → 2h");
    }

    #[test]
    fn ipn_retry_exhausted() {
        assert_eq!(next_retry_delay_seconds(5), 0, "Exhausted attempts → 0 delay");
        assert_eq!(next_retry_delay_seconds(99), 0);
    }

    #[test]
    fn ipn_retry_delays_monotonically_increase() {
        let delays: Vec<i64> = (0..5).map(|i| next_retry_delay_seconds(i)).collect();
        for w in delays.windows(2) {
            assert!(w[1] > w[0], "Delays must increase: {} should be > {}", w[1], w[0]);
        }
    }
}
