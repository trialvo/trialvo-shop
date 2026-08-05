#!/bin/bash
set -e

# Postgres init for Trialvo Pay only (shop Control Plane now uses MySQL).
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE trialvo_pay'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trialvo_pay')\gexec
EOSQL

echo "Database trialvo_pay created successfully"
