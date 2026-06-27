-- Migration 003: Add brute-force protection to merchant accounts
-- Adds failed_login_count and locked_until fields to merchant_users

ALTER TABLE merchant_users
    ADD COLUMN IF NOT EXISTS failed_login_count SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
