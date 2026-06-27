-- ═══════════════════════════════════════════════════════════════════
-- PayVault — Merchant Portal Migration
-- Migration: 002_merchant_portal.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── Add commission_rate to services ──────────────────────────────
ALTER TABLE services ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,3) NOT NULL DEFAULT 2.500;
ALTER TABLE services ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage';
-- commission_type: 'percentage' (e.g. 2.5%) or 'flat' (e.g. 10 BDT per txn)
-- Admin can set to 0 for special deals

COMMENT ON COLUMN services.commission_rate IS 'Commission charged per transaction. 0 = free. Admin-controlled.';
COMMENT ON COLUMN services.commission_type IS 'percentage or flat';

-- ─── Merchant Users ──────────────────────────────────────────────
-- One merchant user per service. Admin creates accounts.
CREATE TABLE IF NOT EXISTS merchant_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(200),
    role            VARCHAR(50) NOT NULL DEFAULT 'owner',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    last_login_ip   VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_users_service ON merchant_users(service_id);
CREATE INDEX IF NOT EXISTS idx_merchant_users_email ON merchant_users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_users_one_per_service ON merchant_users(service_id);

-- ─── Merchant Sessions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_user_id UUID NOT NULL REFERENCES merchant_users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_sessions_token ON merchant_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_merchant_sessions_user ON merchant_sessions(merchant_user_id);

-- ─── Trigger for updated_at ──────────────────────────────────────
DROP TRIGGER IF EXISTS trg_merchant_users_updated ON merchant_users;
CREATE TRIGGER trg_merchant_users_updated
    BEFORE UPDATE ON merchant_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
