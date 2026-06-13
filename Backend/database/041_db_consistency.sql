-- 041_db_consistency.sql
-- Phase 12.3: Database consistency and constraint audit
-- All changes are additive (CREATE INDEX IF NOT EXISTS / CREATE UNIQUE INDEX IF NOT EXISTS)
-- and safe for existing data.

-- ============================================
-- 1. Composite index on attendance(branch_id, date)
-- Helps queries filtering attendance by branch AND date together.
-- Existing separate indexes: idx_attendance_branch_id, idx_attendance_date
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_branch_date
  ON attendance(branch_id, date);

-- ============================================
-- 2. Composite index on employees(status, branch_id)
-- Helps queries like "show all ACTIVE employees in branch X".
-- Existing separate indexes: idx_employees_status, idx_employees_branch_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_status_branch
  ON employees(status, branch_id);

-- ============================================
-- 3. Unique constraint on employee_deductions(employee_id, type)
-- Prevents duplicate deduction types for the same employee.
-- Checked: no duplicates exist in current data.
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS unique_employee_deduction_type
  ON employee_deductions(employee_id, type);
