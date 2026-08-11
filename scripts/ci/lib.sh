#!/usr/bin/env bash
# Shared helpers for remote deploy scripts (LF only).
set -euo pipefail

# curl -sf + head breaks under pipefail; use this instead.
http_smoke() {
  local url="$1"
  local label="${2:-$url}"
  local attempts="${3:-1}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    local tmp
    tmp="$(mktemp)"
    if curl -sf --max-time 30 "$url" -o "$tmp"; then
      local nbytes
      nbytes="$(wc -c < "$tmp" | tr -d ' ')"
      echo "${label}: OK (${nbytes} bytes)"
      rm -f "$tmp"
      return 0
    fi
    rm -f "$tmp"
    if [[ "$i" -lt "$attempts" ]]; then
      sleep 5
    fi
  done
  echo "${label}: FAIL ($url)"
  return 1
}

http_json_smoke() {
  local url="$1"
  local label="${2:-$url}"
  local body
  body="$(curl -sf --max-time 30 "$url" || true)"
  if [[ -n "$body" ]]; then
    echo "${label}: ${body}"
    return 0
  fi
  echo "${label}: FAIL ($url)"
  return 1
}
