# Attendance System — React Query Migration Report (Phase 3)

Generated: Jul 1, 2026

---

## 1. Executive Summary

### What's Been Done
**28 of ~76 files with manual `api.get()` patterns have been migrated** to React Query (`useQuery`/`useSuspenseQuery`), with **31 custom hooks** created.

### What Remains
**48 files** still contain manual `api.get()` calls across 14 feature folders. Of these:
- **37 SAFE** (straightforward migration, start-to-finish in <30 min each)
- **11 NOT SAFE** (complex state interleaving, sequential dependencies, or heavy API surface — 1–4 hrs each)

### Estimated Effort
- 37 SAFE × 0.5 hr = **18.5 hrs**
- 11 NOT SAFE × 2.5 hr avg = **27.5 hrs**
- **Total: ~46 hours**

### Quick Wins Recommendation
Phase 3A (37 SAFE files) can be parallelized or automated. Phase 3B+C (11 NOT SAFE) need individual attention.

---

## 2. Completed Migrations (28 files, 31 hooks)

### Phase 1 — Schedule & Core (12 hooks)
| File | Hook(s) |
|---|---|
| EmployeeProfilePage.tsx | `useEmployeeProfile` |
| EditEmployeePage.tsx | `useEmployeeProfile` (shared) |
| MyScheduleRequests.tsx | `useMyScheduleRequests` |
| EmployeeSchedule.tsx | `useEmployeeSchedule` |
| ScheduleLogs.tsx | `useScheduleLogs` |
| ScheduleOverview.tsx | `useScheduleOverview` |
| MySchedule.tsx | `useMySchedule` |
| ScheduleRequests.tsx | `useScheduleRequestsPending`, `useMyScheduleRequests` |
| ScheduleTemplate.tsx | `useScheduleTemplates` |
| ShiftsPage.tsx | `useAllShifts` |
| ShiftSwapPage.tsx | `useShiftSwaps` |
| AttendanceRecord.tsx | `useAttendanceRecord` |
| RequestOT.tsx | `useRequestOvertime` |
| MySchedules.tsx | `useMySchedules` |

### Phase 2A — Admin / Settings (6 hooks)
| File | Hook(s) |
|---|---|
| BranchesPage.tsx | `useAllBranches` |
| DepartmentsPage.tsx | `useAllDepartments` |
| MyOvertime.tsx | `useMyOvertime` |
| AnomalyDetailDrawer.tsx | `useAnomalyDetail` |
| HRPolicies.tsx | `useAdminHrPolicies`, `useAllHrPolicies` |
| NotificationsPage.tsx | `useNotifications` |

### Phase 2C — Deferred (1 hook)
| File | Hook(s) |
|---|---|
| DevicesPage.tsx | `useDevices` |

### Phase 2D Batch 3 — Medium Group (8 hooks)
| File | Hook(s) |
|---|---|
| OvertimeRequests.tsx | `useOvertimeRequests`, `useIsOvertimeApprover` |
| MyManHoursReport.tsx | `useMyManHoursReport` |
| AnomalyPage.tsx | `useAnomalies`, `useAnomalySummary` |
| AdminLeavePage.tsx | `useAdminLeaves` |
| EmployeeList.tsx | `useEmployeeList` |
| OnboardingPage.tsx | `useEmployeeOnboardings` |

### Phase 2D Batch 4 — Complex Group (4 hooks)
| File | Hook(s) |
|---|---|
| PayrollDetails.tsx | `usePayrollById` |
| LeavePage.tsx | `useMyLeavesPaginated`, `useAdminLeaves` (shared) |
| AttendancePage.tsx | `useAttendanceRecords`, `useTimeModificationRequests` |

**Excluded:** PayrollGenerate.tsx (no manual fetches found — only mutations via `api.post`)

---

## 3. Remaining Files (48) — Full Inventory

### 3A. leaves/ — 5 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| LeaveApprovers.tsx | 2 static GETs | ✅ SAFE | Low |
| EmployeeCreditsTable.tsx | 1 paginated GET | ✅ SAFE | Low |
| LeaveConversionHistory.tsx | 4 parallel GETs | ✅ SAFE | Medium |
| LeaveConversionSettings.tsx | GET + mutations (interleaved) | ❌ NOT SAFE | High |
| LeaveDrawer.tsx | Fetch + mutations (interleaved) | ❌ NOT SAFE | High |

### 3B. employees/ — 2 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| BulkImportDialog.tsx | File upload + API calls | ❌ NOT SAFE | High |
| EmployeeDrawer.tsx | ~20+ API calls | ❌ NOT SAFE | Very High |

### 3C. settings/ — 8 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| ApprovalSettings.tsx | Paginated GET + mutations | ✅ SAFE | Medium |
| AttendanceSettings.tsx | GET + mutations | ✅ SAFE | Low |
| AuditLogsSettings.tsx | Paginated GET | ✅ SAFE | Low |
| EmailTemplateEditor.tsx | GET + mutations | ✅ SAFE | Low |
| EmployeeCodeSettings.tsx | On-demand GET | ✅ SAFE | Low |
| DeviceIntegration.tsx | 4 sub-components | ❌ NOT SAFE | High |
| EmployeeRotation.tsx | Multiple fetches + paginated | ❌ NOT SAFE | High |
| RotationGroups.tsx | Multiple fetches + paginated | ❌ NOT SAFE | High |

### 3D. hr-forms/ — 6 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| MyFormsPage.tsx | Paginated GET | ✅ SAFE | Low |
| MyFormFillPage.tsx | Simple GET + submit | ✅ SAFE | Low |
| HrFormsPage.tsx | Paginated GET + mutations | ✅ SAFE | Medium |
| HrFormSubmissionsPage.tsx | Paginated GET | ✅ SAFE | Low |
| HrFormBuilderPage.tsx | Sequential GETs + mutations | ❌ NOT SAFE | High |
| HrFormAssignmentsPage.tsx | Mixed pattern | ❌ NOT SAFE | Medium |

### 3E. kpi/ — 4 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| EvaluationHistoryPage.tsx | Paginated GET | ✅ SAFE | Low |
| EmployeeEvaluationPage.tsx | Paginated GET | ✅ SAFE | Low |
| KpiTemplatesPage.tsx | Paginated GET + mutations | ✅ SAFE | Medium |
| KpiEvaluationPage.tsx | Paginated GET + bulk | ✅ SAFE | Medium |

### 3F. recruitment/ — 5 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| ApplicantsPage.tsx | Paginated + secondary GET | ✅ SAFE | Medium |
| JobPositionsPage.tsx | Paginated + secondary GET | ✅ SAFE | Medium |
| RecruitmentWorkflowsPage.tsx | Paginated + mutations | ✅ SAFE | Medium |
| MyInterviewAssignmentsPage.tsx | Parallel GETs + mutation | ✅ SAFE | Medium |
| ApplicantDetailPage.tsx | ~15+ API calls | ❌ NOT SAFE | Very High |

### 3G. payroll/ — 5 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| EmployeePayrollPage.tsx | 2 parallel GETs | ✅ SAFE | Low |
| PayrollSettings.tsx | Paginated + detail GET | ✅ SAFE | Medium |
| FinalPayTable.tsx | Paginated + mutations | ✅ SAFE | Medium |
| FinalPayHistoryTable.tsx | Paginated GET | ✅ SAFE | Low |
| PayrollTable.tsx | Mutation + download | ✅ SAFE | Low |
| PayRollPage.tsx | Sequential state-dependent GETs | ❌ NOT SAFE | High |

### 3H. users/ — 2 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| Users.tsx | Paginated GET | ✅ SAFE | Low |
| UserDrawersForm.tsx | Simple GET + mutations | ✅ SAFE | Low |

### 3I. performance/ — 3 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| MyKpiResultsPage.tsx | Simple + detail GET | ✅ SAFE | Low |
| MyProbationStatusPage.tsx | Simple GET | ✅ SAFE | Low |
| MyPerformancePage.tsx | Simple GET | ✅ SAFE | Low |

### 3J. benefits/ — 1 file
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| MyBenefitsPage.tsx | Simple GET | ✅ SAFE | Low |

### 3K. reports/ — 1 file
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| ReportsPage.tsx | Conditional paginated GETs | ✅ SAFE | Medium |

### 3L. calendar/ — 1 file
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| Calendar.tsx | Simple GET | ✅ SAFE | Low |

### 3M. dashboard/ — 2 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| ForecastCard.tsx | Simple GET | ✅ SAFE | Low |
| StatInsightCard.tsx | Simple GET | ✅ SAFE | Low |

### 3N. man-hour-reports/ — 2 files
| File | API Calls | Safety | Complexity |
|---|---|---|---|
| ManHoursApproval.tsx | Paginated + approver check | ✅ SAFE | Medium |
| MissingManHoursTab.tsx | Simple GET | ✅ SAFE | Low |

---

## 4. Safety Classification Criteria

### ✅ SAFE (37 files)
**Definition:** Contains only independent/paginated GET calls that can be cleanly replaced with `useQuery`.

- No interleaving of fetch results with state (no `useEffect` → `setState` patterns)
- No sequential API calls where response B depends on response A's data
- No complex conditional fetching or branching
- No heavy drawer/modal forms with inline fetch-on-open

Strategy:
1. Extract `api.get()` URL into hook
2. Replace with `useQuery` + `select` for data transformation
3. Remove `loading`/`error` state vars (replace with `isPending`/`error` from query)
4. Update JSX references

### ❌ NOT SAFE (11 files)
**Definition:** Requires refactoring beyond simple find-and-replace.

- State interleaving: fetch results flow into `useState` → mutated → sent back
- Sequential dependencies: response A → request B
- Modal/drawer forms with inline fetches in event handlers
- Heavy API surface (>10 endpoints in one component)
- Sub-component composition (parent fetches, passes to children that also fetch)

Strategy:
1. Extract into domain hooks per logical group
2. Use `enabled` option for dependent queries
3. Split monolithic components into smaller units
4. Handle race conditions via query key design

---

## 5. Migration Roadmap — 3 Phases

### Phase 3A — SAFE Quick Wins (37 files · ~18.5 hrs)

**Priority 1: User-Facing & Self-Service** (files visible to all employees)
1. Calendar.tsx
2. MyFormsPage.tsx
3. MyFormFillPage.tsx
4. MyKpiResultsPage.tsx
5. MyProbationStatusPage.tsx
6. MyPerformancePage.tsx
7. MyBenefitsPage.tsx
8. LeaveApprovers.tsx
9. EmployeeCreditsTable.tsx
10. LeaveConversionHistory.tsx

**Priority 2: Admin/HR Operational**
11. Users.tsx
12. UserDrawersForm.tsx
13. EvaluationHistoryPage.tsx
14. EmployeeEvaluationPage.tsx
15. KpiTemplatesPage.tsx
16. KpiEvaluationPage.tsx
17. ReportsPage.tsx
18. ManHoursApproval.tsx
19. MissingManHoursTab.tsx

**Priority 3: Payroll (remaining SAFE)**
20. EmployeePayrollPage.tsx
21. PayrollSettings.tsx
22. FinalPayTable.tsx
23. FinalPayHistoryTable.tsx
24. PayrollTable.tsx

**Priority 4: Recruitment (SAFE)**
25. ApplicantsPage.tsx
26. JobPositionsPage.tsx
27. RecruitmentWorkflowsPage.tsx
28. MyInterviewAssignmentsPage.tsx

**Priority 5: Settings (SAFE)**
29. AudienceLogsSettings → AuditLogsSettings.tsx
30. EmailTemplateEditor.tsx
31. EmployeeCodeSettings.tsx
32. ApprovalSettings.tsx
33. AttendanceSettings.tsx

**Priority 6: Dashboard & HR Forms (SAFE)**
34. ForecastCard.tsx
35. StatInsightCard.tsx
36. HrFormsPage.tsx
37. HrFormSubmissionsPage.tsx

### Phase 3B — NOT SAFE Medium (5 files · ~10 hrs)

1. **LeaveDrawer.tsx** — Extract drawer-level fetch + mutation into dedicated hook
2. **LeaveConversionSettings.tsx** — Untangle fetch → state → mutation cycle
3. **HrFormAssignmentsPage.tsx** — Mixed pattern, partial migration
4. **BulkImportDialog.tsx** — File upload pattern, use `useMutation` for upload
5. **PayRollPage.tsx** — Sequential state-dependent GETs, use `enabled` + shared query key

### Phase 3C — NOT SAFE Complex (6 files · ~17.5 hrs)

1. **EmployeeRotation.tsx** — Complex paginated state + multiple fetches
2. **RotationGroups.tsx** — Same pattern as EmployeeRotation
3. **DeviceIntegration.tsx** — 4 sub-components, each with own fetches
4. **HrFormBuilderPage.tsx** — Sequential GETs + mutations + builder state
5. **EmployeeDrawer.tsx** — ~20+ API calls: split into domain hooks
6. **ApplicantDetailPage.tsx** — ~15+ API calls: split into domain hooks

---

## 6. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Regressions in EmployeeDrawer | High | Medium | Start with hooks, keep old code, A/B test |
| Race conditions in dependent queries | Medium | Low | Use `enabled` option, test stale scenarios |
| Breaking pagination/search state | High | Low | Keep existing pagination state; only replace fetch layer |
| Drawer/modal form data loss | High | Low | Keep form state; only replace initial data load |
| Missing error handling for edge cases | Medium | Low | Audit existing error states; react-query `onError` |
| TypeScript breaking changes in PR | Low | Medium | Run `tsc --noEmit` before commit |

---

## 7. Pattern Reference

### Standard Hook Template
```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MyType } from '../types/my-type';

async function fetchMyData(params: MyParams): Promise<MyType> {
  const { data } = await api.get<MyType>('/endpoint', { params });
  return data;
}

export function useMyData(params: MyParams) {
  return useSuspenseQuery({
    queryKey: ['my-data', params],
    queryFn: () => fetchMyData(params),
  });
}
```

### Dual-Role Hook (Admin + Employee)
```typescript
export function useAttendanceRecords(params: {
  employeeId?: string;
  startDate: string;
  endDate: string;
}) {
  return useSuspenseQuery({
    queryKey: ['attendance-records', params],
    queryFn: async () => {
      const { data } = await api.get('/api/attendance/my-records', { params });
      return data;
    },
  });
}
```

---

## 8. Summary Statistics

| Metric | Value |
|---|---|
| Total files with manual `api.get()` | ~76 |
| Files migrated | 28 (37%) |
| Files remaining | 48 (63%) |
| Custom hooks created | 31 |
| SAFE remaining | 37 |
| NOT SAFE remaining | 11 |
| Estimated remaining effort | ~46 hours |

---

*Next recommended action: Begin Phase 3A Priority 1 (Calendar.tsx, MyFormsPage.tsx, MyFormFillPage.tsx)*
