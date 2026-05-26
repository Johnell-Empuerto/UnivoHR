-- ============================================
-- UNIVOHR – Branch FK Enforcement v6
-- Date: 2026-05-26
-- ADDS: FK on employees.branch_id, audit_logs.branch_id
--        index on employees.branch_id
-- PREPARES: deprecation of employees.branches varchar
-- SAFE: additive only, no data loss, no breaking changes
-- ============================================

BEGIN;

-- ============================================
-- 0. PRE-VALIDATION (run separately before migration)
-- ============================================
-- Run these to verify data integrity BEFORE executing this file:
--
--   -- Check for orphan branch_id values
--   SELECT e.id, e.employee_code, e.branch_id
--   FROM employees e
--   LEFT JOIN branches b ON b.id = e.branch_id
--   WHERE e.branch_id IS NOT NULL AND b.id IS NULL;
--
--   -- Summary statistics
--   SELECT
--     COUNT(*) AS total,
--     COUNT(branch_id) AS with_branch,
--     COUNT(*) - COUNT(branch_id) AS null_branch,
--     COUNT(DISTINCT branch_id) AS distinct_branches
--   FROM employees;
--
-- Expected: orphan query returns 0 rows.

-- ============================================
-- 1. ADD INDEX ON employees.branch_id
--    (needed for FK performance and branch-filtered queries)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_branch_id
    ON employees(branch_id);

-- ============================================
-- 2. ADD FOREIGN KEY ON employees.branch_id
--    → branches(id) ON DELETE SET NULL
--    Keeps branch_id nullable so employee records survive
--    branch deletion without being deleted themselves.
-- ============================================

ALTER TABLE employees
    DROP CONSTRAINT IF EXISTS fk_employees_branch;

ALTER TABLE employees
    ADD CONSTRAINT fk_employees_branch
    FOREIGN KEY (branch_id)
    REFERENCES branches(id)
    ON DELETE SET NULL;

-- ============================================
-- 3. ADD FOREIGN KEY ON audit_logs.branch_id
--    → branches(id) ON DELETE SET NULL
--    Audit records should survive branch deletion.
-- ============================================

ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS fk_audit_logs_branch;

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_branch
    FOREIGN KEY (branch_id)
    REFERENCES branches(id)
    ON DELETE SET NULL;

-- ============================================
-- 4. MARK employees.branches AS DEPRECATED
--    This varchar column is 100% NULL across all 5,109 records.
--    It has never been populated by the application.
--    Step 1: Add a comment documenting deprecation.
--    Step 2: After verifying no application code writes to it,
--            it can be dropped in a future migration.
-- ============================================

COMMENT ON COLUMN employees.branches IS
    'DEPRECATED: This column is unused. All branch data is in branch_id FK. Remove in a future migration.';

-- ============================================
-- 5. VALIDATE NEW CONSTRAINTS (run separately)
-- ============================================
-- After migration, run:
--
--   SELECT
--     tc.table_name,
--     tc.constraint_name,
--     tc.constraint_type,
--     kcu.column_name,
--     ccu.table_name AS ref_table,
--     ccu.column_name AS ref_column
--   FROM information_schema.table_constraints tc
--   JOIN information_schema.key_column_usage kcu
--     ON kcu.constraint_name = tc.constraint_name
--   JOIN information_schema.constraint_column_usage ccu
--     ON ccu.constraint_name = tc.constraint_name
--   WHERE tc.constraint_type = 'FOREIGN KEY'
--     AND tc.table_name IN ('employees', 'audit_logs')
--   ORDER BY tc.table_name, tc.constraint_name;
--
-- Expected: two new FK rows for employees and audit_logs.

COMMIT;
