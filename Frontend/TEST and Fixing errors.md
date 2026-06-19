# UnivoHR Current System Status

## What Is Done Now

### 1. Fresh Start / Database Cleanup

Status: Done

- Database fresh-start cleanup completed.
- Old test/demo data removed.
- One admin account created.
- Admin account has full permissions.
- Required default settings were reseeded.
- Core schema preserved.
- No orphan records found after cleanup.
- Backup was created before cleanup.

### 2. Environment and API Configuration

Status: Done

- Hardcoded frontend API URL fixed.
- Frontend now uses `VITE_API_URL`.
- Backend `.env.example` created.
- Frontend `.env.example` created.
- CORS configuration now uses environment variable.
- Socket.IO CORS also uses environment variable.
- Production API URL setup is now cleaner.

### 3. Authentication and API Security

Status: Done

- Password reset validation fixed.
- Reset password now uses the same strong password rules.
- JWT verification now has algorithm whitelist.
- Custom JSON 404 handler added.
- Centralized error handler verified.
- Auth routes still have stricter protection.
- Device routes still have device-specific protection.

### 4. Rate Limit Fix

Status: Done

- The 429 Too Many Requests issue was fixed.
- Old global limiter was too strict.
- Read and write limits are now separated.
- GET requests now have a higher safe limit.
- POST/PUT/PATCH/DELETE requests still have stricter limits.
- Sidebar repeated API calls were reduced.
- Approver status is now cached.
- KPI pending count sidebar call is now cached.
- 429 frontend message is now handled more gracefully.

### 5. Data Validation and Upload Safety

Status: Done

- Input sanitizer helper added.
- Plain text cleanup added.
- Rich text cleanup added.
- Leave reason sanitized.
- Overtime reason/comment sanitized.
- Man-hour task/activity/remarks sanitized.
- Email template subject/body sanitized.
- Applicant notes/address sanitized.
- Form answers/remarks sanitized.
- Upload middleware improved with extension checks and safer filename handling.

### 6. Database Backup and Migration Readiness

Status: Done

- Backup script created.
- `backup:db` package script added.
- Restore guide created.
- Migration guide created.
- Database operations checklist created.
- Constraint validation SQL created.
- No destructive SQL was executed.

### 7. Automated Tests

Status: Mostly Done

- Jest installed.
- Test script added.
- Password validation tests added.
- Input sanitizer tests added.
- Payroll formula helper tests added.
- Backend test count increased to 122 passing tests.
- Payroll formula helpers were extracted for unit testing.

Remaining:

- More integration tests can still be added later.
- End-to-end tests are not yet added.
- Full payroll database fixture tests can still be added later.

### 8. KPI Evaluation Error

Status: Done

- `fetchBulkEmployees` initialization error fixed.
- KPI Evaluations page no longer crashes from the function order issue.

### 9. Documentation

Status: Not Started Yet

Documentation will be done one by one per module.

You decided:

- Do not create deployment guide yet.
- Deployment documentation will be last.
- Start module documentation first.

---

# Current Main Module List

## 1. Dashboard

Status: Done

Includes:

- Admin dashboard
- Employee dashboard
- Summary cards
- Analytics
- Forecast cards
- Notification preview
- Quick actions

## 2. Attendance

Status: Done

Includes:

- Attendance records
- Clock in / clock out
- Web clock in/out
- Manual attendance
- Attendance logs
- Attendance source tracking
- Device attendance integration
- Shift-based attendance
- Timezone-aware attendance

## 3. Anomalies

Status: Done

Includes:

- Attendance anomalies
- Late anomalies
- Missing clock in/out
- Excessive hours
- Overlapping time records
- Anomaly summary
- Anomaly trend analytics

## 4. HR Policies

Status: Done

Includes:

- Policy list
- Policy details
- Policy categories
- Rich text policy content
- Admin policy management
- Employee policy viewing

## 5. Leave Management

Status: Done

Includes:

- My Leaves
- Manage Leaves
- Leave requests
- Leave approvals
- Leave balances
- Leave types
- Paid leave
- Unpaid leave
- Half-day leave
- Leave conversion support

## 6. Overtime

Status: Done

Includes:

- My Overtime
- Manage Overtime
- Overtime requests
- Overtime approvals
- Approver checking
- Payroll overtime integration

## 7. Man Hours

Status: Done

Includes:

- My Man Hours
- Approve Man Hours
- Man-hour requests
- Man-hour approvals
- Man-hour remarks
- Man-hour reports

## 8. Employees

Status: Done

Includes:

- Employee records
- Employee create/edit
- Employee archive/restore
- Employee profile
- Employee salary setup
- Employee branch assignment
- Employee department assignment
- Employee position assignment
- Employment status
- Regularization tracking

## 9. Recruitment

Status: Done

Includes:

- Job Positions
- Applicants
- My Recruitment Assignments
- Recruitment Workflows
- Dynamic stages
- Interviews
- Exams
- Document checks
- Approval stages
- Convert applicant to employee

## 10. Performance / KPI

Status: Mostly Done

Includes:

- KPI Templates
- KPI Evaluations
- Pending KPI count
- Employee KPI results
- KPI assignment/evaluation flow

Needs possible future improvement:

- 360-degree feedback
- More analytics/reporting
- More validation tests

## 11. Employee KPI

Status: Done

Includes:

- My KPI Results
- Employee performance view
- Employee KPI self-service

## 12. Forms

Status: Done

Includes:

- Form Templates
- Assign Forms
- Form Submissions
- HR form workflow
- Employee form answers
- Reviewer remarks

## 13. Employee Forms

Status: Done

Includes:

- My Forms
- Assigned forms
- Employee form submission

## 14. Payroll

Status: Done

Includes:

- Generate Payroll
- Payroll List
- Payroll Details
- Salary Breakdown
- Payslip Download
- Mark as Paid
- Mark All as Paid
- Lock Payroll
- Unlock Payroll
- Void Payroll
- Payroll email queue
- Payroll audit logs
- Late deduction
- Absent deduction display
- Rest day pay
- Holiday pay
- Holiday on rest day
- Night differential
- Overtime pay
- Paid leave/unpaid leave behavior
- Payroll formula unit tests

## 15. Reports

Status: Mostly Done

Includes:

- Attendance reports
- Payroll reports
- Leave reports
- Overtime reports
- Man-hour reports
- HR reports
- Export support

Needs possible future improvement:

- Custom report builder
- More advanced filters
- Better report layouts

## 16. My Benefits

Status: Needs Improvement / Pending

Includes:

- Employee benefit view

Still needs improvement:

- Benefit enrollment
- Dependent management
- Benefit assignment flow
- Admin benefit management
- Benefit history
- Benefit reports

## 17. Calendar

Status: Done

Includes:

- Company calendar
- Holidays
- Special working days
- Special non-working days
- Payroll day-type calendar
- Branch-based calendar support

## 18. Accounts

Status: Done

Includes:

- User accounts
- Account creation
- Account editing
- Account roles
- Account status
- Employee-user linking

## 19. Branches

Status: Done

Includes:

- Branch records
- Branch timezone
- Branch rest days
- Branch access control
- Multi-branch support

## 20. User Permissions

Status: Done

Includes:

- User permission assignment
- Role permissions
- Module permissions
- Feature-level permissions
- Admin full access
- Employee permission control

## 21. Settings

Status: Done

Includes:

- Attendance Settings
- Timezone Settings
- Shifts
- Rest Days
- Pay Rules
- Payroll Rules
- Approvals
- SMTP
- Email Templates
- Notifications
- Branding
- Employee Codes
- Rotation Groups
- Rotation Patterns
- Pattern Assignments
- Employee Rotation
- Devices

## 22. Devices

Status: Done

Includes:

- Device setup
- Device list
- Device user mapping
- Device log mapping
- Raw device logs
- Device attendance sync
- CSV import
- RFID / biometric / QR source mapping
- Device API key protection

## 23. Notifications

Status: Done

Includes:

- In-app notifications
- Email notifications
- Notification rules
- Notification templates
- Unread count
- Scheduler notifications
- Worker-based email sending

## 24. Approvals

Status: Done

Includes:

- Approval settings
- Leave approvals
- Overtime approvals
- Man-hour approvals
- Recruitment approvals
- Configurable approvers

## 25. Authentication / Security

Status: Done

Includes:

- Login
- JWT authentication
- Refresh/session handling
- Password strength validation
- Reset password validation
- Role-based access
- Permission middleware
- Branch access middleware
- API rate limiting
- 404 handler
- Error handler

## 26. Audit Logs

Status: Done

Includes:

- Payroll audit logs
- Employee audit logs
- Settings audit logs
- Action tracking
- Old/new value tracking
- Immutable audit log behavior

---

# Clean Final Checklist

## Core Modules

- [x] Dashboard
- [x] Attendance
- [x] Anomalies
- [x] HR Policies
- [x] Leave Management
- [x] Overtime
- [x] Man Hours
- [x] Employees
- [x] Recruitment
- [x] Performance / KPI
- [x] Employee KPI
- [x] Forms
- [x] Employee Forms
- [x] Payroll
- [x] Reports
- [x] My Benefits
- [x] Calendar
- [x] Accounts
- [x] Branches
- [x] Settings
- [x] Devices
- [x] Notifications
- [x] Approvals
- [x] User Permissions
- [x] Authentication / Security
- [x] Audit Logs

---

# Admin / HR Modules

- Dashboard
- Attendance
- Anomalies
- HR Policies
- Manage Leaves
- Overtime
- Man Hours
- Employees
- Recruitment
- Performance / KPI
- Forms
- Reports
- Payroll
- Calendar
- Accounts
- Branches
- Settings
- User Permissions
- Devices
- Notifications
- Approvals
- Audit Logs

---

# Employee Modules

- Dashboard
- My Attendance / Clock In-Out
- My Leaves
- My Overtime
- My Man Hours
- My KPI Results
- My Forms
- My Benefits
- My Payroll / Payslips
- Calendar
- Notifications
- HR Policies

---

# Settings / Configuration Modules

- Attendance
- Timezone
- Shifts
- Rest Days
- Pay Rules
- Payroll Rules
- Approvals
- SMTP
- Email Templates
- Notifications
- Branding
- Employee Codes
- Rotation Groups
- Rotation Patterns
- Pattern Assignments
- Employee Rotation
- Devices

---

# Remaining Work Before Documentation

## Must finish or decide

1. My Benefits
   - Still the weakest module.
   - Needs improvement if you want complete HRIS coverage.

2. Reports
   - Mostly done.
   - Can be documented as existing report module, but custom report builder is future improvement.

3. Performance / KPI
   - Mostly done.
   - Current flow is usable.
   - 360-feedback can be future improvement.

4. Documentation
   - Not started yet.
   - You will document one module at a time.
   - Deployment guide will be last.

5. Optional future improvements
   - Docker
   - CI/CD
   - structured logging
   - error tracking
   - E2E tests
   - custom report builder
   - advanced benefits enrollment

---

# Current Verdict

The system is now stronger than the original audit result.

Original audit score:
7.5 / 10

Current estimated status after fixes:
8.2 / 10 to 8.5 / 10

Reason:

- P0/P1 hardening items are mostly fixed.
- API config is fixed.
- Password reset security is fixed.
- JWT verification is improved.
- Rate limiting is fixed and tuned.
- Input cleanup is added.
- Backup/migration readiness is added.
- Unit tests are added.
- Payroll formula helpers/tests are added.

Still not full enterprise grade because:

- My Benefits needs improvement.
- Deployment guide is not done yet by your choice.
- CI/CD is not added.
- Docker is not added.
- E2E tests are not added.
- Monitoring/logging is still basic.

====================================================================

Create the documentation order only.

Documentation Phase:
Phase 0 - User Manual Documentation Order

Goal:
Create the correct order for writing UnivoHR user manual documentation, one module at a time.

Important context:
This documentation is for normal users and client admins, not developers.

The client will receive the system with a clean database.
Only one default admin account exists at the start.
Most tables are empty.
The client must set up the system in the correct order before using attendance, payroll, leave, overtime, recruitment, KPI, forms, and reports.

Important:
Do not write the full documentation for each module yet.
Do not create deployment guide.
Do not create API documentation.
Do not create developer documentation.
Do not modify code.
Do not modify database.
Only create the proper documentation order and phases.

Documentation style required:
Each future module guide must be written for non-technical users.

Every future module guide should include:

- What this module is for
- Who uses this module
- When to use this module
- What must be set up before using this module
- Where to click in the sidebar/menu
- What button to click
- What fields to fill up
- What each field means
- What happens after clicking Save/Create/Submit
- How to edit records
- How to delete/archive records if available
- How to search/filter records
- Common mistakes
- What to do next after completing the module
- Related modules
- Previous guide link
- Next guide link
- Related guide buttons/links

Important related documentation rule:
Every future module document must include a section called:

## Related Guides

This section must include clickable Markdown links to related documents.

Use button-style Markdown links like this:

[⬅ Previous: Branch Setup Guide](../01_SYSTEM_SETUP/BRANCH_SETUP_GUIDE.md)

[Next: Employee Code Settings Guide ➜](../01_SYSTEM_SETUP/EMPLOYEE_CODE_SETTINGS_GUIDE.md)

[Related: User Permissions Guide](../04_EMPLOYEE_ACCOUNT_SETUP/USER_PERMISSIONS_GUIDE.md)

[Related: Payroll Rules Guide](../02_CORE_SETTINGS/PAYROLL_RULES_GUIDE.md)

If a document depends on another guide, add it as a related link.
If a document should be read next, add it as the next guide.
If a document has a previous setup step, add it as the previous guide.

Example:
Employee Management Guide should link to:

- Branch Setup Guide
- Employee Code Settings Guide
- Employee Salary Setup Guide
- User Account Setup Guide
- User Permissions Guide
- Payroll Processing Guide

Payroll Processing Guide should link to:

- Employee Salary Setup Guide
- Attendance Management Guide
- Leave Management Guide
- Overtime Management Guide
- Man Hours Guide
- Calendar and Holiday Setup Guide
- Pay Rules Guide
- Payroll Rules Guide
- Reports Guide

Create the documentation order using phases below.

PHASE 1 - First Login and Basic Company Setup

Purpose:
This phase prepares the system before any employee, attendance, or payroll setup.

Order:

1. First Admin Login Guide
2. Change Admin Password Guide
3. Company Branding Guide
4. Branch Setup Guide
5. Employee Code Settings Guide

Reason:
The client must log in first, secure the admin account, set company identity, create branches, and prepare employee code rules before adding employees.

PHASE 2 - Core Settings Setup

Purpose:
This phase configures the rules used by attendance, payroll, leave, overtime, and approvals.

Order: 6. Timezone Settings Guide 7. Attendance Settings Guide 8. Shift Settings Guide 9. Rest Day Settings Guide 10. Calendar and Holiday Setup Guide 11. Pay Rules Guide 12. Payroll Rules Guide 13. Approval Settings Guide

Reason:
These settings must be ready before daily operations and payroll processing.

PHASE 3 - Communication and Device Setup

Purpose:
This phase prepares notifications, email sending, and attendance devices.

Order: 14. SMTP Settings Guide 15. Email Templates Guide 16. Notification Settings Guide 17. Device Setup Guide 18. Device User Mapping Guide 19. Device Log Mapping Guide

Reason:
Email and notifications are needed for approvals and alerts. Devices must be configured before device-based attendance is used.

PHASE 4 - Employee and Account Setup

Purpose:
This phase prepares the real users of the system.

Order: 20. Employee Management Guide 21. Employee Salary Setup Guide 22. Employee Shift / Rest Day / Rotation Assignment Guide 23. User Account Setup Guide 24. User Permissions Guide 25. Branch Access Guide

Reason:
Employees must exist before accounts, attendance, leave, overtime, KPI, forms, and payroll can work properly.

PHASE 5 - HR Daily Management Modules

Purpose:
This phase documents the main HR operations used after setup.

Order: 26. HR Policies Guide 27. Leave Management Guide 28. Overtime Management Guide 29. Man Hours Guide 30. Attendance Management Guide 31. Anomalies Guide

Reason:
These are daily HR/admin tasks after employees and settings are ready.

PHASE 6 - Recruitment, Performance, and Forms

Purpose:
This phase documents HR workflow modules.

Order: 32. Job Positions Guide 33. Recruitment Workflow Guide 34. Applicants Guide 35. My Recruitment Assignments Guide 36. KPI Templates Guide 37. KPI Evaluations Guide 38. Employee KPI Results Guide 39. Form Templates Guide 40. Assign Forms Guide 41. Form Submissions Guide

Reason:
These modules depend on employees, accounts, permissions, and HR workflows.

PHASE 7 - Payroll and Reports

Purpose:
This phase documents payroll processing after all required attendance, employee, salary, leave, overtime, man-hour, calendar, and payroll rules are configured.

Order: 42. Payroll Processing Guide 43. Payroll Details Guide 44. Payslip Download Guide 45. Payroll Status Actions Guide 46. Reports Guide

Reason:
Payroll should be documented after setup and daily modules because payroll depends on many modules.

PHASE 8 - Employee Self-Service Guides

Purpose:
This phase documents what normal employees can do.

Order: 47. Employee Dashboard Guide 48. My Attendance / Clock In-Out Guide 49. My Leaves Guide 50. My Overtime Guide 51. My Man Hours Guide 52. My KPI Results Guide 53. My Forms Guide 54. My Payroll / Payslips Guide 55. My Benefits Guide 56. Notifications Guide

Reason:
Employee guides should be separate from admin guides because employees need simpler instructions.

PHASE 9 - Security, Audit, and Troubleshooting

Purpose:
This phase documents system safety and support topics.

Order: 57. Authentication and Login Issues Guide 58. Security and Permissions Guide 59. Audit Logs Guide 60. Troubleshooting Guide

Reason:
These are support/admin reference documents.

PHASE 10 - Deployment Guide

Purpose:
Deployment documentation comes last.

Order: 61. Deployment Guide 62. Backup and Restore Guide 63. Migration Guide 64. Production Checklist

Important:
Do not write this phase yet.
Deployment docs will be created only after user module documentation is complete.

Output required:

1. Create a clean documentation phase order.

2. Use a table with these columns:
   - Phase
   - Document Number
   - Document Title
   - File Path
   - Target User
   - Why This Comes First
   - Depends On
   - Related Guide Links
   - Status

3. Mark all documents as:
   Not Started

4. For the Related Guide Links column, include Markdown links to:
   - previous guide
   - next guide
   - related dependency guides

5. Create a recommended folder structure.

Use this folder structure:

docs/
00_START_HERE/
01_BASIC_COMPANY_SETUP/
02_CORE_SETTINGS/
03_COMMUNICATION_DEVICE_SETUP/
04_EMPLOYEE_ACCOUNT_SETUP/
05_HR_DAILY_MANAGEMENT/
06_RECRUITMENT_PERFORMANCE_FORMS/
07_PAYROLL_REPORTS/
08_EMPLOYEE_SELF_SERVICE/
09_SECURITY_AUDIT_TROUBLESHOOTING/
10_DEPLOYMENT_LAST/

6. After the table, recommend the first document to write.

7. Final answer should say:
   The first module documentation to write is:
   First Admin Login Guide

   =========================================================================

   Here is the full checklist of what we already finished and what is still not done.

## Current Overall Status

You are currently at:

**Phase 1D.6 Audit completed only.**
**Phase 1D.6 implementation is not yet done.**

Latest completed work was the **High-Risk Badge Audit** for Attendance, Payroll, Recruitment, Overtime, Man Hours, Anomalies, and Device Integration. It recommends implementing only safe subsets first.

---

# Done

## 1. Employee Bulk Upload Module

Done:

- Created `employeeBulk.service.js`
- Created `employeeBulk.controller.js`
- Created `employeeUpload.middleware.js`
- Added backend routes
- Fixed duplicate tracking bug from `Set` to `Map`
- Ran migration `053_employee_import_batches.sql`
- Added parse and validate logic
- Added import batch persistence
- Added transaction-safe commit/import logic
- Added import history endpoint
- Added error report generation endpoint
- Added frontend `BulkImportDialog.tsx`
- Added API methods
- Added Bulk Upload button in Employees module

Status: **Complete**

---

## 2. Docs / User Manual / Legal Pages

Done:

- Created `EmployeeBulkUploadDocs.tsx`
- Registered route for employee bulk upload docs
- Updated `docsData.ts`
- Renumbered docs order
- Removed `DocScreenshot` imports from 68 docs pages
- Rewrote:
  - `PrivacyPage.tsx`
  - `TermsPage.tsx`
  - `SecurityPage.tsx`

Status: **Complete**

---

## 3. Phase 1A — Critical UI Fixes

Done:

- Fixed wrong Input import casing in `KpiTemplatesPage.tsx`
  - from `@/components/ui/input`
  - to `@/components/ui/Input`

- Removed stray `console.log` in `PayRollPage.tsx`
- Added dark mode badge classes to:
  - `KpiTemplatesPage.tsx`
  - `KpiEvaluationPage.tsx`
  - `OnboardingPage.tsx`

- Ran TypeScript check

Status: **Complete**

---

## 4. Phase 1B — UI Consistency Fixes

Done:

- Added Clear Filters buttons to 5 pages
- Replaced `<p>` labels with `<Label>` in 3 pages
- Replaced delete confirmation `Dialog` with `AlertDialog` in `KpiTemplatesPage`
- Replaced safe raw `<select>` / `<input>` with shadcn components in:
  - `AttendancePage`
  - `OnboardingPage`

- Ran TypeScript check

Status: **Complete**

---

## 5. Applicants API Bug Fix

Done:

Fixed this error:

```txt
invalid input syntax for type integer: "all"
```

Cause:

```txt
job_position_id=all
```

Fixes applied:

- Frontend normalized `jobFilter === "all"` to `""`
- Frontend normalized `statusFilter === "all"` to `""`
- Backend controller validates `job_position_id`
- Backend returns `400` for invalid non-numeric IDs
- Backend model added regex SQL guard before casting to integer
- Tested:
  - no filters
  - `job_position_id=all`
  - valid job position
  - invalid job position
  - `status=all`

Status: **Complete**

---

## 6. Phase 1B Regression Testing

Done:

Tested affected Phase 1B pages for similar API/filter errors:

- Applicants
- Attendance
- HR Forms
- HR Form Builder
- KPI Templates
- KPI Evaluation
- Onboarding
- Branches

Result:

- No more integer-casting filter errors found
- TypeScript passed

Status: **Complete**

---

## 7. Phase 1C — UI Cleanup

Done:

- Added Search icon wrappers to:
  - `HrFormsPage`
  - `OnboardingPage`

- Standardized icon-only buttons from `size="sm"` to `size="icon-sm"` in:
  - `KpiTemplatesPage`
  - `KpiEvaluationPage`
  - `OnboardingPage`

- Replaced raw pagination `<select>` with shadcn `<Select>` in:
  - `KpiEvaluationPage`
  - `OnboardingPage`

- Verified Phase 1C
- Fixed `KpiEvaluationPage` Input import casing
- Ran TypeScript check

Status: **Complete**

---

## 8. Full Input Import Casing Fix

Done:

Fixed all remaining lowercase Input imports:

- `EvaluationHistoryPage.tsx`
- `EmployeeEvaluationPage.tsx`
- `EmployeeRotation.tsx`
- `ShiftManagement.tsx`
- `ProfilePage.tsx`
- `ReportFilters.tsx`

Changed:

```ts
import { Input } from "@/components/ui/input";
```

to:

```ts
import { Input } from "@/components/ui/Input";
```

Status: **Complete**

---

## 9. Phase 1D.1 — Route Titles Cleanup

Done:

Updated:

- `Frontend/src/components/layout/AppLayout.tsx`

Added missing titles for modules like:

- Profile
- HR Policies
- Branches
- Anomalies
- Benefits
- Reports
- Recruitment routes
- KPI routes
- My Performance routes
- HR Forms routes
- My Forms
- User Permissions

Added dynamic title handling for:

- Payroll Details
- Applicant Details
- New Applicant
- Form Builder
- Form Submission
- Fill Form

Status: **Complete**

---

## 10. Phase 1D.2 — Badge / Status Audit

Done:

Audited badge/status usage across frontend.

Findings:

- Around 200+ badge usages
- Around 25+ duplicated badge helpers
- No shared badge utility existed
- Some pages missing dark mode badge styles
- Some statuses use inconsistent colors

Status: **Complete**

---

## 11. Phase 1D.3 — Shared Badge Utility

Done:

Created:

```txt
Frontend/src/utils/statusBadge.ts
```

Added exports:

- `StatusBadgeTone`
- `getStatusBadgeClass`
- `getStatusTone`
- `getStatusBadgeClassByStatus`
- `formatStatusLabel`

Added literal Tailwind class strings only.

Added warning comments for context-sensitive modules:

- Attendance
- Payroll
- Recruitment
- Device sync
- Anomalies
- HR Policies
- Legal/docs badges

Status: **Complete**

---

## 12. Phase 1D.4 — Low-Risk Badge Migration

Done:

Applied shared badge utility to low-risk modules:

- `BranchesPage`
- `JobPositionsPage`
- `DeviceTable`
- HR Forms pages:
  - `HrFormsPage`
  - `HrFormAssignmentsPage`
  - `HrFormSubmissionsPage`
  - `HrFormSubmissionViewPage`
  - `MyFormsPage`

Status: **Complete**

---

## 13. Phase 1D.5 — Medium-Risk Badge Migration

Done:

Applied shared badge utility to medium-risk modules:

KPI / Performance:

- `EmployeeEvaluationPage`
- `EvaluationHistoryPage`
- `SelfEvaluationPage`
- `KpiEvaluationPage`
- `MyKpiResultsPage`
- `KpiTemplatesPage`

Employees:

- `EmployeeTable`
- `BulkImportDialog`

Profile:

- `ProfilePage`

Also improved dark mode for KPI badges.

Status: **Complete**

---

## 14. Phase 1D.6 — High-Risk Badge Audit

Done:

Audited but did **not implement** high-risk modules:

- Attendance
- Payroll
- Recruitment
- Overtime
- Man Hours
- Anomalies
- Device Integration sync logs

Result:

- Safe subsets identified
- Risky badges identified
- Modules to skip identified
- Implementation order recommended

Status: **Audit Complete, Implementation Not Done**

---

# Not Done Yet

## 1. Phase 1D.6A — Overtime + Man Hours Safe Badge Migration

Not done.

Recommended first implementation:

- `OvertimeTable.tsx`
- `ManHourReportTable.tsx`

Safe statuses:

- `APPROVED` → success
- `REJECTED` → danger
- `PENDING` / `SUBMITTED` → warning

Do not touch yet:

- `OvertimeDrawer`
- `ManHourReportDrawer`

Status: **Pending**

---

## 2. Phase 1D.6B — Payroll Safe Badge Migration

Not done.

Possible safe files:

- `PayrollTable.tsx`
- `FinalPayTable.tsx`

Safe statuses:

- `PAID`
- `Processed`
- `RESIGNED`
- `TERMINATED`

Be careful with:

- `UNPAID`
- `Pending`

Status: **Pending**

---

## 3. Phase 1D.6C — Device Integration Safe Subset

Not done.

Safe candidates:

- `PROCESSED`
- Mapping Active
- Mapping Inactive

Do not touch yet:

- `FAILED`
- `DUPLICATE`
- `PENDING`
- Device sync log special badges

Status: **Pending**

---

## 4. Phase 1D.6D — Attendance Safe Subset

Not done.

Possible safe statuses:

- `PRESENT`
- `ABSENT`
- `APPROVED`
- `REJECTED`
- default fallback

Do not touch yet:

- `LATE`
- `PENDING`
- `LEAVE`
- source badges like WEB / MANUAL / BIOMETRIC
- timezone badges

Status: **Pending**

---

## 5. Phase 1D.6E — Recruitment Safe Subset

Not done.

Possible safe statuses:

- Initial
- Final Interview
- Completed
- Fail
- Requirement Completed
- Requirement Rejected
- Recommendation Passed / Failed / For Review
- Interview Completed / Scheduled / Cancelled
- Onboarding statuses except emerald Completed

Do not touch yet:

- Pending purple
- Exam Interview indigo
- Onboarding Completed emerald
- MyInterviewAssignments spans
- workflow timeline spans

Status: **Pending**

---

## 6. Skip / Leave As-Is For Now

Not done and should **not be touched yet**:

- `AnomalyPage`
- `MyInterviewAssignmentsPage`
- `OvertimeDrawer`
- `ManHourReportDrawer`
- HR Policy category badges
- Legal pages
- Docs pages
- Recruitment purple / indigo badges
- Onboarding emerald Completed badge
- Attendance LEAVE border badge
- Device sync special statuses

Status: **Skip for now**

---

## 7. Phase 1D.7 — Final Visual Regression Test

Not done.

Need to test:

- Light mode
- Dark mode
- Badge colors
- Table layouts
- Dialogs/drawers
- No console errors
- No API 500 errors
- TypeScript check

Status: **Pending**

---

## 8. Phase 1E — Pagination Standardization

Not done.

Known remaining raw pagination selects:

- `NotificationsPage`
- `LeaveApprovers`

Also still not done:

- Shared pagination component
- Shared DataTable component
- Full pagination cleanup across all modules

Status: **Pending / Optional**

---

# Next Recommended Step

Do this next:

**Phase 1D.6A only — apply shared badge utility to OvertimeTable and ManHourReportTable.**

Do not jump to Attendance, Payroll, or Recruitment yet.
