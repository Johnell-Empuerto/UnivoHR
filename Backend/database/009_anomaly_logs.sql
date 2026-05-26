-- ============================================
-- UNIVOHR – Anomaly Detection v9
-- Date: 2026-05-26
-- ADDS: anomaly_logs table, indexes, functions
-- SAFE: CREATE IF NOT EXISTS, additive only
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE ANOMALY TYPES ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE anomaly_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE anomaly_status AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. CREATE anomaly_logs TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS anomaly_logs (
    id               BIGSERIAL PRIMARY KEY,
    employee_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    branch_id        INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    anomaly_type     VARCHAR(50) NOT NULL,
    source_module    VARCHAR(50) NOT NULL,
    severity         anomaly_severity NOT NULL DEFAULT 'MEDIUM',
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    detected_value   VARCHAR(100),
    expected_value   VARCHAR(100),
    status           anomaly_status NOT NULL DEFAULT 'OPEN',
    detected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at      TIMESTAMPTZ,
    resolved_at      TIMESTAMPTZ,
    reviewed_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata         JSONB DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_anomaly_employee_id
    ON anomaly_logs(employee_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_branch_id
    ON anomaly_logs(branch_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_type
    ON anomaly_logs(anomaly_type);

CREATE INDEX IF NOT EXISTS idx_anomaly_source_module
    ON anomaly_logs(source_module);

CREATE INDEX IF NOT EXISTS idx_anomaly_severity
    ON anomaly_logs(severity);

CREATE INDEX IF NOT EXISTS idx_anomaly_status
    ON anomaly_logs(status);

CREATE INDEX IF NOT EXISTS idx_anomaly_detected_at
    ON anomaly_logs(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_created_at
    ON anomaly_logs(created_at DESC);

-- Composite index for duplicate checking
CREATE INDEX IF NOT EXISTS idx_anomaly_dedup
    ON anomaly_logs(employee_id, anomaly_type, status, detected_at);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_anomaly_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_anomaly_updated_at ON anomaly_logs;
CREATE TRIGGER trg_anomaly_updated_at
    BEFORE UPDATE ON anomaly_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_anomaly_updated_at();

COMMIT;
