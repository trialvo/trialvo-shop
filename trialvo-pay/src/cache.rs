use anyhow::{anyhow, Result};
use redis::{aio::ConnectionManager, AsyncCommands};

/// Cache an EPS token in Redis with TTL (in seconds).
/// Key: "eps:token:{mode}"  (e.g., "eps:token:sandbox")
pub async fn cache_eps_token(
    redis: &mut ConnectionManager,
    mode: &str,
    token: &str,
    ttl_seconds: u64,
) -> Result<()> {
    let key = format!("eps:token:{}", mode);
    redis.set_ex::<_, _, ()>(&key, token, ttl_seconds).await
        .map_err(|e| anyhow!("Redis cache_eps_token error: {}", e))?;
    Ok(())
}

/// Get cached EPS token. Returns None if missing or expired.
pub async fn get_cached_eps_token(redis: &mut ConnectionManager, mode: &str) -> Result<Option<String>> {
    let key = format!("eps:token:{}", mode);
    let token: Option<String> = redis.get(&key).await
        .map_err(|e| anyhow!("Redis get_cached_eps_token error: {}", e))?;
    Ok(token)
}

/// Get remaining TTL of cached token (in seconds). 0 if key doesn't exist.
pub async fn get_token_ttl(redis: &mut ConnectionManager, mode: &str) -> Result<u64> {
    let key = format!("eps:token:{}", mode);
    let ttl: i64 = redis.ttl(&key).await
        .map_err(|e| anyhow!("Redis ttl error: {}", e))?;
    Ok(if ttl < 0 { 0 } else { ttl as u64 })
}

/// Rate limiting: increment a key with TTL. Returns new count.
pub async fn rate_limit_check(
    redis: &mut ConnectionManager,
    key: &str,
    window_seconds: u64,
    limit: u64,
) -> Result<bool> {
    let count: u64 = redis.incr(key, 1).await
        .map_err(|e| anyhow!("Redis incr error: {}", e))?;
    if count == 1 {
        // First request in window — set TTL
        redis.expire::<_, ()>(key, window_seconds as i64).await
            .map_err(|e| anyhow!("Redis expire error: {}", e))?;
    }
    Ok(count <= limit)
}

/// Store a nonce to prevent replay attacks. Returns false if already seen.
pub async fn store_nonce(
    redis: &mut ConnectionManager,
    nonce: &str,
    service_id: &str,
    ttl_seconds: u64,
) -> Result<bool> {
    let key = format!("nonce:{}:{}", service_id, nonce);
    // SET NX (set if not exists) — returns true if newly set
    let set: bool = redis.set_nx(&key, "1").await
        .map_err(|e| anyhow!("Redis nonce set error: {}", e))?;
    if set {
        redis.expire::<_, ()>(&key, ttl_seconds as i64).await
            .map_err(|e| anyhow!("Redis nonce expire error: {}", e))?;
    }
    Ok(set)
}

