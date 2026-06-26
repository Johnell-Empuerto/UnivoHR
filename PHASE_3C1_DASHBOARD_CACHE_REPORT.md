# Phase 3C.1 Dashboard Cache Report

## Summary

Dashboard read-data fetching was migrated from manual `useState` + `useEffect` + `Promise.all` patterns to TanStack Query hooks. The dashboard now caches read-only data with per-query stale times, eliminating redundant network requests when navigating away and back.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/hooks/useDashboardQueries.ts` | **Created** — 11 TanStack Query hooks for dashboard data |
| `Frontend/src/features/dashboard/pages/Dashboard.tsx` | **Modified** — removed `useEffect`/`Promise.all`, replaced with hook calls |

## Hooks Added

All hooks are in `Frontend/src/hooks/useDashboardQueries.ts`:

| Hook Name | Wraps |
|-----------|-------|
| `useAdminDashboardSummary` | `getDashboardSummary()` |
| `useAdminAnalytics` | `getAdminAnalytics()` |
| `useAnomalySummaryQuery` | `getAnomalySummary()` |
| `useEmploymentStats` | `getEmploymentStats()` |
| `useDueForRegularization` | `getDueForRegularization()` |
| `useMyAnalytics` | `getMyAnalytics()` |
| `useTodayStatus` | `getTodayStatus()` |
| `useLeaveCredits` | `leaveService.getLeaveCredits()` |
| `useMyRecentLeaves` | `leaveService.getMyLeaves()` (returns first 3) |
| `useWebClockSetting` | `getSetting("enable_web_clock_in_out")` |

## Dashboard API Calls Migrated

**Admin (5 parallel calls):**

| Old Pattern | New Pattern |
|-------------|-------------|
| `getDashboardSummary().catch(() => null)` | `useAdminDashboardSummary()` |
| `getAdminAnalytics().catch(() => null)` | `useAdminAnalytics()` |
| `getAnomalySummary().catch(() => null)` | `useAnomalySummaryQuery()` |
| `getEmploymentStats().catch(() => null)` | `useEmploymentStats()` |
| `getDueForRegularization().catch(() => [])` | `useDueForRegularization()` |

**Employee (5 parallel calls):**

| Old Pattern | New Pattern |
|-------------|-------------|
| `getMyAnalytics().catch(() => null)` | `useMyAnalytics()` |
| `getTodayStatus().catch(() => null)` | `useTodayStatus()` |
| `leaveService.getLeaveCredits().catch(() => null)` | `useLeaveCredits()` |
| `leaveService.getMyLeaves().catch(() => null)` | `useMyRecentLeaves()` |
| `getSetting("enable_web_clock_in_out").catch(...)` | `useWebClockSetting()` |

## Query Keys and Stale Times

| Query Key | Stale Time | Used By |
|-----------|-----------|---------|
| `["dashboard", "admin", "summary"]` | 30s | `useAdminDashboardSummary` |
| `["dashboard", "admin", "analytics"]` | 30s | `useAdminAnalytics` |
| `["anomaly", "summary"]` | 30s | `useAnomalySummaryQuery` |
| `["employees", "stats"]` | 60s | `useEmploymentStats` |
| `["employees", "due-for-regularization"]` | 60s | `useDueForRegularization` |
| `["dashboard", "employee", "analytics"]` | 30s | `useMyAnalytics` |
| `["dashboard", "employee", "today"]` | 15s | `useTodayStatus` |
| `["leave-credits", "my"]` | 60s | `useLeaveCredits` |
| `["leaves", "my", "recent"]` | 30s | `useMyRecentLeaves` |
| `["settings", "enable_web_clock_in_out"]` | 5min | `useWebClockSetting` |

## Admin Dashboard Behavior Preserved

- Same stats cards (Present, Late, Absent, On Leave) with trend data
- Same anomaly summary card with severity counts
- Same employment stats (probationary, regular, due for regularization)
- Same due-for-regularization employee list
- Same charts (weekly trend, daily breakdown, employee growth, absent trend)
- Same forecast card, insights panel, stat insight card
- Skeleton loading on first load, no loading flash on cache hit

## Employee Dashboard Behavior Preserved

- Same today status card with clock-in/out UI
- Same stats row (Present, Late, Absent, Leave days)
- Same attendance chart
- Same leave balance card (sick, vacation, emergency, maternity)
- Same recent leaves card
- Same quick actions
- Same clock-in/out functionality with confirmation dialog
- Same refresh after clock action (uses `refetch()` on all employee queries)

## Loading and Error Behavior

- **Before**: Single `loading` boolean, all-or-nothing skeleton until all 5 queries resolved
- **After**: Combined `isPending` from role-specific queries, same all-or-nothing skeleton on first load
- Errors are handled per-query (TanStack Query retries once per global config), falling back to `undefined`/`null` which matches the previous `.catch(() => null)` behavior
- `webClockEnabled` defaults to `true` when the setting query hasn't loaded (matches previous `useState(true)`)

## Validation Commands and Results

```powershell
cd Frontend
npx tsc --noEmit
# → No output (0 errors from our changes)

npm list @tanstack/react-query --depth=0
# frontend@0.0.0
# └── @tanstack/react-query@5.101.1
```

All validation commands passed.

## Known Risks

- **Resolved**: Admin and employee query sets previously both fired on every mount. Now role-based `enabled` guards ensure only the relevant role's queries run.
- **`refreshEmployee` dependency**: The `useCallback` for `refreshEmployee` has an empty dependency array `[]`. The `refetch` functions from TanStack Query are stable references, so this is safe. This callback is only passed to `EmployeeDashboardContent`, which is only rendered for non-admin users, so it will never call `.refetch()` on disabled queries.

## Next Recommended Step

Proceed to Phase 3C.2: Migrate the second tier of reference data (shifts, settings, leave types) to cached hooks, or optimize the unused admin/employee query splitting with `enabled` guards.
