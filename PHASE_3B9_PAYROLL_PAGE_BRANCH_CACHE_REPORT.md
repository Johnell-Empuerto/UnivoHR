# Phase 3B.9 PayRollPage Branch Cache Report

## Summary

`PayRollPage.tsx` was migrated from direct `getActiveBranches()` calls to the cached `useActiveBranches()` hook. The branch filter dropdown in the payroll records tab now reads branch data from TanStack Query's cache (staleTime: 10min, gcTime: 30min) instead of fetching via a standalone `useEffect` on every mount.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/features/payroll/pages/PayRollPage.tsx` | 3 edits (see diff below) |

## Page Migrated

- **Component**: `PayRollPage.tsx` — branch filter dropdown for payroll records
- **Previously**: `const [branches, setBranches] = useState<any[]>([])` + `useEffect` calling `getActiveBranches()` directly
- **Now**: `const { data: branches = [] } = useActiveBranches()` — reads from shared cache

## Behavior Preservation

- Branch filter dropdown works identically — same data, same "All Branches" default
- `branchFilter` state and its usage in `getPayroll()` and `getPayrollSummary()` payloads are completely untouched
- Payroll records fetching (`fetchPayroll`, `getPayroll`, `getPayrollSummary`), pagination, search, and final pay fetching are unchanged
- Payroll actions (mark paid, delete batch), date/period selection, and tab switching are unchanged
- UI design, filter layout, and table behavior are unchanged
- `useBranches.ts` was reused, not duplicated
- Backend was not touched
- Payroll business logic, calculations, and API behavior not changed
- Attendance, recruitment, and employee modules not touched

## Diff Summary

```
- import { getActiveBranches } from "@/services/branchService";
+ import { useActiveBranches } from "@/hooks/useBranches";

  // Branch Filter State
- const [branches, setBranches] = useState<any[]>([]);
+ const { data: branches = [] } = useActiveBranches();
  const [branchFilter, setBranchFilter] = useState("");

- // Fetch branches on mount
- useEffect(() => {
-   getActiveBranches()
-     .then((data) => setBranches(data))
-     .catch(() => {});
- }, []);
```

3 hunks: import swap, state→hook, useEffect removal.

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

- **No risk** — Same pattern as PayrollGenerate. The component uses `any[]` for branches, so no type compatibility concerns. The branch filter is a simple dropdown with `branchFilter` state that is consumed independently by the payroll fetching logic.

## Next Recommended Migration

**EmployeeDrawer.tsx** — the next safest migration. Requires attention to the auto-select logic (`branches[0].id` for new employees) and the `if (!open) return` guard, but follows the same pattern.
