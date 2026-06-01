-- 024_shift_enhancements_rollback.sql
--
-- Reverses the changes made by 024_shift_enhancements.sql.
--
-- DOES NOT remove added columns or data (additive changes are safe to keep).
-- Reverts only the structural changes that could affect future migrations:
--   1. Drops the unique index on shift_schedules.code
--   2. Reverts the type CHECK constraint to original (MORNING, NIGHT only)
--
-- WARNING:
--   Only run if you need to undo this migration. Data is preserved.

BEGIN;

DROP INDEX IF EXISTS idx_shift_schedules_code;

ALTER TABLE shift_schedules DROP CONSTRAINT IF EXISTS shift_schedules_type_check;
ALTER TABLE shift_schedules ADD CONSTRAINT shift_schedules_type_check
  CHECK (type IN ('MORNING', 'NIGHT'));

SELECT 'Rollback complete. Index and type constraint reverted. New columns and data preserved.' AS result;

COMMIT;
