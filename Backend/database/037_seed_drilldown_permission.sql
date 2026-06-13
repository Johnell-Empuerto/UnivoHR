-- 037_seed_drilldown_permission.sql
--
-- Purpose:
--   Grant drilldown.view permission to all existing ADMIN users.
--   Also grant to any non-ADMIN user who already has analytics.view.
--
-- Background:
--   Phase 12.1 changed drilldown routes from requirePermission('analytics.view')
--   to requirePermission('drilldown.view'). Existing users who had analytics.view
--   need drilldown.view granted explicitly to avoid losing access.
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- Idempotent: INSERT only where NOT EXISTS

BEGIN;

-- 1. Grant drilldown.view to all ADMIN users
INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT
    u.id,
    'drilldown.view',
    TRUE
FROM users u
WHERE u.role = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id
      AND up.permission_key = 'drilldown.view'
  );

-- 2. Grant drilldown.view to any non-ADMIN who already has analytics.view
INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT
    u.id,
    'drilldown.view',
    TRUE
FROM users u
WHERE u.role != 'ADMIN'
  AND EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id
      AND up.permission_key = 'analytics.view'
      AND up.is_allowed = TRUE
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up2
    WHERE up2.user_id = u.id
      AND up2.permission_key = 'drilldown.view'
  );

COMMIT;
