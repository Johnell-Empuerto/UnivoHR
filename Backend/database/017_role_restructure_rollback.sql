BEGIN;

-- Rollback Phase 1: Role Restructure
-- Reverses SYSTEM_ADMIN/ADMIN/HR_USER/PAYROLL_USER/EMPLOYEE back to old roles
-- WARNING: Demoted seed users (874 ADMIN→EMPLOYEE, 829 HR_ADMIN→EMPLOYEE) cannot be restored
--          because we don't track which EMPLOYEE users were originally ADMIN/HR_ADMIN.

-- Step 1: Revert SYSTEM_ADMIN back to ADMIN (id=1)
UPDATE users SET role = 'ADMIN' WHERE id = 1 AND role = 'SYSTEM_ADMIN';

-- Step 2: Revert ADMIN back to HR_ADMIN (id=3875)
UPDATE users SET role = 'HR_ADMIN' WHERE id = 3875 AND role = 'ADMIN';

-- Step 3: Rename HR_USER back to HR
UPDATE users SET role = 'HR' WHERE role = 'HR_USER';

-- Note: To fully restore seed users, re-run the seed script or manually update:
-- UPDATE users SET role = 'ADMIN' WHERE role = 'EMPLOYEE' AND employee_status = 'Probationary' AND created_at = '2026-04-15';
-- UPDATE users SET role = 'HR_ADMIN' WHERE role = 'EMPLOYEE' AND employee_status = 'Probationary' AND created_at = '2026-04-15';
-- (This is approximate and may affect legitimate EMPLOYEE users)

COMMIT;
