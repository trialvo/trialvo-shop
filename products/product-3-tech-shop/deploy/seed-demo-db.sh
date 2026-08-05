#!/usr/bin/env bash
# L-3.2 — Apply demo DB + trial tables into MySQL for a Lifestyle trial stack.
# Usage:
#   ./deploy/seed-demo-db.sh [mysql_host] [mysql_user] [mysql_password] [database]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${1:-127.0.0.1}"
USER="${2:-ecom}"
PASS="${3:-}"
DB="${4:-ecom}"
PORT="${MYSQL_PORT:-3306}"

MYSQL=(mysql -h"$HOST" -P"$PORT" -u"$USER")
if [[ -n "$PASS" ]]; then MYSQL+=(-p"$PASS"); fi

echo "==> Creating database $DB (if needed)"
"${MYSQL[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

DEMO="$ROOT/Back End/db backup/myecomv2.sql"
TRIAL="$ROOT/Back End/scripts/trial_v1.sql"
ADMIN_SEED="$ROOT/Back End/scripts/trial_admin_seed.sql"

if [[ -f "$DEMO" ]]; then
  echo "==> Importing myecomv2 demo dump (may take a while)"
  "${MYSQL[@]}" "$DB" < "$DEMO"
else
  echo "WARN: demo dump missing at $DEMO — skipping"
fi

if [[ -f "$TRIAL" ]]; then
  echo "==> Applying trial_v1.sql"
  "${MYSQL[@]}" "$DB" < "$TRIAL"
fi

if [[ -f "$ADMIN_SEED" ]]; then
  echo "==> Applying trial ADMIN seed"
  "${MYSQL[@]}" "$DB" < "$ADMIN_SEED"
fi

echo "Done. Demo + trial schema ready on $HOST/$DB"
