-- 033_seed_clock_in_permission.sql
--
-- Purpose:
--   Grant attendance.clock_in permission to all existing users.
--   New users automatically get this permission via EMPLOYEE_DEFAULT_PERMISSIONS
--   in the backend code, but existing users have frozen permissions in the
--   user_permissions table and need this migration.
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING

BEGIN;

INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT
    u.id,
    'attendance.clock_in',
    TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1
    FROM user_permissions up
    WHERE up.user_id = u.id
      AND up.permission_key = 'attendance.clock_in'
);

COMMIT;
