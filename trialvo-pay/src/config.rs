use anyhow::Result;
use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub database_url: String,
    pub redis_url: String,
    pub master_key: String,     // AES-256 master key for encrypting secrets in DB (32 bytes hex)
    pub base_url: String,
    pub host: String,
    pub port: u16,
    pub rust_log: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            database_url: required_env("DATABASE_URL")?,
            redis_url: required_env("REDIS_URL")?,
            master_key: required_env("MASTER_KEY")?,
            base_url: env::var("BASE_URL")
                .unwrap_or_else(|_| "https://pay.trialvo.com".to_string()),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            rust_log: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        })
    }
}

fn required_env(key: &str) -> Result<String> {
    env::var(key).map_err(|_| anyhow::anyhow!("Required env var '{}' not set", key))
}
