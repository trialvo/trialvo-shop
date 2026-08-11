#!/bin/sh
# Idempotent one-shot database seeder for trial instances (Option 2 installer).
#
# Loads the demo schema + data the first time only. On subsequent boots it detects
# existing tables and skips, so `docker compose up` is safe to re-run. This lives
# inside the API image (which already bundles the seed SQL and the MySQL client),
# and is baked in as a file — NOT an inline compose command — specifically to avoid
# CRLF fragility: a multi-line YAML block-scalar command shipped from Windows keeps
# \r on each line, which breaks `sh` ("set: Illegal option"). Line endings here are
# normalized at build time in the Dockerfile.
set -e

DB_HOST="${DB_HOST:-db}"
DB_NAME="${DB_NAME:-ecom}"
MAIN_SQL="/usr/src/app/db backup/myecomv2.sql"
TRIAL_SQL="/usr/src/app/scripts/trial_v1.sql"
TECH_REPLACE="/usr/src/app/scripts/replace-tech-catalog.js"

echo "[seed] waiting for MySQL at ${DB_HOST}..."
until mysql -h "$DB_HOST" -uroot -p"$DB_ROOT_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done

# Skip if the database is already populated (idempotency guard).
TABLES=$(mysql -h "$DB_HOST" -uroot -p"$DB_ROOT_PASSWORD" -N -e \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}'")

if [ "$TABLES" -eq 0 ]; then
  echo "[seed] importing demo data (first boot)..."
  mysql -h "$DB_HOST" -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" < "$MAIN_SQL"
  # trial_v1.sql creates the license_state table; tolerate if already present.
  mysql -h "$DB_HOST" -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" < "$TRIAL_SQL" 2>/dev/null || true
  echo "[seed] replacing fashion catalog with tech products..."
  DB_HOST="$DB_HOST" DB_NAME="$DB_NAME" DB_USER="root" DB_PASSWORD="$DB_ROOT_PASSWORD" \
    node "$TECH_REPLACE"
  echo "[seed] done"
else
  echo "[seed] database already has ${TABLES} tables; skipping full import"
  # If an old fashion dump is present, swap catalog to tech once.
  FASHION_LEFT=$(mysql -h "$DB_HOST" -uroot -p"$DB_ROOT_PASSWORD" -N "$DB_NAME" -e \
    "SELECT COUNT(*) FROM main_categories WHERE name='Fashion'" 2>/dev/null || echo 0)
  if [ "${FASHION_LEFT:-0}" -gt 0 ] && [ -f "$TECH_REPLACE" ]; then
    echo "[seed] fashion catalog detected — applying tech catalog replace..."
    DB_HOST="$DB_HOST" DB_NAME="$DB_NAME" DB_USER="root" DB_PASSWORD="$DB_ROOT_PASSWORD" \
      node "$TECH_REPLACE"
  fi
fi

# Always upsert the Trialvo-issued admin so the emailed credentials actually work.
# (The demo dump's admins have unknown passwords — never tell users those.)
if [ -n "${TRIAL_ADMIN_EMAIL:-}" ] && [ -n "${TRIAL_ADMIN_PASSWORD:-}" ]; then
  node /usr/src/app/scripts/seed-trial-admin.js
fi
