# Trialvo Shop — Development Rules

## Docker UI Development
- **Never rebuild Docker for UI-only changes** (CSS/JS/HTML). The `trialvo-pay` service has a volume mount (`../trialvo-pay/static:/app/static:ro`) that reflects changes instantly.
- Only rebuild Docker when **Rust source code** changes (`src/`, `Cargo.toml`, `migrations/`).
- Use `docker compose -f docker-compose.local.yml build trialvo-pay` (without `--no-cache`) for faster cached builds.
- Use `--no-cache` only when dependencies change significantly.
