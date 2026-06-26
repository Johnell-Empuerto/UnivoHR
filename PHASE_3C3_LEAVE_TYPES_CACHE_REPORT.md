# Phase 3C.3 Leave Types Cache Report

## Summary

Leave-type reference-data fetching was migrated to TanStack Query hooks across 5 components. Three hooks were created wrapping three distinct leave-type API endpoints. All local `useState` + `useEffect` fetch patterns were replaced. Mutation handlers in LeaveTypeSettings and LeaveConversionSettings were updated to use `queryClient.setQueryData` for optimistic cache updates.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/hooks/useLeaveTypes.ts` | **Created** — 3 hooks |
| `Frontend/src/features/leaves/components/LeaveDrawer.tsx` | Migrated `getEnabledLeaveTypes` → `useEnabledLeaveTypes` |
| `Frontend/src/features/leaves/components/EmployeeCreditsTable.tsx` | Migrated `getEnabledLeaveTypes` → `useEnabledLeaveTypes` |
| `Frontend/src/features/leaves/components/LeaveTable.tsx` | Migrated `getEnabledLeaveTypes` → `useEnabledLeaveTypes` |
| `Frontend/src/features/settings/components/LeaveTypeSettings.tsx` | Migrated `getAllLeaveTypesAdmin` → `useAllLeaveTypesAdmin` with optimistic cache updates |
| `Frontend/src/features/leaves/components/LeaveConversionSettings.tsx` | Migrated `getLeaveTypes` → `useLeaveConversionTypes` with optimistic cache updates |

## Hooks Added

| Hook | Wraps | Query Key | staleTime | gcTime |
|------|-------|-----------|-----------|--------|
| `useEnabledLeaveTypes()` | `getEnabledLeaveTypes()` | `["leave-types", "enabled"]` | 10 min | 30 min |
| `useAllLeaveTypesAdmin()` | `getAllLeaveTypesAdmin()` | `["leave-types", "all"]` | 10 min | 30 min |
| `useLeaveConversionTypes()` | `getLeaveTypes()` | `["leave-conversion", "types"]` | 10 min | 30 min |

## Leave-Type API Calls Migrated

- **`getEnabledLeaveTypes`** — 3 call sites removed (LeaveDrawer, EmployeeCreditsTable, LeaveTable)
- **`getAllLeaveTypesAdmin`** — 1 call site removed (LeaveTypeSettings)
- **`getLeaveTypes`** — 1 call site removed (LeaveConversionSettings)

## Query Keys and Stale Times

| Query Key | Stale Time | GC Time | Used By |
|-----------|-----------|---------|---------|
| `["leave-types", "enabled"]` | 10 min | 30 min | LeaveDrawer, EmployeeCreditsTable, LeaveTable |
| `["leave-types", "all"]` | 10 min | 30 min | LeaveTypeSettings |
| `["leave-conversion", "types"]` | 10 min | 30 min | LeaveConversionSettings |

## Behavior Preserved

- **LeaveDrawer**: Same `employee_requestable` filter on leave types dropdown
- **EmployeeCreditsTable**: Same `include_in_credits` filter on dynamic columns
- **LeaveTable**: Same leave type filter dropdown with enabled types
- **LeaveTypeSettings**: Same table, search, filter, add/edit/toggle/delete dialog. Same optimistic cache updates (now via `queryClient.setQueryData`)
- **LeaveConversionSettings**: Same tabs, toggle, max days input, company settings form. Same optimistic cache updates for leave type config (now via `queryClient.setQueryData`). `getConversionSettings()` still fetched locally (not cached).
- All UI is unchanged. All leave request payloads, approval flows, credits logic, and settings forms are identical.

## Mutation/Invalidation Notes

- **LeaveTypeSettings**: Mutations (`toggleLeaveTypeEnabled`, `createLeaveType`, `updateLeaveTypeAdmin`, `deleteLeaveType`) optimistically update the `["leave-types", "all"]` cache via `queryClient.setQueryData`. No invalidation was added since the optimistic update keeps the UI consistent.
- **LeaveConversionSettings**: Mutations (`updateLeaveType` for toggle and max days) optimistically update the `["leave-conversion", "types"]` cache via `queryClient.setQueryData`. No invalidation added.
- Cross-query invalidation (e.g., toggling a leave type in LeaveTypeSettings should invalidate `["leave-types", "enabled"]` and `["leave-conversion", "types"]`) is deferred to Phase 3E.
- The Refresh button in LeaveTypeSettings now calls `refetch()` from the query result.

## Validation Commands and Results

```bash
cd Frontend
npx tsc --noEmit       # PASS (0 errors)
npm list @tanstack/react-query --depth=0  # @tanstack/react-query@5.101.1
```

## Known Risks

- No cross-query invalidation between `["leave-types", "all"]`, `["leave-types", "enabled"]`, and `["leave-conversion", "types"]`. If an admin toggles or creates a leave type, enabled leave types and conversion types caches will remain stale until their 10-minute stale time expires. This is acceptable for Phase 3C and will be addressed in Phase 3E (mutation invalidation).

## Next Recommended Step

**Phase 3C.4 — Settings reference-data caching.** Implement `useSetting(key)` and `useAllSettings()` hooks for `getSetting(key)` and `getAllSettings()` calls across CompanyTimezoneSettings, EmployeeCodeSettings, CompanyBranding, and AttendanceSettings.
