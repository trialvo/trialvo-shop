/// Simple IP-based rate limiting using Redis.
/// Wraps cache::rate_limit_check for route-specific limits.
use actix_web::{HttpRequest};

/// Extract client IP from request (respects X-Forwarded-For from Nginx)
pub fn extract_ip(req: &HttpRequest) -> String {
    req.headers()
        .get("X-Forwarded-For")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| req.peer_addr().map(|a| a.ip().to_string()))
        .unwrap_or_else(|| "unknown".to_string())
}

pub fn rate_key_api(service_id: &str) -> String {
    format!("rate:api:{}", service_id)
}

