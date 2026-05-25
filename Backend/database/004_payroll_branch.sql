-- ============================================
-- UNIVOHR – Payroll Branch Support Migration v4
-- Date: 2026-05-25
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- 1. ADD branch_id TO payroll
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE payroll ADD COLUMN branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. BACKFILL branch_id FROM employees table
UPDATE payroll p
SET branch_id = e.branch_id
FROM employees e
WHERE e.id = p.employee_id
  AND p.branch_id IS NULL;

-- 3. INDEX ON branch_id
CREATE INDEX IF NOT EXISTS idx_payroll_branch_id ON payroll(branch_id);

-- 4. ADD branch_id TO getPayrollDetails JOIN (no DB change, just query)
--    Handled in backend code.

COMMIT;
