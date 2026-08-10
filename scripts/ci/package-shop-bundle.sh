#!/usr/bin/env bash
# Package Trialvo Shop CP for OLD VPS (155.248.253.24).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
OUT="${1:-shop-deploy.tgz}"
STAGE="$ROOT/.ci-staging-shop"

rm -rf "$STAGE"
mkdir -p "$STAGE/scripts/ci"

rsync -a \
  --exclude node_modules --exclude dist --exclude .git \
  "$ROOT/trialvo-shop/trialvo-backend" "$STAGE/trialvo-backend"
rsync -a \
  --exclude node_modules --exclude dist --exclude .git \
  "$ROOT/trialvo-shop/trialvo-frontend" "$STAGE/trialvo-frontend"

cp "$ROOT/trialvo-shop/docker-compose.prod.yml" "$STAGE/"
cp "$ROOT/trialvo-shop/docker-compose.shared-demo-remote.yml" "$STAGE/"
[[ -f "$ROOT/trialvo-shop/init-db-pay.sh" ]] && cp "$ROOT/trialvo-shop/init-db-pay.sh" "$STAGE/"
[[ -d "$ROOT/trialvo-shop/nginx" ]] && cp -r "$ROOT/trialvo-shop/nginx" "$STAGE/"

cp "$ROOT/scripts/ci/lib.sh" "$STAGE/scripts/ci/"
cp "$ROOT/scripts/ci/remote-deploy-shop.sh" "$STAGE/scripts/ci/"
chmod +x "$STAGE/scripts/ci/"*.sh

tar -czf "$OUT" -C "$STAGE" .
rm -rf "$STAGE"
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
