use anyhow::{anyhow, Result};
use base32::Alphabet;
use totp_rs::{Algorithm, Secret, TOTP};

/// Generate a new TOTP secret for a new admin user.
/// Returns the raw base32 secret string.
pub fn generate_totp_secret() -> Result<String> {
    // Generate 20 random bytes and encode as base32
    use ring::rand::{SecureRandom, SystemRandom};
    let rng = SystemRandom::new();
    let mut bytes = [0u8; 20];
    rng.fill(&mut bytes).map_err(|_| anyhow!("RNG failure"))?;
    let encoded = base32::encode(Alphabet::RFC4648 { padding: false }, &bytes);
    Ok(encoded)
}

/// Get the current TOTP code for a secret (for testing/verification).
pub fn get_current_code(secret_base32: &str) -> Result<String> {
    let totp = build_totp(secret_base32)?;
    totp.generate_current()
        .map_err(|e| anyhow!("Failed to generate TOTP code: {}", e))
}

/// Verify a TOTP code against a secret.
/// Allows 1 step tolerance (30s window on each side).
pub fn verify_code(secret_base32: &str, code: &str) -> Result<bool> {
    let totp = build_totp(secret_base32)?;
    totp.check_current(code)
        .map_err(|e| anyhow!("TOTP check failed: {}", e))
}

/// Generate a QR code SVG string for the admin setup page.
pub fn generate_qr_code_svg(secret_base32: &str, _admin_email: &str) -> Result<String> {
    let totp = build_totp(secret_base32)?;
    let otpauth_url = totp.get_url();
    // Return the otpauth URL for the frontend to render as QR code
    Ok(otpauth_url)
}

/// Generate backup codes for an admin (10 x 8-char alphanumeric codes).
pub fn generate_backup_codes() -> Vec<String> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..10)
        .map(|_| {
            (0..8)
                .map(|_| {
                    let idx = rng.gen_range(0..36);
                    if idx < 10 {
                        (b'0' + idx) as char
                    } else {
                        (b'A' + idx - 10) as char
                    }
                })
                .collect()
        })
        .collect()
}

fn build_totp(secret_base32: &str) -> Result<TOTP> {
    TOTP::new(
        Algorithm::SHA1,
        6,      // digit count
        1,      // step tolerance
        30,     // step (30 seconds)
        Secret::Encoded(secret_base32.to_string())
            .to_bytes()
            .map_err(|e| anyhow!("Invalid TOTP secret: {:?}", e))?,
        Some("PayVault".to_string()),
        "admin@payvault.trialvo.com".to_string(),
    )
    .map_err(|e| anyhow!("Failed to build TOTP: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_and_verify() {
        let secret = generate_totp_secret().unwrap();
        let code = get_current_code(&secret).unwrap();
        assert!(verify_code(&secret, &code).unwrap());
    }

    #[test]
    fn test_backup_codes_format() {
        let codes = generate_backup_codes();
        assert_eq!(codes.len(), 10);
        for code in &codes {
            assert_eq!(code.len(), 8);
        }
    }
}
