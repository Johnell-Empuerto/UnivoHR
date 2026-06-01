BEGIN;

-- ============================================
-- Rollback for Phase 2B
-- Drops shift-related columns from attendance
-- ============================================

DROP INDEX IF EXISTS idx_attendance_shift_date;

ALTER TABLE attendance DROP COLUMN IF EXISTS shift_id;
ALTER TABLE attendance DROP COLUMN IF EXISTS shift_date;

COMMIT;
