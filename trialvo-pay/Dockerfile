# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM rust:1.88-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set SQLX_OFFLINE so we don't need a live DB during build
ENV SQLX_OFFLINE=true

# Cache dependencies (Docker layer optimization)
# We strip the [[lib]] target from Cargo.toml and build with a dummy main only.
# This caches all dependency compilation without needing the actual source.
COPY Cargo.toml Cargo.lock ./
RUN sed -i '/^\[lib\]/,/^$/d' Cargo.toml 2>/dev/null || true && \
    mkdir -p src && \
    echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src target/release/deps/payvault*

# Build actual binary
COPY src/ src/
COPY migrations/ migrations/
COPY static/ static/
COPY .cargo/ .cargo/
RUN cargo build --release

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r payvault && useradd -r -g payvault -d /app -s /sbin/nologin payvault

WORKDIR /app

# Copy binary, migrations, static assets
COPY --from=builder /app/target/release/payvault ./payvault
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/static ./static

RUN chown -R payvault:payvault /app

USER payvault

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./payvault"]
