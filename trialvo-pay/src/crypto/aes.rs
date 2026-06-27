use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use aes_gcm::aead::rand_core::RngCore;
use anyhow::{anyhow, Result};
use hex;

/// Encrypt plaintext using AES-256-GCM.
/// Returns nonce (12 bytes) + ciphertext concatenated as hex string.
pub fn encrypt(master_key_hex: &str, plaintext: &str) -> Result<String> {
    let key_bytes = hex::decode(master_key_hex)
        .map_err(|e| anyhow!("Invalid master key hex: {}", e))?;
    if key_bytes.len() != 32 {
        return Err(anyhow!("Master key must be exactly 32 bytes (64 hex chars)"));
    }

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| anyhow!("Encryption failed: {}", e))?;

    // Combine nonce + ciphertext and encode as hex
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(hex::encode(combined))
}

/// Decrypt a hex-encoded nonce+ciphertext produced by `encrypt`.
pub fn decrypt(master_key_hex: &str, encrypted_hex: &str) -> Result<String> {
    let key_bytes = hex::decode(master_key_hex)
        .map_err(|e| anyhow!("Invalid master key hex: {}", e))?;
    if key_bytes.len() != 32 {
        return Err(anyhow!("Master key must be exactly 32 bytes"));
    }

    let combined = hex::decode(encrypted_hex)
        .map_err(|e| anyhow!("Invalid encrypted hex: {}", e))?;
    if combined.len() < 12 {
        return Err(anyhow!("Encrypted data too short"));
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| anyhow!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext_bytes)
        .map_err(|e| anyhow!("Decrypted data is not valid UTF-8: {}", e))
}

/// Generate a random 32-byte master key as hex string (for initial setup).
pub fn generate_master_key() -> String {
    let mut key_bytes = [0u8; 32];
    OsRng.fill_bytes(&mut key_bytes);
    hex::encode(key_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let master_key = generate_master_key();
        let plaintext = "Epsdemo258@";
        let encrypted = encrypt(&master_key, plaintext).unwrap();
        let decrypted = decrypt(&master_key, &encrypted).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_different_nonces_each_time() {
        let master_key = generate_master_key();
        let plaintext = "test";
        let e1 = encrypt(&master_key, plaintext).unwrap();
        let e2 = encrypt(&master_key, plaintext).unwrap();
        assert_ne!(e1, e2); // Different nonces = different ciphertexts
    }
}
