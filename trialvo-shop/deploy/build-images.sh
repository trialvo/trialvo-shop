#!/usr/bin/env bash
# Thin wrapper — Lifestyle image build lives in sibling product repo
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
LIFESTYLE="$(cd "$HERE/../../products/product-1-lifestyle" && pwd)"

if [[ ! -f "$LIFESTYLE/deploy/build-images.sh" ]]; then
  echo "Expected Lifestyle deploy at: $LIFESTYLE/deploy/build-images.sh"
  exit 1
fi

exec bash "$LIFESTYLE/deploy/build-images.sh" "$@"
