#!/usr/bin/env bash
# Build local-tagged demo images (names match shared-demo docker-compose).
# Usage: build-demo-images.sh [lifestyle|fashion|tech|all]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -n "${DEPLOY_ROOT:-}" ]]; then
  ROOT="$DEPLOY_ROOT"
else
  ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"
fi
TARGET="${1:-all}"

build_lifestyle() {
  echo "==> Building lifestyle demo images"
  local P="$ROOT/products/product-1-lifestyle"
  docker build -f "$P/deploy/Dockerfile.trial" -t lifestyle-api:trial "$P" \
    || docker build -t lifestyle-api:trial "$P/Back End"
  docker build -t lifestyle-admin:trial "$P/admin panel"
  docker build -t lifestyle-shop:trial "$P/shop panel"
}

build_fashion() {
  echo "==> Building fashion demo images"
  local P="$ROOT/products/product-2-fashion"
  docker build -f "$P/deploy/Dockerfile.trial" -t fashion-api:trial "$P" \
    || docker build -t fashion-api:trial "$P/Back End"
  docker build -t fashion-admin:trial "$P/admin panel"
  docker build -f "$P/deploy/Dockerfile.shop.trial" -t fashion-shop:trial "$P/shop panel" \
    || docker build -t fashion-shop:trial "$P/shop panel"
}

build_tech() {
  echo "==> Building techshop demo images"
  local P="$ROOT/products/product-3-tech-shop"
  docker build -f "$P/deploy/Dockerfile.trial" -t techshop-api:trial "$P" \
    || docker build -t techshop-api:trial "$P/Back End"
  docker build -t techshop-admin:trial "$P/admin panel"
  docker build -f "$P/deploy/Dockerfile.shop.trial" -t techshop-shop:trial "$P/shop panel" \
    || docker build -t techshop-shop:trial "$P/shop panel"
}

case "$TARGET" in
  lifestyle) build_lifestyle ;;
  fashion) build_fashion ;;
  tech) build_tech ;;
  all)
    build_lifestyle
    build_fashion
    build_tech
    ;;
  *)
    echo "Unknown target: $TARGET (use lifestyle|fashion|tech|all)"
    exit 1
    ;;
esac

echo "==> Demo images ready"
