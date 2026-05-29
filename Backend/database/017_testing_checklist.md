# Phase 1 Role Restructure - Testing Checklist

## Pre-Migration
- [ ] Backup the database
- [ ] Confirm JWT_SECRET in Backend/.env is accessible
- [ ] Ensure all current users log out before migration (old JWTs will work via normalizeRole)

## Migration Steps
1. Run `database/017_role_restructure.sql` against the production DB
2. Verify counts:
   - `SELECT role, COUNT(*) FROM users GROUP BY role;`
   - Expected: SYSTEM_ADMIN:1, ADMIN:1, HR_USER:47, EMPLOYEE:~3828

## Post-Migration Backend Tests
- [ ] Start backend, verify no startup errors (node index.js)
- [ ] Login as SYSTEM_ADMIN (user_id=1) → verify full access
- [ ] Login as ADMIN (user_id=3875) → verify HR+payroll read-only, no salary access
- [ ] Login as HR_USER → verify HR ops (leave management, employee list, recruitment) but no salary/payroll
- [ ] Login as EMPLOYEE → verify self-service only (my attendance, my leaves, my payslips)
- [ ] Verify normalizeRole backward compatibility: set role to 'ADMIN' in JWT → should be normalized to SYSTEM_ADMIN
- [ ] Check all protected routes return appropriate 403 for unauthorized roles
- [ ] Verify create/update/delete operations respect new role boundaries

## Specific Feature Tests
### Attendance
- [ ] EMPLOYEE can check in/out, view own attendance
- [ ] HR_USER can view all attendance, approve time modifications
- [ ] ADMIN can view all, approve, update any record
- [ ] SYSTEM_ADMIN has full access

### Leaves
- [ ] EMPLOYEE can file leaves, see own leaves
- [ ] HR_USER can approve EMPLOYEE leaves
- [ ] ADMIN can approve EMPLOYEE+HR_USER leaves
- [ ] SYSTEM_ADMIN can approve all levels
- [ ] Leave credit conversion: only PAYROLL_ADMIN can access

### Payroll
- [ ] EMPLOYEE sees only own payslips
- [ ] HR_USER cannot access payroll
- [ ] ADMIN can view (read-only) payroll
- [ ] SYSTEM_ADMIN can view payroll
- [ ] PAYROLL_USER can manage payroll fully

### Reports
- [ ] HR_ACCESS (SYSTEM_ADMIN/ADMIN/HR_USER) can view employee/leave/attendance reports
- [ ] PAYROLL_ADMIN (SYSTEM_ADMIN/ADMIN/PAYROLL_USER) can view payroll reports
- [ ] EMPLOYEE cannot access any reports

### Recruitment
- [ ] HR_ACCESS (SYSTEM_ADMIN/ADMIN/HR_USER) can manage job positions, applicants
- [ ] EMPLOYEE cannot access recruitment

### KPI / Performance
- [ ] ADMIN/SYSTEM_ADMIN can manage KPI templates, evaluations
- [ ] HR_USER cannot access KPI admin features
- [ ] EMPLOYEE can see own evaluations, self-evaluation

### HR Forms
- [ ] ADMIN/SYSTEM_ADMIN can manage forms, assignments, submissions
- [ ] HR_USER can... (check routes - hrForms has ADMIN_ONLY which is SYSTEM_ADMIN/ADMIN)
- [ ] EMPLOYEE can fill assigned forms

### Users / Accounts
- [ ] Only SYSTEM_ADMIN and ADMIN can manage user accounts
- [ ] Role dropdown shows 5 new roles (SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE)

### Overtime / Man Hours
- [ ] HR_ACCESS (SYSTEM_ADMIN/ADMIN/HR_USER) + assigned approvers can approve
- [ ] EMPLOYEE can submit own requests

### Calendar
- [ ] ADMIN/SYSTEM_ADMIN can create/edit/delete calendar events
- [ ] HR_USER can manage branch-assigned events

### Branch Management
- [ ] Only SYSTEM_ADMIN and ADMIN can manage branches

### Settings
- [ ] SYSTEM_ADMIN, ADMIN, HR_USER can access settings

## Frontend Tests
- [ ] Sidebar shows correct menu items per role
- [ ] Routes redirect correctly per role
- [ ] User creation form shows 5 roles
- [ ] Role badge colors display correctly in Users table
- [ ] Payroll page routes correctly (ADMIN/SYSTEM_ADMIN → PayRollPage, others → EmployeePayrollPage)
- [ ] Leave page shows admin vs employee view based on role

## Edge Cases
- [ ] Old JWT token still works (normalized by middleware)
- [ ] Creating a user with PAYROLL_USER role succeeds
- [ ] Changing a user's role via API works
- [ ] Audit logs capture the new role names
