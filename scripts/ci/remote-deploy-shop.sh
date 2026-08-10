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
  tar -xzf shop-deploy.tgz -C "$DEPLOY_DIR"
  chmod +x scripts/ci/*.sh 2>/dev/null || true
fi

COMPOSE="docker compose -f docker-compose.prod.yml"
if [[ -f docker-compose.shared-demo-remote.yml ]]; then
  COMPOSE="$COMPOSE -f docker-compose.shared-demo-remote.yml"
fi

if [[ "$DEPLOY_FRONTEND" == "1" ]]; then
  echo "=== Build & deploy frontend ==="
  if [[ -d trialvo-frontend ]] && [[ ! -w trialvo-frontend ]]; then
    sudo rm -rf trialvo-frontend
    tar -xzf shop-deploy.tgz trialvo-frontend 2>/dev/null || tar -xzf shop-deploy.tgz
  fi
  $COMPOSE build --no-cache frontend
  $COMPOSE up -d --no-deps frontend
fi

if [[ "$DEPLOY_BACKEND" == "1" ]]; then
  echo "=== Build & deploy backend ==="
  $COMPOSE build backend
  $COMPOSE up -d --no-deps backend
  sleep 8
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
