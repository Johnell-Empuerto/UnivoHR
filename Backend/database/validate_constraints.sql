-- ============================================
-- Validate Constraint Script
-- ============================================
-- SAFE: This script only VALIDATES existing
-- NOT VALID foreign key constraints.
-- It does NOT drop, alter, or modify data.
-- ============================================
-- WARNING: Run this during low-traffic hours.
-- Validation acquires SHARE ROW EXCLUSIVE lock
-- on both tables, which blocks writes during scan.
-- ============================================

BEGIN;

-- ============================================
-- 1. Validate all NOT VALID constraints
--    from 001_safe_migration.sql
-- ============================================

ALTER TABLE payroll
  VALIDATE CONSTRAINT fk_payroll_employee;

ALTER TABLE attendance
  VALIDATE CONSTRAINT fk_attendance_employee;

ALTER TABLE leaves
  VALIDATE CONSTRAINT fk_leaves_employee;

ALTER TABLE employee_salary
  VALIDATE CONSTRAINT fk_employee_salary_employee;

ALTER TABLE employee_deductions
  VALIDATE CONSTRAINT fk_employee_deductions_employee;

ALTER TABLE overtime_requests
  VALIDATE CONSTRAINT fk_overtime_employee;

ALTER TABLE notifications
  VALIDATE CONSTRAINT fk_notifications_user;

COMMIT;

-- ============================================
-- 2. Verification: Check for remaining
--    NOT VALID constraints
-- ============================================

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'f'
  AND convalidated = false
ORDER BY table_name, constraint_name;

-- ============================================
-- Expected result: Zero rows (empty set)
-- after successful validation.
-- ============================================
