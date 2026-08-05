#!/bin/sh
# Trial/hosted runtime config generator.
#
# The official nginx image runs every executable /docker-entrypoint.d/*.sh
# before starting nginx. We use that hook to write /config.js from env vars so a
# single admin image can serve many trial instances (lifestyle / fashion / tech),
# each pointing at its own API and brand, without a rebuild.
set -e

: "${API_ORIGIN:=http://localhost:9000}"
: "${IMAGE_URL:=${API_ORIGIN}}"
: "${API_PREFIX:=/api/v1}"
: "${APP_VERTICAL:=default}"
: "${APP_NAME:=}"
: "${APP_SHORT_NAME:=}"

# Escape values for embedding inside a JS string literal.
js_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

APP_VERTICAL_ESC="$(js_escape "$APP_VERTICAL")"
APP_NAME_ESC="$(js_escape "$APP_NAME")"
APP_SHORT_NAME_ESC="$(js_escape "$APP_SHORT_NAME")"
API_ORIGIN_ESC="$(js_escape "$API_ORIGIN")"
IMAGE_URL_ESC="$(js_escape "$IMAGE_URL")"
API_PREFIX_ESC="$(js_escape "$API_PREFIX")"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_ORIGIN: "${API_ORIGIN_ESC}",
  IMAGE_URL: "${IMAGE_URL_ESC}",
  API_PREFIX: "${API_PREFIX_ESC}",
  APP_VERTICAL: "${APP_VERTICAL_ESC}",
  APP_NAME: "${APP_NAME_ESC}",
  APP_SHORT_NAME: "${APP_SHORT_NAME_ESC}"
};
EOF

echo "[trial-config] wrote /config.js (API_ORIGIN=${API_ORIGIN}, APP_VERTICAL=${APP_VERTICAL})"
