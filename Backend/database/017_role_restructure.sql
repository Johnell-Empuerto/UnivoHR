BEGIN;

-- Phase 1: Role Restructure
-- Replaces ADMIN/HR_ADMIN/HR/EMPLOYEE with SYSTEM_ADMIN/ADMIN/HR_USER/PAYROLL_USER/EMPLOYEE
-- Migration date: 2026-05-29

-- Step 1: Promote original IT admin (id=1) from ADMIN to SYSTEM_ADMIN
UPDATE users SET role = 'SYSTEM_ADMIN' WHERE id = 1 AND role = 'ADMIN';

-- Step 2: Promote real HR admin (id=3875) from HR_ADMIN to ADMIN
UPDATE users SET role = 'ADMIN' WHERE id = 3875 AND role = 'HR_ADMIN';

-- Step 3: Demote all seed ADMIN users (except id=1) to EMPLOYEE
UPDATE users SET role = 'EMPLOYEE' WHERE role = 'ADMIN' AND id != 1;

-- Step 4: Demote all seed HR_ADMIN users (except id=3875) to EMPLOYEE
UPDATE users SET role = 'EMPLOYEE' WHERE role = 'HR_ADMIN' AND id != 3875;

-- Step 5: Rename HR role to HR_USER
UPDATE users SET role = 'HR_USER' WHERE role = 'HR';

-- Note: EMPLOYEE role stays as EMPLOYEE (no change needed)
-- Note: PAYROLL_USER role has 0 initial users (created manually post-deployment)

COMMIT;
