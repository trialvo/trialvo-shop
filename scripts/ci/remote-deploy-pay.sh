#!/usr/bin/env bash
# Runs ON OLD VPS — Trialvo Pay (payvault-app) ONLY when explicitly enabled.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$SCRIPT_DIR/lib.sh" ]]; then
  # shellcheck source=lib.sh
  source "$SCRIPT_DIR/lib.sh"
fi

PAY_DIR="${PAY_DIR:-/home/opc/payvault}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if ! docker ps --format '{{.Names}}' | grep -qx payvault-app; then
  echo "payvault-app not found — skip pay deploy"
  exit 0
fi

echo "=== payvault-app standalone container ==="
http_json_smoke "http://127.0.0.1:8088/health" "pay-before"

mkdir -p "$PAY_DIR"
if [[ -f pay-deploy.tgz ]]; then
  tar -xzf pay-deploy.tgz -C "$PAY_DIR"
  chmod +x "$PAY_DIR/scripts/ci/"*.sh 2>/dev/null || true
fi

if [[ -f "$PAY_DIR/$COMPOSE_FILE" ]]; then
  cd "$PAY_DIR"
  docker compose -f "$COMPOSE_FILE" build app 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate app nginx 2>/dev/null || true
else
  echo "No compose in $PAY_DIR — skipping recreate (manual payvault-app)"
fi

sleep 10
http_json_smoke "http://127.0.0.1:8088/health" "pay-after"
echo "Pay deploy OK"
