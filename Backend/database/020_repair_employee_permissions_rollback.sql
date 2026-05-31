-- 020_repair_employee_permissions_rollback.sql
--
-- Purpose:
--   Reverses the changes made by 020_repair_employee_permissions.sql.
--
-- What it does:
--   1. Removes ONLY the permission rows that were added by the forward migration
--      (tracked in _migration_020_repair_log).
--   2. Drops the tracking table.
--
-- WARNING:
--   Only run this if you need to undo the migration. Existing custom permissions
--   are not affected.

BEGIN;

-- ============================================================
-- Step 1: Remove only the permissions added by forward migration
-- ============================================================
DELETE FROM user_permissions up
WHERE EXISTS (
  SELECT 1
  FROM _migration_020_repair_log log
  WHERE log.user_id = up.user_id
    AND log.permission_key = up.permission_key
);

-- ============================================================
-- Step 2: Drop tracking table
-- ============================================================
DROP TABLE IF EXISTS _migration_020_repair_log;

-- ============================================================
-- Step 3: Report
-- ============================================================
SELECT 'Rollback complete. Permissions added by migration 020 have been removed.' AS result;

COMMIT;
