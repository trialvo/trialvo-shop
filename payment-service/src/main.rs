use actix_web::{middleware::Logger, web, App, HttpServer};
use redis::aio::ConnectionManager;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use payvault::api;
use payvault::config;
use payvault::db;
use payvault::ipn;

use config::AppConfig;
use db::pool::create_pool;
use payvault::AppState;


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // ─── Load .env (if present) ────────────────────────────────────────────────
    let _ = dotenvy::dotenv();

    // ─── Config ───────────────────────────────────────────────────────────────
    let config = AppConfig::from_env().expect("Failed to load configuration");

    // ─── Tracing ──────────────────────────────────────────────────────────────
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(&config.rust_log))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    tracing::info!("Starting PayVault on {}:{}", config.host, config.port);

    // ─── Database ─────────────────────────────────────────────────────────────
    let pool = create_pool(&config.database_url)
        .await
        .expect("Failed to connect to PostgreSQL");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");

    tracing::info!("Database connected and migrations applied");

    // ─── Redis ────────────────────────────────────────────────────────────────
    let redis_client = redis::Client::open(config.redis_url.clone())
        .expect("Invalid Redis URL");
    let redis_manager = ConnectionManager::new(redis_client)
        .await
        .expect("Failed to connect to Redis");
    let redis = Arc::new(Mutex::new(redis_manager));

    tracing::info!("Redis connected");

    // ─── Spawn background workers ─────────────────────────────────────────────
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        ipn::retry::run_retry_worker(pool_clone).await;
    });

    let pool_clone2 = pool.clone();
    tokio::spawn(async move {
        run_bill_expiry_worker(pool_clone2).await;
    });

    // ─── Shared IPN HTTP client ───────────────────────────────────────────────
    let ipn_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .expect("IPN HTTP client init failed");

    // ─── Build shared state ───────────────────────────────────────────────────
    let state = web::Data::new(AppState {
        db: pool,
        redis,
        config: config.clone(),
        ipn_client,
    });

    let host = config.host.clone();
    let port = config.port;

    // ─── HTTP Server ──────────────────────────────────────────────────────────
    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .app_data(
                web::JsonConfig::default()
                    .error_handler(|err, _req| {
                        let response = actix_web::HttpResponse::BadRequest()
                            .json(serde_json::json!({"error": format!("JSON parse error: {}", err)}));
                        actix_web::error::InternalError::from_response(err, response).into()
                    })
            )
            .wrap(Logger::default())
            .wrap(
                actix_cors::Cors::default()
                    .allowed_origin("https://payvault.trialvo.com")
                    .allowed_origin("http://localhost:8080")
                    .allowed_origin("http://127.0.0.1:8080")
                    .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
                    .allowed_headers(vec![
                        "Content-Type", "Authorization",
                        "X-Service-Id", "X-Timestamp", "X-Nonce", "X-Signature", "X-Api-Key", "X-Body-Hash",
                    ])
                    .max_age(3600)
            )
            // ─── Health check (MUST be before catch-all scopes) ─────────────
            .route("/health", web::get().to(health_check))
            // ─── Static assets (Admin SPA) ─────────────────────────────────────
            .service(
                actix_files::Files::new("/assets", "./static/assets")
                    .use_last_modified(true)
                    .use_etag(true)
            )
            // ─── Landing Page ────────────────────────────────────────────────────
            .service(
                web::resource("/")
                    .route(web::get().to(serve_landing_page))
            )
            // ─── Developer Documentation ────────────────────────────────────────
            .service(
                web::resource("/docs")
                    .route(web::get().to(serve_docs_page))
            )
            // ─── Admin SPA catch-all (serve index.html) ───────────────────────
            .service(
                web::resource("/admin/{tail:.*}")
                    .route(web::get().to(serve_admin_spa))
            )
            .service(
                web::resource("/admin")
                    .route(web::get().to(serve_admin_spa))
            )
            // ─── Merchant SPA catch-all ────────────────────────────────────────
            .service(
                web::resource("/merchant/{tail:.*}")
                    .route(web::get().to(serve_merchant_spa))
            )
            .service(
                web::resource("/merchant")
                    .route(web::get().to(serve_merchant_spa))
            )
            // ─── Service API (HMAC auth required) ─────────────────────────────
            .service(
                web::scope("/api/v1")
                    .wrap(api::middleware::hmac_auth::HmacAuthMiddleware)
                    .configure(api::service::bills::routes)
                    .configure(api::service::refunds::routes)
                    .configure(api::service::transactions::routes)
            )
            // ─── Admin API (session auth required) ────────────────────────────
            .service(
                web::scope("/api/admin")
                    // Auth routes (no middleware — these are the login endpoints)
                    .configure(api::admin::auth::routes)
                    // Protected admin routes
                    .service(
                        web::scope("")
                            .wrap(api::middleware::admin_auth::AdminAuthMiddleware)
                            .configure(api::admin::dashboard::routes)
                            .configure(api::admin::services::routes)
                            .configure(api::admin::transactions::routes)
                            .configure(api::admin::bills::routes)
                            .configure(api::admin::refunds::routes)
                            .configure(api::admin::customers::routes)
                            .configure(api::admin::config::routes)
                            .configure(api::admin::ipn::routes)
                            .configure(api::admin::audit::routes)
                            .configure(api::admin::admins::routes)
                            .configure(api::admin::merchants::routes)
                    )
            )
            // ─── Merchant API (session auth required) ─────────────────────────
            .service(
                web::scope("/api/merchant")
                    // Auth routes (no middleware — login endpoint)
                    .configure(api::merchant::auth::routes)
                    // Protected merchant routes
                    .service(
                        web::scope("")
                            .wrap(api::middleware::merchant_auth::MerchantAuthMiddleware)
                            .configure(api::merchant::auth::protected_routes)
                            .configure(api::merchant::dashboard::routes)
                            .configure(api::merchant::settings::routes)
                            .configure(api::merchant::webhooks::routes)
                            .configure(api::merchant::keys::routes)
                            .configure(api::merchant::transactions::routes)
                            .configure(api::merchant::refunds::routes)
                            .configure(api::merchant::deliveries::routes)
                    )
            )
            // ─── Public routes ─────────────────────────────────────────────────
            // Payment pages (no auth — customers access these)
            // MUST be LAST because /{token} is a catch-all
            .service(
                web::scope("")
                    .configure(api::payment::pay::routes)
            )
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}

async fn health_check(state: web::Data<AppState>) -> actix_web::HttpResponse {
    // Check DB
    let db_ok = sqlx::query("SELECT 1 as n").fetch_one(&state.db).await.is_ok();

    if db_ok {
        actix_web::HttpResponse::Ok().json(serde_json::json!({
            "status": "healthy",
            "service": "payvault",
            "version": env!("CARGO_PKG_VERSION"),
        }))
    } else {
        actix_web::HttpResponse::ServiceUnavailable().json(serde_json::json!({
            "status": "unhealthy",
            "db": false,
        }))
    }
}

async fn serve_admin_spa() -> actix_web::HttpResponse {
    let html = std::fs::read_to_string("./static/admin/index.html")
        .unwrap_or_else(|_| "<h1>Admin SPA not built yet. Run: npm run build</h1>".to_string());
    actix_web::HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

async fn serve_merchant_spa() -> actix_web::HttpResponse {
    let html = std::fs::read_to_string("./static/merchant/index.html")
        .unwrap_or_else(|_| "<h1>Merchant panel not found</h1>".to_string());
    actix_web::HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

async fn serve_landing_page() -> actix_web::HttpResponse {
    let html = std::fs::read_to_string("./static/landing/index.html")
        .unwrap_or_else(|_| "<h1>Landing page not found</h1>".to_string());
    actix_web::HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

async fn serve_docs_page() -> actix_web::HttpResponse {
    let html = std::fs::read_to_string("./static/docs/index.html")
        .unwrap_or_else(|_| "<h1>Documentation not found</h1>".to_string());
    actix_web::HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

/// Background worker: expire stale bills every 5 minutes
async fn run_bill_expiry_worker(pool: PgPool) {
    loop {
        match db::bills::expire_stale_bills(&pool).await {
            Ok(count) if count > 0 => tracing::info!("Expired {} stale bills", count),
            Err(e) => tracing::error!("Bill expiry worker error: {}", e),
            _ => {}
        }
        tokio::time::sleep(std::time::Duration::from_secs(300)).await;
    }
}
