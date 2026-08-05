#!/bin/bash
set -e

# This script runs when the PostgreSQL container starts for the first time.
# It creates separate databases for each service.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create database for trialvo-shop backend
    SELECT 'CREATE DATABASE trialvo_shop'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trialvo_shop')\gexec

    -- Create database for trialvo-pay
    SELECT 'CREATE DATABASE trialvo_pay'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trialvo_pay')\gexec
EOSQL

echo "Both databases (trialvo_shop, trialvo_pay) created successfully"
