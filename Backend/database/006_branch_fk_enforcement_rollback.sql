-- ============================================
-- UNIVOHR – Rollback: Branch FK Enforcement v6
-- Date: 2026-05-26
-- REVERTS: FK constraints, index, column comments
-- SAFE: no data loss
-- ============================================

BEGIN;

-- 1. DROP FOREIGN KEY on employees.branch_id
ALTER TABLE employees
    DROP CONSTRAINT IF EXISTS fk_employees_branch;

-- 2. DROP FOREIGN KEY on audit_logs.branch_id
ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS fk_audit_logs_branch;

-- 3. DROP INDEX on employees.branch_id
DROP INDEX IF EXISTS idx_employees_branch_id;

-- 4. REMOVE deprecated column comment
COMMENT ON COLUMN employees.branches IS NULL;

COMMIT;
