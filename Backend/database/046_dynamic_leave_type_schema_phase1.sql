BEGIN;

-- ============================================
-- Migration 046: Dynamic Leave Type Schema — Phase 1
-- 
-- Purpose: Prepare database foundation for dynamic
-- leave types WITHOUT changing existing behavior.
--
-- Changes:
--   1. Add safe columns to leave_types (IF NOT EXISTS)
--   2. Fix existing leave_type configuration issues
--   3. Create employee_leave_balances normalized table
--   4. Backfill existing balances from leave_credits
--   5. Keep leave_credits table untouched
--   6. No consumers are switched to new table yet
--
-- Rollback: DROP employee_leave_balances; ALTER leave_types
--           DROP COLUMN for each new column added.
-- ============================================

-- ============================================
-- STEP 1: Add safe columns to leave_types
--          All columns use IF NOT EXISTS for idempotency
--          All columns have safe defaults
-- ============================================

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS requires_attachment BOOLEAN DEFAULT false;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS employee_requestable BOOLEAN DEFAULT true;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS hr_only BOOLEAN DEFAULT false;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS include_in_credits BOOLEAN DEFAULT true;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN DEFAULT true;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS deducts_salary BOOLEAN DEFAULT false;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS description TEXT;


-- ============================================
-- STEP 2: Fix existing leave type data issues
-- ============================================

-- 2a. NP (No Pay Leave) is incorrectly marked as paid
--     NP is unpaid leave by definition
UPDATE leave_types
SET is_paid = false,
    is_convertible = false,
    requires_balance = false,
    is_unlimited = true,
    deducts_salary = true,
    description = 'Unpaid leave without salary'
WHERE code = 'NP' AND is_paid = true;

-- 2b. VL (Vacation Leave) missing max_convertible_days
--     Seed set it to 5 but ON CONFLICT DO NOTHING preserved NULL
UPDATE leave_types
SET max_convertible_days = 5
WHERE code = 'VL' AND max_convertible_days IS NULL;

-- 2c. Add descriptions for existing types
UPDATE leave_types SET description = 'Annual vacation leave entitlement' WHERE code = 'VL' AND description IS NULL;
UPDATE leave_types SET description = 'Sick leave for medical needs' WHERE code = 'SL' AND description IS NULL;
UPDATE leave_types SET description = 'Emergency leave for urgent personal matters' WHERE code = 'EL' AND description IS NULL;
UPDATE leave_types SET description = 'Maternity leave for childbirth and recovery' WHERE code = 'ML' AND description IS NULL;

-- 2d. Set sort_order for existing types
UPDATE leave_types SET sort_order = 1 WHERE code = 'VL' AND sort_order = 0;
UPDATE leave_types SET sort_order = 2 WHERE code = 'SL' AND sort_order = 0;
UPDATE leave_types SET sort_order = 3 WHERE code = 'EL' AND sort_order = 0;
UPDATE leave_types SET sort_order = 4 WHERE code = 'ML' AND sort_order = 0;
UPDATE leave_types SET sort_order = 5 WHERE code = 'NP' AND sort_order = 0;

-- 2e. Set employee_requestable for all existing types
--     All 5 current types are employee-requestable
UPDATE leave_types SET employee_requestable = true WHERE code IN ('VL', 'SL', 'EL', 'ML', 'NP') AND employee_requestable IS DISTINCT FROM true;

-- 2f. Set requires_approval for all existing types
UPDATE leave_types SET requires_approval = true WHERE code IN ('VL', 'SL', 'EL', 'ML', 'NP') AND requires_approval IS DISTINCT FROM true;


-- ============================================
-- STEP 3: Create employee_leave_balances table
--          Normalized replacement for leave_credits
--          Created IF NOT EXISTS for idempotency
-- ============================================

CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id               SERIAL PRIMARY KEY,
  employee_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id    INTEGER NOT NULL REFERENCES leave_types(id),
  year             INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  total_days       NUMERIC(5,1) DEFAULT 0,
  used_days        NUMERIC(5,1) DEFAULT 0,
  carried_over_days NUMERIC(5,1) DEFAULT 0,
  adjusted_days    NUMERIC(5,1) DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, leave_type_id, year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee_year
  ON employee_leave_balances(employee_id, year);

CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_leave_type
  ON employee_leave_balances(leave_type_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_employee_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employee_leave_balances_updated_at ON employee_leave_balances;
CREATE TRIGGER trg_employee_leave_balances_updated_at
  BEFORE UPDATE ON employee_leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_leave_balances_updated_at();


-- ============================================
-- STEP 4: Backfill existing balances from leave_credits
--          Maps old wide columns to normalized rows
--          Uses ON CONFLICT to avoid duplicates
--          Does NOT modify or delete leave_credits
-- ============================================

-- 4a. Backfill Sick Leave (SL)
INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days)
SELECT
  lc.employee_id,
  lt.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  COALESCE(lc.sick_leave, 0),
  COALESCE(lc.used_sick_leave, 0)
FROM leave_credits lc
CROSS JOIN LATERAL (
  SELECT id FROM leave_types WHERE code = 'SL'
) lt
ON CONFLICT (employee_id, leave_type_id, year)
DO UPDATE SET
  total_days = EXCLUDED.total_days,
  used_days = EXCLUDED.used_days;

-- 4b. Backfill Vacation Leave (VL)
INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days)
SELECT
  lc.employee_id,
  lt.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  COALESCE(lc.vacation_leave, 0),
  COALESCE(lc.used_vacation_leave, 0)
FROM leave_credits lc
CROSS JOIN LATERAL (
  SELECT id FROM leave_types WHERE code = 'VL'
) lt
ON CONFLICT (employee_id, leave_type_id, year)
DO UPDATE SET
  total_days = EXCLUDED.total_days,
  used_days = EXCLUDED.used_days;

-- 4c. Backfill Maternity Leave (ML)
INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days)
SELECT
  lc.employee_id,
  lt.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  COALESCE(lc.maternity_leave, 0),
  COALESCE(lc.used_maternity_leave, 0)
FROM leave_credits lc
CROSS JOIN LATERAL (
  SELECT id FROM leave_types WHERE code = 'ML'
) lt
ON CONFLICT (employee_id, leave_type_id, year)
DO UPDATE SET
  total_days = EXCLUDED.total_days,
  used_days = EXCLUDED.used_days;

-- 4d. Backfill Emergency Leave (EL)
INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days)
SELECT
  lc.employee_id,
  lt.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  COALESCE(lc.emergency_leave, 0),
  COALESCE(lc.used_emergency_leave, 0)
FROM leave_credits lc
CROSS JOIN LATERAL (
  SELECT id FROM leave_types WHERE code = 'EL'
) lt
ON CONFLICT (employee_id, leave_type_id, year)
DO UPDATE SET
  total_days = EXCLUDED.total_days,
  used_days = EXCLUDED.used_days;

-- 4e. Backfill No Pay Leave (NP) — tracked as 0/0 since NP is unlimited/unpaid
--     The old leave_credits table has no_pay_leave and used_no_pay_leave columns
--     but they are always 0 because NP is tracked differently (no balance needed).
--     We insert rows for consistency but with 0 values.
INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days)
SELECT
  lc.employee_id,
  lt.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  0,
  0
FROM leave_credits lc
CROSS JOIN LATERAL (
  SELECT id FROM leave_types WHERE code = 'NP'
) lt
ON CONFLICT (employee_id, leave_type_id, year)
DO NOTHING;


-- ============================================
-- STEP 5: Update leave_types updated_at for existing rows
-- ============================================

UPDATE leave_types SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;


-- ============================================
-- VALIDATION QUERIES (run manually after migration)
--
-- These queries compare old leave_credits vs new
-- employee_leave_balances to ensure data integrity.
-- ============================================

-- -- V1: Check total employees in both tables
-- SELECT
--   (SELECT COUNT(*) FROM leave_credits) AS old_employees,
--   (SELECT COUNT(DISTINCT employee_id) FROM employee_leave_balances) AS new_employees;

-- -- V2: Check total balance rows per leave type
-- SELECT
--   lt.code,
--   lt.name,
--   COUNT(elb.id) AS employee_count,
--   SUM(elb.total_days) AS sum_total_days,
--   SUM(elb.used_days) AS sum_used_days
-- FROM employee_leave_balances elb
-- JOIN leave_types lt ON lt.id = elb.leave_type_id
-- WHERE elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
-- GROUP BY lt.code, lt.name
-- ORDER BY lt.code;

-- -- V3: Compare VL totals (old vs new)
-- SELECT
--   'VL' AS type,
--   (SELECT COALESCE(SUM(vacation_leave), 0) FROM leave_credits) AS old_total,
--   (SELECT COALESCE(SUM(elb.total_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'VL' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_total,
--   (SELECT COALESCE(SUM(used_vacation_leave), 0) FROM leave_credits) AS old_used,
--   (SELECT COALESCE(SUM(elb.used_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'VL' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_used;

-- -- V4: Compare SL totals (old vs new)
-- SELECT
--   'SL' AS type,
--   (SELECT COALESCE(SUM(sick_leave), 0) FROM leave_credits) AS old_total,
--   (SELECT COALESCE(SUM(elb.total_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'SL' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_total,
--   (SELECT COALESCE(SUM(used_sick_leave), 0) FROM leave_credits) AS old_used,
--   (SELECT COALESCE(SUM(elb.used_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'SL' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_used;

-- -- V5: Compare ML totals (old vs new)
-- SELECT
--   'ML' AS type,
--   (SELECT COALESCE(SUM(maternity_leave), 0) FROM leave_credits) AS old_total,
--   (SELECT COALESCE(SUM(elb.total_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'ML' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_total,
--   (SELECT COALESCE(SUM(used_maternity_leave), 0) FROM leave_credits) AS old_used,
--   (SELECT COALESCE(SUM(elb.used_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'ML' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_used;

-- -- V6: Compare EL totals (old vs new)
-- SELECT
--   'EL' AS type,
--   (SELECT COALESCE(SUM(emergency_leave), 0) FROM leave_credits) AS old_total,
--   (SELECT COALESCE(SUM(elb.total_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'EL' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_total,
--   (SELECT COALESCE(SUM(used_emergency_leave), 0) FROM leave_credits) AS old_used,
--   (SELECT COALESCE(SUM(elb.used_days), 0) FROM employee_leave_balances elb
--    JOIN leave_types lt ON lt.id = elb.leave_type_id
--    WHERE lt.code = 'EL' AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS new_used;

-- -- V7: Verify NP configuration
-- SELECT
--   code,
--   name,
--   is_paid,
--   is_convertible,
--   requires_balance,
--   is_unlimited,
--   deducts_salary
-- FROM leave_types
-- WHERE code = 'NP';

-- -- V8: Check for any employee in leave_credits NOT in employee_leave_balances
-- SELECT lc.employee_id
-- FROM leave_credits lc
-- WHERE NOT EXISTS (
--   SELECT 1 FROM employee_leave_balances elb
--   WHERE elb.employee_id = lc.employee_id
-- );

-- -- V9: Check for any employee in employee_leave_balances NOT in leave_credits
-- SELECT DISTINCT elb.employee_id
-- FROM employee_leave_balances elb
-- WHERE NOT EXISTS (
--   SELECT 1 FROM leave_credits lc
--   WHERE lc.employee_id = elb.employee_id
-- );

-- -- V10: Verify all new leave_types columns were added
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'leave_types'
-- ORDER BY ordinal_position;


COMMIT;
