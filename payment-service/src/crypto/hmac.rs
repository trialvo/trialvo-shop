use base64::{engine::general_purpose::STANDARD, Engine as _};
use hmac::{Hmac, Mac};
use hmac::digest::KeyInit;
use ring::hmac as ring_hmac;

// ─── EPS x-hash (HMAC-SHA512 → Base64) ───────────────────────────────────────
// Used to sign requests to EPS API: GetToken, InitializeEPS, CheckStatus

/// Generate EPS x-hash header value.
/// Spec: HMAC-SHA512(hash_key_utf8, data_utf8) → Base64
pub fn compute_eps_x_hash(hash_key: &str, data: &str) -> String {
    type HmacSha512 = Hmac<sha2::Sha512>;

    let mut mac = <HmacSha512 as KeyInit>::new_from_slice(hash_key.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(data.as_bytes());
    let result = mac.finalize();
    STANDARD.encode(result.into_bytes())
}

// ─── Service HMAC-SHA256 (for PayVault API auth) ──────────────────────────────
// Used to authenticate calls FROM registered services TO PayVault.
// Signature = HMAC-SHA256(secret_key, "{service_id}:{timestamp}:{nonce}:{body_sha256}")

/// Compute HMAC-SHA256 for service request verification.
pub fn compute_service_signature(
    secret_key: &[u8],
    service_id: &str,
    timestamp: u64,
    nonce: &str,
    body_sha256: &str,
) -> String {
    let message = format!("{}:{}:{}:{}", service_id, timestamp, nonce, body_sha256);
    let key = ring_hmac::Key::new(ring_hmac::HMAC_SHA256, secret_key);
    let signature = ring_hmac::sign(&key, message.as_bytes());
    hex::encode(signature.as_ref())
}

/// Verify a service's HMAC-SHA256 signature using constant-time comparison.
pub fn verify_service_signature(
    secret_key: &[u8],
    service_id: &str,
    timestamp: u64,
    nonce: &str,
    body_sha256: &str,
    provided_signature: &str,
) -> bool {
    let _expected = compute_service_signature(secret_key, service_id, timestamp, nonce, body_sha256);
    // Constant-time comparison to prevent timing attacks
    ring_hmac::verify(
        &ring_hmac::Key::new(ring_hmac::HMAC_SHA256, secret_key),
        format!("{}:{}:{}:{}", service_id, timestamp, nonce, body_sha256).as_bytes(),
        &hex::decode(provided_signature).unwrap_or_default(),
    )
    .is_ok()
}

// ─── IPN payload signature ────────────────────────────────────────────────────
// HMAC-SHA256(ipn_endpoint.secret, raw_json_body) → hex

/// Sign an IPN payload to be sent to a service's webhook endpoint.
pub fn sign_ipn_payload(ipn_secret: &str, payload_json: &str) -> String {
    let key = ring_hmac::Key::new(ring_hmac::HMAC_SHA256, ipn_secret.as_bytes());
    let sig = ring_hmac::sign(&key, payload_json.as_bytes());
    hex::encode(sig.as_ref())
}

/// Compute SHA-256 hash of request body (for service auth).
pub fn sha256_body(body: &[u8]) -> String {
    use sha2::Digest;
    let hash = sha2::Sha256::digest(body);
    hex::encode(hash)
}

/// Generate a cryptographically random 64-byte secret key for a service (hex-encoded).
pub fn generate_service_secret() -> String {
    use ring::rand::{SecureRandom, SystemRandom};
    let rng = SystemRandom::new();
    let mut bytes = [0u8; 32];
    rng.fill(&mut bytes).expect("RNG failure");
    hex::encode(bytes)
}

/// Hash a secret key with SHA-256 for database lookup (so we don't store raw keys).
pub fn hash_key_for_lookup(raw_key: &str) -> String {
    use sha2::Digest;
    let hash = sha2::Sha256::digest(raw_key.as_bytes());
    hex::encode(hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eps_x_hash() {
        // From EPS docs example: hash key + username
        let hash = compute_eps_x_hash(
            "FHZxyzeps56789gfhg678ygu876o=",
            "Epsdemo@gmail.com",
        );
        // Should produce a valid base64 string
        assert!(!hash.is_empty());
        assert!(STANDARD.decode(&hash).is_ok());
    }

    #[test]
    fn test_service_signature_verify() {
        let secret = b"my_secret_key_here_32_bytes_long!";
        let sig = compute_service_signature(secret, "svc_test", 1719475200, "nonce123", "bodyhash");
        assert!(verify_service_signature(secret, "svc_test", 1719475200, "nonce123", "bodyhash", &sig));
    }

    #[test]
    fn test_wrong_signature_rejected() {
        let secret = b"my_secret_key_here_32_bytes_long!";
        let wrong_sig = "deadbeef".repeat(8);
        assert!(!verify_service_signature(secret, "svc_test", 1719475200, "nonce123", "bodyhash", &wrong_sig));
    }
}
