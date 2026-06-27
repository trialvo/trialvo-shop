// Trialvo Pay Library Root
// Exposes internal modules for integration testing via `tests/` directory.
// The actual binary entry point is `main.rs`.

use redis::aio::ConnectionManager;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::Mutex;

pub mod api;
pub mod cache;
pub mod config;
pub mod crypto;
pub mod db;
pub mod gateway;
pub mod ipn;
pub mod templates;

/// Shared application state passed to all Actix handlers.
pub struct AppState {
    pub db: PgPool,
    pub redis: Arc<Mutex<ConnectionManager>>,
    pub config: config::AppConfig,
    /// Shared HTTP client for IPN webhook delivery — reuse for connection pooling.
    pub ipn_client: reqwest::Client,
}

