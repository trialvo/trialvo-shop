#!/usr/bin/env bash
# Runs ON OLD VPS — deploy Trialvo Shop CP (never stops payvault-app).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

DEPLOY_DIR="${DEPLOY_DIR:-/home/opc/trialvo-shop}"
DEPLOY_FRONTEND="${DEPLOY_FRONTEND:-1}"
DEPLOY_BACKEND="${DEPLOY_BACKEND:-1}"

cd "$DEPLOY_DIR"

echo "=== Pay safety check (payvault-app must stay healthy) ==="
http_json_smoke "http://127.0.0.1:8088/health" "pay-pre"
docker ps --filter name=payvault-app --format '{{.Names}} {{.Status}}'

if [[ -f shop-deploy.tgz ]]; then
  echo "=== Extract shop bundle ==="
  # Stale nested layout from broken rsync bundles (trialvo-backend/trialvo-backend).
  rm -rf trialvo-backend/trialvo-backend trialvo-frontend/trialvo-frontend
  if [[ -d trialvo-backend ]] && [[ ! -w trialvo-backend ]]; then
    sudo rm -rf trialvo-backend
  fi
  if [[ -d trialvo-frontend ]] && [[ ! -w trialvo-frontend ]]; then
    sudo rm -rf trialvo-frontend
  fi
  tar -xzf shop-deploy.tgz -C "$DEPLOY_DIR"
  chmod +x scripts/ci/*.sh 2>/dev/null || true
  chmod -R u+w trialvo-backend trialvo-frontend deploy 2>/dev/null || true
  if ! grep -q comboBasketProductSeed trialvo-backend/src/seeds/runner.js; then
    echo "ERROR: extracted shop bundle missing comboBasketProductSeed in runner.js"
    exit 1
  fi
fi

COMPOSE="docker compose -f docker-compose.prod.yml"
if [[ -f docker-compose.shared-demo-remote.yml ]]; then
  COMPOSE="$COMPOSE -f docker-compose.shared-demo-remote.yml"
fi

if [[ "$DEPLOY_FRONTEND" == "1" ]]; then
  echo "=== Build & deploy frontend ==="
  $COMPOSE build --no-cache frontend
  $COMPOSE up -d --no-deps frontend
fi

if [[ "$DEPLOY_BACKEND" == "1" ]]; then
  echo "=== Build & deploy backend ==="
  $COMPOSE build --no-cache backend
  $COMPOSE up -d --no-deps backend
  sleep 8
  echo "=== Run catalog seeds (Combo Basket + cleanup) ==="
  if ! grep -q comboBasketProductSeed trialvo-backend/src/seeds/runner.js; then
    echo "ERROR: trialvo-backend bundle missing comboBasketProductSeed — aborting"
    exit 1
  fi
  $COMPOSE exec -T backend node -e "require('./src/seeds/runner').runSeeds().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"
fi

if [[ -f nginx/host-live-old-vps.conf ]]; then
  sudo cp nginx/host-live-old-vps.conf /etc/nginx/conf.d/trialvo-shop-pay-live.conf
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo "=== Smoke ==="
http_smoke "http://127.0.0.1:8090/" "frontend"
http_json_smoke "http://127.0.0.1:5000/api/health" "backend"
http_json_smoke "http://127.0.0.1:8088/health" "pay-post"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'frontend|backend|payvault' || true
echo "Shop CP deploy OK"
