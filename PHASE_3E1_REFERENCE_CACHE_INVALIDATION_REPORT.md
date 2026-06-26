# Phase 3E.1 Reference Cache Invalidation Report

## Summary

After Phase 3C caching, successful mutations across branches, shifts, leave types, and settings now invalidate affected TanStack Query caches, keeping reference data correct after create/update/delete/toggle/save actions. Seven files were updated. ShiftManagement.tsx already had invalidation from Phase 3C.2 and was not re-touched.

## Files Changed

| File | Change |
|------|--------|
| `BranchesPage.tsx` | Added `queryClient.invalidateQueries({ queryKey: ["branches"] })` after create/update and toggle |
| `LeaveTypeSettings.tsx` | Added `invalidateQueries` for `["leave-types"]` and `["leave-conversion", "types"]` after toggle, create, update, delete |
| `LeaveConversionSettings.tsx` | Added `invalidateQueries` for `["leave-types"]` and `["leave-conversion", "types"]` after toggle convertible and max days change |
| `CompanyTimezoneSettings.tsx` | Added `invalidateQueries({ queryKey: ["settings"] })` after timezone update |
| `EmployeeCodeSettings.tsx` | Added `invalidateQueries({ queryKey: ["settings"] })` after individual field save and bulk save |
| `CompanyBranding.tsx` | Added `invalidateQueries({ queryKey: ["settings"] })` after bulk branding save |
| `AttendanceSettings.tsx` | Added `invalidateQueries({ queryKey: ["settings"] })` after web clock toggle |

## Mutation Groups Covered

| Group | Files With Mutations | Invalidation Added |
|-------|---------------------|--------------------|
| Branches | BranchesPage.tsx | ✅ After createBranch, updateBranch, setBranchActive |
| Shifts | ShiftManagement.tsx | ✅ Already present (Phase 3C.2) |
| Leave Types (admin) | LeaveTypeSettings.tsx | ✅ After toggle, create, update, delete |
| Leave Types (conversion) | LeaveConversionSettings.tsx | ✅ After toggle convertible, max days change |
| Settings (per-key) | CompanyTimezoneSettings, EmployeeCodeSettings, AttendanceSettings | ✅ After updateSetting, toggleSetting |
| Settings (bulk) | EmployeeCodeSettings, CompanyBranding | ✅ After bulk save |

## Query Keys Invalidated

| Broad Key | Sub-keys Covered |
|-----------|-----------------|
| `["branches"]` | `["branches", "active"]`, `["branches", "all"]` |
| `["shifts"]` | `["shifts", "active"]`, `["shifts", "all"]` |
| `["leave-types"]` | `["leave-types", "enabled"]`, `["leave-types", "all"]` |
| `["leave-conversion", "types"]` | (standalone key) |
| `["settings"]` | `["settings", key]`, `["settings", "all"]` |

## Behavior Preserved

- **Same mutation functions**: All calls to `createBranch`, `updateBranch`, `setBranchActive`, `createShift`, `updateShift`, `deleteShift`, `createLeaveType`, `updateLeaveTypeAdmin`, `toggleLeaveTypeEnabled`, `deleteLeaveType`, `updateLeaveType`, `updateSetting`, `toggleSetting` remain unchanged.
- **Same payloads**: No mutation payloads were modified.
- **Same optimistic local state**: Existing `queryClient.setQueryData` calls and local state updates are preserved. Invalidation runs in addition to (not instead of) optimistic updates.
- **Same toast messages, dialogs, loading/saving states**: Unchanged.
- **Same API calls**: No backend functions were modified.
- **Only after success**: All `invalidateQueries` calls are placed after `await mutationFn(...)` and before `toast.success()`, inside the `try` block.

## Validation Commands and Results

```bash
cd Frontend
npx tsc --noEmit       # PASS (0 errors)
npm list @tanstack/react-query --depth=0  # @tanstack/react-query@5.101.1
```

## Known Risks

- None specific to this phase. Broader invalidation (e.g., `["branches"]` invalidates both `["branches", "active"]` and any future `["branches", "all"]`) is safe and future-proof.
- Pre-existing build errors in unrelated files (docs, profile, recruitment) remain from before Phase 3C — they are not caused by this change.

## Next Recommended Step

**Phase 4A — Profile page caching.** Migrate the profile page's read-only data fetching to TanStack Query hooks if profile data is reference-heavy. Alternatively, Phase 4B — Employee list read-data caching if employee list fetching is performance-critical. Recommend re-evaluating priorities with the team.
