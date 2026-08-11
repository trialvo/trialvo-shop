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
DEPLOY_COMBO="${DEPLOY_COMBO:-0}"
DEPLOY_INFRA="${DEPLOY_INFRA:-0}"

if [[ -f "$ROOT/demos-deploy.tgz" ]]; then
  echo "=== Extract demos bundle ==="
  rm -rf "$ROOT/trialvo-shop/deploy/shared-demo" "$ROOT/deploy/shared-demo"
  tar -xzf "$ROOT/demos-deploy.tgz" -C "$ROOT"
  chmod +x "$ROOT/scripts/ci/"*.sh 2>/dev/null || true
  chmod -R u+w "$ROOT/trialvo-shop/deploy/shared-demo" "$ROOT/deploy/shared-demo" 2>/dev/null || true
fi

cd "$ROOT"
export DEPLOY_ROOT="$ROOT"

SHARED_COMPOSE_DIR=""
if [[ -f "$ROOT/trialvo-shop/deploy/shared-demo/docker-compose.yml" ]]; then
  SHARED_COMPOSE_DIR="$ROOT/trialvo-shop/deploy/shared-demo"
elif [[ -f "$ROOT/deploy/shared-demo/docker-compose.yml" ]]; then
  SHARED_COMPOSE_DIR="$ROOT/deploy/shared-demo"
else
  echo "ERROR: shared-demo docker-compose.yml not found under trialvo-shop/ or deploy/"
  exit 1
fi

# Keep legacy deploy/shared-demo path in sync when monorepo overlay is present.
if [[ -f "$ROOT/trialvo-shop/deploy/shared-demo/docker-compose.yml" ]]; then
  mkdir -p "$ROOT/deploy/shared-demo"
  cp -f "$ROOT/trialvo-shop/deploy/shared-demo/docker-compose.yml" "$ROOT/deploy/shared-demo/"
  if [[ -f "$ROOT/trialvo-shop/deploy/shared-demo/docker-compose.vps.yml" ]]; then
    cp -f "$ROOT/trialvo-shop/deploy/shared-demo/docker-compose.vps.yml" "$ROOT/deploy/shared-demo/"
  fi
fi

echo "=== Ensure shared MySQL ==="
docker compose -f infra/docker-compose.yml up -d
sleep 5

BUILD_SCRIPT="$ROOT/scripts/ci/build-demo-images.sh"
chmod +x "$BUILD_SCRIPT" "$ROOT/scripts/ci/remote-deploy-demos.sh" 2>/dev/null || true

COMPOSE="docker compose -f $SHARED_COMPOSE_DIR/docker-compose.yml"
if [[ -f "$SHARED_COMPOSE_DIR/docker-compose.vps.yml" ]]; then
  COMPOSE="$COMPOSE -f $SHARED_COMPOSE_DIR/docker-compose.vps.yml"
fi

echo "Compose services: $($COMPOSE config --services | tr '\n' ' ')"

if grep -q 'combobasket-api:' "$SHARED_COMPOSE_DIR/docker-compose.yml" 2>/dev/null; then
  if [[ "$DEPLOY_COMBO" != "1" ]]; then
    echo "Combo services in compose — enabling DEPLOY_COMBO"
    DEPLOY_COMBO=1
  fi
fi

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

if [[ "$DEPLOY_COMBO" == "1" ]]; then
  bash "$BUILD_SCRIPT" combo
  $COMPOSE up -d --no-deps combobasket-api combobasket-admin combobasket-shop
fi

if [[ "$DEPLOY_INFRA" == "1" && "$DEPLOY_LIFESTYLE" == "0" && "$DEPLOY_FASHION" == "0" && "$DEPLOY_TECH" == "0" && "$DEPLOY_COMBO" == "0" ]]; then
  if grep -q 'combobasket' trialvo-shop/deploy/shared-demo/docker-compose.yml 2>/dev/null; then
    bash "$BUILD_SCRIPT" combo
  fi
  $COMPOSE up -d
fi

echo "=== Smoke demos ==="
http_smoke "http://127.0.0.1:5100/" "lifestyle-shop"
http_smoke "http://127.0.0.1:5101/" "fashion-shop"
http_smoke "http://127.0.0.1:5102/" "tech-shop"
if [[ "$DEPLOY_COMBO" == "1" ]] || docker ps --format '{{.Names}}' | grep -q combobasket-demo-shop; then
  http_smoke "http://127.0.0.1:5103/" "combo-shop"
  http_smoke "http://127.0.0.1:9103/api/health" "combo-api"
fi
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -15
echo "Demos deploy OK"
