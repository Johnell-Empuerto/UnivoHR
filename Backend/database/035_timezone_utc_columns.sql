BEGIN;

-- ============================================
-- Phase 10.1: Add UTC-safe timestamptz columns
-- ADDITIVE ONLY — never alter existing timestamp columns
-- ============================================

-- 1. Add UTC-normalized timestamptz columns for attendance
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS check_in_time_utc timestamptz,
  ADD COLUMN IF NOT EXISTS check_out_time_utc timestamptz;

COMMENT ON COLUMN attendance.check_in_time_utc IS
  'UTC-normalized check-in time. Populated from check_in_time + timezone_used.';

COMMENT ON COLUMN attendance.check_out_time_utc IS
  'UTC-normalized check-out time. Populated from check_out_time + timezone_used.';

-- 2. Add indexes for UTC queries
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_utc
  ON attendance (check_in_time_utc);

CREATE INDEX IF NOT EXISTS idx_attendance_check_out_utc
  ON attendance (check_out_time_utc);

COMMIT;
