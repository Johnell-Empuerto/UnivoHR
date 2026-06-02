You are a senior full-stack system auditor.

I want you to perform a FULL RE-AUDIT of my HRMS system.

IMPORTANT:
Do not assume you already know my system.
Do not guess.
Do not rely only on file names.
You must read and inspect the actual code, frontend, backend, routes, database usage, permissions, and modules.

System database connection:

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=cimtops
DB_NAME=smart_hrms_attendance

Main goal:
Audit the entire system end-to-end so you fully understand how my HRMS works before recommending changes.

Audit scope:

1. Backend audit

- Read backend folder structure
- Identify all modules
- Identify all API routes
- Identify all controllers/services/middleware
- Identify authentication flow
- Identify RBAC/permissions flow
- Identify notification flow
- Identify payroll, attendance, leave, employee, recruitment, performance, policy, overtime, branch, dashboard, reports, and settings logic
- Check for duplicated old code vs new modular code
- Check if frontend is still calling old backend paths
- Check if there are unused or conflicting routes

2. Frontend audit

- Read frontend folder structure
- Identify all pages, components, layouts, routes, menus, sidebar items, tabs, and role-based visibility
- Check every module page and sub-tab
- Check API calls used by each frontend module
- Compare frontend API calls with actual backend routes
- Find broken pages, old imports, duplicate components, unused components, and inconsistent UI patterns
- Check if sidebar/menu permissions match backend permissions

3. Database audit using psql
   Connect to PostgreSQL and inspect the real database.

Use psql commands to check:

- All tables
- Table columns
- Primary keys
- Foreign keys
- Indexes
- Enum/check constraints
- Sequences
- Views
- Triggers/functions
- Existing permission/role tables
- Notification tables
- Employee/applicant/payroll/attendance/leave/performance-related tables

Use commands like:

psql -h localhost -p 5432 -U postgres -d smart_hrms_attendance

Then inspect:

\dt
\dv
\ds
\df
\d table_name

Also run SQL queries where needed:

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name;

4. Module relationship audit
   Create a clear map of how these modules connect:

- Dashboard
- Employees
- Applicants / Recruitment
- Convert Applicant to Employee
- Attendance
- Leaves
- Overtime
- Payroll
- Performance / KPI / Forms / Assignments
- HR Policies
- Notifications
- Reports
- Branch / Department / Position / Settings
- Users / Roles / Permissions
- Audit Logs
- Employee Code Generation Settings

For each module, identify:

- Frontend files
- Backend files
- API routes
- Database tables
- Permissions used
- Current status: working / partial / broken / duplicate / unused
- Problems found
- Recommended fixes

5. Employee code generation audit
   Specifically check:

- How employee code is generated when creating employee manually
- How employee code is generated when converting applicant to employee
- Whether both flows use the same settings
- Whether duplicate employee codes can happen
- Whether sequence/counter logic is safe
- Whether settings UI matches backend logic
- Whether “check next code” is useful or confusing

6. RBAC and permissions audit
   Check:

- User roles
- Permission list
- Sidebar visibility
- Backend route protection
- Frontend route protection
- Employee self-access rules
- Admin/HR/Payroll/Employee access separation
- Any page visible in sidebar but forbidden in backend
- Any backend API accessible without correct permission

7. Notification audit
   Check:

- All notification tables
- All notification backend services
- All frontend notification UI
- Which modules create notifications
- Which modules should create notifications but do not
- Wrong or duplicated notifications
- Notification permission issues
- Email/real-time/in-app notification logic if existing

8. Output required
   After the audit, provide a structured report:

A. System overview
Explain what the system currently has.

B. Folder structure map
Show backend and frontend folder structure with explanation.

C. Module-by-module audit table
Columns:
Module | Frontend Files | Backend Files | API Routes | DB Tables | Permissions | Status | Issues | Fix Priority

D. Database schema summary
Summarize important tables and relationships.

E. Broken or risky areas
List critical issues first.

F. Duplicate or old code
List old files, old routes, duplicate modules, unused pages/components.

G. Frontend-backend mismatch
List frontend API calls that do not match backend routes.

H. RBAC/permission problems
List sidebar/backend/frontend permission mismatches.

I. Recommended next steps
Give prioritized phases:
Phase 1: Critical fixes
Phase 2: Cleanup old/duplicate code
Phase 3: UI consistency
Phase 4: Security/RBAC hardening
Phase 5: Enterprise improvements

Rules:

- dont re run npm run dev both frontend and backend its already running
- Do not modify code yet.
- Do not run migrations yet.
- Do not delete files yet.
- Audit and report only.
- If you are unsure, say “needs verification” and show what file/table caused uncertainty.
- Be specific. Mention exact file paths, route paths, table names, and permission names.
- Use psql to inspect the real database, not only migration files.
