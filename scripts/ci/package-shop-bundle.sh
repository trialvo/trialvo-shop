#!/usr/bin/env bash
# Package Trialvo Shop CP for OLD VPS (155.248.253.24).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
# shellcheck source=paths.sh
source "$(dirname "$0")/paths.sh"

OUT="${1:-shop-deploy.tgz}"
STAGE="$ROOT/.ci-staging-shop"

rm -rf "$STAGE"
mkdir -p "$STAGE/scripts/ci"

rsync -a \
  --exclude node_modules --exclude dist --exclude .git \
  "$BACKEND_SRC" "$STAGE/trialvo-backend"
rsync -a \
  --exclude node_modules --exclude dist --exclude .git \
  "$FRONTEND_SRC" "$STAGE/trialvo-frontend"

cp "$SHOP_COMPOSE_DIR/docker-compose.prod.yml" "$STAGE/"
if [[ -f "$SHOP_COMPOSE_DIR/docker-compose.shared-demo-remote.yml" ]]; then
  cp "$SHOP_COMPOSE_DIR/docker-compose.shared-demo-remote.yml" "$STAGE/"
fi
if [[ -f "$SHOP_COMPOSE_DIR/init-db-pay.sh" ]]; then
  cp "$SHOP_COMPOSE_DIR/init-db-pay.sh" "$STAGE/"
elif [[ -f "$ROOT/init-db.sh" ]]; then
  cp "$ROOT/init-db.sh" "$STAGE/init-db-pay.sh"
fi

NGINX_SRC=""
if [[ -d "$SHOP_COMPOSE_DIR/nginx" ]]; then
  NGINX_SRC="$SHOP_COMPOSE_DIR/nginx"
elif [[ -d "$ROOT/nginx" ]]; then
  NGINX_SRC="$ROOT/nginx"
fi
if [[ -n "$NGINX_SRC" ]]; then
  cp -r "$NGINX_SRC" "$STAGE/nginx"
fi

cp "$ROOT/scripts/ci/lib.sh" "$STAGE/scripts/ci/"
cp "$ROOT/scripts/ci/remote-deploy-shop.sh" "$STAGE/scripts/ci/"
chmod +x "$STAGE/scripts/ci/"*.sh

tar -czf "$OUT" -C "$STAGE" .
rm -rf "$STAGE"
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
