# Smart HRMS System — Complete Discovery & Documentation Audit

**Audit Date:** May 30, 2026  
**System Name:** UnivoHR (Smart HRMS Attendance System)  
**Tech Stack:** Node.js/Express (Backend) + React/TypeScript (Frontend) + PostgreSQL (Database)  
**Brand:** UnivoHR  

---

## SECTION 1 — FULL FOLDER STRUCTURE

### Backend (`Backend/`)

```
Backend/
├── index.js                          # Server entry point (port 3003)
├── package.json
├── scheduler.js                      # Leave conversion scheduler
├── worker.js                         # Background worker
├── .env                              # Environment variables
├── config/
│   ├── db.js                         # PostgreSQL connection pool
│   ├── env.js                        # Environment config loader
│   ├── redis.js                      # Redis client (optional)
│   └── socket.js                     # WebSocket initialization
├── constants/
│   ├── roles.js                      # Role definitions (SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE)
│   └── status.js                     # Status constants
├── middleware/
│   ├── auth.middleware.js            # JWT authentication
│   ├── role.middleware.js            # Role-based authorization
│   ├── branchAccess.middleware.js    # Branch-level data scoping
│   ├── deviceAuth.middleware.js      # Device API key auth
│   ├── errorHandler.js              # Global error handler
│   ├── logger.js                    # Request logging
│   ├── payrollLock.middleware.js    # Payroll lock check
│   ├── rateLimit.middleware.js      # Rate limiting (login, OTP, password reset)
│   ├── upload.middleware.js         # File upload (multer)
│   └── validate.middleware.js       # Joi validation
├── controllers/ (42 files)
│   ├── analytics.controller.js
│   ├── anomaly.controller.js
│   ├── applicant.controller.js
│   ├── applicantApproval.controller.js
│   ├── applicantDocument.controller.js
│   ├── applicantInterview.controller.js
│   ├── applicantRequirement.controller.js
│   ├── attendance.controller.js
│   ├── auth.controller.js
│   ├── branch.controller.js
│   ├── calendar.bulk.controller.js
│   ├── calendar.controller.js
│   ├── dashboard.controller.js
│   ├── device.controller.js
│   ├── drilldown.controller.js
│   ├── emailTemplate.controller.js
│   ├── employee.controller.js
│   ├── employeeOnboarding.controller.js
│   ├── employeePerformance.controller.js
│   ├── employeeRequirement.controller.js
│   ├── finalPay.controller.js
│   ├── forecast.controller.js
│   ├── historyLeave.controller.js
│   ├── hrForm.controller.js
│   ├── hrPolicy.controller.js
│   ├── jobPosition.controller.js
│   ├── kpiEvaluation.controller.js
│   ├── kpiTemplate.controller.js
│   ├── leave.controller.js
│   ├── leaveConversion.controller.js
│   ├── leaveCredit.controller.js
│   ├── man_hour_report.controller.js
│   ├── notification.controller.js
│   ├── overtime.controller.js
│   ├── payroll.controller.js
│   ├── payRules.controller.js
│   ├── profile.controller.js
│   ├── report.controller.js
│   ├── setting.controller.js
│   ├── smtp.controller.js
│   ├── statisticalAnomaly.controller.js
│   └── user.controller.js
├── routes/ (41 files)
│   ├── analytics.routes.js
│   ├── anomaly.routes.js
│   ├── applicant.routes.js
│   ├── applicantApproval.routes.js
│   ├── applicantDocument.routes.js
│   ├── applicantInterview.routes.js
│   ├── applicantRequirement.routes.js
│   ├── attendance.routes.js
│   ├── attendanceRules.routes.js
│   ├── auth.routes.js
│   ├── branch.routes.js
│   ├── calendar.routes.js
│   ├── dashboard.routes.js
│   ├── device.routes.js
│   ├── drilldown.routes.js
│   ├── emailTemplate.routes.js
│   ├── employee.routes.js
│   ├── employeeOnboarding.routes.js
│   ├── employeePerformance.routes.js
│   ├── employeeRequirement.routes.js
│   ├── finalPay.routes.js
│   ├── forecast.routes.js
│   ├── historyLeave.routes.js
│   ├── hrForm.routes.js
│   ├── hrPolicy.routes.js
│   ├── jobPosition.routes.js
│   ├── kpiEvaluation.routes.js
│   ├── kpiTemplate.routes.js
│   ├── leave.routes.js
│   ├── leaveConversion.routes.js
│   ├── man_hour_report.routes.js
│   ├── notification.routes.js
│   ├── overtime.routes.js
│   ├── payRules.routes.js
│   ├── payroll.routes.js
│   ├── profile.routes.js
│   ├── queue.routes.js
│   ├── report.routes.js
│   ├── setting.routes.js
│   ├── smtp.routes.js
│   ├── statisticalAnomaly.routes.js
│   └── user.routes.js
├── services/ (49 files)
│   ├── analytics.service.js
│   ├── anomaly.service.js
│   ├── applicant.service.js
│   ├── applicantApproval.service.js
│   ├── applicantDocument.service.js
│   ├── applicantInterview.service.js
│   ├── applicantRequirement.service.js
│   ├── attendance.service.js
│   ├── attendanceNotification.service.js
│   ├── audit.service.js
│   ├── auth.service.js
│   ├── branch.service.js
│   ├── calendar.bulk.service.js
│   ├── calendar.service.js
│   ├── company.service.js
│   ├── dashboard.service.js
│   ├── device.service.js
│   ├── drilldown.service.js
│   ├── emailTemplate.service.js
│   ├── emailWrapper.service.js
│   ├── employee.service.js
│   ├── employeeOnboarding.service.js
│   ├── employeePerformance.service.js
│   ├── employeeRequirement.service.js
│   ├── finalPay.service.js
│   ├── forecast.service.js
│   ├── historyLeave.service.js
│   ├── hrForm.service.js
│   ├── hrPolicy.service.js
│   ├── jobPosition.service.js
│   ├── kpiEvaluation.service.js
│   ├── kpiTemplate.service.js
│   ├── leave.service.js
│   ├── leaveConversion.service.js
│   ├── leaveCredit.service.js
│   ├── loginAttempt.service.js
│   ├── man_hour_report.service.js
│   ├── notification.service.js
│   ├── otp.service.js
│   ├── overtime.service.js
│   ├── payroll.service.js
│   ├── payRules.service.js
│   ├── profile.service.js
│   ├── queue.service.js
│   ├── report.service.js
│   ├── setting.service.js
│   ├── smtp.service.js
│   ├── statisticalAnomaly.service.js
│   ├── tokenBlacklist.service.js
│   ├── user.service.js
│   └── userCache.service.js
├── models/ (38 files)
├── utils/
│   ├── branchAccess.js
│   ├── date.js
│   ├── emailDesign.js
│   ├── emailTemplateDefaults.js
│   ├── finalPaySlipGenerator.js
│   ├── finalPaySlipTemplate.js
│   ├── manhourGenerator.js
│   ├── manhourTemplate.js
│   ├── passwordValidator.js
│   ├── payslipGenerator.js
│   └── payslipTemplate.js
├── scripts/
│   ├── backup.ps1
│   ├── backup.sh
│   ├── restore.ps1
│   └── restore.sh
├── pages/
│   └── Dashboard.tsx
├── uploads/
│   └── calendar/ (created on demand)
└── public/
    └── images/
```

### Frontend (`Frontend/`)

```
Frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── public/
│   ├── favicon.svg
│   ├── favicon-32.png
│   ├── favicon.png
│   └── icons.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── SocketProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   └── routes/
│   │       └── routes.tsx
│   ├── assets/
│   │   ├── css/
│   │   │   ├── customStyles.css
│   │   │   └── index.css
│   │   └── images/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── shared/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── Loader.tsx
│   │   ├── drilldown/
│   │   │   └── DrilldownDrawer.tsx
│   │   └── ui/ (shadcn-based components)
│   ├── features/
│   │   ├── anomalies/
│   │   │   ├── pages/AnomalyPage.tsx
│   │   │   └── components/AnomalyDetailDrawer.tsx
│   │   ├── attendance/
│   │   │   ├── pages/AttendancePage.tsx
│   │   │   └── components/AttendanceTable.tsx
│   │   ├── auth/
│   │   │   ├── pages/Login.tsx
│   │   │   └── components/{LoginForm,ForgotPassword,OTPVerification,ResetPassword}.tsx
│   │   ├── benefits/pages/MyBenefitsPage.tsx
│   │   ├── branches/pages/BranchesPage.tsx
│   │   ├── calendar/pages/Calendar.tsx
│   │   ├── dashboard/
│   │   │   ├── pages/Dashboard.tsx
│   │   │   └── components/{StatsCard,InsightsPanel,AttendanceChart,...}.tsx
│   │   ├── devices/
│   │   │   ├── pages/DevicePage.tsx
│   │   │   └── components/DeviceTable.tsx
│   │   ├── docs/ (help documentation pages)
│   │   ├── employees/
│   │   │   ├── pages/EmployeeList.tsx
│   │   │   └── components/{EmployeeDrawer,EmployeeTable}.tsx
│   │   ├── hr-forms/ (dynamic forms engine)
│   │   ├── hr-policies/
│   │   ├── kpi/ (performance management)
│   │   ├── leaves/ (leave management)
│   │   ├── legal/ (privacy, terms, security)
│   │   ├── man-hour-reports/
│   │   ├── notifications/
│   │   ├── overtime/
│   │   ├── payroll/
│   │   ├── performance/ (employee self-service)
│   │   ├── profile/
│   │   ├── recruitment/ (job positions, applicants)
│   │   ├── reports/
│   │   ├── settings/
│   │   └── users/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   └── useSocket.ts
│   ├── lib/utils.ts
│   ├── services/ (42 API client files)
│   └── utils/formatDate.ts
```

---

## SECTION 2 — ALL SYSTEM FUNCTIONALITY

### 1. Authentication & Authorization
- **Purpose:** User login, OTP verification, password management, session handling
- **Backend:** auth.controller.js, auth.routes.js, auth.service.js, otp.service.js, loginAttempt.service.js, tokenBlacklist.service.js, userCache.service.js
- **Frontend:** Login.tsx, LoginForm.tsx, ForgotPassword.tsx, OTPVerification.tsx, ResetPassword.tsx, AuthProvider.tsx
- **Database:** users, user_sessions

### 2. Employee Management
- **Purpose:** CRUD employee records, employee listing with filters
- **Backend:** employee.controller.js, employee.routes.js, employee.service.js
- **Frontend:** EmployeeList.tsx, EmployeeDrawer.tsx, EmployeeTable.tsx
- **Database:** employees, employee_salary, employee_deductions

### 3. Attendance Management
- **Purpose:** Track employee attendance, time modification requests
- **Backend:** attendance.controller.js, attendance.routes.js, attendance.service.js, attendanceNotification.service.js
- **Frontend:** AttendancePage.tsx, AttendanceTable.tsx
- **Database:** attendance, time_modification_requests, attendance_rules

### 4. Device Integration
- **Purpose:** Receive raw logs from biometric devices
- **Backend:** device.controller.js, device.routes.js, device.service.js
- **Frontend:** DevicePage.tsx, DeviceTable.tsx
- **Database:** devices, raw_logs

### 5. Leave Management
- **Purpose:** Leave requests, approvals, credits, types
- **Backend:** leave.controller.js, leave.routes.js, leave.service.js, leaveCredit.controller.js
- **Frontend:** LeavePage.tsx, AdminLeavePage.tsx, LeaveDrawer.tsx, LeaveTable.tsx, CreditLeaveTable.tsx, EmployeeCreditsTable.tsx, LeaveApprovers.tsx, AdminLeaveCreditsPage.tsx, CreditLeavePage.tsx
- **Database:** leaves, leave_credits, leave_types, employee_approvers

### 6. Leave Conversion
- **Purpose:** Convert unused leave credits to cash
- **Backend:** leaveConversion.controller.js, leaveConversion.routes.js, leaveConversion.service.js
- **Frontend:** LeaveConversionSettings.tsx, LeaveConversionHistory.tsx
- **Database:** leave_conversions, conversion_logs

### 7. Leave History
- **Purpose:** View historical leave conversion records
- **Backend:** historyLeave.controller.js, historyLeave.routes.js, historyLeave.service.js
- **Frontend:** (part of leave module)
- **Database:** conversion_logs

### 8. Payroll Management
- **Purpose:** Payroll generation, payslip downloads, salary config, deductions
- **Backend:** payroll.controller.js, payroll.routes.js, payroll.service.js, queue.service.js
- **Frontend:** PayRollPage.tsx, EmployeePayrollPage.tsx, PayrollDetails.tsx, PayrollGenerate.tsx, PayrollSettings.tsx, PayrollCard.tsx, PayrollSummary.tsx, PayrollTable.tsx, SalaryBreakdown.tsx
- **Database:** payroll, employee_salary, employee_deductions, payroll_settings, pay_rules

### 9. Final Pay
- **Purpose:** Compute and process final pay for resigning employees
- **Backend:** finalPay.controller.js, finalPay.routes.js, finalPay.service.js
- **Frontend:** FinalPayTable.tsx, FinalPayHistoryTable.tsx
- **Database:** final_pay

### 10. Overtime Management
- **Purpose:** Overtime requests, approval workflow
- **Backend:** overtime.controller.js, overtime.routes.js, overtime.service.js
- **Frontend:** MyOvertime.tsx, OvertimeRequests.tsx, OvertimeDrawer.tsx, OvertimeForm.tsx, OvertimeTable.tsx, ApprovalTimeline.tsx
- **Database:** overtime_requests, employee_approvers

### 11. Man Hour Reporting
- **Purpose:** Daily task/hour logging with approval
- **Backend:** man_hour_report.controller.js, man_hour_report.routes.js, man_hour_report.service.js
- **Frontend:** MyManHoursReport.tsx, ManHoursApproval.tsx, ManHourReportDrawer.tsx, ManHourReportTable.tsx, MissingManHoursTab.tsx, TimeEntryForm.tsx
- **Database:** man_hour_reports, man_hour_report_details

### 12. Dashboard & Analytics
- **Purpose:** Executive KPIs, attendance stats, trends
- **Backend:** dashboard.controller.js, dashboard.routes.js, dashboard.service.js
- **Frontend:** Dashboard.tsx, StatsCard.tsx, InsightsPanel.tsx, AttendanceChart.tsx, AbsentTrendChart.tsx, etc.
- **Database:** attendance, employees, leaves, overtime_requests

### 13. HR Policies
- **Purpose:** Document management for HR policies
- **Backend:** hrPolicy.controller.js, hrPolicy.routes.js, hrPolicy.service.js
- **Frontend:** HRPolicies.tsx, PolicyViewer.tsx, RichTextEditor.tsx
- **Database:** hr_policy_documents

### 14. HR Dynamic Forms
- **Purpose:** Custom form builder, assignments, submissions
- **Backend:** hrForm.controller.js, hrForm.routes.js, hrForm.service.js
- **Frontend:** HrFormsPage.tsx, HrFormBuilderPage.tsx, HrFormAssignmentsPage.tsx, HrFormSubmissionsPage.tsx, MyFormsPage.tsx, MyFormFillPage.tsx
- **Database:** hr_forms, hr_form_fields, hr_form_assignments, hr_form_submissions, hr_form_answers

### 15. Recruitment
- **Purpose:** Job positions, applicant tracking, interviews, approvals, documents
- **Backend:** applicant.controller.js, applicant.routes.js, applicant.service.js, jobPosition.controller.js, jobPosition.routes.js, jobPosition.service.js, applicantApproval.controller.js, applicantDocument.controller.js, applicantInterview.controller.js, applicantRequirement.controller.js
- **Frontend:** ApplicantsPage.tsx, ApplicantDetailPage.tsx, ApplicantFormPage.tsx, JobPositionsPage.tsx
- **Database:** job_positions, applicants, applicant_approvals, applicant_documents, applicant_interviews, applicant_requirements

### 16. KPI / Performance Management
- **Purpose:** KPI templates, evaluations, self-evaluations, scoring
- **Backend:** kpiTemplate.controller.js, kpiTemplate.routes.js, kpiTemplate.service.js, kpiEvaluation.controller.js, kpiEvaluation.routes.js, kpiEvaluation.service.js
- **Frontend:** KpiTemplatesPage.tsx, KpiEvaluationPage.tsx, EmployeeEvaluationPage.tsx, SelfEvaluationPage.tsx, MyPerformancePage.tsx, MyKpiResultsPage.tsx
- **Database:** kpi_templates, kpi_template_items, employee_kpi_evaluations, employee_kpi_scores

### 17. Employee Performance Portal
- **Purpose:** Self-service KPI results, probation status
- **Backend:** employeePerformance.controller.js, employeePerformance.routes.js, employeePerformance.service.js
- **Frontend:** MyPerformancePage.tsx, MyKpiResultsPage.tsx, MyProbationStatusPage.tsx
- **Database:** employees, employee_kpi_evaluations

### 18. Employee Onboarding
- **Purpose:** New employee onboarding checklist / requirements tracking
- **Backend:** employeeOnboarding.controller.js, employeeOnboarding.routes.js, employeeOnboarding.service.js, employeeRequirement.controller.js, employeeRequirement.routes.js, employeeRequirement.service.js
- **Frontend:** OnboardingPage.tsx
- **Database:** employee_onboarding, employee_requirements

### 19. Branch Management
- **Purpose:** Multi-branch / multi-company support
- **Backend:** branch.controller.js, branch.routes.js, branch.service.js
- **Frontend:** BranchesPage.tsx
- **Database:** branches, user_branch_access

### 20. User / Account Management
- **Purpose:** System user CRUD, role assignment
- **Backend:** user.controller.js, user.routes.js, user.service.js
- **Frontend:** Users.tsx, UsersTable.tsx, UserDrawersForm.tsx
- **Database:** users

### 21. Notifications
- **Purpose:** In-app notification system
- **Backend:** notification.controller.js, notification.routes.js, notification.service.js
- **Frontend:** NotificationsPage.tsx, NotificationDropdown.tsx
- **Database:** notifications

### 22. Calendar Management
- **Purpose:** Holiday/event calendar, bulk upload
- **Backend:** calendar.controller.js, calendar.routes.js, calendar.service.js, calendar.bulk.controller.js, calendar.bulk.service.js
- **Frontend:** Calendar.tsx
- **Database:** calendar_days

### 23. Settings & Configuration
- **Purpose:** System settings, attendance rules, payroll settings
- **Backend:** setting.controller.js, setting.routes.js, setting.service.js, smtp.controller.js, smtp.routes.js, smtp.service.js, emailTemplate.controller.js, emailTemplate.routes.js, emailTemplate.service.js
- **Frontend:** Setting.tsx, SMTPSettings.tsx, AttendanceSettings.tsx, NotificationSettings.tsx, CompanyBranding.tsx, PayRulesSettings.tsx, EmailTemplateEditor.tsx, ApprovalSettings.tsx
- **Database:** system_settings, payroll_settings, smtp_settings, email_templates, company_settings

### 24. Pay Rules & Calendar Days
- **Purpose:** Configure pay multipliers by day type
- **Backend:** payRules.controller.js, payRules.routes.js, payRules.service.js
- **Frontend:** (integrated in settings)
- **Database:** pay_rules, calendar_days

### 25. Reports
- **Purpose:** Employee, leave, attendance, payroll, benefits, performance reports with export
- **Backend:** report.controller.js, report.routes.js, report.service.js
- **Frontend:** ReportsPage.tsx, ExportButton.tsx, ReportFilters.tsx
- **Database:** employees, leaves, attendance, payroll, etc.

### 26. Anomaly Detection
- **Purpose:** Detect attendance anomalies (late, early leave, missing logs)
- **Backend:** anomaly.controller.js, anomaly.routes.js, anomaly.service.js, statisticalAnomaly.controller.js, statisticalAnomaly.routes.js, statisticalAnomaly.service.js
- **Frontend:** AnomalyPage.tsx, AnomalyDetailDrawer.tsx
- **Database:** anomaly_logs

### 27. Drill-down Analytics
- **Purpose:** Deep dive into attendance, payroll, overtime, leaves, branches with exports
- **Backend:** drilldown.controller.js, drilldown.routes.js, drilldown.service.js
- **Frontend:** DrilldownDrawer.tsx
- **Database:** attendance, payroll, overtime_requests, leaves, branches, anomaly_logs

### 28. Forecasting
- **Purpose:** Predictive analytics for attendance/workforce
- **Backend:** forecast.controller.js, forecast.routes.js, forecast.service.js
- **Frontend:** ForecastCard.tsx
- **Database:** forecast_logs

### 29. Analytics & Insights
- **Purpose:** Executive analytics, anomaly trends, department comparison
- **Backend:** analytics.controller.js, analytics.routes.js, analytics.service.js
- **Frontend:** (integrated in dashboard)
- **Database:** attendance, leaves, employees, anomaly_logs, forecast_logs

### 30. Email Communication
- **Purpose:** SMTP configuration, email templates, sending
- **Backend:** smtp.controller.js, smtp.routes.js, smtp.service.js, emailTemplate.controller.js, emailTemplate.routes.js, emailTemplate.service.js, emailWrapper.service.js
- **Frontend:** SMTPSettings.tsx, EmailTemplateEditor.tsx
- **Database:** smtp_settings, email_templates, email_logs

### 31. My Benefits
- **Purpose:** Employee self-service benefits view
- **Backend:** (via payroll controller)
- **Frontend:** MyBenefitsPage.tsx
- **Database:** payroll, employee_salary

### 32. Profile
- **Purpose:** View own profile (read-only)
- **Backend:** profile.controller.js, profile.routes.js, profile.service.js
- **Frontend:** ProfilePage.tsx
- **Database:** employees, users

### 33. Help Documentation
- **Purpose:** Built-in user guides for all modules
- **Frontend:** DocsLayout.tsx + 13 doc pages
- **Database:** (none)

### 34. Legal Pages
- **Purpose:** Privacy, Terms, Security policy pages
- **Frontend:** PrivacyPage.tsx, TermsPage.tsx, SecurityPage.tsx
- **Database:** (none)

---

## SECTION 3 — ALL DATABASE TABLES

| # | Table Name | Purpose | Records | PK | FKs | Related Tables | Used By |
|---|-----------|---------|---------|----|-----|---------------|---------|
| 1 | users | System user accounts | 5 | id | employee_id → employees | employees, user_sessions, user_branch_access, notifications | Auth, User Management |
| 2 | employees | Employee master records | 5 | id | branch_id → branches | users, employee_salary, employee_deductions, attendance, leaves, overtime_requests, man_hour_reports, leave_credits, leave_conversions, payroll, employee_onboarding, employee_kpi_evaluations, time_modification_requests, final_pay | Employee Management |
| 3 | branches | Company branches | 2 | id | - | employees, payroll, calendar_days, user_branch_access, job_positions, anomaly_logs | Branch Management |
| 4 | employee_salary | Employee salary configuration | 0 | id | employee_id → employees | employees, payroll | Payroll |
| 5 | employee_deductions | Employee-specific deductions | 0 | id | employee_id → employees | employees, payroll | Payroll |
| 6 | attendance | Daily attendance records | 0 | id | employee_id → employees | employees, time_modification_requests | Attendance |
| 7 | attendance_rules | Configured attendance rules | 1 | id | - | - | Attendance Settings |
| 8 | time_modification_requests | Time correction requests | 0 | id | employee_id → employees, attendance_id → attendance | employees, attendance | Attendance |
| 9 | devices | Biometric device configuration | 1 | id | - | raw_logs | Device Integration |
| 10 | raw_logs | Raw device punch logs | 0 | id | device_id → devices | devices | Device Integration |
| 11 | leaves | Leave requests | 0 | id | employee_id → employees | employees, leave_credits, leave_types | Leave Management |
| 12 | leave_credits | Employee leave balances | 3 | id | employee_id → employees | employees, leaves | Leave Management |
| 13 | leave_types | Leave type definitions | 5 | id | - | leaves | Leave Management |
| 14 | employee_approvers | Leave/overtime/man-hour approvers mapping | 0 | id | employee_id + approver_id → employees | employees | Leave, Overtime, Man Hours |
| 15 | leave_conversions | Leave-to-cash conversions | 0 | id | employee_id → employees | employees, conversion_logs | Leave Conversion |
| 16 | conversion_logs | Conversion audit trail | 0 | id | - | leave_conversions | Leave Conversion |
| 17 | overtime_requests | Overtime work requests | 0 | id | employee_id → employees | employees, employee_approvers | Overtime |
| 18 | man_hour_reports | Daily man-hour report headers | 0 | id | employee_id → employees | employees, man_hour_report_details | Man Hours |
| 19 | man_hour_report_details | Man-hour time entries per report | 0 | id | report_id → man_hour_reports | man_hour_reports | Man Hours |
| 20 | payroll | Payroll records per employee per cutoff | 0 | id | employee_id → employees, branch_id → branches | employees, branches, employee_salary, employee_deductions | Payroll |
| 21 | payroll_settings | Payroll cutoff/pay-day configuration | 0 | id | - | - | Payroll Settings |
| 22 | pay_rules | Pay multipliers by day type | 4 | id | - | payroll | Pay Rules |
| 23 | final_pay | Final pay for resigned employees | 0 | id | employee_id → employees | employees | Final Pay |
| 24 | notifications | In-app notifications | 0 | id | user_id → users | users | Notifications |
| 25 | calendar_days | Holiday/event calendar entries | 1059 | id | - | branches | Calendar |
| 26 | hr_policy_documents | HR policy documents | 6 | id | - | - | HR Policies |
| 27 | hr_forms | Dynamic form definitions | 0 | id | - | hr_form_fields, hr_form_assignments | HR Forms |
| 28 | hr_form_fields | Form field definitions | 0 | id | form_id → hr_forms | hr_forms, hr_form_answers | HR Forms |
| 29 | hr_form_assignments | Form-to-employee assignments | 0 | id | form_id → hr_forms | hr_forms, hr_form_submissions | HR Forms |
| 30 | hr_form_submissions | Employee form submissions | 0 | id | assignment_id → hr_form_assignments | hr_form_assignments | HR Forms |
| 31 | hr_form_answers | Individual field answers | 0 | id | assignment_id → hr_form_assignments, field_id → hr_form_fields | hr_form_assignments, hr_form_fields | HR Forms |
| 32 | applicant_approvals | Applicant approval records | 0 | id | applicant_id → applicants | applicants | Recruitment |
| 33 | applicant_documents | Applicant uploaded documents | 0 | id | applicant_id → applicants | applicants | Recruitment |
| 34 | applicant_interviews | Interview records | 0 | id | applicant_id → applicants | applicants | Recruitment |
| 35 | applicant_requirements | Applicant requirement tracking | 0 | id | applicant_id → applicants | applicants | Recruitment |
| 36 | applicants | Job applicants | 0 | id | job_position_id → job_positions | job_positions | Recruitment |
| 37 | job_positions | Open job positions | 1 | id | branch_id → branches | branches, applicants | Recruitment |
| 38 | kpi_templates | KPI evaluation templates | 1 | id | - | kpi_template_items | KPI Management |
| 39 | kpi_template_items | Individual KPI items within templates | 1 | id | template_id → kpi_templates | kpi_templates | KPI Management |
| 40 | employee_kpi_evaluations | Employee KPI evaluation records | 0 | id | employee_id → employees | employees, employee_kpi_scores | KPI Management |
| 41 | employee_kpi_scores | Scores per KPI item | 0 | id | evaluation_id → employee_kpi_evaluations | employee_kpi_evaluations | KPI Management |
| 42 | employee_onboarding | Employee onboarding records | 0 | id | employee_id → employees | employees, employee_requirements | Onboarding |
| 43 | employee_requirements | Onboarding requirement checklist | 0 | id | onboarding_id → employee_onboarding | employee_onboarding | Onboarding |
| 44 | system_settings | System key-value settings | 18 | id | - | - | Settings |
| 45 | company_settings | Company branding info | 1 | id | - | - | Company Settings |
| 46 | smtp_settings | SMTP email configuration | 1 | id | - | - | Email |
| 47 | email_templates | Email notification templates | 7 | id | - | - | Email |
| 48 | email_logs | Email send audit log | 0 | id | - | - | Email |
| 49 | anomaly_logs | Detected anomaly records | 0 | id | - | - | Anomaly Detection |
| 50 | audit_logs | Data change audit trail | 35 | id | - | - | Audit |
| 51 | forecast_logs | Predictive forecast records | 0 | id | - | - | Forecasting |
| 52 | user_branch_access | User-to-branch assignments | 7 | id | user_id → users, branch_id → branches | users, branches | Branch Access |
| 53 | user_sessions | Active user sessions | 18 | id | user_id → users | users | Auth |
| 54 | approval_logs | Approval action audit | 0 | id | - | - | Approval Audit |

---

## SECTION 4 — ALL API ROUTES

### Auth Routes (`/api/auth`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | /login | auth.controller.login | loginLimiter | Public |
| POST | /verify-otp | auth.controller.verifyOTP | otpLimiter | Public |
| POST | /resend-otp | auth.controller.resendOTP | resendOtpLimiter | Public |
| POST | /forgot-password | auth.controller.forgotPassword | forgotPasswordLimiter | Public |
| POST | /reset-password | auth.controller.resetPassword | resetPasswordLimiter | Public |
| POST | /refresh | auth.controller.refresh | - | Public |
| POST | /logout | auth.controller.logout | authenticate | All Authenticated |
| PUT | /change-password | auth.controller.changePassword | authenticate | All Authenticated |

### Employee Routes (`/api/employees`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | / | employee.controller.createEmployee | auth, authorize | ADMIN |
| GET | / | employee.controller.getEmployees | auth, authorize, branchAccess | SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER |
| PUT | /:id | employee.controller.updateEmployee | auth, authorize, branchAccess | ADMIN |

### Leave Routes (`/api/leaves`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | / | leave.controller.createLeave | auth, authorize(ALL), validate | ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE |
| GET | /my | leave.controller.getMyLeaves | auth, authorize(ALL) | ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE |
| GET | / | leave.controller.getLeaves | auth, custom role/approver check | ADMIN, HR_USER, approvers |
| PUT | /:id/status | leave.controller.updateStatus | auth, custom approver check | ADMIN, HR_USER, employee_approvers |
| GET | /credits | leaveCreditController.getMyCredits | auth, authorize(ALL) | ALL |
| GET | /credits/all | leaveCreditController.getAllCredits | auth, authorize | ADMIN |
| GET | /credits/:employeeId | leaveCreditController.getEmployeeCredits | auth, authorize | ADMIN |
| PUT | /credits/:employeeId | leaveCreditController.updateCredits | auth, authorize | ADMIN |
| GET | /approvers | - | auth, custom approver check | ADMIN, HR_USER, employee_approvers |

### Attendance Routes (`/api/attendance`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | / | attendance.controller.createAttendance | auth, authorize | ADMIN |
| GET | / | attendance.controller.getAttendance | auth, authorize, branchAccess | ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE |
| GET | /:id | attendance.controller.getByEmployee | auth, authorize | ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE |
| POST | /time-requests | attendance.controller.createTimeModificationRequest | auth, authorize(ALL), validate | ALL |
| GET | /time-requests/my | attendance.controller.getMyTimeModificationRequests | auth, authorize(ALL) | ALL |
| GET | /time-requests | attendance.controller.getTimeModificationRequests | auth, authorize | ADMIN, HR_USER |
| PUT | /time-requests/:id/status | attendance.controller.updateTimeModificationStatus | auth, authorize(HR_ROLES), validate | ADMIN, HR_USER |

### Attendance Rules Routes (`/api/attendance-rules`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /active | attendance.controller.getRules | auth, authorize | SYSTEM_ADMIN, ADMIN |
| GET | / | attendance.controller.getAllRules | auth, authorize | SYSTEM_ADMIN, ADMIN |
| POST | / | attendance.controller.createRule | auth, authorize | SYSTEM_ADMIN, ADMIN |
| PUT | /:id/activate | attendance.controller.setActiveRule | auth, authorize | SYSTEM_ADMIN, ADMIN |
| DELETE | /:id | attendance.controller.deleteRule | auth, authorize | SYSTEM_ADMIN |
| PUT | /:id | attendance.controller.updateRule | auth, authorize | SYSTEM_ADMIN, ADMIN |

### Payroll Routes (`/api/payroll`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | /generate | payroll.controller.generatePayroll | auth, authorize, branchAccess | ADMIN, PAYROLL_USER |
| GET | / | payroll.controller.getPayroll | auth, authorize, branchAccess | ADMIN, PAYROLL_USER |
| GET | /summary | payroll.controller.getPayrollSummary | auth, authorize, branchAccess | ADMIN, PAYROLL_USER |
| GET | /my | payroll.controller.getMyPayroll | auth, authorize | ALL |
| GET | /my/benefits | payroll.controller.getMyBenefits | auth, authorize | ALL |
| GET | /my/salary | payroll.controller.getMySalaryDetails | auth, authorize | ALL |
| GET | /:id | payroll.controller.getPayrollById | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /:id/payslip | payroll.controller.downloadPayslip | auth, authorize | ADMIN, PAYROLL_USER, EMPLOYEE |
| PATCH | /:id/lock | payroll.controller.lockPayroll | auth, authorize | ADMIN, PAYROLL_USER |
| PATCH | /:id/unlock | payroll.controller.unlockPayroll | auth, authorize | ADMIN, PAYROLL_USER |
| PATCH | /:id/void | payroll.controller.voidPayroll | auth, authorize | ADMIN, PAYROLL_USER |
| PATCH | /:id/pay | payroll.controller.markAsPaid | auth, authorize, payrollLock | ADMIN, PAYROLL_USER |
| PATCH | /mark-all-paid | payroll.controller.markAllAsPaid | auth, authorize | ADMIN, PAYROLL_USER |
| DELETE | /delete-cutoff | payroll.controller.deletePayrollByCutoff | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /salary | payroll.controller.getEmployeeSalary | auth, authorize | ADMIN, PAYROLL_USER |
| PUT | /salary/:id | payroll.controller.updateEmployeeSalary | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /deductions/:employee_id | payroll.controller.getDeductions | auth, authorize | ADMIN, PAYROLL_USER |
| POST | /deductions | payroll.controller.createDeduction | auth, authorize | ADMIN, PAYROLL_USER |
| PUT | /deductions/:id | payroll.controller.updateDeduction | auth, authorize | ADMIN, PAYROLL_USER |
| DELETE | /deductions/:id | payroll.controller.deleteDeduction | auth, authorize | ADMIN, PAYROLL_USER |

### Overtime Routes (`/api/overtime`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /my | overtime.controller.getMyOvertime | auth, authorize(ALL) | ALL |
| POST | / | overtime.controller.createOvertime | auth, authorize(ALL) | ALL |
| GET | / | overtime.controller.getAllOvertime | auth, custom approver check | ADMIN, HR_USER, approvers |
| GET | /:id | overtime.controller.getOvertimeDetails | auth, custom check | ADMIN, HR_USER, owner, approvers |
| PUT | /:id/approve | overtime.controller.approveOvertime | auth, approveCheck | ADMIN, HR_USER, approvers |
| PUT | /:id/reject | overtime.controller.rejectOvertime | auth, approveCheck | ADMIN, HR_USER, approvers |
| GET | /approvers | overtime.controller.getApprovers | auth, authorize | ADMIN |
| POST | /approvers | overtime.controller.createApprover | auth, authorize | ADMIN |
| PUT | /approvers/:id | overtime.controller.updateApprover | auth, authorize | ADMIN |
| DELETE | /approvers/:id | overtime.controller.deleteApprover | auth, authorize | ADMIN |
| GET | /employees/list | overtime.controller.getEmployeesForDropdown | auth, authorize | ADMIN |
| GET | /is-approver | overtime.controller.isApprover | auth | All Authenticated |

### Man Hour Report Routes (`/api/man-hour-reports`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /my | man_hour.controller.getMyManHourReports | auth, authorize(ALL) | ALL |
| GET | /missing | man_hour.controller.getMissingManHourDates | auth, authorize(ALL) | ALL |
| POST | / | man_hour.controller.createManHourReport | auth, authorize(ALL) | ALL |
| PUT | /:id | man_hour.controller.updateManHourReport | auth, authorize(ALL) | ALL |
| DELETE | /:id | man_hour.controller.deleteManHourReport | auth, authorize(ALL) | ALL |
| GET | / | man_hour.controller.getAllManHourReports | auth, custom approver check | ADMIN, HR_USER, approvers |
| GET | /:id | man_hour.controller.getManHourReportDetails | auth, custom check | ADMIN, HR_USER, owner, approvers |
| PUT | /:id/approve | man_hour.controller.approveManHourReport | auth, approveCheck | ADMIN, HR_USER, approvers |
| PUT | /:id/reject | man_hour.controller.rejectManHourReport | auth, approveCheck | ADMIN, HR_USER, approvers |
| GET | /download | man_hour.controller.downloadManHourReports | auth, authorize | ADMIN, HR_USER |
| GET | /summary/range | man_hour.controller.getManHourSummary | auth, authorize | ADMIN, HR_USER |

### Calendar Routes (`/api/calendar`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | calendar.controller.getCalendar | auth, authorize(ALL) | ALL |
| GET | /:date | calendar.controller.getByDate | auth, authorize(ALL) | ALL |
| POST | / | calendar.controller.create | auth, authorize | ADMIN |
| PUT | /:id | calendar.controller.update | auth, authorize | ADMIN |
| DELETE | /:id | calendar.controller.remove | auth, authorize | ADMIN |
| POST | /bulk | calendar.bulk.controller.bulkUpload | auth, authorize(ADMIN), upload | ADMIN |
| GET | /bulk/template | calendar.bulk.controller.downloadTemplate | auth, authorize | ADMIN |

### Dashboard Routes (`/api/dashboard`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /summary | dashboard.controller.getSummary | auth, authorize | ADMIN |
| GET | /me/summary | dashboard.controller.getMySummary | auth, authorize(ALL) | ALL |
| GET | /me/today | dashboard.controller.getTodayStatus | auth, authorize(ALL) | ALL |
| GET | /analytics | dashboard.controller.getAdminAnalytics | auth, authorize | ADMIN |
| GET | /me/analytics | dashboard.controller.getMyAnalytics | auth, authorize(ALL) | ALL |
| GET | /kpis | dashboard.controller.getExecutiveKpis | auth, authorize | ADMIN |

### User Routes (`/api/users`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | user.controller.getUsers | auth, authorize | SYSTEM_ADMIN, ADMIN |
| GET | /available-employees | user.controller.getEmployeesWithoutAccounts | auth, authorize | SYSTEM_ADMIN, ADMIN |
| GET | /:id | user.controller.getUserById | auth, authorize | SYSTEM_ADMIN, ADMIN |
| POST | / | user.controller.createUser | auth, authorize | SYSTEM_ADMIN, ADMIN |
| PUT | /:id | user.controller.updateUser | auth, authorize | SYSTEM_ADMIN, ADMIN |
| DELETE | /:id | user.controller.deleteUser | auth, authorize | SYSTEM_ADMIN, ADMIN |
| GET | /employee/:employeeId | user.controller.getEmployeeName | auth, authorize | SYSTEM_ADMIN, ADMIN |

### Branch Routes (`/api/branches`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | branch.controller.getAll | auth, authorize | SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER |
| GET | /active | branch.controller.getActive | auth, authorize | SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER |
| GET | /:id | branch.controller.getById | auth, authorize | SYSTEM_ADMIN, ADMIN |
| POST | / | branch.controller.create | auth, authorize | SYSTEM_ADMIN, ADMIN |
| PUT | /:id | branch.controller.update | auth, authorize | SYSTEM_ADMIN, ADMIN |
| PATCH | /:id/status | branch.controller.setActive | auth, authorize | SYSTEM_ADMIN, ADMIN |

### Notification Routes (`/api/notifications`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | notification.controller.getMyNotifications | auth | All Authenticated |
| GET | /unread-count | notification.controller.getUnreadCount | auth | All Authenticated |
| PUT | /:id/read | notification.controller.markAsRead | auth | All Authenticated |
| PUT | /read-all | notification.controller.markAllAsRead | auth | All Authenticated |

### Setting Routes (`/api/settings`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | setting.controller.getAllSettings | auth, authorize | SYSTEM_ADMIN |
| GET | /:key | setting.controller.getSetting | auth, authorize | SYSTEM_ADMIN |
| PUT | /:key | setting.controller.updateSetting | auth, authorize | SYSTEM_ADMIN |
| POST | /:key/toggle | setting.controller.toggleSetting | auth, authorize | SYSTEM_ADMIN |

### Profile Routes (`/api/profile`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | profile.controller.getProfile | auth | All Authenticated |

### Device Routes (`/api/device`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | /logs | device.controller.receiveLogs | deviceAuth | Device API Key |

### SMTP Routes (`/api/smtp`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | smtp.controller.getSmtpSettings | auth, authorize | SYSTEM_ADMIN |
| GET | /all | smtp.controller.getAllSmtpSettings | auth, authorize | SYSTEM_ADMIN |
| POST | / | smtp.controller.createSmtpSettings | auth, authorize | SYSTEM_ADMIN |
| PUT | /:id | smtp.controller.updateSmtpSettings | auth, authorize | SYSTEM_ADMIN |
| DELETE | /:id | smtp.controller.deleteSmtpSettings | auth, authorize | SYSTEM_ADMIN |
| POST | /test | smtp.controller.testSmtpConnection | auth, authorize | SYSTEM_ADMIN |

### Email Template Routes (`/api/email-templates`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | emailTemplate.controller.getAllTemplates | auth, authorize | SYSTEM_ADMIN |
| GET | /:type | emailTemplate.controller.getTemplateByType | auth, authorize | SYSTEM_ADMIN |
| POST | / | emailTemplate.controller.upsertTemplate | auth, authorize | SYSTEM_ADMIN |
| PUT | /:id | emailTemplate.controller.updateTemplate | auth, authorize | SYSTEM_ADMIN |
| PATCH | /:id/toggle | emailTemplate.controller.toggleTemplate | auth, authorize | SYSTEM_ADMIN |
| DELETE | /:id | emailTemplate.controller.deleteTemplate | auth, authorize | SYSTEM_ADMIN |

### Final Pay Routes (`/api/final-pay`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /employees | finalPay.controller.getEmployeesForFinalPay | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /calculate/:employeeId | finalPay.controller.calculateFinalPay | auth, authorize | ADMIN, PAYROLL_USER |
| POST | /process/:employeeId | finalPay.controller.processFinalPay | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /history | finalPay.controller.getFinalPayHistory | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /:id | finalPay.controller.getFinalPayById | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /:id/download | finalPay.controller.downloadFinalPaySlip | auth, authorize | ADMIN, PAYROLL_USER |

### Pay Rules Routes (`/api/pay-rules`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /pay-rules | payRules.controller.getAllPayRules | auth, authorize | SYSTEM_ADMIN, ADMIN |
| GET | /pay-rules/:id | payRules.controller.getPayRuleById | auth, authorize | SYSTEM_ADMIN, ADMIN |
| POST | /pay-rules | payRules.controller.createPayRule | auth, authorize | SYSTEM_ADMIN, ADMIN |
| PUT | /pay-rules/:id | payRules.controller.updatePayRule | auth, authorize | SYSTEM_ADMIN, ADMIN |
| DELETE | /pay-rules/:id | payRules.controller.deletePayRule | auth, authorize | SYSTEM_ADMIN |
| GET | /calendar-days | payRules.controller.getCalendarDays | auth, authorize | SYSTEM_ADMIN, ADMIN |
| POST | /calendar-days | payRules.controller.upsertCalendarDay | auth, authorize | SYSTEM_ADMIN, ADMIN |
| DELETE | /calendar-days/:date | payRules.controller.deleteCalendarDay | auth, authorize | SYSTEM_ADMIN |

### Leave Conversion Routes (`/api/leave-conversion`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /types | leaveConversion.controller.getLeaveTypes | auth, authorize | ADMIN |
| PUT | /types/:id | leaveConversion.controller.updateLeaveType | auth, authorize | ADMIN |
| GET | /settings | leaveConversion.controller.getSettings | auth, authorize | ADMIN |
| PUT | /settings | leaveConversion.controller.updateSettings | auth, authorize | ADMIN |
| POST | /save-all | leaveConversion.controller.saveAll | auth, authorize | ADMIN |
| POST | /trigger-year-end | leaveConversion.controller.triggerYearEndConversion | auth, authorize | ADMIN |
| POST | /resignation/:employee_id | leaveConversion.controller.processResignationConversion | auth, authorize | ADMIN |
| GET | /payroll-amount/:employee_id | leaveConversion.controller.getPayrollAmount | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /history/:employee_id | leaveConversion.controller.getConversionHistory | auth, authorize | ADMIN, HR_USER |
| GET | /year/:year | leaveConversion.controller.getConversionsByYear | auth, authorize | ADMIN |
| GET | /stats | leaveConversion.controller.getConversionStats | auth, authorize | ADMIN |
| DELETE | /:employee_id/:year/:leave_type | leaveConversion.controller.deleteConversion | auth, authorize | ADMIN |
| GET | /employee/:employee_id | leaveConversion.controller.getHistoryLeaveEmployeeSummary | auth, authorize | ALL |

### History Leave Routes (`/api/history-leave`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | historyLeave.controller.getAll | auth, authorize | ADMIN |
| GET | /summary | historyLeave.controller.getSummary | auth, authorize | ADMIN |
| GET | /yearly-summary | historyLeave.controller.getYearlySummary | auth, authorize | ADMIN |
| GET | /available-years | historyLeave.controller.getAvailableYears | auth, authorize | ADMIN |
| GET | /employee/:employee_id | historyLeave.controller.getEmployeeSummary | auth, authorize | ADMIN |

### Report Routes (`/api/reports`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /employees | report.controller.getEmployeeReport | auth, authorize | ADMIN, HR_USER |
| GET | /leaves | report.controller.getLeaveReport | auth, authorize | ADMIN, HR_USER |
| GET | /attendance | report.controller.getAttendanceReport | auth, authorize | ADMIN, HR_USER |
| GET | /payroll | report.controller.getPayrollReport | auth, authorize | ADMIN, PAYROLL_USER |
| GET | /benefits | report.controller.getBenefitsReport | auth, authorize | ADMIN, HR_USER |
| GET | /performance | report.controller.getPerformanceReport | auth, authorize | ADMIN, HR_USER |
| GET | /export | report.controller.exportReport | auth, authorize | SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER |

### Anomaly Routes (`/api/anomalies`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | anomaly.controller.getAnomalies | auth, authorize | ADMIN, HR_USER |
| GET | /summary | anomaly.controller.getAnomalySummary | auth, authorize | ADMIN, HR_USER |
| GET | /:id | anomaly.controller.getAnomalyById | auth, authorize | ADMIN, HR_USER |
| PATCH | /:id/status | anomaly.controller.updateAnomalyStatus | auth, authorize | ADMIN, HR_USER |
| POST | /scan/daily | anomaly.controller.runDailyScan | auth, authorize | ADMIN |
| POST | /scan/weekly | anomaly.controller.runWeeklyScan | auth, authorize | ADMIN |

### Drill-down Routes (`/api/drilldown`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /attendance | drilldown.controller.getAttendance | auth, authorize | ADMIN, HR_USER |
| GET | /payroll | drilldown.controller.getPayroll | auth, authorize | ADMIN, HR_USER |
| GET | /overtime | drilldown.controller.getOvertime | auth, authorize | ADMIN, HR_USER |
| GET | /leaves | drilldown.controller.getLeaves | auth, authorize | ADMIN, HR_USER |
| GET | /anomalies | drilldown.controller.getAnomalies | auth, authorize | ADMIN, HR_USER |
| GET | /branches | drilldown.controller.getBranches | auth, authorize | ADMIN, HR_USER |
| GET | /export | drilldown.controller.exportDrillDown | auth, authorize | ADMIN, HR_USER |

### Forecast Routes (`/api/forecast`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | /generate | forecast.controller.generateForecasts | auth, authorize | ADMIN |
| GET | /history | forecast.controller.getHistory | auth, authorize | ADMIN, HR_USER |
| GET | /latest | forecast.controller.getLatest | auth, authorize | ADMIN, HR_USER |
| GET | /accuracy | forecast.controller.getAccuracy | auth, authorize | ADMIN, HR_USER |
| PATCH | /:id/actual | forecast.controller.updateActual | auth, authorize | ADMIN |

### Statistical Anomaly Routes (`/api/stats-anomaly`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| POST | /scan/daily | statAnomaly.controller.runDailyScan | auth, authorize | ADMIN |
| POST | /scan/weekly | statAnomaly.controller.runWeeklyScan | auth, authorize | ADMIN |

### Analytics Routes (`/api/analytics`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /overview | analytics.controller.getOverview | auth, authorize | ADMIN, HR_USER |
| GET | /anomaly-trend | analytics.controller.getAnomalyTrend | auth, authorize | ADMIN, HR_USER |
| GET | /forecast-summary | analytics.controller.getForecastSummary | auth, authorize | ADMIN, HR_USER |
| GET | /department-comparison | analytics.controller.getDepartmentComparison | auth, authorize | ADMIN, HR_USER |

### HR Policy Routes (`/api/hr-policies`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | hrPolicy.controller.getAll | auth, authorize(ALL) | ALL |
| GET | /:id | hrPolicy.controller.getById | auth, authorize(ALL) | ALL |
| POST | / | hrPolicy.controller.create | auth, authorize | ADMIN |
| PUT | /:id | hrPolicy.controller.update | auth, authorize | ADMIN |
| DELETE | /:id | hrPolicy.controller.remove | auth, authorize | ADMIN |
| PATCH | /:id/status | hrPolicy.controller.setActive | auth, authorize | ADMIN |

### Job Position Routes (`/api/job-positions`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /active | jobPosition.controller.getAllActive | auth, authorize | ADMIN, HR_USER |
| GET | / | jobPosition.controller.getAll | auth, authorize | ADMIN, HR_USER |
| GET | /:id | jobPosition.controller.getById | auth, authorize | ADMIN, HR_USER |
| POST | / | jobPosition.controller.create | auth, authorize | ADMIN |
| PUT | /:id | jobPosition.controller.update | auth, authorize | ADMIN |
| DELETE | /:id | jobPosition.controller.remove | auth, authorize | ADMIN |

### Applicant Routes (`/api/applicants`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | applicant.controller.getAll | auth, authorize | ADMIN, HR_USER |
| GET | /:id | applicant.controller.getById | auth, authorize | ADMIN, HR_USER |
| POST | / | applicant.controller.create | auth, authorize | ADMIN, HR_USER |
| PUT | /:id | applicant.controller.update | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id | applicant.controller.remove | auth, authorize | ADMIN |
| PATCH | /:id/status | applicant.controller.updateStatus | auth, authorize | ADMIN, HR_USER |
| POST | /:id/convert | applicant.controller.convertToEmployee | auth, authorize | ADMIN |

### Applicant Sub-routes (mounted under `/api/applicants`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /:id/requirements | applicantRequirement.getByApplicantId | auth, authorize | ADMIN, HR_USER |
| POST | /:id/requirements | applicantRequirement.create | auth, authorize | ADMIN, HR_USER |
| PATCH | /:id/requirements/:reqId | applicantRequirement.update | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id/requirements/:reqId | applicantRequirement.remove | auth, authorize | ADMIN |
| GET | /:applicantId (approvals) | applicantApproval.getByApplicantId | auth, authorize | ADMIN, HR_USER |
| POST | /:applicantId (approvals) | applicantApproval.create | auth, authorize | ADMIN, HR_USER |
| PUT | /:id (approvals) | applicantApproval.update | auth, authorize | ADMIN |
| GET | /:applicantId (documents) | applicantDocument.getByApplicantId | auth, authorize | ADMIN, HR_USER |
| POST | /:applicantId (documents) | applicantDocument.create | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id (documents) | applicantDocument.remove | auth, authorize | ADMIN |
| GET | /:applicantId (interviews) | applicantInterview.getByApplicantId | auth, authorize | ADMIN, HR_USER |
| POST | /:applicantId (interviews) | applicantInterview.create | auth, authorize | ADMIN, HR_USER |
| PUT | /:id (interviews) | applicantInterview.update | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id (interviews) | applicantInterview.remove | auth, authorize | ADMIN |

### KPI Template Routes (`/api/kpi/templates`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /active | kpiTemplate.controller.getActiveTemplates | auth | All Authenticated |
| GET | / | kpiTemplate.controller.getAll | auth, authorize | ADMIN, HR_USER |
| GET | /:id | kpiTemplate.controller.getById | auth, authorize | ADMIN, HR_USER |
| POST | / | kpiTemplate.controller.create | auth, authorize | ADMIN, HR_USER |
| PUT | /:id | kpiTemplate.controller.update | auth, authorize | ADMIN, HR_USER |
| PATCH | /:id/toggle | kpiTemplate.controller.toggleActive | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id | kpiTemplate.controller.remove | auth, authorize | ADMIN, HR_USER |
| GET | /:templateId/items | kpiTemplate.controller.getItems | auth | All Authenticated |
| POST | /:templateId/items | kpiTemplate.controller.addItem | auth, authorize | ADMIN, HR_USER |
| PUT | /items/:itemId | kpiTemplate.controller.editItem | auth, authorize | ADMIN, HR_USER |
| DELETE | /items/:itemId | kpiTemplate.controller.removeItem | auth, authorize | ADMIN, HR_USER |

### KPI Evaluation Routes (`/api/kpi/evaluations`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /my-evaluations | kpiEvaluation.controller.getMyEvaluations | auth | All Authenticated (with employee_id) |
| GET | /my-assignments | kpiEvaluation.controller.getMyAssignments | auth | All Authenticated |
| GET | /pending-count | kpiEvaluation.controller.getPendingCount | auth | All Authenticated |
| GET | /history | kpiEvaluation.controller.getHistory | auth | All Authenticated |
| GET | /hr-view | kpiEvaluation.controller.getHrView | auth, authorize | ADMIN, HR_USER |
| POST | /assign | kpiEvaluation.controller.assign | auth, authorize | ADMIN, HR_USER |
| POST | /bulk-assign | kpiEvaluation.controller.bulkAssign | auth, authorize | ADMIN, HR_USER |
| GET | /:id | kpiEvaluation.controller.getById | auth | All Authenticated (owner/evaluator) |
| POST | /:id/scores | kpiEvaluation.controller.saveScores | auth | Authenticated evaluator |
| POST | /:id/submit | kpiEvaluation.controller.submit | auth | Authenticated evaluator |
| POST | /:id/self-evaluation | kpiEvaluation.controller.saveSelfEvaluation | auth | All Authenticated (with employee_id) |
| POST | /:id/approve | kpiEvaluation.controller.hrApprove | auth, authorize | ADMIN, HR_USER |
| POST | /:id/reject | kpiEvaluation.controller.hrReject | auth, authorize | ADMIN, HR_USER |

### HR Form Routes (`/api/hr-forms`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /my-assignments | hrForm.controller.getMyAssignments | auth | All Authenticated |
| GET | /assignments/all | hrForm.controller.getAllAssignments | auth, authorize | ADMIN, HR_USER |
| GET | /assignments/:assignmentId | hrForm.controller.getAssignmentById | auth | All Authenticated |
| POST | /assignments/:assignmentId/submit | hrForm.controller.submitForm | auth | All Authenticated |
| GET | /submissions/all | hrForm.controller.getSubmissions | auth, authorize | ADMIN, HR_USER |
| GET | /submissions/:submissionId | hrForm.controller.getSubmissionById | auth | Authenticated owner |
| PATCH | /submissions/:submissionId/review | hrForm.controller.reviewSubmission | auth, authorize | ADMIN, HR_USER |
| GET | / | hrForm.controller.getAllForms | auth, authorize | ADMIN, HR_USER |
| POST | / | hrForm.controller.createForm | auth, authorize | ADMIN, HR_USER |
| GET | /:formId/fields | hrForm.controller.getFields | auth, authorize | ADMIN, HR_USER |
| POST | /:formId/fields | hrForm.controller.addField | auth, authorize | ADMIN, HR_USER |
| PUT | /fields/:fieldId | hrForm.controller.editField | auth, authorize | ADMIN, HR_USER |
| DELETE | /fields/:fieldId | hrForm.controller.removeField | auth, authorize | ADMIN, HR_USER |
| GET | /:id | hrForm.controller.getFormById | auth | All Authenticated |
| PATCH | /:id | hrForm.controller.updateForm | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id | hrForm.controller.deleteForm | auth, authorize | ADMIN, HR_USER |
| POST | /:id/assign | hrForm.controller.assignForm | auth, authorize | ADMIN, HR_USER |

### Employee Performance Routes (`/api/employee/performance`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /summary | employeePerformance.controller.getSummary | auth, authorize(ALL) | ALL |
| GET | /probation | employeePerformance.controller.getProbationInfo | auth, authorize(ALL) | ALL |

### Employee Onboarding Routes (`/api/employee-onboarding`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | / | employeeOnboarding.controller.getAll | auth, authorize | ADMIN, HR_USER |
| GET | /:id | employeeOnboarding.controller.getById | auth, authorize | ADMIN, HR_USER |
| POST | / | employeeOnboarding.controller.create | auth, authorize | ADMIN, HR_USER |
| PUT | /:id | employeeOnboarding.controller.update | auth, authorize | ADMIN, HR_USER |

### Employee Requirement Routes (`/api/employee-onboarding/:onboardingId/requirements`)
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /:onboardingId | employeeRequirement.getByOnboardingId | auth, authorize | ADMIN, HR_USER |
| POST | /:onboardingId | employeeRequirement.create | auth, authorize | ADMIN, HR_USER |
| PUT | /:id | employeeRequirement.update | auth, authorize | ADMIN, HR_USER |
| DELETE | /:id | employeeRequirement.remove | auth, authorize | ADMIN |

### Queue Status Route
| Method | Route | Controller | Middleware | Roles |
|--------|-------|-----------|-----------|-------|
| GET | /api/queue/status | payroll.controller.getQueueStatus | auth, authorize | ADMIN |

---

## SECTION 5 — COMPLETE ROLE MATRIX

| Functionality | SYSTEM_ADMIN | ADMIN | HR_USER | PAYROLL_USER | EMPLOYEE |
|--------------|:------------:|:-----:|:-------:|:------------:|:--------:|
| **Authentication** | Full | Full | Full | Full | Full |
| **Employee Management** | Read | Full | No Access | No Access | No Access |
| **Attendance View** | No Access (inferred) | Full | Full | Full | Own Only |
| **Attendance Time Requests** | No Access | Full | Full | Own Only | Own Only |
| **Leave Requests** | No Access | Full | Full | Own Only | Own Only |
| **Leave Approval** | No Access | Full | Full | No Access | No Access (unless approver) |
| **Leave Credits Mgmt** | No Access | Full | No Access | No Access | Own Only |
| **Leave Conversion** | No Access | Full | Read | Read (payroll amount) | No Access |
| **Overtime Requests** | No Access | Full | Full | Own Only | Own Only |
| **Overtime Approval** | No Access | Full | Full | No Access | No Access (unless approver) |
| **Man Hour Report** | No Access | Full | Full | Own Only | Own Only |
| **Man Hour Approval** | No Access | Full | Full | No Access | No Access (unless approver) |
| **Payroll Management** | No Access | Full | No Access | Full | No Access |
| **Payroll View** | No Access | Full | No Access | Full | Own Only |
| **Final Pay** | No Access | Full | No Access | Full | No Access |
| **Pay Rules** | Full | Full | No Access | No Access | No Access |
| **Attendance Rules** | Full | Full | No Access | No Access | No Access |
| **Calendar Management** | No Access | Full | No Access | No Access | View Only |
| **Dashboard Analytics** | No Access | Full | View Only | View Only | Own Only |
| **Branch Management** | Full | Full | Read Only | Read Only | No Access |
| **User/Account Mgmt** | Full | Full | No Access | No Access | No Access |
| **Settings** | Full | System Admin only | No Access | No Access | No Access |
| **SMTP Config** | Full | No Access | No Access | No Access | No Access |
| **Email Templates** | Full | No Access | No Access | No Access | No Access |
| **HR Policies** | Full | Full | View Only | View Only | View Only |
| **HR Forms (admin)** | No Access | Full | Full | No Access | No Access |
| **HR Forms (fill)** | No Access | No Access | No Access | No Access | Own Only |
| **Recruitment** | No Access | Full | Full | No Access | No Access |
| **KPI Templates** | No Access | Full | Full | No Access | No Access |
| **KPI Evaluations (admin)** | No Access | Full | Full | No Access | No Access |
| **KPI Self-Evaluations** | No Access | No Access | No Access | No Access | Own Only |
| **KPI Evaluator** | No Access | If assigned | If assigned | If assigned | If assigned |
| **Employee Performance** | Own Only | Own Only | Own Only | Own Only | Own Only |
| **Probation Status** | Own Only | Own Only | Own Only | Own Only | Own Only |
| **Reports** | Full | Full | Full | Payroll Only | No Access |
| **Anomaly Detection** | No Access | Full | Full | No Access | No Access |
| **Drill-down Analytics** | No Access | Full | Full | No Access | No Access |
| **Forecasting** | No Access | Full | View Only | No Access | No Access |
| **Analytics Overview** | No Access | Full | Full | No Access | No Access |
| **Notifications** | Full | Full | Full | Full | Full |
| **My Benefits** | Own Only | Own Only | Own Only | Own Only | Own Only |
| **Profile** | Own Only | Own Only | Own Only | Own Only | Own Only |
| **Employee Onboarding** | No Access | Full | Full | No Access | No Access |
| **Device Management** | No Access | Full | No Access | No Access | No Access |
| **Leave Types/Settings** | No Access | Full | No Access | No Access | No Access |

**Key:**
- **Full** = Create, Read, Update, Delete
- **Read** = View only
- **Own Only** = Only their own data
- **No Access** = Not available
- **If assigned** = Based on evaluator/approver assignments
- **Unless approver** = If added as approver in employee_approvers table

---

## SECTION 6 — FRONTEND PAGE INVENTORY

| # | Page Name | Route Path | Component File | Menu Location | Accessible Roles |
|---|----------|-----------|---------------|--------------|-----------------|
| 1 | Login | /login | features/auth/pages/Login.tsx | Public | Public |
| 2 | Dashboard | /dashboard | features/dashboard/pages/Dashboard.tsx | Sidebar → Dashboard | ALL |
| 3 | Attendance | /attendance | features/attendance/pages/AttendancePage.tsx | Sidebar → Attendance | ALL |
| 4 | Anomalies | /anomalies | features/anomalies/pages/AnomalyPage.tsx | Sidebar → Anomalies | ADMIN, HR_USER |
| 5 | HR Policies | /hr-policies | pages/HRPolicies.tsx | Sidebar → HR Policies | ALL |
| 6 | Manage/My Leaves | /leaves | features/leaves/pages/AdminLeavePage.tsx or LeavePage.tsx | Sidebar → Leaves | ALL (different views) |
| 7 | Leave Credits | /leave-credits | (redirects to /leaves) | - | ADMIN |
| 8 | Payroll | /payroll | features/payroll/pages/PayRollPage.tsx or EmployeePayrollPage.tsx | Sidebar → Payroll | ALL (different views) |
| 9 | Payroll Details | /payroll/details/:id | features/payroll/pages/PayrollDetails.tsx | From Payroll page | ADMIN, PAYROLL_USER |
| 10 | My Benefits | /my-benefits | features/benefits/pages/MyBenefitsPage.tsx | Sidebar → My Benefits | ALL |
| 11 | Reports | /reports | features/reports/pages/ReportsPage.tsx | Sidebar → Reports | ADMIN, HR_USER |
| 12 | Calendar | /calendar | features/calendar/pages/Calendar.tsx | Sidebar → Calendar | ALL |
| 13 | Settings | /settings | features/settings/pages/Setting.tsx | Sidebar → Settings | SYSTEM_ADMIN, ADMIN |
| 14 | My Overtime | /myovertime | features/overtime/pages/MyOvertime.tsx | Sidebar → Overtime → My Overtime | ALL |
| 15 | Manage Overtime | /overtime | features/overtime/pages/OvertimeRequests.tsx | Sidebar → Overtime → Manage Overtime | Approvers |
| 16 | Accounts | /users | features/users/pages/Users.tsx | Sidebar → Accounts | SYSTEM_ADMIN, ADMIN |
| 17 | Branches | /branches | features/branches/pages/BranchesPage.tsx | Sidebar → Branches | SYSTEM_ADMIN, ADMIN |
| 18 | Profile | /profile | features/profile/pages/ProfilePage.tsx | Top-right profile | ALL |
| 19 | Notifications | /notifications | features/notifications/pages/NotificationsPage.tsx | Top nav bell icon | ALL |
| 20 | My Man Hours | /my-manhours | features/man-hour-reports/pages/MyManHoursReport.tsx | Sidebar → Man Hours → My Man Hours | ALL |
| 21 | Approve Man Hours | /manhours-approval | features/man-hour-reports/pages/ManHoursApproval.tsx | Sidebar → Man Hours → Approve | Approvers |
| 22 | Job Positions | /recruitment/job-positions | features/recruitment/pages/JobPositionsPage.tsx | Sidebar → Recruitment → Job Positions | ADMIN, HR_USER |
| 23 | Applicants | /recruitment/applicants | features/recruitment/pages/ApplicantsPage.tsx | Sidebar → Recruitment → Applicants | ADMIN, HR_USER |
| 24 | New Applicant | /recruitment/applicants/new | features/recruitment/pages/ApplicantFormPage.tsx | From Applicants page | ADMIN, HR_USER |
| 25 | Applicant Detail | /recruitment/applicants/:id | features/recruitment/pages/ApplicantDetailPage.tsx | From Applicants page | ADMIN, HR_USER |
| 26 | KPI Templates | /kpi/templates | features/kpi/pages/KpiTemplatesPage.tsx | Sidebar → Performance → KPI Templates | ADMIN, HR_USER |
| 27 | KPI Evaluations | /kpi/evaluations | features/kpi/pages/KpiEvaluationPage.tsx | Sidebar → Performance → KPI Evaluations | ADMIN, HR_USER |
| 28 | My KPI Evaluations | /kpi/my-evaluations | features/kpi/pages/EmployeeEvaluationPage.tsx | Sidebar → Evaluator → Evaluations | Evaluators |
| 29 | Self Evaluation | /kpi/self-evaluation | features/kpi/pages/SelfEvaluationPage.tsx | From evaluation page | Employees |
| 30 | My Performance | /my-performance | features/performance/pages/MyPerformancePage.tsx | From employee KPI menu | Employees |
| 31 | My KPI Results | /my-performance/kpi-results | features/performance/pages/MyKpiResultsPage.tsx | Sidebar → Employee KPI → My KPI Results | Employees |
| 32 | My Probation | /my-performance/probation | features/performance/pages/MyProbationStatusPage.tsx | Sidebar → Employee KPI → My Probation | Employees |
| 33 | HR Forms | /hr-forms | features/hr-forms/pages/HrFormsPage.tsx | Sidebar → Forms → Form Templates | ADMIN, HR_USER |
| 34 | Form Builder | /hr-forms/:id/builder | features/hr-forms/pages/HrFormBuilderPage.tsx | From HR Forms page | ADMIN, HR_USER |
| 35 | Form Assignments | /hr-forms/assignments | features/hr-forms/pages/HrFormAssignmentsPage.tsx | Sidebar → Forms → Assign Forms | ADMIN, HR_USER |
| 36 | Form Submissions | /hr-forms/submissions | features/hr-forms/pages/HrFormSubmissionsPage.tsx | Sidebar → Forms → Form Submissions | ADMIN, HR_USER |
| 37 | Submission Detail | /hr-forms/submissions/:submissionId | features/hr-forms/pages/HrFormSubmissionViewPage.tsx | From submissions page | ADMIN, HR_USER |
| 38 | My Forms | /my-forms | features/hr-forms/pages/MyFormsPage.tsx | Sidebar → Employee KPI → My Forms | Employees |
| 39 | Fill Form | /my-forms/:assignmentId | features/hr-forms/pages/MyFormFillPage.tsx | From My Forms page | Employees |
| 40 | Employees List | /employees | features/employees/pages/EmployeeList.tsx | Sidebar → Employees | ADMIN, HR_USER, PAYROLL_USER |

**Legal/Doc Pages (Public or accessible without layout):**
| 41 | Privacy Policy | /privacy | features/legal/pages/PrivacyPage.tsx | Footer | Public |
| 42 | Terms of Service | /terms | features/legal/pages/TermsPage.tsx | Footer | Public |
| 43 | Security | /security | features/legal/pages/SecurityPage.tsx | Footer | Public |
| 44-56 | Help Docs (13 pages) | /docs/* | features/docs/pages/ | Footer | Public |

---

## SECTION 7 — SIDEBAR MENU INVENTORY

### SYSTEM_ADMIN Menu
```
Dashboard (ALL)
Attendance (ALL)
Anomalies (ADMIN, HR_USER)
HR Policies (ALL)
My Leaves / Manage Leaves (ALL)
  Performance (ADMIN, HR_USER)
    ├─ KPI Templates
    └─ KPI Evaluations
  Forms (ADMIN, HR_USER)
    ├─ Form Templates
    ├─ Assign Forms
    └─ Form Submissions
  Overtime
    ├─ My Overtime
    └─ Manage Overtime (if approver)
  Man Hours
    ├─ My Man Hours
    └─ Approve Man Hours (if approver)
Employees (ADMIN, HR_USER, PAYROLL_USER)
  Recruitment (ADMIN, HR_USER)
    ├─ Job Positions
    └─ Applicants
Reports (ADMIN, HR_USER)
Payroll (ALL)
My Benefits (ALL)
Calendar (ALL)
Accounts (SYSTEM_ADMIN, ADMIN)
Branches (SYSTEM_ADMIN, ADMIN)
Settings (SYSTEM_ADMIN, ADMIN)
```

### ADMIN Menu
```
Dashboard
Attendance
Anomalies
HR Policies
Manage Leaves (since canApprove = true)
  Performance
    ├─ KPI Templates
    └─ KPI Evaluations
  Forms
    ├─ Form Templates
    ├─ Assign Forms
    └─ Form Submissions
  Overtime
    ├─ My Overtime
    └─ Manage Overtime
  Man Hours
    ├─ My Man Hours
    └─ Approve Man Hours
Employees
  Recruitment
    ├─ Job Positions
    └─ Applicants
Reports
Payroll
My Benefits
Calendar
Accounts
Branches
Settings
```

### HR_USER Menu
```
Dashboard
Attendance
Anomalies
HR Policies
Manage Leaves (since role is HR_USER)
  Performance
    ├─ KPI Templates
    └─ KPI Evaluations
  Forms
    ├─ Form Templates
    ├─ Assign Forms
    └─ Form Submissions
  Overtime
    ├─ My Overtime
    └─ Manage Overtime
  Man Hours
    ├─ My Man Hours
    └─ Approve Man Hours
Employees
  Recruitment
    ├─ Job Positions
    └─ Applicants
Reports
Payroll
My Benefits
Calendar
```

### PAYROLL_USER Menu
```
Dashboard
Attendance
HR Policies
My Leaves
  Overtime
    ├─ My Overtime
    └─ (no manage — not approver)
  Man Hours
    ├─ My Man Hours
    └─ (no approve — not approver)
Employees
Payroll
My Benefits
Calendar
```

### EMPLOYEE Menu
```
Dashboard
Attendance
HR Policies
My Leaves (since canApprove = false, isRegularEmployee = true)
  Overtime
    ├─ My Overtime
    └─ Manage Overtime (if approver)
  Man Hours
    ├─ My Man Hours
    └─ Approve Man Hours (if approver)
  Employee KPI (if employee_id exists)
    ├─ My KPI Results
    ├─ My Probation Status
    └─ My Forms
  Evaluator (if has evaluator assignments)
    └─ Evaluations Page
Payroll
My Benefits
Calendar
```

---

## SECTION 8 — APPROVAL WORKFLOW INVENTORY

### 1. Leave Approval Workflow
**Table:** `employee_approvers` (fields: employee_id, approver_id, approval_type)
- **approval_type values:** 'LEAVE', 'OVERTIME', 'MAN_HOUR', 'ALL'
- **Who can approve:** ADMIN, HR_USER, or any user listed as approver in `employee_approvers` with type 'LEAVE' or 'ALL'
- **Flow:** Employee submits leave → approver(s) receive notification → approver approves/rejects via PUT `/api/leaves/:id/status`
- **Authorization:** Custom middleware checks if user is ADMIN, HR_USER, or assigned as leave approver for the leave's employee
- **Statuses:** PENDING → APPROVED / REJECTED
- **Leave types:** SICK, ANNUAL, MATERNITY, EMERGENCY, NO_PAY (with half-day support: MORNING/AFTERNOON)

### 2. Overtime Approval Workflow
**Table:** `employee_approvers` (approval_type: 'OVERTIME' or 'ALL')
**Table:** `overtime_requests` (status, approved_by, rejected_by, rejection_reason)
- **Who can approve:** ADMIN, HR_USER, or any user listed as approver
- **Flow:** Employee submits overtime → approver sees in Manage Overtime → approves/rejects via PUT `/api/overtime/:id/approve` or `/reject`
- **Authorization:** Custom middleware `approveCheck` verifies approver status
- **Additional:** Over-time can be marked as paid, linked to payroll

### 3. Man Hour Approval Workflow
**Table:** `employee_approvers` (approval_type: 'MAN_HOUR' or 'ALL')
**Table:** `man_hour_reports` (employee_id, work_date, task, hours, status)
**Table:** `man_hour_report_details` (time_from, time_to, activity)
- **Who can approve:** ADMIN, HR_USER, or any user listed as approver with type 'MAN_HOUR' or 'ALL'
- **Flow:** Employee submits daily report → approver reviews in Approve Man Hours → approves/rejects
- **Authorization:** Same pattern as Overtime

### 4. Recruitment Approval Workflow
**Table:** `applicant_approvals`
- **Who can manage:** ADMIN, HR_USER (create/view), ADMIN (update)
- **Flow:** Applicant receives approval entries tracking hiring stages
- **Conversion:** ADMIN can convert applicant to employee via POST `/:id/convert`

### 5. KPI Evaluation Approval Workflow
**Table:** `employee_kpi_evaluations` (status, evaluator_id)
- **Flow:** Admin/HR assigns evaluators → evaluator scores → HR approves/rejects
- **Who can approve/reject:** ADMIN, HR_USER
- **Self-evaluation:** Employees can submit self-evaluations

### 6. Time Modification Request Flow
**Table:** `time_modification_requests` (status, reviewed_by)
- **Who can create:** ALL roles
- **Who can approve:** ADMIN, HR_USER

### 7. Branch Access Control
**Table:** `user_branch_access` (user_id, branch_id)
- HR_USER is restricted to assigned branches
- SYSTEM_ADMIN and ADMIN have full branch access
- EMPLOYEE and PAYROLL_USER cannot use branch filtering

---

## SECTION 9 — SECURITY AUDIT

### Findings:

#### Strengths:
1. **JWT Authentication**: All protected routes require Bearer token via `auth.middleware.js`
2. **JWT Blacklisting**: `tokenBlacklist.service.js` prevents reuse of revoked tokens
3. **Role-based Authorization**: `role.middleware.js` enforces role checks on all admin routes
4. **Rate Limiting**: 5 different rate limiters for auth endpoints (login, OTP, password reset)
5. **Device API Key**: `deviceAuth.middleware.js` for biometric device authentication
6. **Payroll Lock**: `payrollLock.middleware.js` prevents modification of locked/paid payrolls
7. **Branch Scoping**: HR_USER data is scoped to assigned branches via `branchAccess.middleware.js`
8. **Input Validation**: Joi schemas used for leave creation, time modification requests
9. **Session Management**: Refresh token rotation, session tracking in `user_sessions` table
10. **Audit Logging**: `audit_logs` table tracks data changes

#### Potential Issues:
1. **No Refresh Token Rotation on Login**: Refresh token stored but rotation mechanism may need review
2. **Frontend-only Route Protection**: Some pages (e.g., /branches, /settings) use conditional rendering but backend still has protection
3. **Password Reset**: SMS/email OTP verification present but implementation depends on SMTP configuration
4. **File Upload**: Only calendar bulk upload has multer; applicant documents may need file validation
5. **CORS Configuration**: Limited to localhost:5173 and 192.168.1.8:5173 — production-ready CORS needed
6. **No CSRF Protection**: Not implemented (REST API with JWT, risk depends on deployment)
7. **No API Request Logging Middleware for Sensitive Routes**: Logger exists but may need enhancement for PCI compliance
8. **EMPLOYEE role has broad access**: Can view all attendance (not just own) — GET /api/attendance allows EMPLOYEE to view all attendance records (potential data leak)
9. **Missing proper authorization on some routes**: GET /api/attendance allows EMPLOYEE role to view *all* attendance, not just own

---

## SECTION 10 — SYSTEM STATISTICS

| Metric | Count |
|--------|:-----:|
| **Frontend Pages (distinct)** | 56 |
| **Backend API Routes** | 190+ |
| **Controllers** | 42 |
| **Services (Backend)** | 49 |
| **Services (Frontend)** | 42 |
| **Models** | 38 |
| **Middlewares** | 10 |
| **Database Tables** | 54 |
| **Database Indexes** | 159 |
| **Distinct Functionalities** | 34 |
| **User Roles** | 5 |
| **Route Files** | 41 |
| **Utils** | 11 |
| **UI Components (shadcn)** | ~25 |
| **Feature Modules** | ~25 |

---

## SECTION 11 — ENTERPRISE ASSESSMENT

| Category | Score (1-10) | Assessment |
|----------|:------------:|-----------|
| **Architecture** | 8/10 | Well-structured MVC with clean separation. Service layer properly separated from controllers. Modular frontend feature structure. Could benefit from dependency injection and stronger DDD patterns. |
| **RBAC** | 7/10 | 5 roles with granular permissions. Branch-level scoping is excellent. Some routes lack proper role granularity (e.g., EMPLOYEE can view all attendance). Role normalization for backward compatibility is good. |
| **Security** | 7/10 | Strong JWT auth, rate limiting, device auth, payroll lock. Missing CSRF, production CORS config, and some routes have overly permissive access. Token blacklisting is a plus. |
| **Database Design** | 8/10 | 54 well-normalized tables. Proper foreign keys, indexes (159), unique constraints. Good use of ENUM types and JSONB for flexible data. Some unique constraints appear duplicated. Audit trail is solid. |
| **Maintainability** | 8/10 | Clean code structure, consistent naming, separate concerns. Frontend service layer cleanly abstracts API calls. 42 frontend services mirror backend functionality. Good use of TypeScript frontend. |
| **Scalability** | 6/10 | PostgreSQL can scale well. Queue system for payslip generation is good. Missing Redis caching for frequent queries. Pagination exists but may need optimization at scale. WebSocket for real-time is promising. |
| **Enterprise Readiness** | 7/10 | Comprehensive feature set covering HR, payroll, recruitment, KPI, analytics. Missing: SSO, LDAP, advanced reporting, mobile app, timezone handling, multi-language. Strong foundation for enterprise use. |

**Overall Score: 7.3/10**

---

## SECTION 12 — EXECUTIVE SUMMARY

### 1. Everything My System Can Do

The **UnivoHR Smart HRMS** is a comprehensive Human Resource Management System covering:

- **Employee Lifecycle:** Onboarding → Employee Management → Performance (KPI) → Offboarding (Final Pay)
- **Attendance & Time:** Biometric device integration, daily attendance tracking, time modification requests, man-hour reporting
- **Leave Management:** Leave requests, approvals, credit tracking, leave-to-cash conversion, year-end processing
- **Payroll:** Payroll generation by cutoff, salary configuration, deductions, payslip generation (with background queue), locking/voiding workflows, final pay computation
- **Overtime:** Request and approval workflow with payroll integration
- **Recruitment:** Job positions, applicant tracking, interviews, document management, approval workflows, applicant-to-employee conversion
- **Performance Management:** KPI template builder, multi-rater evaluations, self-evaluations, probation tracking
- **HR Forms:** Dynamic form builder with field-level customization, employee assignments, submissions, review workflows
- **Analytics & Intelligence:** Executive dashboard, anomaly detection (rule-based + statistical), attendance/workforce forecasting, drill-down analytics, department comparison
- **Notifications:** In-app notification system with real-time WebSocket
- **Multi-Branch:** Full multi-branch/company support with branch-level data scoping
- **Communications:** SMTP configuration, email templates, automated email notifications
- **Compliance:** Audit logging, approval workflows, policy document management, privacy/security pages

### 2. What Each Role Can Do

- **SYSTEM_ADMIN** (1 user): Technical administration — settings, SMTP, email templates, attendance rules, pay rules, user accounts. No operational HR functions.
- **ADMIN** (1 user): Full operational control — everything except system-level settings (SMTP, email templates). Can approve all workflows, manage payroll, recruitment, KPI.
- **HR_USER** (1 user): Day-to-day HR operations — employee management (view), attendance (view), leave (approve), overtime/man-hour (approve), recruitment (manage), KPI (manage), reports, forms (manage). Branch-scoped data access. Cannot manage payroll or system settings.
- **PAYROLL_USER** (1 user): Payroll operations — generate payroll, manage deductions, final pay. Can view employees and attendance. Cannot manage leaves, recruitment, KPI, or HR forms.
- **EMPLOYEE** (1 user): Self-service — own attendance, leaves, overtime requests, man-hour reports, calendar, benefits, payslip, performance portal (KPI results, probation). Can be assigned as approver for leave/overtime/man-hours.

### 3. Strongest Parts of the System

1. **Comprehensive Feature Coverage**: Covers the entire HR employee lifecycle from recruitment to offboarding
2. **Approval Workflow Engine**: Flexible approver assignment system works across leaves, overtime, man-hours with fallback to role-based approval
3. **Branch-Level Data Scoping**: True multi-branch support with configurable access per user — essential for enterprise deployments
4. **Analytics & Intelligence**: Anomaly detection, forecasting, drill-down analytics with statistical methods — rare in HRMS
5. **Dynamic Forms Engine**: Custom form builder allows HR to create any form without code changes
6. **KPI/Performance Module**: Complete performance management with templates, multi-rater evaluations, self-evaluations, probation tracking
7. **PostgreSQL Schema**: Well-designed database with proper indexing (159 indexes), foreign keys, and audit trail
8. **Recruitment-to-Employee Pipeline**: Seamless conversion from applicant to employee with onboarding tracking

### 4. Weakest Parts of the System

1. **No Mobile Application**: Entirely web-based, no mobile app for employees to clock in/out or check status
2. **Limited Payroll Flexibility**: Payroll appears to work on fixed cutoff schedules; may not accommodate complex shift differentials or union rules
3. **No SSO/LDAP Integration**: No Active Directory or single sign-on support
4. **No Advanced Reporting**: Reports exist but no drag-drop report builder or scheduled report delivery
5. **No Timezone Support**: Not handling multiple timezones for multi-location companies
6. **No Multi-language (i18n)**: Only English supported
7. **CORS Hardcoded**: Development URLs hardcoded in CORS config — needs environment-based configuration
8. **No Document Generation**: No offer letter, contract, or certificate generation beyond payslips
9. **No Training/LMS Module**: No learning management system
10. **No Expense Management**: Employee expense tracking/reimbursement is missing

### 5. Missing Enterprise Features

- Single Sign-On (SSO) / LDAP / SAML
- Multi-language / Internationalization (i18n)
- Timezone support
- Mobile application (iOS/Android)
- Advanced scheduling (shifts, rotating schedules)
- Employee self-service document upload
- Expense management
- Asset management
- Training & Certification tracking
- Succession planning
- Advanced compensation management (bonuses, equity)
- Employee engagement surveys
- Helpdesk / ticket system
- API versioning and public API documentation
- Webhooks for third-party integrations
- Containerization (Docker) and orchestration (Kubernetes) configs
- CI/CD pipeline configuration
- Comprehensive test suite (unit, integration, e2e)

### 6. Recommended Next Steps

1. **Immediate (Security):**
   - Fix `GET /api/attendance` to scope EMPLOYEE role to own records only
   - Make CORS configuration environment-based
   - Add proper file validation for applicant document uploads
   - Add request body size limits

2. **Short-term (Quality):**
   - Add unit test suite for services and controllers
   - Add Docker configuration for easier deployment
   - Implement comprehensive error logging with structured logging
   - Add pagination consistently across all list endpoints
   - Implement API rate limiting on all routes (not just auth)

3. **Medium-term (Features):**
   - Add SSO/LDAP integration
   - Implement mobile-friendly PWA or mobile app
   - Add expense management module
   - Build advanced report builder with saved reports
   - Add i18n support

4. **Long-term (Scale):**
   - Microservices migration for payroll (most complex module)
   - Redis caching layer for frequent queries
   - Read replicas for reporting queries
   - Full-text search on employees and applicants
   - Public API with documentation (Swagger/OpenAPI)

---

*End of Comprehensive Audit Report — Generated May 30, 2026*
