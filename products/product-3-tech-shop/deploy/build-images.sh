#!/usr/bin/env bash
# Build Tech Shop trial images (api/admin/shop/agent)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="${TRIAL_REGISTRY:-registry.trialvo.com}"
TAG_SUFFIX="${1:-trial}"
PREFIX="${PRODUCT_IMAGE_PREFIX:-techshop}"

echo "==> Obfuscate API (optional best-effort)"
cd "$ROOT/Back End" || true
npm i -D javascript-obfuscator --no-fund --no-audit 2>/dev/null || true
cd "$ROOT"
node deploy/obfuscate-backend.js || echo "WARN: obfuscate skipped"

echo "==> API image"
docker build -f deploy/Dockerfile.trial -t "${REGISTRY}/${PREFIX}-api:${TAG_SUFFIX}" "$ROOT" \
  || docker build -t "${REGISTRY}/${PREFIX}-api:${TAG_SUFFIX}" "$ROOT/Back End"

echo "==> Admin image"
docker build -t "${REGISTRY}/${PREFIX}-admin:${TAG_SUFFIX}" "$ROOT/admin panel"

echo "==> Shop image"
docker build -f deploy/Dockerfile.shop.trial -t "${REGISTRY}/${PREFIX}-shop:${TAG_SUFFIX}" "$ROOT/shop panel"

echo "==> License agent image (Go multi-stage, no local Go required)"
docker build -t "${REGISTRY}/${PREFIX}-license-agent:${TAG_SUFFIX}" "$ROOT/license-agent"

echo "Built:"
echo "  ${REGISTRY}/${PREFIX}-api:${TAG_SUFFIX}"
echo "  ${REGISTRY}/${PREFIX}-admin:${TAG_SUFFIX}"
echo "  ${REGISTRY}/${PREFIX}-shop:${TAG_SUFFIX}"
echo "  ${REGISTRY}/${PREFIX}-license-agent:${TAG_SUFFIX}"
echo "Push when ready: docker push <image>"
