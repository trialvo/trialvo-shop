#!/usr/bin/env bash
# Resolve monorepo vs flat shop repo layout (deploy branch uses flat paths).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"

if [[ -d "$ROOT/trialvo-shop/trialvo-backend" ]]; then
  BACKEND_SRC="$ROOT/trialvo-shop/trialvo-backend"
  FRONTEND_SRC="$ROOT/trialvo-shop/trialvo-frontend"
elif [[ -d "$ROOT/trialvo-backend" ]]; then
  BACKEND_SRC="$ROOT/trialvo-backend"
  FRONTEND_SRC="$ROOT/trialvo-frontend"
else
  echo "ERROR: cannot find trialvo-backend (checked trialvo-shop/ and repo root)"
  exit 1
fi

# Compose/nginx may live in monorepo overlay even when app code is flat on deploy branch
if [[ -f "$ROOT/trialvo-shop/docker-compose.prod.yml" ]]; then
  SHOP_COMPOSE_DIR="$ROOT/trialvo-shop"
elif [[ -f "$ROOT/docker-compose.prod.yml" ]]; then
  SHOP_COMPOSE_DIR="$ROOT"
else
  echo "ERROR: docker-compose.prod.yml not found"
  exit 1
fi

SHARED_DEMO_SRC=""
if [[ -d "$ROOT/trialvo-shop/deploy/shared-demo" ]]; then
  SHARED_DEMO_SRC="$ROOT/trialvo-shop/deploy/shared-demo"
elif [[ -d "$ROOT/deploy/shared-demo" ]]; then
  SHARED_DEMO_SRC="$ROOT/deploy/shared-demo"
fi

INFRA_SRC=""
if [[ -d "$ROOT/infra" ]]; then
  INFRA_SRC="$ROOT/infra"
elif [[ -d "$ROOT/trialvo-shop/deploy/infra" ]]; then
  INFRA_SRC="$ROOT/trialvo-shop/deploy/infra"
fi

PRODUCTS_SRC="$ROOT/products"
