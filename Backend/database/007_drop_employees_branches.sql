-- ============================================
-- UNIVOHR – Drop employees.branches varchar v7
-- Date: 2026-05-26
-- SAFE: column is 100% NULL across all 5,109 records
--        no backend code, no views, no functions, no triggers reference it
--        FK on employees.branch_id is the authoritative source
-- ============================================

BEGIN;

ALTER TABLE employees DROP COLUMN IF EXISTS branches;

COMMIT;
