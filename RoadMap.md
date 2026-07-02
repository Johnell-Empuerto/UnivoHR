# HRMS - Roadmap & Completion Status

Generated: Jul 1, 2026

---

## Legend

- ✅ Done
- 🔷 In Progress
- ⬜ Not Started
- ❌ Skipped / Blocked

---

## Phase 0 — Production Hardening

> Error Boundary, Express error handling, Health Check, Structured Logging, Worker fixes

| Task | Status | Notes |
|---|---|---|
| React Error Boundary | ✅ | Implemented with `resetKeys`, layered boundaries (global + page-level) |
| Express centralized error handling | ✅ | |
| Health Check endpoint | ✅ | |
| Structured logging (Pino) | ✅ | |
| Request IDs / Correlation IDs | ✅ | |
| Worker cron fix (duplicate registration) | ✅ | |
| Graceful shutdown | ✅ | |

**Production readiness: 6.5/10 → 8.5/10**

---

## Phase 1 — Frontend Quality (React Query Migration)

> The original Phase 2A–2I plan, rebranded as Phase 1A–1I for clarity

### Phase 1A — Mutation Analysis

| Task | Status | Notes |
|---|---|---|
| Scan for raw `api.post / put / patch / delete` calls | ✅ | |
| Classify SAFE / NOT SAFE | ✅ | |
| Migration roadmap produced | ✅ | |

### Phase 1B — Safe Mutation Migration

| Task | Status | Notes |
|---|---|---|
| Convert safe mutations to `useMutation` | ✅ | |
| Loading / error states standardized | ✅ | |

### Phase 1C — Import Integrity & Runtime Repair

| Task | Status | Notes |
|---|---|---|
| Import integrity audit | ✅ | |
| Runtime crash repair | ✅ | |
| Mount orphan routes | ✅ | |

### Phase 1D — Query Migration Analysis

| Task | Status | Notes |
|---|---|---|
| 3-agent parallel scan of entire `src/features/` | ✅ | Leaves, employees, settings, hr-forms, kpi, recruitment, payroll, users, performance, benefits, reports, calendar, dashboard, man-hour-reports, auth |
| ~76 files with manual `api.get()` identified | ✅ | |
| SAFE / NOT SAFE classification | ✅ | 37 SAFE, 11 NOT SAFE |
| Full report produced | ✅ | `attendance_migration_report.md` |

### Phase 1E — Safe Query Migration (IN PROGRESS)

> Migrate SAFE manual fetches → `useQuery`

| Batch | Status | Files | Hooks |
|---|---|---|---|
| Phase 1 Schedule (prior) | ✅ | EmployeeProfilePage, EditEmployeePage, MyScheduleRequests, EmployeeSchedule, ScheduleLogs, ScheduleOverview, MySchedule, ScheduleRequests, ScheduleTemplate, ShiftsPage, ShiftSwapPage, AttendanceRecord, RequestOT, MySchedules (14 files) | useEmployeeProfile, useMyScheduleRequests, useEmployeeSchedule, useScheduleLogs, useScheduleOverview, useMySchedule, useScheduleRequestsPending, useScheduleTemplates, useAllShifts, useShiftSwaps, useAttendanceRecord, useRequestOvertime, useMySchedules, useMySchedule (shared) |
| Phase 2A Admin/Settings (prior) | ✅ | BranchesPage, DepartmentsPage, MyOvertime, AnomalyDetailDrawer, HRPolicies, NotificationsPage (6 files) | useAllBranches, useAllDepartments, useMyOvertime, useAnomalyDetail, useAdminHrPolicies, useAllHrPolicies, useNotifications |
| Phase 2C Deferred (prior) | ✅ | DevicesPage (1 file) | useDevices |
| Phase 2D Batch 3 Medium | ✅ | OvertimeRequests, MyManHoursReport, AnomalyPage, AdminLeavePage, EmployeeList, OnboardingPage (6 files) | useOvertimeRequests, useIsOvertimeApprover, useMyManHoursReport, useAnomalies, useAnomalySummary, useAdminLeaves, useEmployeeList, useEmployeeOnboardings |
| Phase 2D Batch 4 Complex | ✅ | PayrollDetails, LeavePage, AttendancePage (3 files) | usePayrollById, useMyLeavesPaginated, useAttendanceRecords, useTimeModificationRequests |
| Phase 2E Priority 1 (current) | ✅ | MyFormsPage, MyFormFillPage, MyKpiResultsPage, MyProbationStatusPage, MyPerformancePage, MyBenefitsPage (6 files) | useMyHrAssignments, useHrAssignmentById, useMyKpiEvaluations, useKpiEvaluationDetail, useMyProbationInfo, useMyPerformanceSummary, useMyBenefits |

#### Migration Stats (Phase 1E)

| Metric | Value |
|---|---|
| Total manual-fetch files found | ~76 |
| Files migrated | **34** (45%) |
| Custom hooks created | **38** |
| SAFE remaining | 31 |
| NOT SAFE remaining | 11 (see below) |
| Skipped (no manual fetches) | 1 (PayrollGenerate.tsx) |

#### Remaining SAFE Files (31)

**Priority 2 — Admin/HR (9 files)**
- Users.tsx, UserDrawersForm.tsx
- EvaluationHistoryPage.tsx, EmployeeEvaluationPage.tsx
- KpiTemplatesPage.tsx, KpiEvaluationPage.tsx
- ReportsPage.tsx
- ManHoursApproval.tsx, MissingManHoursTab.tsx

**Priority 3 — Payroll (5 files)**
- EmployeePayrollPage.tsx, PayrollSettings.tsx
- FinalPayTable.tsx, FinalPayHistoryTable.tsx, PayrollTable.tsx

**Priority 4 — Recruitment (4 files)**
- ApplicantsPage.tsx, JobPositionsPage.tsx
- RecruitmentWorkflowsPage.tsx, MyInterviewAssignmentsPage.tsx

**Priority 5 — Settings (5 files)**
- AuditLogsSettings.tsx, EmailTemplateEditor.tsx, EmployeeCodeSettings.tsx
- ApprovalSettings.tsx, AttendanceSettings.tsx

**Priority 6 — Dashboard/HR Forms (4 files)**
- ForecastCard.tsx, StatInsightCard.tsx
- HrFormsPage.tsx, HrFormSubmissionsPage.tsx

**Skipped as NOT SAFE (4 files + 1 deferred)**
- Calendar.tsx (FullCalendar loading state sharing, complex pipeline)
- LeaveApprovers.tsx, EmployeeCreditsTable.tsx, LeaveConversionHistory.tsx
  *(reclassified: these are SAFE — remove from this list)*

#### Corrected NOT SAFE Files (11)

| File | Reason |
|---|---|
| Calendar.tsx | FullCalendar loading prop conflated with manual fetch state; 3-stage data pipeline; mutation-refetch cycles |
| LeaveConversionSettings.tsx | Complex fetch/mutation interleaving |
| LeaveDrawer.tsx | Fetch on drawer open + mutation cycles |
| EmployeeDrawer.tsx | ~20+ API calls |
| BulkImportDialog.tsx | File upload + chained API calls |
| DeviceIntegration.tsx | 4 sub-components with independent fetches |
| EmployeeRotation.tsx | Complex paginated state + multiple fetches |
| RotationGroups.tsx | Same pattern as EmployeeRotation |
| HrFormBuilderPage.tsx | Sequential GETs + mutations + builder state |
| ApplicantDetailPage.tsx | ~15+ API calls |
| PayRollPage.tsx | Sequential state-dependent GETs |

### Phase 1F — Remove Duplicate Fetch Logic

| Task | Status |
|---|---|
| Audit for duplicated query logic across components | ⬜ |
| Consolidate into shared hooks | ⬜ |
| Remove dead/inline fetch code | ⬜ |

### Phase 1G — Cache Optimization

| Task | Status |
|---|---|
| Tune `staleTime` / `gcTime` per domain | ⬜ |
| Add `prefetching` for likely navigation targets | ⬜ |
| Dependent queries using `enabled` | ⬜ (partially done in 1E) |
| Optimistic updates for mutations | ⬜ |

### Phase 1H — React Performance

| Task | Status |
|---|---|
| Memoization audit (`useMemo`, `useCallback`) | ⬜ |
| Render optimization (reduce re-renders) | ⬜ |
| Code-splitting / lazy loading audit | ⬜ |

### Phase 1I — Final Production Audit

| Task | Status |
|---|---|
| Race condition review | ⬜ |
| Memory leak review (stale subscriptions, intervals) | ⬜ |
| React Query best-practices pass | ⬜ |
| Console error cleanup | ⬜ |

---

## Phase 2 — Testing

> Controller, Service, Model, Integration, Permission tests

| Task | Status | Notes |
|---|---|---|
| Middleware tests | ✅ | Existing |
| Controller tests | ⬜ | |
| Service tests | ⬜ | |
| Model tests | ⬜ | |
| Database integration tests | ⬜ | |
| Permission tests | ⬜ | |
| CI pipeline (GitHub Actions) | ✅ | Existing |

---

## Phase 3 — Complete Existing Features

> Features already implemented but inaccessible (orphan routes/pages)

| Task | Status | Notes |
|---|---|---|
| Mount orphan routes | ✅ | Done in Phase 1C |
| Onboarding pages | ✅ | |
| Device pages | ✅ | |
| Leave credits admin page | ⬜ | |
| Missing feature audit | ⬜ | |

---

## Phase 4 — Enterprise Payroll

> Government deductions, allowances, payroll approval workflows

| Task | Status |
|---|---|
| SSS computation | ⬜ |
| PhilHealth computation | ⬜ |
| Pag-IBIG computation | ⬜ |
| BIR withholding tax | ⬜ |
| Allowance engine | ⬜ |
| Payroll approval workflow | ⬜ |

**Current payroll completeness: ~55%**

---

## Phase 5 — Enterprise Workflow

> Multi-level approvals, escalation rules, delegates

| Task | Status |
|---|---|
| Multi-level approvals | ⬜ |
| Escalation rules | ⬜ |
| Approval chains | ⬜ |
| Delegates / Acting approvers | ⬜ |

---

## Phase 6 — New HR Modules

| Module | Status |
|---|---|
| Learning Management / Training | ⬜ |
| Certifications / Skill Matrix | ⬜ |
| Goals / OKRs | ⬜ |
| 360 Feedback | ⬜ |

---

## Overall Progress

| Phase | % Complete |
|---|---|
| Phase 0 — Production Hardening | 100% |
| Phase 1A — Mutation Analysis | 100% |
| Phase 1B — Safe Mutation Migration | 100% |
| Phase 1C — Import/Runtime Repair | 100% |
| Phase 1D — Query Analysis | 100% |
| Phase 1E — Safe Query Migration | **45%** (34/76 files) |
| Phase 1F — Remove Duplicate Fetches | 0% |
| Phase 1G — Cache Optimization | 0% |
| Phase 1H — React Performance | 0% |
| Phase 1I — Final Audit | 0% |
| Phase 2 — Testing | 5% |
| Phase 3 — Complete Features | 30% |
| Phase 4 — Enterprise Payroll | 0% |
| Phase 5 — Enterprise Workflow | 0% |
| Phase 6 — New HR Modules | 0% |

**System feature completeness (per original audit): ~70-75%**

**Recommended next action:** Continue Phase 1E Priority 2 — Admin/HR SAFE files (Users.tsx, UserDrawersForm.tsx, EvaluationHistoryPage.tsx, etc.)
