#!/usr/bin/env bash
# Package product demos + shared MySQL for NEW VPS (217.216.108.119).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
OUT="${1:-demos-deploy.tgz}"
STAGE="$ROOT/.ci-staging-demos"

rm -rf "$STAGE"
mkdir -p "$STAGE/scripts/ci" "$STAGE/trialvo-shop/deploy"

rsync -a \
  --exclude node_modules --exclude dist --exclude .next --exclude target --exclude .git \
  "$ROOT/products" "$STAGE/"
rsync -a "$ROOT/infra" "$STAGE/"
rsync -a "$ROOT/trialvo-shop/deploy/shared-demo" "$STAGE/trialvo-shop/deploy/"

cp "$ROOT/scripts/ci/lib.sh" "$STAGE/scripts/ci/"
cp "$ROOT/scripts/ci/build-demo-images.sh" "$STAGE/scripts/ci/"
cp "$ROOT/scripts/ci/remote-deploy-demos.sh" "$STAGE/scripts/ci/"
chmod +x "$STAGE/scripts/ci/"*.sh

tar -czf "$OUT" -C "$STAGE" .
rm -rf "$STAGE"
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
