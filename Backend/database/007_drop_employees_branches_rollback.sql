-- ============================================
-- UNIVOHR – Rollback: Restore employees.branches
-- ============================================

BEGIN;

ALTER TABLE employees ADD COLUMN branches VARCHAR(100);

COMMENT ON COLUMN employees.branches IS 'DEPRECATED: This column is unused. All branch data is in branch_id FK.';

COMMIT;
