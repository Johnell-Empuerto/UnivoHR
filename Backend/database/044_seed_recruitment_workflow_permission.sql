-- 044_seed_recruitment_workflow_permission.sql
-- Grants recruitment.workflows.manage to ADMIN users and users who already have recruitment.approvals.manage
-- Safe for re-run (uses ON CONFLICT DO NOTHING)

BEGIN;

INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT u.id, 'recruitment.workflows.manage', TRUE
FROM users u
WHERE u.role = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id AND up.permission_key = 'recruitment.workflows.manage'
  );

INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT u.id, 'recruitment.workflows.manage', TRUE
FROM users u
WHERE EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id AND up.permission_key = 'recruitment.approvals.manage' AND up.is_allowed = TRUE
  )
  AND u.role != 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up2
    WHERE up2.user_id = u.id AND up2.permission_key = 'recruitment.workflows.manage'
  );

COMMIT;
