BEGIN;

-- ============================================
-- Phase 2B: Shift-aware attendance
-- Additive migration -- safe for existing data
-- ============================================

-- 1. Add shift_id FK to attendance (nullable for backward compat)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift_id INTEGER REFERENCES shift_schedules(id);

-- 2. Add shift_date to attendance (for night shift attribution)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift_date DATE;

-- 3. Index for shift_date lookups (used by night shift checkout)
CREATE INDEX IF NOT EXISTS idx_attendance_shift_date ON attendance(shift_date);

COMMIT;
