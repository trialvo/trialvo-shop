#!/bin/sh
set -e

: "${API_URL:=http://localhost:9103/api}"
: "${IMAGE_BASE_URL:=http://localhost:9103}"
: "${APP_TITLE:=Combo Basket Admin}"

js_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_URL_ESC="$(js_escape "$API_URL")"
IMAGE_URL_ESC="$(js_escape "$IMAGE_BASE_URL")"
TITLE_ESC="$(js_escape "$APP_TITLE")"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL_ESC}",
  IMAGE_BASE_URL: "${IMAGE_URL_ESC}",
  APP_TITLE: "${TITLE_ESC}"
};
EOF

echo "[trial-config] wrote /config.js (API_URL=${API_URL})"
