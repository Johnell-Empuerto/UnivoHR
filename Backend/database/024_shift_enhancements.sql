BEGIN;

-- ============================================
-- Phase 2A: Enhanced Shift Management
-- Additive migration — safe for existing data
-- ============================================

-- 1. Add new columns to shift_schedules
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS code VARCHAR(20);
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS break_start TIME;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS break_end TIME;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS grace_minutes INT DEFAULT 0;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS required_hours DECIMAL(4,2) DEFAULT 8;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS flex_start_window TIME;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS flex_end_window TIME;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS is_night_shift BOOLEAN DEFAULT false;
ALTER TABLE shift_schedules ADD COLUMN IF NOT EXISTS is_flexitime BOOLEAN DEFAULT false;

-- 2. Backfill codes for existing rows seeded by 002_shift_schedules.sql
UPDATE shift_schedules SET code = 'MORNING' WHERE type = 'MORNING' AND code IS NULL;
UPDATE shift_schedules SET code = 'NIGHT'   WHERE type = 'NIGHT'   AND code IS NULL;

-- 3. Deduplicate: if 002 was run multiple times, keep only the lowest-id row per code
DELETE FROM shift_schedules
WHERE code IS NOT NULL
  AND id NOT IN (SELECT MIN(id) FROM shift_schedules WHERE code IS NOT NULL GROUP BY code);

-- 4. Add unique index on code (safe after dedup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_schedules_code ON shift_schedules(code);

-- 5. Expand type CHECK to include MID and FLEXITIME
ALTER TABLE shift_schedules DROP CONSTRAINT IF EXISTS shift_schedules_type_check;
ALTER TABLE shift_schedules ADD CONSTRAINT shift_schedules_type_check
  CHECK (type IN ('MORNING', 'MID', 'NIGHT', 'FLEXITIME'));

-- 6. Upsert the 4 required shift types
INSERT INTO shift_schedules (name, code, type, start_time, end_time, break_start, break_end, grace_minutes, required_hours, flex_start_window, flex_end_window, is_night_shift, is_flexitime, is_active)
VALUES
  ('Morning Shift', 'MORNING', 'MORNING', '08:00', '17:00', '12:00', '13:00', 0, 8, NULL, NULL, false, false, true),
  ('Mid Shift',     'MID',     'MID',     '14:00', '23:00', '18:00', '19:00', 0, 8, NULL, NULL, false, false, true),
  ('Night Shift',   'NIGHT',   'NIGHT',   '22:00', '06:00', '02:00', '03:00', 0, 8, NULL, NULL, true,  false, true),
  ('Flexitime',     'FLEX',    'FLEXITIME','08:00', '17:00', '12:00', '13:00', 0, 8, '06:00', '10:00', false, true,  true)
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  type           = EXCLUDED.type,
  start_time     = EXCLUDED.start_time,
  end_time       = EXCLUDED.end_time,
  break_start    = EXCLUDED.break_start,
  break_end      = EXCLUDED.break_end,
  grace_minutes  = EXCLUDED.grace_minutes,
  required_hours = EXCLUDED.required_hours,
  flex_start_window = EXCLUDED.flex_start_window,
  flex_end_window   = EXCLUDED.flex_end_window,
  is_night_shift    = EXCLUDED.is_night_shift,
  is_flexitime      = EXCLUDED.is_flexitime,
  updated_at     = NOW();

-- 7. Ensure indexes on employee_shift_assignments
CREATE INDEX IF NOT EXISTS idx_emp_shift_assignments_employee
  ON employee_shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_shift_assignments_dates
  ON employee_shift_assignments(employee_id, effective_date, end_date);
CREATE INDEX IF NOT EXISTS idx_emp_shift_assignments_effective
  ON employee_shift_assignments(effective_date);

COMMIT;
