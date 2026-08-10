#!/usr/bin/env bash
# Detect which deploy targets changed between two refs.
# Writes GitHub Actions outputs when GITHUB_OUTPUT is set.
set -euo pipefail

BEFORE="${1:-${GITHUB_EVENT_BEFORE:-}}"
AFTER="${2:-${GITHUB_SHA:-HEAD}}"

# workflow_dispatch / missing before → compare last commit only (not full tree)
if [[ -z "$BEFORE" ]]; then
  if git rev-parse "${AFTER}^" >/dev/null 2>&1; then
    BEFORE="$(git rev-parse "${AFTER}^")"
    echo "No BEFORE ref — using parent commit ${BEFORE}"
  else
    BEFORE="0000000000000000000000000000000000000000"
    echo "No parent commit — treating as initial deploy (all targets)"
  fi
fi

if [[ "$BEFORE" == "0000000000000000000000000000000000000000" ]]; then
  CHANGED="$(git ls-files)"
else
  CHANGED="$(git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null || git diff --name-only "${AFTER}^" "$AFTER")"
fi

shop_frontend=0
shop_backend=0
shop_other=0
demos_lifestyle=0
demos_fashion=0
demos_tech=0
demos_infra=0
pay=0

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  case "$path" in
    trialvo-shop/trialvo-frontend/*|trialvo-frontend/*) shop_frontend=1 ;;
    trialvo-shop/trialvo-backend/*|trialvo-backend/*) shop_backend=1 ;;
    trialvo-shop/*|trialvo-backend/*|trialvo-frontend/*|docker-compose*) shop_other=1 ;;
    products/product-1-lifestyle/*) demos_lifestyle=1 ;;
    products/product-2-fashion/*) demos_fashion=1 ;;
    products/product-3-tech-shop/*) demos_tech=1 ;;
    infra/*|trialvo-shop/deploy/shared-demo/*) demos_infra=1 ;;
    trialvo-pay/*) pay=1 ;;
    scripts/ci/*|.github/workflows/deploy.yml|.github/DEPLOY.md) shop_other=1; demos_infra=1 ;;
  esac
done <<< "$CHANGED"

if [[ "$shop_other" == "1" ]]; then
  shop_frontend=1
  shop_backend=1
fi

shop_cp=0
if [[ "$shop_frontend" == "1" || "$shop_backend" == "1" || "$shop_other" == "1" ]]; then
  shop_cp=1
fi

demos=0
if [[ "$demos_lifestyle" == "1" || "$demos_fashion" == "1" || "$demos_tech" == "1" || "$demos_infra" == "1" ]]; then
  demos=1
fi

echo "Changed files (sample):"
echo "$CHANGED" | head -20
echo "---"
echo "shop_cp=$shop_cp frontend=$shop_frontend backend=$shop_backend"
echo "demos=$demos lifestyle=$demos_lifestyle fashion=$demos_fashion tech=$demos_tech infra=$demos_infra"
echo "pay=$pay"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "shop_cp=$shop_cp"
    echo "shop_frontend=$shop_frontend"
    echo "shop_backend=$shop_backend"
    echo "demos=$demos"
    echo "demos_lifestyle=$demos_lifestyle"
    echo "demos_fashion=$demos_fashion"
    echo "demos_tech=$demos_tech"
    echo "demos_infra=$demos_infra"
    echo "pay=$pay"
  } >> "$GITHUB_OUTPUT"
fi
