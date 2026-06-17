-- ============================================
-- Migration 047: Backup and Drop leave_credits
-- ============================================
-- 
-- Background:
--   The legacy `leave_credits` table stored fixed-column leave balances
--   (vacation_leave, sick_leave, emergency_leave, maternity_leave, no_pay_leave).
--   It has been fully replaced by the dynamic `employee_leave_balances` +
--   `leave_types` system, which supports configurable leave types with
--   per-employee, per-year, per-type balances.
--
-- Prerequisites (verified before creating this migration):
--   ✅ Zero `leave_credits` references in backend source code
--   ✅ Payroll uses employee_leave_balances
--   ✅ Reports use employee_leave_balances
--   ✅ Final Pay uses employee_leave_balances
--   ✅ Leave Management uses employee_leave_balances
--   ✅ All syntax checks pass
--   ✅ Runtime tests pass (VL convertible, CL non-convertible, CL convertible)
--   ✅ leave_credits row count unchanged (no writes during tests)
--
-- Steps:
--   1. Back up old data to leave_credits_backup_before_drop
--   2. Add safety metadata comment
--   3. Drop old leave_credits table
--
-- Rollback:
--   If rollback is needed, rename leave_credits_backup_before_drop to leave_credits
--   and recreate the sequence and constraints.
-- ============================================

-- STEP 1: Backup old table
CREATE TABLE IF NOT EXISTS leave_credits_backup_before_drop AS
SELECT * FROM leave_credits;

-- STEP 2: Add safety metadata
COMMENT ON TABLE leave_credits_backup_before_drop IS
'Backup of legacy leave_credits table before migration to employee_leave_balances. Created by migration 047.';

COMMENT ON COLUMN leave_credits_backup_before_drop.id IS 'Original primary key from leave_credits';
COMMENT ON COLUMN leave_credits_backup_before_drop.employee_id IS 'References employees(id)';
COMMENT ON COLUMN leave_credits_backup_before_drop.vacation_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = VL';
COMMENT ON COLUMN leave_credits_backup_before_drop.used_vacation_leave IS 'Legacy column — replaced by employee_leave_balances used_days for VL';
COMMENT ON COLUMN leave_credits_backup_before_drop.sick_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = SL';
COMMENT ON COLUMN leave_credits_backup_before_drop.used_sick_leave IS 'Legacy column — replaced by employee_leave_balances used_days for SL';
COMMENT ON COLUMN leave_credits_backup_before_drop.emergency_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = EL';
COMMENT ON COLUMN leave_credits_backup_before_drop.used_emergency_leave IS 'Legacy column — replaced by employee_leave_balances used_days for EL';
COMMENT ON COLUMN leave_credits_backup_before_drop.maternity_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = ML';
COMMENT ON COLUMN leave_credits_backup_before_drop.used_maternity_leave IS 'Legacy column — replaced by employee_leave_balances used_days for ML';
COMMENT ON COLUMN leave_credits_backup_before_drop.no_pay_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = NP';
COMMENT ON COLUMN leave_credits_backup_before_drop.used_no_pay_leave IS 'Legacy column — replaced by employee_leave_balances used_days for NP';
COMMENT ON COLUMN leave_credits_backup_before_drop.last_conversion_year IS 'Legacy column — no longer used; conversion year tracked in leave_conversions';
COMMENT ON COLUMN leave_credits_backup_before_drop.created_at IS 'Original timestamp';

-- STEP 3: Drop old table safely
DROP TABLE IF EXISTS leave_credits;

-- ============================================
-- Verification Queries (run after migration)
-- ============================================
--
-- SELECT COUNT(*) AS backup_row_count FROM leave_credits_backup_before_drop;
-- SELECT COUNT(*) AS active_balance_count FROM employee_leave_balances;
-- SELECT code, name, is_enabled FROM leave_types ORDER BY sort_order;
