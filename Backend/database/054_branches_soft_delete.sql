-- Soft Delete for Branches
-- Adds is_deleted column to allow safe deletion via hiding instead of hard delete.
-- Hard delete was blocked by the immutable audit log trigger (trg_audit_immutable).
-- Soft delete preserves all foreign key relationships and historical JOINs.

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Existing branches are not deleted, so no migration of data is needed.
-- The DEFAULT false ensures backward compatibility.

CREATE INDEX IF NOT EXISTS idx_branches_is_deleted
  ON branches (is_deleted)
  WHERE is_deleted = true;
