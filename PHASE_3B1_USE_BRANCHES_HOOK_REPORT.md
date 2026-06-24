# Phase 3B.1 useBranches Hook Report

## Summary

A cached `useActiveBranches` hook was created and Calendar.tsx was migrated to use it. The hook wraps `getActiveBranches()` with TanStack Query, providing a 10-minute stale time and 30-minute garbage collection. Calendar.tsx was chosen as the first migration target because it uses branches purely as reference/filter data with no mutations, making it the lowest-risk page to convert. Only one page was migrated.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/hooks/useBranches.ts` | **New** — `useActiveBranches()` hook with TanStack Query |
| `Frontend/src/features/calendar/pages/Calendar.tsx` | Migrated from `useEffect` + `getActiveBranches` to `useActiveBranches()` |

## Hook Added

**`Frontend/src/hooks/useBranches.ts`** — `useActiveBranches()`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getActiveBranches } from "@/services/branchService";

export const useActiveBranches = () => {
  return useQuery({
    queryKey: ["branches", "active"],
    queryFn: getActiveBranches,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
```

- **Query key**: `["branches", "active"]` (mutations should later invalidate `["branches"]`)
- **staleTime**: 10 minutes — branches change rarely (deployment-time config)
- **gcTime**: 30 minutes — keeps data in memory for back-navigation
- **retry**: 1 (inherited from global QueryClient default)

Comments in the hook explain:
- Branches are reference data and safe to cache for 10 minutes
- Mutations should invalidate `["branches"]` later

## Page Migrated

**`Frontend/src/features/calendar/pages/Calendar.tsx`**

| Before | After |
|--------|-------|
| `import { getActiveBranches } from "@/services/branchService"` | `import { useActiveBranches } from "@/hooks/useBranches"` |
| `const [branches, setBranches] = useState<Branch[]>([])` | `const { data: branches = [] } = useActiveBranches()` |
| 7-line `useEffect` calling `getActiveBranches().then().catch()` | Removed — caching hook handles fetching |
| Local `interface Branch { id; name; code }` | Removed — inline type in `.map()` callbacks |

### Behavior Preservation

| Aspect | Status |
|--------|--------|
| Branch data shape (`id`, `name`) | ✅ Preserved — inline types in `.map()` callbacks |
| Default value when loading | ✅ `branches = []` matches old `useState<Branch[]>([])` |
| Error handling | ✅ Silently returns empty array on error (TanStack Query default, matches `.catch(() => {})`) |
| Loading state | ✅ No loading UI for branches (same as before — was silent) |
| Filter behavior | ✅ Unchanged — `branchViewFilter` state is independent |
| FullCalendar behavior | ✅ Unchanged — calendar events are unaffected |
| Dialog behavior | ✅ Unchanged — branch selection in dialogs unaffected |
| API service function | ✅ Unchanged — same `getActiveBranches` behind the hook |

The removed `interface Branch { code: string }` was never used in the JSX (only `id` and `name` are accessed).

## Validation Commands and Results

| Command | Result |
|---------|--------|
| `npm list @tanstack/react-query` | ✅ `@tanstack/react-query@5.101.1` present |
| `npx tsc --noEmit` | ✅ **0 errors** — all Calendar.tsx changes type-safe |
| `npm run build` (`tsc -b && vite build`) | ⚠️ Pre-existing errors only (113 errors in docs, profile, recruitment, etc.). **Zero errors** from our changes. |

## Known Risks

| Risk | Status |
|------|--------|
| New `useActiveBranches()` hook causes regression on Calendar page | **Low** — Same API call, same data shape, same error behavior |
| Other pages still using `useEffect` + `getActiveBranches` become stale | **None** — Each page still fetches independently via unused old pattern |
| `branches` data shape mismatch | **Low** — Inline types match the API shape used by component |
| Cache returns stale branch list | **Low** — Branches are admin-config data, rarely changed during a session |
| Memory from `gcTime: 30min` | **None** — Only one query key cached, ~1KB of data |

## Next Recommended Migration

Migrate `EmployeeList.tsx` next. It also fetches branches on mount via `useEffect` + `getActiveBranches` for the branch filter dropdown. The migration is identical to Calendar.tsx — replace `useEffect` with `useActiveBranches()`. This is the second-lowest-risk page since branches are used only for filtering.

After EmployeeList: `AttendancePage.tsx` (branch filter, slightly more complex due to tabs).

After that: remaining 8 call sites (DevicePage, PayRollPage, JobPositionsPage, ApplicantDetailPage, EmployeeDrawer, DeviceIntegration, BranchRestDays, PayrollGenerate).
