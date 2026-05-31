-- 020_repair_employee_permissions.sql
-- 
-- Purpose:
--   Add missing Employee Default permissions to existing EMPLOYEE users
--   who were created before the auto-assignment logic was implemented.
--
-- What it does:
--   1. Creates a tracking table to log added permissions (for rollback).
--   2. For each EMPLOYEE user, inserts only the Employee Default permissions
--      they are missing (does NOT overwrite existing custom permissions).
--   3. Logs all insertions for traceability.
--
-- Employee Default permissions:
--   dashboard.view, attendance.view, leave.view, overtime.view,
--   manhours.view, hr_policies.view, calendar.view, notifications.view,
--   my_performance.view, profile.view, change_password
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING

BEGIN;

-- ============================================================
-- Step 1: Create tracking/log table for this migration
-- ============================================================
CREATE TABLE IF NOT EXISTS _migration_020_repair_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Step 2: Insert missing Employee Default permissions
-- ============================================================
WITH default_keys(key) AS (
  VALUES
    ('dashboard.view'),
    ('attendance.view'),
    ('leave.view'),
    ('overtime.view'),
    ('manhours.view'),
    ('hr_policies.view'),
    ('calendar.view'),
    ('notifications.view'),
    ('my_performance.view'),
    ('profile.view'),
    ('change_password')
),
missing_permissions AS (
  SELECT u.id AS user_id, dk.key AS permission_key
  FROM users u
  CROSS JOIN default_keys dk
  WHERE u.role = 'EMPLOYEE'
    AND NOT EXISTS (
      SELECT 1
      FROM user_permissions up
      WHERE up.user_id = u.id
        AND up.permission_key = dk.key
    )
),
inserted AS (
  INSERT INTO user_permissions (user_id, permission_key, is_allowed)
  SELECT user_id, permission_key, TRUE
  FROM missing_permissions
  ON CONFLICT (user_id, permission_key) DO NOTHING
  RETURNING user_id, permission_key
)
INSERT INTO _migration_020_repair_log (user_id, permission_key)
SELECT user_id, permission_key FROM inserted;

-- ============================================================
-- Step 3: Report results
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM _migration_020_repair_log) AS permissions_added,
  (SELECT COUNT(DISTINCT user_id) FROM _migration_020_repair_log) AS users_affected;

COMMIT;
