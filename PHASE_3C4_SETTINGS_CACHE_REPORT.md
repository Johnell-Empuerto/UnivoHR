# Phase 3C.4 Settings Cache Report

## Summary

Settings reference-data fetching was migrated to TanStack Query hooks across 4 components. Two hooks were created wrapping `getSetting(key)` and `getAllSettings()`. All local `useState` + `useEffect` fetch patterns were replaced.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/hooks/useSettings.ts` | **Created** — 2 hooks |
| `Frontend/src/features/settings/components/CompanyTimezoneSettings.tsx` | Migrated `getSetting("company_timezone")` → `useSetting` |
| `Frontend/src/features/settings/components/EmployeeCodeSettings.tsx` | Migrated `getAllSettings()` → `useAllSettings` |
| `Frontend/src/features/settings/components/CompanyBranding.tsx` | Migrated `getAllSettings()` → `useAllSettings` |
| `Frontend/src/features/settings/components/AttendanceSettings.tsx` | Migrated `getSetting("enable_web_clock_in_out")` → `useSetting` |

## Hooks Added

| Hook | Wraps | Query Key | staleTime | gcTime |
|------|-------|-----------|-----------|--------|
| `useSetting(key, enabled=true)` | `getSetting(key)` | `["settings", key]` | 5 min | 15 min |
| `useAllSettings(enabled=true)` | `getAllSettings()` | `["settings", "all"]` | 5 min | 15 min |

The `enable` parameter gates the query with `enabled && !!key` for `useSetting`.

## Settings API Calls Migrated

- **`getSetting`** — 2 call sites removed (CompanyTimezoneSettings, AttendanceSettings)
- **`getAllSettings`** — 2 call sites removed (EmployeeCodeSettings, CompanyBranding)

Remaining `getSetting` usages in frontend:
- `Frontend/src/hooks/useDashboardQueries.ts` — `useWebClockSetting` already uses TanStack Query (Phase 3C.1) with the same query key `["settings", "enable_web_clock_in_out"]`, sharing the same cache entry.

## Query Keys and Stale Times

| Query Key | Stale Time | GC Time | Used By |
|-----------|-----------|---------|---------|
| `["settings", key]` | 5 min | 15 min | CompanyTimezoneSettings, AttendanceSettings |
| `["settings", "all"]` | 5 min | 15 min | EmployeeCodeSettings, CompanyBranding |

## Behavior Preserved

- **CompanyTimezoneSettings**: Same timezone dropdown, same optimistic local state (revert on error), same "Asia/Manila" fallback, same `saving` indicator during update. Local `timezone` state initialized from cached `settingResult`. The `isLoading` state replaces `loading` for the spinner.
- **EmployeeCodeSettings**: Same form fields, same individual field save, same "Save All" button, same preview logic, same `getNextEmployeeCode()` call (unchanged — not cached). Local `settings` state initialized from cached `useAllSettings` data via `useEffect`.
- **CompanyBranding**: Same Map-based settings state, same tabs (General/Colors/Preview), same bulk save behavior. Local `settings` Map initialized from cached data via `useEffect` (only once when `settings.size === 0`).
- **AttendanceSettings**: Same web clock toggle switch, same rule CRUD operations (unchanged, not cached). Web clock enabled state derived from cached `useSetting` data (`setting?.value === "true"`). Toggle mutation updates the cache via `queryClient.setQueryData`.

## Mutation/Invalidation Notes

- **AttendanceSettings** (`handleWebClockToggle`): After calling `toggleSetting()`, the cache for `["settings", "enable_web_clock_in_out"]` is updated via `queryClient.setQueryData` with the new boolean-to-string mapping (`result.value ? "true" : "false"`). This keeps the `useWebClockSetting` hook in Dashboard in sync.
- **CompanyTimezoneSettings**: After `updateSetting`, the cache is NOT updated. The local `timezone` state handles the optimistic UI. The cache will refresh on next stale-time expiry (5 min). This preserves the original optimistic-local-state behavior.
- **EmployeeCodeSettings**: Individual field saves use `updateSetting` + local `setSettings`. No cache invalidation — preserves original behavior of not refetching.
- **CompanyBranding**: Bulk save uses `updateSetting` per key. No cache invalidation — preserves original behavior.
- No mutating components explicitly invalidate `["settings", "all"]` after updating individual settings. This is consistent with the original behavior where no refetch occurred after save.

## Validation Commands and Results

```bash
cd Frontend
npx tsc --noEmit       # PASS (0 errors)
npm list @tanstack/react-query --depth=0  # @tanstack/react-query@5.101.1
```

## Known Risks

- Settings cache stale time (5 min) may cause brief delays before per-key setting changes appear in `["settings", "all"]` queries. Affects EmployeeCodeSettings and CompanyBranding if they re-mount before expiry. Low risk since these components stay mounted while open.
- No cross-query invalidation between `["settings", key]` and `["settings", "all"]`. If a setting is updated via a per-key mutation, the `["settings", "all"]` cache remains stale until its 5-minute expiry. Phase 3E should add broad invalidation via `invalidateQueries({ queryKey: ["settings"] })` after any settings mutation.

## Next Recommended Step

**Phase 3E — Mutation invalidation.** Add `queryClient.invalidateQueries()` on successful mutations across branches, shifts, leave types, and settings to keep all dependent caches fresh after CUD operations.
