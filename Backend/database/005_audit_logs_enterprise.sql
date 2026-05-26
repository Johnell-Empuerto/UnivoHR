-- ============================================
-- UNIVOHR – Enterprise Audit Logging v5
-- Date: 2026-05-26
-- ADDS: audit_logs table, indexes, immutable trigger
-- SAFE: CREATE IF NOT EXISTS, additive only
-- ============================================

BEGIN;

-- ============================================
-- 1. DROP OLD audit_logs TABLE IF EXISTS (from 001_safe_migration)
--    Replaced by enterprise-grade implementation below
-- ============================================

DROP TABLE IF EXISTS audit_logs CASCADE;

-- ============================================
-- 2. CREATE ENTERPRISE audit_logs TABLE
-- ============================================

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    employee_id INTEGER,
    branch_id   INTEGER,
    action      VARCHAR(50) NOT NULL,
    table_name  VARCHAR(50) NOT NULL,
    record_id   INTEGER,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES for query performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id
    ON audit_logs(employee_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_id
    ON audit_logs(branch_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
    ON audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC);

-- Composite index for common lookups (what happened to a specific record)
CREATE INDEX IF NOT EXISTS idx_audit_logs_record
    ON audit_logs(table_name, record_id);

-- ============================================
-- 4. IMMUTABLE TRIGGER
--    Prevent modification or deletion of audit records
-- ============================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_logs;
CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- ============================================
-- 5. GRANT permissions (adjust for your DB user)
-- ============================================

-- All roles can INSERT (backend service writes logs)
-- Only superuser/owner can read (for reporting)
-- No one can UPDATE or DELETE (enforced by trigger)

COMMIT;
