#!/usr/bin/env bash
# Runs ON NEW VPS — demos + shared MySQL only (no Pay / no CP).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT="${DEPLOY_ROOT:-/opt/trialvo}"
DEPLOY_LIFESTYLE="${DEPLOY_LIFESTYLE:-0}"
DEPLOY_FASHION="${DEPLOY_FASHION:-0}"
DEPLOY_TECH="${DEPLOY_TECH:-0}"
DEPLOY_INFRA="${DEPLOY_INFRA:-0}"

if [[ -f "$ROOT/demos-deploy.tgz" ]]; then
  echo "=== Extract demos bundle ==="
  tar -xzf "$ROOT/demos-deploy.tgz" -C "$ROOT"
  chmod +x "$ROOT/scripts/ci/"*.sh 2>/dev/null || true
fi

cd "$ROOT"
export DEPLOY_ROOT="$ROOT"

echo "=== Ensure shared MySQL ==="
docker compose -f infra/docker-compose.yml up -d
sleep 5

BUILD_SCRIPT="$ROOT/scripts/ci/build-demo-images.sh"
chmod +x "$BUILD_SCRIPT" "$ROOT/scripts/ci/remote-deploy-demos.sh" 2>/dev/null || true

COMPOSE="docker compose -f trialvo-shop/deploy/shared-demo/docker-compose.yml -f trialvo-shop/deploy/shared-demo/docker-compose.vps.yml"

if [[ "$DEPLOY_LIFESTYLE" == "1" ]]; then
  bash "$BUILD_SCRIPT" lifestyle
  $COMPOSE up -d --no-deps lifestyle-api lifestyle-admin lifestyle-shop
fi

if [[ "$DEPLOY_FASHION" == "1" ]]; then
  bash "$BUILD_SCRIPT" fashion
  $COMPOSE up -d --no-deps fashion-api fashion-admin fashion-shop
fi

if [[ "$DEPLOY_TECH" == "1" ]]; then
  bash "$BUILD_SCRIPT" tech
  $COMPOSE up -d --no-deps techshop-api techshop-admin techshop-shop
fi

if [[ "$DEPLOY_INFRA" == "1" && "$DEPLOY_LIFESTYLE" == "0" && "$DEPLOY_FASHION" == "0" && "$DEPLOY_TECH" == "0" ]]; then
  $COMPOSE up -d
fi

echo "=== Smoke demos ==="
http_smoke "http://127.0.0.1:5100/" "lifestyle-shop"
http_smoke "http://127.0.0.1:5101/" "fashion-shop"
http_smoke "http://127.0.0.1:5102/" "tech-shop"
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -15
echo "Demos deploy OK"
