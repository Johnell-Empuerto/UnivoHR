-- Migration 036: Fix duplicate and missing unique constraints
--
-- Problem 1: payroll had two identical UNIQUE constraints on (employee_id, cutoff_start, cutoff_end):
--   unique_employee_cutoff  — duplicate, being dropped
--   unique_employee_payroll — kept
-- PostgreSQL cannot infer which constraint to use for ON CONFLICT when duplicates exist.
--
-- Problem 2: leave_credits was missing a UNIQUE constraint on employee_id,
-- causing `INSERT ... ON CONFLICT (employee_id)` in generatePayroll to fail.

-- Fix 1: Drop the duplicate constraint on payroll
ALTER TABLE payroll DROP CONSTRAINT IF EXISTS unique_employee_cutoff;

-- Fix 2: Add missing unique constraint on leave_credits
ALTER TABLE leave_credits ADD CONSTRAINT unique_leave_credits_employee UNIQUE (employee_id);

-- Verify both constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'payroll'::regclass
      AND conname = 'unique_employee_payroll'
      AND contype = 'u'
  ) THEN
    RAISE EXCEPTION 'unique_employee_payroll constraint not found after dropping duplicate';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'leave_credits'::regclass
      AND conname = 'unique_leave_credits_employee'
      AND contype = 'u'
  ) THEN
    RAISE EXCEPTION 'unique_leave_credits_employee constraint was not created';
  END IF;
END $$;
