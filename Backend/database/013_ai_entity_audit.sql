-- ============================================
-- UNIVOHR – AI Entity & Audit Enhancement v13
-- Date: 2026-05-26
-- ADDS: enhanced audit columns, ai_session_context table
-- SAFE: IF NOT EXISTS, additive only
-- ============================================

BEGIN;

-- Add enhanced audit columns
ALTER TABLE ai_audit_logs
  ADD COLUMN IF NOT EXISTS entities          JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accessed_employee_id INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accessed_branch_id   INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accessed_department  VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permission_result    VARCHAR(20) DEFAULT 'GRANTED',
  ADD COLUMN IF NOT EXISTS denied_reason        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS response_time_ms     INTEGER DEFAULT NULL;

-- Add CHECK for permission_result if it doesn't exist
-- (PostgreSQL doesn't support IF NOT EXISTS for CHECK, so we use safe approach)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'ai_audit_logs_permission_check'
  ) THEN
    ALTER TABLE ai_audit_logs
      ADD CONSTRAINT ai_audit_logs_permission_check
      CHECK (permission_result IN ('GRANTED', 'DENIED', 'ERROR'));
  END IF;
END $$;

COMMIT;
