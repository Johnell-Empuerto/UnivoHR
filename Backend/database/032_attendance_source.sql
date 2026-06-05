BEGIN;

-- ============================================
-- Phase 3A: Attendance source tracking
-- Additive migration -- safe for existing data
-- ============================================

-- 1. Add source column to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'BIOMETRIC';

-- 2. Add CHECK constraint for allowed source values
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS chk_attendance_source;
ALTER TABLE attendance ADD CONSTRAINT chk_attendance_source
  CHECK (source IN ('BIOMETRIC', 'WEB', 'MANUAL', 'IMPORT'));

-- 3. Add index for source lookups
CREATE INDEX IF NOT EXISTS idx_attendance_source ON attendance(source);

-- 4. Add comment for documentation
COMMENT ON COLUMN attendance.source IS 'Origin of attendance record: BIOMETRIC, WEB, MANUAL, or IMPORT';

-- 5. Seed web clock-in/out setting (safe upsert)
INSERT INTO system_settings (key, value, description)
VALUES ('enable_web_clock_in_out', 'true', 'Allow employees to clock in and clock out using the web app')
ON CONFLICT (key) DO NOTHING;

COMMIT;
