-- ============================================
-- Phase 2A: Device Processing Engine
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- ============================================
-- 0. CREATE attendance_logs STAGING TABLE
-- ============================================
-- Deferred from Phase 1A. Each processing attempt
-- INSERTs a row here for full audit trail.

CREATE TABLE IF NOT EXISTS attendance_logs (
  id              SERIAL PRIMARY KEY,
  raw_log_id      INTEGER REFERENCES raw_logs(id) ON DELETE SET NULL,
  device_id       INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  employee_code   VARCHAR(50),
  employee_id     INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  log_timestamp   TIMESTAMP NOT NULL,
  status          VARCHAR(20) DEFAULT 'PENDING',
  error_message   TEXT,
  processed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 1. ADD COLUMNS TO raw_logs
-- ============================================
-- retry_count: tracks number of processing attempts
-- last_retry_at: timestamp of most recent retry
-- processing_started_at: when this log was claimed for processing

ALTER TABLE raw_logs
  ADD COLUMN IF NOT EXISTS retry_count         INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retry_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;

-- ============================================
-- 2. INDEXES FOR QUEUE POLLING AND DUPLICATE CHECK
-- ============================================

-- Composite index for efficient queue polling (status + age)
CREATE INDEX IF NOT EXISTS idx_raw_logs_status_timestamp
  ON raw_logs(status, "timestamp");

-- Index for duplicate detection: find attendance_logs by raw_log_id
CREATE INDEX IF NOT EXISTS idx_attendance_logs_raw_log
  ON attendance_logs(raw_log_id);

COMMIT;
