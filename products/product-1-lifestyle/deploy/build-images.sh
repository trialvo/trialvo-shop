#!/usr/bin/env bash
# L-3.1 + TS-5.5 — Build Lifestyle trial images (api/admin/shop/agent)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="${TRIAL_REGISTRY:-registry.trialvo.com}"
TAG_SUFFIX="${1:-trial}"

echo "==> Obfuscate API (optional best-effort)"
cd "$ROOT/Back End" || true
npm i -D javascript-obfuscator --no-fund --no-audit 2>/dev/null || true
cd "$ROOT"
node deploy/obfuscate-backend.js || echo "WARN: obfuscate skipped"

echo "==> API image"
docker build -f deploy/Dockerfile.trial -t "${REGISTRY}/lifestyle-api:${TAG_SUFFIX}" "$ROOT" \
  || docker build -t "${REGISTRY}/lifestyle-api:${TAG_SUFFIX}" "$ROOT/Back End"

echo "==> Admin image"
docker build -t "${REGISTRY}/lifestyle-admin:${TAG_SUFFIX}" "$ROOT/admin panel"

echo "==> Shop image"
docker build -t "${REGISTRY}/lifestyle-shop:${TAG_SUFFIX}" "$ROOT/shop panel"

echo "==> License agent image (Go multi-stage, no local Go required)"
docker build -t "${REGISTRY}/lifestyle-license-agent:${TAG_SUFFIX}" "$ROOT/license-agent"

echo "Built:"
echo "  ${REGISTRY}/lifestyle-api:${TAG_SUFFIX}"
echo "  ${REGISTRY}/lifestyle-admin:${TAG_SUFFIX}"
echo "  ${REGISTRY}/lifestyle-shop:${TAG_SUFFIX}"
echo "  ${REGISTRY}/lifestyle-license-agent:${TAG_SUFFIX}"
echo "Push when ready: docker push <image>"
