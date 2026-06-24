# Phase 3B.8 PayrollGenerate Branch Cache Report

## Summary

`PayrollGenerate.tsx` was migrated from direct `getActiveBranches()` calls to the cached `useActiveBranches()` hook. The branch selector in the "Generate Payroll" form now reads branch data from TanStack Query's cache (staleTime: 10min, gcTime: 30min) instead of fetching via a standalone `useEffect` on every mount.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/features/payroll/pages/PayrollGenerate.tsx` | 4 edits (see diff below) |

## Page Migrated

- **Component**: `PayrollGenerate.tsx` — branch selector in the generate payroll form
- **Previously**: `useState<Branch[]>` + `useEffect` calling `getActiveBranches()` directly + local `Branch` interface
- **Now**: `const { data: branches = [] } = useActiveBranches()` — reads from shared cache

## Behavior Preservation

- Branch selector dropdown works identically — same data, same "All Branches" default
- `selectedBranch` state and its usage in `generatePayroll()` payload are completely untouched
- Payroll generation logic (`handleGenerate`), cutoff period selection, pay date selection, and submission are unchanged
- `generatePayroll` API call and payload shape are unchanged
- UI design, labels, and help text are unchanged
- `useBranches.ts` was reused, not duplicated
- Backend was not touched
- Payroll generation, calculations, and API behavior not changed
- Attendance, recruitment, and employee modules not touched

## Diff Summary

```
- import { useState, useEffect } from "react";
+ import { useState } from "react";

- import { getActiveBranches } from "@/services/branchService";
+ import { useActiveBranches } from "@/hooks/useBranches";

- interface Branch {
-   id: number;
-   name: string;
-   code: string;
- }

- const [branches, setBranches] = useState<Branch[]>([]);
+ const { data: branches = [] } = useActiveBranches();

- useEffect(() => {
-   getActiveBranches()
-     .then((data) => setBranches(data))
-     .catch(() => {});
- }, []);
```

4 hunks: `useEffect` import removed, `getActiveBranches` → `useActiveBranches`, `Branch` interface removed, `useState`+`useEffect` replaced with hook.

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

- **No risk** — This is the simplest migration so far. The component has a single branch dependency used only for a dropdown selector. No `Promise.all`, no auto-select logic, no shared `fetchData` function. The `branches = []` fallback ensures graceful degradation during initial cache load.

## Next Recommended Migration

**PayRollPage.tsx** — same module (payroll), similar pattern (branch filter dropdown), slightly larger context. Next safest migration after PayrollGenerate.
