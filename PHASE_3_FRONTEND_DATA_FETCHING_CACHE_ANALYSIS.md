# Phase 3 Frontend Data Fetching and Cache Analysis

## Executive Summary

The frontend currently uses **zero caching, zero request deduplication, and zero abort/cancellation**. Every page component re-fetches all its data on mount, resulting in redundant network calls especially for reference data (branches, shifts, settings) that rarely changes. The `hooks/` directory is empty (3 placeholder files), meaning no shared fetching infrastructure exists. Approximately **237+ `setLoading` usages** indicate pervasive manual loading state management that a caching library could eliminate.

**Key metrics:**
- 50 service files wrapping Axios calls
- 90+ `useEffect` data-fetching patterns across feature pages
- 0 `AbortController` usages — every in-flight request runs to completion
- 11 pages independently fetch `getActiveBranches` on mount
- 10 parallel API calls on dashboard mount (5 per role)
- 3 empty hook files ready for implementation

## Current Data Fetching Architecture

### API Layer (`services/api.ts`)
- Axios instance configured with base URL, Bearer token in request interceptor
- Response interceptor implements **token refresh with request queuing** — failed requests during refresh are queued and replayed
- 429 rate-limit toast (throttled to 10s)
- Session expiry detection via custom `auth:session-expired` event
- **No retry logic** — non-401 errors are simply rejected
- **No request cancellation** — no `AbortController`, `CancelToken`, or `signal:` support
- **No caching headers or ETag handling**

### Service Pattern (50 files in `services/`)
Each service exports standalone async functions:
```typescript
export const getActiveBranches = async () => {
  const response = await api.get("/branches/active");
  return response.data;
};
```

Services call `api.get/post/put/patch/delete` and return `response.data`. No shared state, no caching, no deduplication.

### Hook Layer (`hooks/`)
Three files exist — all **empty**:
- `useFetch.ts` — empty (ready for implementation)
- `useAuth.ts` — empty (auth is in providers)
- `useSocket.ts` — empty (socket init is in providers)

### Page Fetching Pattern (ubiquitous)
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchData()
    .then(setData)
    .catch(toast.error)
    .finally(() => setLoading(false));
}, [deps]);
```

This pattern repeats in every feature component with:
- **No abort**: Component unmount → state update on unmounted component
- **No dedup**: Rapid deps change → multiple in-flight requests → race condition
- **No stale-while-revalidate**: Every mount = full loading state
- **No shared cache**: Same endpoint called from 2 components = 2 network requests

## Duplicate Request Risks

### Highest Priority: `getActiveBranches` (11 call sites)
| File | Fetch trigger |
|------|--------------|
| `AttendancePage.tsx` | On mount |
| `EmployeeList.tsx` | On mount |
| `Calendar.tsx` | On mount |
| `DevicePage.tsx` | On mount |
| `PayRollPage.tsx` | On mount |
| `JobPositionsPage.tsx` | On mount |
| `ApplicantDetailPage.tsx` | On mount (in Promise.all) |
| `EmployeeDrawer.tsx` | On mount |
| `DeviceIntegration.tsx` | On mount |
| `BranchRestDays.tsx` | On mount |
| `PayrollGenerate.tsx` | On mount |

**Risk scenario**: A user navigating between tabs (Attendance → Calendar → Employees) triggers 3 separate `getActiveBranches` calls in rapid succession. Since branches rarely change (updated once per deployment), this is pure redundant traffic.

### Medium Priority: Permission & User Data
- `getAllPermissions()` called in `UserPermissionsPage.tsx` on mount — good candidate
- `getUserPermissions()` called per user view — depends on context
- `getUsers()` called on mount in Users page

### Low Priority: Component-level duplicates
- `EmployeeDrawer.tsx` fetches branches and shifts every time drawer opens
- `Dashboard.tsx` re-fetches all 5 endpoints when `fetchData` callback identity changes (currently memoized, safe)

## High-Value Cache Candidates

### Tier 1 — Reference / Static Data (Cache on first load, long TTL)

| Candidate | Service/File | Cache Key | Stale Time | GC Time | Invalidations | Risk |
|-----------|-------------|-----------|-----------|---------|--------------|------|
| Active branches | `branchService.getActiveBranches` | `branches:active` | 10 min | 30 min | On branch create/update/status-change | Low |
| All branches | `branchService.getBranches` | `branches:all` | 10 min | 30 min | On branch create/update/delete | Low |
| Active shifts | `shiftService.getActiveShifts` | `shifts:active` | 10 min | 30 min | On shift create/update/delete | Low |
| All shifts | `shiftService.getShifts` | `shifts:all` | 10 min | 30 min | On shift create/update/delete | Low |
| All settings | `settingsService.getAllSettings` | `settings:all` | 5 min | 15 min | On setting update | Low |
| Individual setting | `settingsService.getSetting(key)` | `settings:{key}` | 5 min | 15 min | On that setting update | Low |
| Notification rules | `notificationRuleService.getAllRules` | `notification-rules:all` | 5 min | 15 min | On rule update/toggle | Low |
| Leave types (enabled) | `leaveService.getEnabledLeaveTypes` | `leave-types:enabled` | 10 min | 30 min | On leave type create/update/toggle | Low |
| All leave types | `leaveService.getAllLeaveTypesAdmin` | `leave-types:all` | 10 min | 30 min | On leave type create/update/delete | Low |
| Leave conversion types | `leaveService.getLeaveTypes` | `leave-conversion:types` | 10 min | 30 min | On conversion type update | Low |
| Leave conversion settings | `leaveService.getConversionSettings` | `leave-conversion:settings` | 5 min | 15 min | On conversion settings save | Low |

**Expected benefit**: These 11 endpoints are called on mount across **20+ components**. Caching them eliminates redundant calls entirely for the session.

### Tier 2 — Read-Heavy Dashboard Data (Short TTL, stale-while-revalidate)

| Candidate | Service/File | Cache Key | Stale Time | GC Time | Invalidations | Risk |
|-----------|-------------|-----------|-----------|---------|--------------|------|
| Dashboard summary (admin) | `dashboardService.getDashboardSummary` | `dashboard:summary:admin` | 30s | 5 min | None (TTL-based) | Low |
| Dashboard analytics (admin) | `dashboardService.getAdminAnalytics` | `dashboard:analytics:admin` | 30s | 5 min | None (TTL-based) | Low |
| Dashboard summary (employee) | `dashboardService.getMySummary` | `dashboard:summary:{userId}` | 30s | 5 min | None (TTL-based) | Low |
| Today status | `dashboardService.getTodayStatus` | `dashboard:today:{userId}` | 30s | 5 min | On clock-in/out via socket event | Low |
| Employment stats | `employeeService.getEmploymentStats` | `employees:stats` | 1 min | 5 min | On employee create/update | Low |
| Leave credits | `leaveService.getLeaveCredits` | `leaves:credits:{userId}` | 1 min | 5 min | On leave create/approve | Low |
| Unread notification count | `notificationService.getUnreadCount` | `notifications:unread:{userId}` | 30s | 5 min | On notification mark-read | Low |

**Expected benefit**: Dashboard becomes near-instant on return navigation. 5 parallel calls reduced to cache reads.

### Tier 3 — Paginated Lists (Cache with query-key inclusion of page/filter params)

| Candidate | Service | Cache Key Pattern | Stale Time | Risk |
|-----------|---------|------------------|-----------|------|
| Employee list | `employeeService.getEmployees` | `employees:list:{page}:{limit}:{search}:{filters}` | 30s | Medium |
| Leave list (my) | `leaveService.getMyLeaves` | `leaves:my:{userId}:{page}:{limit}:{status}` | 30s | Medium |
| Leave list (all) | `leaveService.getAllLeaves` | `leaves:all:{page}:{limit}:{search}:{filters}` | 30s | Medium |
| Overtime requests | `overtimeService.getOvertimeRequests` | `overtime:requests:{page}:{limit}:{filters}` | 30s | Medium |
| Payroll list | `payrollService.getPayroll` | `payroll:list:{page}:{limit}:{search}:{cutoff}` | 30s | Medium |
| Attendance list | `attendanceService.getAttendanceLogs` | `attendance:logs:{page}:{limit}:{filters}` | 30s | Medium |

**Key insight**: These paginated lists will see the most benefit from **stale-while-revalidate** — showing cached data instantly while re-fetching in the background after TTL expiry.

## Unsafe / Do Not Cache Yet

| Endpoint | Reason |
|----------|--------|
| `POST /auth/login` | Auth mutation |
| `POST /auth/refresh` | Token mutation |
| All `POST /leaves`, `PUT /leaves/{id}/status` | Business-critical mutation |
| All `POST /payroll/*` | Payroll mutation (restricted) |
| All `POST /attendance/*` | Attendance mutation (restricted) |
| All `POST /recruitment/*` | Recruitment mutation (restricted) |
| `GET /notifications?page=` | Real-time — socket updates would need manual invalidation |
| `GET /anomalies/*` | Time-sensitive data |
| `GET /reports/*` | Reports need fresh data always |
| `GET /dashboard/me/today` | Real-time clock data |
| All employee-specific bonus/benefit data | Can change from payroll processing |

**Guideline**: Any endpoint that is a direct mutation target or reads data created within the last 60 seconds should either not be cached or have a very short stale time (< 15s).

## Abort and Stale Response Risks

### Current State
- **Zero abort mechanisms** across the entire frontend
- No `AbortController`, no `CancelToken`, no `signal:` pattern
- All in-flight Axios requests run to completion regardless of component lifecycle

### Risk Scenarios

1. **Rapid pagination**: Clicking page 1 → page 2 → page 3 quickly. Response order might be: page-3 completes first, page-1 completes last → UI shows page-1 data while pagination state says page 3.

2. **Tab switching**: EmployeeList mounts (fetches employees + branches). User switches tab before fetch completes. Branch data sets state on unmounted component → React warning.

3. **Filter typing**: Search input with `useEffect` debounce. If debounce is missing, every keystroke triggers a new request. Responses arrive out of order → wrong search results displayed.

4. **Drawer/modal open/close**: Opening `EmployeeDrawer` triggers 3+ API calls. Closing and re-opening triggers them again with no cancellation of first batch.

### Risk Level: Medium
No observed bugs currently (debounced inputs and proper dependency arrays mitigate most issues), but as the app scales, stale responses will become more frequent.

## Recommended TanStack Query / SWR Strategy

### Why TanStack Query (React Query)

| Feature | Benefit |
|---------|---------|
| `staleTime` | Eliminates redundant refetches within time window |
| `gcTime` | Keels cached data for back-navigation without loading |
| Query key dedup | Same key from 2 components = 1 network request |
| `useMutation` with `onSuccess` invalidation | Automatic refetch after create/update/delete |
| `keepPreviousData` | Paginated tables show previous page while next loads |
| Devtools | Debug cache state, stale times, refetches |

### Suggested Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30s default (overridden per query)
      gcTime: 5 * 60 * 1000,       // 5 min garbage collection
      retry: 1,                    // Single retry on failure
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      refetchOnReconnect: false,   // Don't refetch on reconnect
    },
  },
});
```

Stale times per tier:
- **Reference data**: 5–10 min stale time
- **Dashboard**: 30s stale time
- **Paginated lists**: 30s stale time, `keepPreviousData: true`
- **Real-time data**: 0 stale time (always fetch)

## Safe Implementation Phases

### Phase 3A (1–2 days) — Query Client + Provider
- Install `@tanstack/react-query`
- Create `queryClient.ts` with configuration
- Add `QueryClientProvider` in `main.tsx` wrapping `<App />`
- No behavior changes — verify build + lint pass

### Phase 3B (2–3 days) — Reference Data Hooks
- Create `hooks/useBranches.ts` — wraps `getActiveBranches()`, staleTime 10min
- Create `hooks/useShifts.ts` — wraps `getActiveShifts()`, staleTime 10min
- Create `hooks/useSettings.ts` — wraps `getSetting(key)`, staleTime 5min
- Create `hooks/useLeaveTypes.ts` — wraps `getEnabledLeaveTypes()`, staleTime 10min
- Migrate the 11+ components that call `getActiveBranches` to `useBranches()`

**Why first**: Reference data has the lowest risk and highest repeat-call reduction ratio.

### Phase 3C (2–3 days) — Dashboard + Read-Heavy Pages
- Create `hooks/useDashboardSummary.ts` for admin/employee paths
- Create `hooks/useEmploymentStats.ts`
- Create `hooks/useLeaveCredits.ts`
- Migrate `Dashboard.tsx` — replace `useEffect` + `Promise.all` pattern

**Why second**: Dashboard is read-only, high-visibility performance improvement, immediate user-facing benefit.

### Phase 3D (3–5 days) — Paginated Tables
- Create generic paginated list hook pattern
- Migrate employee list, leave lists, overtime requests, payroll list, kpi lists
- Apply `keepPreviousData: true` for instant page transitions
- Add abort signal support for rapid filter changes

**Why third**: Higher complexity due to filter/pagination query keys, but biggest UX improvement for table-heavy workflows.

### Phase 3E (2–3 days) — Mutation Invalidation Strategy
- Implement `useMutation` wrappers for create/update/delete operations
- Define invalidation maps:
  - Create/update branch → invalidate `branches:*`
  - Create/update shift → invalidate `shifts:*`
  - Update setting → invalidate `settings:{key}`
  - Create/update/delete leave type → invalidate `leave-types:*`
  - Create leave → invalidate `leaves:*`, `leave-credits:*`
  - Approve overtime → invalidate `overtime:*`
- Remove manual refetch calls after mutations

**Why fourth**: Requires careful mapping of mutation → affected query keys. Most value for data consistency.

### Phase 3F (1–2 days) — Cleanup
- Remove unused `useState<boolean> loading` and `setLoading` from migrated components
- Remove `.finally(() => setLoading(false))` from migrated effects
- Simplify error handling (TanStack Query provides `error` from hook)
- Remove empty hook files if replaced by TanStack Query hooks

**Why last**: Pure cleanup after all migrations are stable.

## Files Reviewed

| File | Notes |
|------|-------|
| `services/api.ts` | Axios config, interceptors, token refresh, no abort/cancel |
| `services/dashboardService.ts` | 5 endpoints, used in Dashboard.tsx |
| `services/settingsService.ts` | 5 endpoints, reference data |
| `services/branchService.ts` | 6 endpoints, `getActiveBranches` called 11 times |
| `services/permissionService.ts` | 4 endpoints |
| `services/notificationRuleService.ts` | 4 endpoints, reference data |
| `services/shiftService.ts` | 9 endpoints, `getActiveShifts` called 3 times |
| `services/userService.ts` | 7 endpoints |
| `services/approverService.ts` | 4 endpoints |
| `services/restDayService.ts` | 8 endpoints |
| `services/leaveService.ts` | 19 endpoints (leave types + conversion) |
| `hooks/useFetch.ts` | Empty placeholder |
| `hooks/useAuth.ts` | Empty placeholder |
| `hooks/useSocket.ts` | Empty placeholder |
| `features/dashboard/pages/Dashboard.tsx` | 5+5 parallel API calls on mount |
| `features/employees/pages/EmployeeList.tsx` | Paginated list + branches on mount |
| `features/leaves/pages/LeavePage.tsx` | Paginated list + credits on mount |
| `features/attendance/pages/AttendancePage.tsx` | Paginated list + branches on mount |
| `features/calendar/pages/Calendar.tsx` | Branches on mount |
| `features/settings/components/*` | 8+ components, each fetching settings on mount |

Plus 40+ additional feature files reviewed for useEffect and api call patterns.

## Final Recommendation

**Proceed with Phase 3 implementation.** The frontend is a textbook candidate for TanStack Query — zero existing caching, pervasive manual loading state, and heavy redundant fetching of reference data. The staged approach (reference data → dashboard → paginated tables → mutations → cleanup) ensures each step can be validated independently before moving to the next.

Top 5 cache opportunities:
1. `getActiveBranches` — 11 redundant call sites, 10-min stale time, near-zero risk
2. `getActiveShifts` — 3 call sites, 10-min stale time, low risk
3. `getAllSettings` / `getSetting(key)` — called in 5+ settings components, 5-min stale time
4. Dashboard summary/analytics — 5 parallel calls, 30s stale time, high user-facing impact
5. Paginated employee/leave/overtime lists — `keepPreviousData` eliminates loading flicker on page changes

Highest-risk duplicate request areas:
1. Navigation between Attendance → Calendar → Employees tabs — each re-fetches `getActiveBranches`
2. Opening/closing EmployeeDrawer — triggers 3+ API calls on every open
3. Dashboard remount — re-fetches 5 parallel calls even when navigating back within seconds
4. Rapid pagination (no abort) — stale responses from previous page fetches can overwrite current page
5. Filter typing without debounce — each keystroke triggers new request chain

No code was modified. No commit was made.
