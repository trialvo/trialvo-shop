#!/usr/bin/env bash
# Trialvo Opt2 setup — docker login (scoped token) + compose up
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f agent.env ]]; then
  echo "Missing agent.env — re-download the installer package from Trialvo."
  exit 1
fi

# shellcheck disable=SC1091
source agent.env

REGISTRY="${TRIAL_REGISTRY:-registry.trialvo.com}"

if [[ -z "${TRIAL_REGISTRY_TOKEN:-}" ]]; then
  echo "TRIAL_REGISTRY_TOKEN missing in agent.env"
  exit 1
fi

if [[ -z "${TRIAL_REGISTRY_USER:-}" ]]; then
  TRIAL_REGISTRY_USER="trial"
fi

# A localhost registry (local/private testing) is insecure and unauthenticated;
# skip login there. Real deployments log into the scoped private registry.
case "${REGISTRY}" in
  localhost:*|127.0.0.1:*)
    echo "Local registry ${REGISTRY} — skipping docker login."
    ;;
  *)
    echo "Logging into ${REGISTRY} (scoped pull token)…"
    echo "${TRIAL_REGISTRY_TOKEN}" | docker login "${REGISTRY}" -u "${TRIAL_REGISTRY_USER}" --password-stdin
    ;;
esac

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit DOMAIN / passwords, then re-run."
  exit 0
fi

echo "Starting trial stack…"
docker compose up -d
echo "Done. Shop/admin ports are in .env. Agent must reach CONTROL_PLANE_URL."
