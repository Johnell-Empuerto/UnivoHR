# Phase 3B.2 EmployeeList Branch Cache Report

## Summary

`EmployeeList.tsx` was migrated from direct `getActiveBranches()` fetching to the existing cached `useActiveBranches()` hook. The hook was reused without modification. Only the branch reference data source was changed — the employee list fetching, pagination, search, and filters remain in the original `useEffect` pattern. This is the second page migrated (after Calendar.tsx in Phase 3B.1).

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/features/employees/pages/EmployeeList.tsx` | Migrated branch fetching from `useEffect` + `getActiveBranches` to `useActiveBranches()` |

## Page Migrated

**`Frontend/src/features/employees/pages/EmployeeList.tsx`**

| Before | After |
|--------|-------|
| `import { getActiveBranches } from "@/services/branchService"` | `import { useActiveBranches } from "@/hooks/useBranches"` |
| `const [branches, setBranches] = useState<...>([])` | `const { data: branches = [] } = useActiveBranches()` |
| 5-line `useEffect` calling `getActiveBranches().then().catch(() => {})` | Removed — hook handles fetching |
| `{branches.map((b) => ...)}` — implicit `any` from state type | `{branches.map((b: { id: number; name: string }) => ...)}` — explicit inline type |

### Behavior Preservation

| Aspect | Status |
|--------|--------|
| Branch filter dropdown | ✅ Same — renders branch options via `.map()` on `branches` array |
| Default branch value (empty = "All Branches") | ✅ Same — `branches = []` on first render matches old state |
| Loading behavior for branches | ✅ Same — no loading indicator for branches (was silent before) |
| Error handling for branches | ✅ Same — `.catch(() => {})` → TanStack Query returns empty on error |
| Employee list fetching | ✅ Unchanged — still uses `useEffect` + `employeesAPI()` with pagination/filters |
| Search debounce, pagination, status filter | ✅ Unchanged — all employee-specific logic preserved |
| `handleBranchChange`, `handleClearFilters` | ✅ Unchanged — branch filter state is independent |
| UI rendering | ✅ Unchanged — same JSX structure |
| `useBranches.ts` hook | ✅ **Reused, not duplicated** — no modifications needed |

## Validation Commands and Results

| Command | Result |
|---------|--------|
| `npm list @tanstack/react-query` | ✅ `@tanstack/react-query@5.101.1` present |
| `npx tsc --noEmit` | ✅ **0 errors** |
| `npm run build` (`tsc -b && vite build`) | ⚠️ Pre-existing errors only (docs, profile, recruitment, etc.). **Zero errors** from our changes. |

## Known Risks

| Risk | Status |
|------|--------|
| Branch dropdown shows stale data | **Low** — 10-min stale time; branches rarely change at runtime |
| Employee list depends on branch data being available | **Low** — `branchFilter` is a string state, not dependent on `branches` array being populated |
| Regression from removing `useState` + `useEffect` pattern | **Low** — Same data flow, same fallback behavior |
| Inline type `{ id: number; name: string }` diverges from API | **Low** — Previously typed via `useState<{id: number; name: string}[]>`, same shape |

## Next Recommended Migration

Migrate `AttendancePage.tsx` next. It's the remaining high-frequency branch fetch site used by non-admin and admin users alike. It fetches branches on mount (line 251-255) for the branch filter dropdown in the attendance tab. The migration is identical to EmployeeList.

After AttendancePage: remaining 7 call sites (DevicePage, PayRollPage, JobPositionsPage, ApplicantDetailPage, EmployeeDrawer, DeviceIntegration, BranchRestDays, PayrollGenerate).

Note: EmployeeDrawer and ApplicantDetailPage may need more care since they fetch branches as part of a `Promise.all` pattern with other data.
