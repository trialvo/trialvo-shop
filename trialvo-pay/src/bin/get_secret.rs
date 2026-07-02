use sqlx::PgPool;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;
    
    let row: (String,) = sqlx::query_as("SELECT secret FROM webhooks WHERE is_active = TRUE LIMIT 1")
        .fetch_one(&pool)
        .await?;
        
    println!("SECRET_FOUND:{}", row.0);
    Ok(())
}
