-- ═══════════════════════════════════════════════════════════════════
-- Trialvo Pay — Central Payment Service Database Schema
-- PostgreSQL 16 + pgcrypto
-- Migration: 001_init.sql
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM TYPES ────────────────────────────────────────────────────

CREATE TYPE bill_status AS ENUM (
    'draft', 'pending', 'processing', 'paid', 'partially_paid',
    'failed', 'expired', 'cancelled', 'refunded', 'partially_refunded'
);

CREATE TYPE transaction_status AS ENUM (
    'initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'expired'
);

CREATE TYPE refund_status AS ENUM (
    'requested', 'approved', 'processing', 'completed', 'rejected', 'failed'
);

CREATE TYPE ipn_delivery_status AS ENUM (
    'queued', 'sent', 'delivered', 'failed', 'exhausted'
);

CREATE TYPE payment_type AS ENUM (
    'one_time', 'subscription', 'donation', 'api_subscription', 'invoice'
);

CREATE TYPE identity_type AS ENUM (
    'nid', 'birth_certificate', 'passport', 'driving_license'
);

CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'webhook');

-- ─── 1. REGISTERED SERVICES ───────────────────────────────────────

CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(50) NOT NULL UNIQUE,
    display_name    VARCHAR(200) NOT NULL,
    description     TEXT,
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(20),
    logo_url        VARCHAR(512),
    success_url     VARCHAR(512),
    fail_url        VARCHAR(512),
    cancel_url      VARCHAR(512),
    daily_tx_limit      INTEGER DEFAULT 1000,
    monthly_tx_limit    INTEGER DEFAULT 50000,
    max_single_amount   DECIMAL(14,2) DEFAULT 500000.00,
    min_single_amount   DECIMAL(14,2) DEFAULT 1.00,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_sandbox      BOOLEAN NOT NULL DEFAULT TRUE,
    meta            JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_active ON services(is_active);

-- ─── 2. SERVICE KEYS ──────────────────────────────────────────────

CREATE TABLE service_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    key_hash        VARCHAR(128) NOT NULL,
    encrypted_key   BYTEA NOT NULL,
    key_prefix      VARCHAR(12) NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
    grace_until     TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ
);

CREATE INDEX idx_service_keys_hash ON service_keys(key_hash);
CREATE INDEX idx_service_keys_service ON service_keys(service_id, is_active);

-- ─── 3. CUSTOMERS ─────────────────────────────────────────────────

CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name  VARCHAR(300),
    display_name    VARCHAR(300),
    identity_hash   VARCHAR(128) UNIQUE,
    total_spent     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_refunded  DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    risk_score      SMALLINT DEFAULT 0,
    is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
    block_reason    TEXT,
    meta            JSONB DEFAULT '{}',
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_identity_hash ON customers(identity_hash);
CREATE INDEX idx_customers_risk ON customers(risk_score) WHERE risk_score > 50;

-- ─── 4. CUSTOMER CONTACT INFO ─────────────────────────────────────

CREATE TABLE customer_emails (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    email_normalized VARCHAR(255) NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    source_service  UUID REFERENCES services(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_customer_emails_unique ON customer_emails(email_normalized);
CREATE INDEX idx_customer_emails_customer ON customer_emails(customer_id);

CREATE TABLE customer_phones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    phone           VARCHAR(20) NOT NULL,
    phone_normalized VARCHAR(20) NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    source_service  UUID REFERENCES services(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_customer_phones_unique ON customer_phones(phone_normalized);
CREATE INDEX idx_customer_phones_customer ON customer_phones(customer_id);

CREATE TABLE customer_addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label           VARCHAR(50) DEFAULT 'home',
    full_address    TEXT NOT NULL,
    city            VARCHAR(100),
    state           VARCHAR(100),
    postcode        VARCHAR(20),
    country         VARCHAR(10) DEFAULT 'BD',
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    source_service  UUID REFERENCES services(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);

-- ─── 5. CUSTOMER IDENTITIES ───────────────────────────────────────

CREATE TABLE customer_identities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    identity_type   identity_type NOT NULL,
    identity_number_encrypted BYTEA NOT NULL,
    identity_hash   VARCHAR(128) NOT NULL,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    verified_by     VARCHAR(100),
    meta            JSONB DEFAULT '{}',
    source_service  UUID REFERENCES services(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_identities_hash ON customer_identities(identity_hash);
CREATE INDEX idx_customer_identities_customer ON customer_identities(customer_id);

-- ─── 6. BILLS ─────────────────────────────────────────────────────

CREATE TABLE bills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_token      VARCHAR(64) NOT NULL UNIQUE,
    service_id      UUID NOT NULL REFERENCES services(id),
    customer_id     UUID REFERENCES customers(id),
    external_order_id       VARCHAR(255),
    external_subscription_id VARCHAR(255),
    external_invoice_id     VARCHAR(255),
    payment_type    payment_type NOT NULL DEFAULT 'one_time',
    currency        VARCHAR(3) NOT NULL DEFAULT 'BDT',
    subtotal        DECIMAL(14,2) NOT NULL,
    total_discount  DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_amount      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    shipping_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    final_amount    DECIMAL(14,2) NOT NULL,
    customer_name   VARCHAR(300),
    customer_email  VARCHAR(255),
    customer_phone  VARCHAR(20),
    customer_address TEXT,
    customer_address2 TEXT,
    customer_city   VARCHAR(100),
    customer_state  VARCHAR(100),
    customer_postcode VARCHAR(20),
    customer_country VARCHAR(10) DEFAULT 'BD',
    shipment_name   VARCHAR(300),
    shipment_address TEXT,
    shipment_address2 TEXT,
    shipment_city   VARCHAR(100),
    shipment_state  VARCHAR(100),
    shipment_postcode VARCHAR(20),
    shipment_country VARCHAR(10),
    shipment_method VARCHAR(100),
    subscription_tier       VARCHAR(100),
    subscription_period     VARCHAR(50),
    subscription_cost       DECIMAL(14,2),
    status          bill_status NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMPTZ NOT NULL,
    success_url     VARCHAR(512),
    fail_url        VARCHAR(512),
    cancel_url      VARCHAR(512),
    client_ip       INET,
    user_agent      TEXT,
    service_meta    JSONB DEFAULT '{}',
    internal_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at         TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ
);

CREATE INDEX idx_bills_token ON bills(bill_token);
CREATE INDEX idx_bills_service ON bills(service_id, created_at DESC);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_external_order ON bills(service_id, external_order_id);
CREATE INDEX idx_bills_external_sub ON bills(service_id, external_subscription_id);
CREATE INDEX idx_bills_expires ON bills(expires_at) WHERE status IN ('pending', 'processing');

-- ─── 7. BILL ITEMS ────────────────────────────────────────────────

CREATE TABLE bill_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    external_product_id VARCHAR(255),
    product_name    VARCHAR(500) NOT NULL,
    product_category VARCHAR(255),
    product_profile VARCHAR(500),
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_buying_price  DECIMAL(14,2),
    unit_selling_price DECIMAL(14,2) NOT NULL,
    unit_discount   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    unit_final_price DECIMAL(14,2) NOT NULL,
    line_total      DECIMAL(14,2) NOT NULL,
    meta            JSONB DEFAULT '{}',
    serial          SMALLINT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);

-- ─── 8. BILL DISCOUNTS ────────────────────────────────────────────

CREATE TABLE bill_discounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    discount_code   VARCHAR(100),
    discount_name   VARCHAR(255) NOT NULL,
    discount_type   SMALLINT NOT NULL DEFAULT 0,
    discount_value  DECIMAL(14,2) NOT NULL,
    discount_amount DECIMAL(14,2) NOT NULL,
    applied_scope   VARCHAR(50) DEFAULT 'order',
    meta            JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bill_discounts_bill ON bill_discounts(bill_id);

-- ─── 9. TRANSACTIONS ──────────────────────────────────────────────

CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id                 UUID NOT NULL REFERENCES bills(id),
    eps_transaction_id      VARCHAR(100),
    eps_merchant_tx_id      VARCHAR(100) NOT NULL UNIQUE,
    eps_customer_order_id   VARCHAR(255),
    eps_redirect_url        VARCHAR(512),
    eps_financial_entity    VARCHAR(100),
    eps_customer_id         VARCHAR(100),
    eps_payment_ref         VARCHAR(255),
    eps_transaction_date    VARCHAR(100),
    transaction_type_id     SMALLINT NOT NULL DEFAULT 1,
    value_a                 VARCHAR(255),
    value_b                 VARCHAR(255),
    value_c                 VARCHAR(255),
    value_d                 VARCHAR(255),
    amount                  DECIMAL(14,2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'BDT',
    status                  transaction_status NOT NULL DEFAULT 'initiated',
    gateway_provider        VARCHAR(50) NOT NULL DEFAULT 'eps',
    gateway_response_raw    JSONB,
    gateway_error_code      VARCHAR(50),
    gateway_error_message   TEXT,
    client_ip               INET,
    user_agent              TEXT,
    initiated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    redirected_at           TIMESTAMPTZ,
    callback_received_at    TIMESTAMPTZ,
    verified_at             TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    failed_at               TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_bill ON transactions(bill_id);
CREATE INDEX idx_transactions_eps_tx ON transactions(eps_transaction_id);
CREATE INDEX idx_transactions_eps_merchant ON transactions(eps_merchant_tx_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_value_a ON transactions(value_a);

-- ─── 10. TRANSACTION EVENTS ───────────────────────────────────────

CREATE TABLE transaction_events (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    old_status      transaction_status,
    new_status      transaction_status,
    event_data      JSONB DEFAULT '{}',
    source          VARCHAR(50) DEFAULT 'system',
    source_ip       INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tx_events_transaction ON transaction_events(transaction_id, created_at);

-- ─── 11. REFUNDS ──────────────────────────────────────────────────

CREATE TABLE refunds (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id),
    bill_id             UUID NOT NULL REFERENCES bills(id),
    service_id          UUID NOT NULL REFERENCES services(id),
    refund_amount       DECIMAL(14,2) NOT NULL,
    refund_reason       TEXT NOT NULL,
    refund_type         VARCHAR(50) DEFAULT 'full',
    external_order_id   VARCHAR(255),
    external_ref        VARCHAR(255),
    status              refund_status NOT NULL DEFAULT 'requested',
    requested_by        VARCHAR(100) NOT NULL,
    approved_by         UUID,
    processed_by        VARCHAR(100),
    rejection_reason    TEXT,
    admin_notes         TEXT,
    gateway_refund_ref  VARCHAR(255),
    gateway_response    JSONB,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at         TIMESTAMPTZ,
    processed_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    rejected_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX idx_refunds_bill ON refunds(bill_id);
CREATE INDEX idx_refunds_service ON refunds(service_id, created_at DESC);
CREATE INDEX idx_refunds_status ON refunds(status);

-- ─── 12. REFUND EVENTS ────────────────────────────────────────────

CREATE TABLE refund_events (
    id              BIGSERIAL PRIMARY KEY,
    refund_id       UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    old_status      refund_status,
    new_status      refund_status,
    event_data      JSONB DEFAULT '{}',
    actor           VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refund_events_refund ON refund_events(refund_id, created_at);

-- ─── 13. IPN ENDPOINTS ────────────────────────────────────────────

CREATE TABLE ipn_endpoints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    url             VARCHAR(512) NOT NULL,
    secret          VARCHAR(128) NOT NULL,
    events          TEXT[] NOT NULL DEFAULT '{payment.success,payment.failed,refund.completed}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    failure_count   INTEGER NOT NULL DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ipn_endpoints_service ON ipn_endpoints(service_id, is_active);

-- ─── 14. IPN DELIVERIES ───────────────────────────────────────────

CREATE TABLE ipn_deliveries (
    id              BIGSERIAL PRIMARY KEY,
    ipn_endpoint_id UUID NOT NULL REFERENCES ipn_endpoints(id) ON DELETE CASCADE,
    transaction_id  UUID REFERENCES transactions(id),
    refund_id       UUID REFERENCES refunds(id),
    bill_id         UUID REFERENCES bills(id),
    event_type      VARCHAR(50) NOT NULL,
    payload         JSONB NOT NULL,
    signature       VARCHAR(256) NOT NULL,
    status          ipn_delivery_status NOT NULL DEFAULT 'queued',
    attempt_count   SMALLINT NOT NULL DEFAULT 0,
    max_attempts    SMALLINT NOT NULL DEFAULT 5,
    http_status     SMALLINT,
    response_body   TEXT,
    error_message   TEXT,
    next_retry_at   TIMESTAMPTZ,
    first_sent_at   TIMESTAMPTZ,
    last_sent_at    TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ipn_deliveries_status ON ipn_deliveries(status, next_retry_at)
    WHERE status IN ('queued', 'failed');
CREATE INDEX idx_ipn_deliveries_tx ON ipn_deliveries(transaction_id);
CREATE INDEX idx_ipn_deliveries_endpoint ON ipn_deliveries(ipn_endpoint_id);

-- ─── 15. ADMINS ───────────────────────────────────────────────────

CREATE TABLE admins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(200),
    role            VARCHAR(50) NOT NULL DEFAULT 'viewer',
    totp_secret_encrypted BYTEA,
    is_2fa_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes    TEXT[],
    failed_login_count SMALLINT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 16. ADMIN SESSIONS ───────────────────────────────────────────

CREATE TABLE admin_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id        UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_id);

-- ─── 17. AUDIT LOGS ───────────────────────────────────────────────

CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    actor_type      VARCHAR(20) NOT NULL,
    actor_id        VARCHAR(100),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     VARCHAR(100),
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─── 18. SYSTEM CONFIG ────────────────────────────────────────────

CREATE TABLE system_config (
    id              SERIAL PRIMARY KEY,
    category        VARCHAR(50) NOT NULL,
    key_name        VARCHAR(100) NOT NULL,
    value           TEXT NOT NULL,
    value_type      VARCHAR(20) NOT NULL DEFAULT 'string',
    description     TEXT,
    is_secret       BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by      UUID REFERENCES admins(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category, key_name)
);

CREATE INDEX idx_system_config_category ON system_config(category, is_active);

-- ─── 19. NOTIFICATION LOG ─────────────────────────────────────────

CREATE TABLE notification_log (
    id              BIGSERIAL PRIMARY KEY,
    channel         notification_channel NOT NULL,
    recipient       VARCHAR(255) NOT NULL,
    subject         VARCHAR(500),
    body            TEXT,
    related_bill_id     UUID REFERENCES bills(id),
    related_transaction_id UUID REFERENCES transactions(id),
    related_refund_id   UUID REFERENCES refunds(id),
    provider        VARCHAR(50),
    provider_msg_id VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'sent',
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_log_recipient ON notification_log(recipient, created_at DESC);
CREATE INDEX idx_notification_log_bill ON notification_log(related_bill_id);

-- ─── 20. NONCE STORE ──────────────────────────────────────────────

CREATE TABLE used_nonces (
    nonce           VARCHAR(64) PRIMARY KEY,
    service_id      UUID NOT NULL,
    used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_used_nonces_time ON used_nonces(used_at);

-- ─── TRIGGERS: auto-update updated_at ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_services_updated BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bills_updated BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_system_config_updated BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ipn_endpoints_updated BEFORE UPDATE ON ipn_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED: system_config defaults ─────────────────────────────────

INSERT INTO system_config (category, key_name, value, value_type, description, is_secret) VALUES
    -- EPS Gateway (sandbox)
    ('eps', 'sandbox_base_url', 'https://sandboxpgapi.eps.com.bd/v1', 'string', 'EPS Sandbox API base URL', FALSE),
    ('eps', 'sandbox_merchant_id', '29e86e70-0ac6-45eb-ba04-9fcb0aaed12a', 'string', 'Sandbox Merchant ID', FALSE),
    ('eps', 'sandbox_store_id', 'd44e705f-9e3a-41de-98b1-1674631637da', 'string', 'Sandbox Store ID', FALSE),
    ('eps', 'sandbox_username', '', 'encrypted', 'Sandbox login email (set from admin panel)', TRUE),
    ('eps', 'sandbox_password', '', 'encrypted', 'Sandbox login password', TRUE),
    ('eps', 'sandbox_hash_key', '', 'encrypted', 'Sandbox HMAC hash key', TRUE),
    -- EPS Gateway (live)
    ('eps', 'live_base_url', 'https://pgapi.eps.com.bd/v1', 'string', 'EPS Live API base URL', FALSE),
    ('eps', 'live_merchant_id', '0f71ad2d-2cfe-4b32-8804-918db808cd6f', 'string', 'Live Merchant ID', FALSE),
    ('eps', 'live_store_id', 'b3a6ac12-f3be-4d5f-b0d0-c59e322436d5', 'string', 'Live Store ID', FALSE),
    ('eps', 'live_username', '', 'encrypted', 'Live login email', TRUE),
    ('eps', 'live_password', '', 'encrypted', 'Live login password', TRUE),
    ('eps', 'live_hash_key', '', 'encrypted', 'Live HMAC hash key', TRUE),
    ('eps', 'mode', 'sandbox', 'string', 'Active mode: sandbox or live', FALSE),
    -- General
    ('general', 'base_url', 'https://pay.trialvo.com', 'string', 'Trialvo Pay public base URL', FALSE),
    ('general', 'domain', 'pay.trialvo.com', 'string', 'Trialvo Pay domain name', FALSE),
    ('general', 'bill_expiry_minutes', '30', 'integer', 'Bill token expiry in minutes', FALSE),
    ('general', 'max_refund_days', '30', 'integer', 'Max days after payment to allow refund', FALSE),
    ('general', 'refund_auto_approve', 'false', 'boolean', 'All refunds require manual admin approval', FALSE),
    ('general', 'default_currency', 'BDT', 'string', 'Default currency code', FALSE),
    -- SMTP
    ('smtp', 'host', '', 'string', 'SMTP host', FALSE),
    ('smtp', 'port', '587', 'integer', 'SMTP port', FALSE),
    ('smtp', 'username', '', 'encrypted', 'SMTP username', TRUE),
    ('smtp', 'password', '', 'encrypted', 'SMTP password', TRUE),
    ('smtp', 'from_email', 'noreply@pay.trialvo.com', 'string', 'From email address', FALSE),
    ('smtp', 'from_name', 'Trialvo Pay', 'string', 'From display name', FALSE),
    -- SMS
    ('sms', 'provider', 'bulksms', 'string', 'SMS provider name', FALSE),
    ('sms', 'api_key', '', 'encrypted', 'SMS API key', TRUE),
    ('sms', 'api_secret', '', 'encrypted', 'SMS API secret', TRUE),
    ('sms', 'sender_id', 'Trialvo Pay', 'string', 'SMS sender ID', FALSE),
    -- Security
    ('security', 'replay_window_seconds', '300', 'integer', 'Max age of request timestamp', FALSE),
    ('security', 'nonce_ttl_seconds', '600', 'integer', 'How long to remember nonces', FALSE),
    ('security', 'admin_session_hours', '8', 'integer', 'Admin session duration', FALSE),
    ('security', 'max_login_attempts', '5', 'integer', 'Max failed logins before lockout', FALSE),
    ('security', 'lockout_minutes', '30', 'integer', 'Lockout duration in minutes', FALSE);
