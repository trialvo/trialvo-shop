#!/usr/bin/env bash
# Package product demos + shared MySQL for NEW VPS (217.216.108.119).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
# shellcheck source=paths.sh
source "$(dirname "$0")/paths.sh"

OUT="${1:-demos-deploy.tgz}"
STAGE="$ROOT/.ci-staging-demos"

rm -rf "$STAGE"
mkdir -p "$STAGE/scripts/ci" "$STAGE/trialvo-shop/deploy" "$STAGE/products" "$STAGE/infra"

if [[ ! -d "$PRODUCTS_SRC" ]]; then
  echo "ERROR: products/ not found — demos bundle requires product directories"
  exit 1
fi

# Trailing slashes are required: without them rsync nests as products/products.
rsync -a \
  --exclude node_modules --exclude dist --exclude .next --exclude target --exclude .git \
  "$PRODUCTS_SRC/" "$STAGE/products/"

if [[ -n "$INFRA_SRC" ]]; then
  rsync -a "$INFRA_SRC/" "$STAGE/infra/"
else
  echo "ERROR: infra/ not found (checked infra/ and trialvo-shop/deploy/infra)"
  exit 1
fi

if [[ -z "$SHARED_DEMO_SRC" ]]; then
  echo "ERROR: shared-demo compose not found"
  exit 1
fi
rsync -a "$SHARED_DEMO_SRC/" "$STAGE/trialvo-shop/deploy/shared-demo/"

if [[ ! -f "$STAGE/trialvo-shop/deploy/shared-demo/docker-compose.yml" ]]; then
  echo "ERROR: staged bundle layout wrong — shared-demo/docker-compose.yml missing"
  exit 1
fi
if [[ ! -d "$STAGE/products/product-4-combo-basket" ]]; then
  echo "ERROR: staged bundle layout wrong — products/product-4-combo-basket missing"
  exit 1
fi

cp "$ROOT/scripts/ci/lib.sh" "$STAGE/scripts/ci/"
cp "$ROOT/scripts/ci/build-demo-images.sh" "$STAGE/scripts/ci/"
cp "$ROOT/scripts/ci/remote-deploy-demos.sh" "$STAGE/scripts/ci/"
chmod +x "$STAGE/scripts/ci/"*.sh

tar -czf "$OUT" -C "$STAGE" .
rm -rf "$STAGE"
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
